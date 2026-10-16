"""Private, single-GPU MuseTalk job worker. Bind to localhost behind TLS/SSH."""
import base64
import concurrent.futures
import hmac
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import threading
import time

from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel

ROOT = Path('/opt/MuseTalk')
JOBS = ROOT / 'data/academia/jobs'
JOBS.mkdir(parents=True, exist_ok=True)
KEY = os.environ['MUSETALK_API_KEY']
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
pool = concurrent.futures.ThreadPoolExecutor(max_workers=1)
lock = threading.Lock()
pending = set()

def authorize(authorization: str = Header(default='')):
    if not hmac.compare_digest(authorization, 'Bearer ' + KEY):
        raise HTTPException(401, 'Unauthorized')

def folder(job_id):
    if not re.fullmatch(r'[a-f0-9]{64}', job_id):
        raise HTTPException(404, 'Not found')
    return JOBS / job_id

def status(directory, value):
    tmp = directory / 'status.tmp'
    tmp.write_text(json.dumps(value))
    tmp.replace(directory / 'status.json')

def run_job(job_id):
    directory = folder(job_id)
    try:
        status(directory, {'status': 'PROCESSING'})
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(directory / 'input.audio'), '-vn', '-ac', '1', '-ar', '16000', str(directory / 'reply.wav')], check=True, timeout=30, capture_output=True)
        duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(directory / 'reply.wav')], timeout=10))
        if not 0 < duration <= 120:
            raise ValueError('Audio duration exceeds limit')
        config = directory / 'inference.json'
        config.write_text(json.dumps({'tutor': {'video_path': str(ROOT / 'data/academia/source.mp4'), 'audio_path': str(directory / 'reply.wav'), 'bbox_shift': 0}}))
        with (directory / 'render.log').open('w') as log:
            subprocess.run([str(ROOT / 'generate-video'), '--inference_config', str(config), '--result_dir', str(directory / 'results'), '--batch_size', '8'], cwd=ROOT, check=True, timeout=600, stdout=log, stderr=subprocess.STDOUT)
        candidates = sorted((directory / 'results').rglob('*.mp4'))
        if not candidates:
            raise ValueError('No output')
        # MuseTalk final outputs combine the source name and the audio name.
        final = next((p for p in candidates if 'reply' in p.name), None)
        if final is None:
            raise ValueError('Final output missing')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(final), '-vf', 'scale=-2:720,fps=20', '-c:v', 'libx264', '-crf', '24', '-maxrate', '850k', '-bufsize', '1700k', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '64k', '-ac', '1', '-movflags', '+faststart', str(directory / 'result.mp4')], check=True, timeout=90, capture_output=True)
        status(directory, {'status': 'COMPLETED'})
    except Exception as error:
        # Retain an internal reason without logging narration text or credentials.
        (directory / 'failure.json').write_text(json.dumps({'type': type(error).__name__, 'duration': locals().get('duration')}))
        status(directory, {'status': 'FAILED', 'error': 'La vidéo n’a pas pu être générée.'})
    finally:
        # Intermediate frames are large; only retain the final MP4 and job metadata.
        shutil.rmtree(directory / 'results', ignore_errors=True)
        with lock:
            pending.discard(job_id)

class Job(BaseModel):
    id: str
    audio: str

@app.get('/health', dependencies=[Depends(authorize)])
def health():
    return {'ready': (ROOT / 'models/musetalkV15/unet.pth').exists(), 'provider': 'musetalk', 'pending': len(pending)}

@app.post('/jobs', status_code=202, dependencies=[Depends(authorize)])
def submit(job: Job):
    directory = folder(job.id)
    if len(job.audio) > 5_400_000:
        raise HTTPException(413, 'Audio too large')
    try:
        audio = base64.b64decode(job.audio, validate=True)
    except ValueError:
        raise HTTPException(400, 'Invalid audio')
    if not 44 < len(audio) <= 4_000_000:
        raise HTTPException(400, 'Invalid audio size')
    with lock:
        for previous in JOBS.iterdir():
            if previous.is_dir() and re.fullmatch(r'[a-f0-9]{64}', previous.name) and previous.name not in pending and time.time() - previous.stat().st_mtime > 86400:
                shutil.rmtree(previous)
        if (directory / 'status.json').exists():
            return {'id': job.id}
        if len(pending) >= 3:
            raise HTTPException(429, 'GPU busy')
        directory.mkdir(mode=0o700)
        (directory / 'input.audio').write_bytes(audio)
        status(directory, {'status': 'PENDING'})
        pending.add(job.id)
        pool.submit(run_job, job.id)
    return {'id': job.id}

@app.get('/jobs/{job_id}', dependencies=[Depends(authorize)])
def get_status(job_id: str):
    directory = folder(job_id)
    if not (directory / 'status.json').exists():
        raise HTTPException(404, 'Not found')
    value = json.loads((directory / 'status.json').read_text())
    if value['status'] in ('PENDING', 'PROCESSING') and job_id not in pending:
        return {'status': 'FAILED', 'error': 'Le service a redémarré. Écoutez la réponse en audio.'}
    return value

@app.get('/jobs/{job_id}/media', dependencies=[Depends(authorize)])
def media(job_id: str):
    result = folder(job_id) / 'result.mp4'
    if not result.exists():
        raise HTTPException(404, 'Not found')
    return FileResponse(result, media_type='video/mp4', headers={'Cache-Control': 'no-store'})

@app.get('/jobs/{job_id}/play')
def play(job_id: str, expires: int, token: str):
    directory = folder(job_id)
    now = int(time.time())
    expected = hmac.new(KEY.encode(), f'{job_id}:{expires}'.encode(), hashlib.sha256).hexdigest()
    if expires < now or expires > now + 930 or len(token) != 64 or not hmac.compare_digest(expected, token):
        raise HTTPException(403, 'Expired or invalid playback ticket')
    result = directory / 'result.mp4'
    if not result.exists():
        raise HTTPException(404, 'Not found')
    return FileResponse(result, media_type='video/mp4', headers={'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer'})

@app.post('/jobs/{job_id}/retry', status_code=202, dependencies=[Depends(authorize)])
def retry(job_id: str):
    directory = folder(job_id)
    with lock:
        if not (directory / 'status.json').exists() or json.loads((directory / 'status.json').read_text()).get('status') != 'FAILED':
            raise HTTPException(409, 'Only failed jobs may be retried explicitly')
        if len(pending) >= 3:
            raise HTTPException(429, 'GPU busy')
        pending.add(job_id)
        status(directory, {'status': 'PENDING'})
        pool.submit(run_job, job_id)
    return {'id': job_id}
