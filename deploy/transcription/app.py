"""Private CPU transcription. Recordings exist only inside a temporary directory."""
import base64
import binascii
import hmac
import json
import os
from pathlib import Path
import subprocess
import secrets
import shutil
import re
import wave
import numpy as np
import tempfile
import threading
from fastapi import FastAPI, Depends, Header, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
KEY = os.environ['STT_API_KEY']
if len(KEY) < 32:
    raise RuntimeError('STT_API_KEY must contain at least 32 characters')
model = None
gate = threading.BoundedSemaphore(1)
TYPES = {'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/aac', 'audio/flac'}
RECORDINGS = Path('/workspace/academia/private/voice-recordings')
RECORDINGS.mkdir(parents=True, exist_ok=True, mode=0o700)
GLOSSARY = 'Marchés publics, ARMP, DGCMP, CGPMP, Kinshasa, Lubumbashi, Bandundu, Kasaï, Haut-Uélé, Luba, Tshiluba, Bakongo, Kikongo, Lingala, Ester, Esther, David.'

@app.on_event('startup')
def initialize():
    global model
    from faster_whisper import WhisperModel
    model = WhisperModel(os.environ.get('STT_MODEL_DIR', '/workspace/academia/models/whisper-stt'), device='cpu', compute_type='int8', cpu_threads=4, num_workers=1)

def authorize(authorization: str = Header(default='')):
    if not hmac.compare_digest(authorization, 'Bearer ' + KEY):
        raise HTTPException(401, 'Unauthorized')

class Recording(BaseModel):
    audio: str = Field(min_length=4, max_length=8000000)
    mimeType: str = Field(max_length=100)
    owner: str = Field(min_length=1, max_length=128)

@app.get('/health', dependencies=[Depends(authorize)])
def health():
    return {'ready': model is not None, 'engine': 'faster-whisper-small', 'device': 'cpu'}

@app.post('/transcribe', dependencies=[Depends(authorize)])
def transcribe(body: Recording):
    if body.mimeType.split(';')[0].lower() not in TYPES:
        raise HTTPException(415, 'Unsupported audio format')
    try:
        audio = base64.b64decode(body.audio, validate=True)
    except (ValueError, binascii.Error):
        raise HTTPException(400, 'Invalid audio') from None
    if not 44 < len(audio) <= 6000000:
        raise HTTPException(413, 'Invalid audio size')
    if model is None:
        raise HTTPException(503, 'Transcription unavailable')
    if not gate.acquire(blocking=False):
        raise HTTPException(429, 'Transcription busy')
    stage = 'decode'
    try:
        with tempfile.TemporaryDirectory(prefix='academia-voice-') as directory:
            source = Path(directory) / 'input.audio'
            source.write_bytes(audio)
            wav = Path(directory) / 'voice.wav'
            # Browser WebM recordings often have no duration metadata. Decode a
            # bounded excerpt first and measure the resulting PCM WAV instead.
            try:
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-t', '91', '-vn', '-ac', '1', '-ar', '16000', str(wav)], check=True, timeout=25, capture_output=True)
                duration = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(wav)], timeout=10, stderr=subprocess.DEVNULL))
            except (ValueError, subprocess.SubprocessError):
                raise HTTPException(422, 'Unreadable audio') from None
            if not 0.25 <= duration <= 90:
                raise HTTPException(422, 'Recording must be between 0.25 and 90 seconds')
            stage = 'transcription'
            # PCM is already decoded and bounded by FFmpeg. Passing the array
            # also avoids a second decode through version-sensitive PyAV APIs.
            with wave.open(str(wav), 'rb') as pcm:
                if pcm.getsampwidth() != 2 or pcm.getnchannels() != 1 or pcm.getframerate() != 16000:
                    raise HTTPException(422, 'Unreadable audio')
                samples = np.frombuffer(pcm.readframes(pcm.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
            segments, _info = model.transcribe(samples, language='fr', beam_size=3, vad_filter=True, vad_parameters={'min_silence_duration_ms': 500}, condition_on_previous_text=False, initial_prompt=GLOSSARY)
            text = ' '.join(segment.text.strip() for segment in segments if segment.no_speech_prob < 0.8).strip()
            if not text or len(text) > 4000:
                raise HTTPException(422, 'No intelligible speech')
            stage = 'storage'
            if shutil.disk_usage(RECORDINGS).free < 1024 * 1024 * 1024:
                raise HTTPException(503, 'Recording storage unavailable')
            recording_id = secrets.token_hex(32)
            saved = RECORDINGS / recording_id
            saved.mkdir(mode=0o700)
            try:
                (saved / 'metadata.json').write_text(json.dumps({'owner': body.owner, 'mimeType': body.mimeType.split(';')[0].lower()}))
                (saved / 'metadata.json').chmod(0o600)
                source.replace(saved / 'recording.audio')
                (saved / 'recording.audio').chmod(0o600)
            except Exception:
                shutil.rmtree(saved, ignore_errors=True)
                raise
            return {'text': text, 'recordingId': recording_id, 'language': 'fr', 'duration': round(duration, 2)}
    except HTTPException:
        raise
    except Exception as error:
        print('Transcription failure:', stage, type(error).__name__, flush=True)
        raise HTTPException(503, 'Transcription unavailable') from None
    finally:
        gate.release()

@app.get('/recordings/{recording_id}', dependencies=[Depends(authorize)])
def recording(recording_id: str, owner: str = Query(min_length=1, max_length=128)):
    if not re.fullmatch('[a-f0-9]{64}', recording_id):
        raise HTTPException(404, 'Not found')
    folder = RECORDINGS / recording_id
    try:
        metadata = json.loads((folder / 'metadata.json').read_text())
        if metadata.get('owner') != owner or not (folder / 'recording.audio').is_file():
            raise ValueError()
    except (OSError, ValueError):
        raise HTTPException(404, 'Not found') from None
    return FileResponse(folder / 'recording.audio', media_type=metadata['mimeType'], headers={'Cache-Control': 'private, no-store'})
