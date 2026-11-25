"""Loopback-only, idempotent MuseTalk jobs behind HF's private endpoint."""
import base64
import concurrent.futures
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import io
import wave
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time


def validate_audio(body):
    if not isinstance(body, dict):
        raise ValueError('Expected audioData object')
    value = body.get('audioData', body.get('audio'))
    if not isinstance(value, str) or not 1 <= len(value) <= 5400000:
        raise ValueError('Audio must be base64 and under 4 MB')
    audio = base64.b64decode(value, validate=True)
    if not 44 < len(audio) <= 4000000:
        raise ValueError('Invalid audio size')
    return audio


def main():
    package, work = map(Path, sys.argv[1:])
    root = work / 'MuseTalk'
    import imageio_ffmpeg
    binary_dir = work / 'bin'
    binary_dir.mkdir(exist_ok=True)
    ffmpeg = binary_dir / 'ffmpeg'
    if not ffmpeg.exists():
        ffmpeg.symlink_to(imageio_ffmpeg.get_ffmpeg_exe())
    os.environ['PATH'] = str(binary_dir) + os.pathsep + os.environ['PATH']
    os.chdir(root)
    sys.path[:0] = [str(package), str(root)]
    source = root / 'data/academia/source.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', 'data/academia/source-input.mp4',
        '-an', '-vf', 'fps=25,scale=-2:480,setpts=PTS-STARTPTS', '-c:v', 'libx264',
        '-preset', 'fast', str(source)], check=True, timeout=60)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i',
        'anullsrc=r=16000:cl=mono', '-t', '2', 'data/academia/reply.wav'], check=True, timeout=30)
    from course_motion import read_story, compose, assemble
    from qwen_engine import QwenClient
    qwen = QwenClient(package, work)
    from piper import PiperVoice, SynthesisConfig
    voices={name:PiperVoice.load(str(work / 'voices' / file)) for name,file in [('vivienne','fr_FR-siwis-medium.onnx'),('henri','fr_FR-tom-medium.onnx')]}
    pool = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    render_lock, jobs_lock = threading.Lock(), threading.Lock()
    engine = None

    def video_engine():
        # Called only under render_lock. Chat readiness never waits for avatar
        # landmarks, masks, latents or CUDA video priming.
        nonlocal engine
        if engine is None:
            from realtime_engine import RealtimeEngine
            print('ACADEMIA_VIDEO_LOADING', flush=True)
            engine = RealtimeEngine(source)
            print('ACADEMIA_VIDEO_READY', flush=True)
        return engine

    print('ACADEMIA_CHAT_READY video=lazy', flush=True)
    jobs = work / 'jobs'
    jobs.mkdir(exist_ok=True)
    pending = set()

    def folder(identifier):
        if not isinstance(identifier, str) or re.fullmatch(r'[a-f0-9]{64}', identifier) is None:
            raise ValueError('Invalid job identifier')
        return jobs / identifier

    def status(directory, value):
        temporary = directory / 'status.tmp'
        temporary.write_text(json.dumps(value))
        temporary.replace(directory / 'status.json')

    def render_audio(audio, directory, limit, lesson=None):
        raw, wav = directory / 'input.audio', directory / 'input.wav'
        raw.write_bytes(audio)
        probe = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(raw)],
            capture_output=True, text=True, timeout=15)
        match = re.search(r'Duration: (\d+):(\d+):(\d+(?:\.\d+)?)', probe.stderr)
        if match is None:
            raise ValueError('Audio duration could not be verified')
        hours, minutes, seconds = map(float, match.groups())
        duration = hours * 3600 + minutes * 60 + seconds
        if not math.isfinite(duration) or not 0 < duration <= limit:
            raise ValueError('Audio exceeds duration limit; it was not truncated')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw),
            '-vn', '-ac', '1', '-ar', '16000', str(wav)], check=True, timeout=30)
        avatar = directory / ('avatar.mp4' if lesson else 'result.mp4')
        with render_lock:
            try:
                video_engine().render(wav, avatar, lambda _: None)
            finally:
                import torch
                torch.cuda.empty_cache()
        if lesson:
            compose(avatar, directory / 'result.mp4', lesson, duration)
        if (directory / 'result.mp4').stat().st_size > 24000000:
            raise ValueError('Video exceeds 24 MB transport limit')
        return duration

    def process(identifier, body):
        directory = folder(identifier)
        try:
            status(directory, {'status': 'PROCESSING'})
            if 'parts' in body:
                children = [folder(part) for part in body['parts']]
                assemble([child / 'result.mp4' for child in children], directory / 'result.mp4')
                duration = sum(json.loads((child / 'status.json').read_text())['durationSeconds'] for child in children)
                if (directory / 'result.mp4').stat().st_size > 24000000:
                    raise ValueError('Film exceeds 24 MB transport limit')
            else:
                lesson = read_story(body['lesson']) if body.get('lesson') else None
                duration = render_audio(validate_audio(body), directory, 120, lesson)
            status(directory, {'status': 'COMPLETED', 'durationSeconds': duration})
        except Exception:
            import traceback
            traceback.print_exc()
            status(directory, {'status': 'FAILED', 'error': 'Le rendu vidéo a échoué.'})
        finally:
            with jobs_lock:
                pending.discard(identifier)

    def submit(body, film=False):
        identifier = body.get('id')
        directory = folder(identifier)
        if film:
            parts = body.get('parts')
            if not isinstance(parts, list) or not 1 <= len(parts) <= 12 or len(set(parts)) != len(parts) or identifier in parts:
                raise ValueError('Invalid film parts')
            if not all((folder(part) / 'status.json').exists() and json.loads((folder(part) / 'status.json').read_text()).get('status') == 'COMPLETED' for part in parts):
                return 409, {'error': 'Film scenes unavailable; regenerate the scenes'}
        else:
            validate_audio(body)
            if body.get('lesson'):
                read_story(body['lesson'])
        with jobs_lock:
            if identifier in pending:
                return 202, {'id': identifier}
            if (directory / 'status.json').exists() and json.loads((directory / 'status.json').read_text()).get('status') != 'FAILED':
                return 202, {'id': identifier}
            if len(pending) >= 3:
                return 429, {'error': 'GPU busy'}
            for child in jobs.iterdir():
                if child.is_dir() and child.name not in pending and time.time() - child.stat().st_mtime > 86400:
                    shutil.rmtree(child)
            directory.mkdir(mode=0o700, exist_ok=True)
            status(directory, {'status': 'PENDING'})
            pending.add(identifier)
            pool.submit(process, identifier, body)
        return 202, {'id': identifier}

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def reply(self, code, value):
            binary = json.dumps(value).encode()
            self.send_response(code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(binary)))
            self.end_headers()
            self.wfile.write(binary)

        def do_GET(self):
            self.reply(200 if self.path == '/health' else 404, {'ready': True})

        def do_POST(self):
            if self.path != '/predict':
                return self.reply(404, {'error': 'Not found'})
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 6500000:
                    raise ValueError('Request too large')
                body = json.loads(self.rfile.read(length))
                operation, method = body.get('operation'), body.get('method', 'GET')
                if operation is None:
                    with tempfile.TemporaryDirectory(prefix='musetalk-request-') as tmp:
                        directory = Path(tmp)
                        duration = render_audio(validate_audio(body), directory, 15)
                        output = (directory / 'result.mp4').read_bytes()
                        return self.reply(200, {'videoData': base64.b64encode(output).decode(),
                            'mimeType': 'video/mp4', 'durationSeconds': duration,
                            'provider': 'musetalk-huggingface'})
                if operation == '/chat' and method == 'POST':
                    # Serialize GPU work with lip-sync to bound memory and contention.
                    if not render_lock.acquire(blocking=False):
                        return self.reply(200, {'statusCode': 429, 'body': {'error': 'GPU busy'}})
                    try:
                        result = qwen.chat(body.get('body', {}))
                        return self.reply(200, {'statusCode': 200, 'body': result})
                    finally:
                        render_lock.release()
                if operation == '/speech' and method == 'POST':
                    speech=body.get('body', {})
                    text=speech.get('text')
                    if speech.get('language') != 'fr' or not isinstance(text,str) or not 1 <= len(text.strip()) <= 3000:
                        raise ValueError('French speech requires 1 to 3000 characters')
                    voice_name='henri' if speech.get('voice') == 'henri' else 'vivienne'
                    with tempfile.TemporaryDirectory(prefix='musetalk-speech-') as tmp:
                        wav,mp3=Path(tmp)/'speech.wav',Path(tmp)/'speech.mp3'
                        with wave.open(str(wav),'wb') as output:
                            voices[voice_name].synthesize_wav(text,output,syn_config=SynthesisConfig(length_scale=1.03,noise_scale=0.55,noise_w_scale=0.65))
                        subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-ac','1','-b:a','64k',str(mp3)],check=True,timeout=30)
                        audio=mp3.read_bytes()
                        if len(audio)>4000000:raise ValueError('Speech audio too large')
                        return self.reply(200,{'statusCode':200,'body':{'audioData':base64.b64encode(audio).decode(),'mimeType':'audio/mpeg','language':'fr','provider':'huggingface-piper'}})
                if operation in ('/jobs', '/films') and method == 'POST':
                    code, result = submit(body.get('body', {}), operation == '/films')
                    return self.reply(200, {'statusCode': code, 'body': result})
                match = re.fullmatch(r'/jobs/([a-f0-9]{64})(/media|/retry)?', operation or '')
                if match:
                    identifier, action = match.groups()
                    directory = folder(identifier)
                    if not (directory / 'status.json').exists():
                        return self.reply(200, {'statusCode': 404, 'body': {}})
                    if action == '/media' and method == 'GET':
                        path = directory / 'result.mp4'
                        if not path.exists() or json.loads((directory / 'status.json').read_text()).get('status') != 'COMPLETED':
                            return self.reply(200, {'statusCode': 404, 'body': {}})
                        return self.reply(200, {'statusCode': 200, 'videoData': base64.b64encode(path.read_bytes()).decode()})
                    if action is None and method == 'GET':
                        return self.reply(200, {'statusCode': 200, 'body': json.loads((directory / 'status.json').read_text())})
                return self.reply(200, {'statusCode': 404, 'body': {}})
            except (ValueError, TypeError, json.JSONDecodeError) as error:
                self.reply(400, {'error': str(error)})
            except Exception:
                import traceback
                traceback.print_exc()
                self.reply(500, {'error': 'MuseTalk request failed; inspect endpoint logs'})

    HTTPServer(('127.0.0.1', 18061), Handler).serve_forever()


if __name__ == '__main__':
    main()
