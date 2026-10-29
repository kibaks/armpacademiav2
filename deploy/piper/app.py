import json
from pathlib import Path
import onnxruntime
from piper.config import PiperConfig
from passages import split_passages
import hmac
import io
import os
import threading
import subprocess
import wave
from enum import Enum
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from piper import PiperVoice, SynthesisConfig

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
def load_voice(path: str):
    options = onnxruntime.SessionOptions()
    options.intra_op_num_threads = 1
    options.inter_op_num_threads = 1
    options.enable_cpu_mem_arena = False
    options.enable_mem_pattern = False
    config = PiperConfig.from_dict(json.loads(Path(path + '.json').read_text()))
    session = onnxruntime.InferenceSession(path, sess_options=options, providers=['CPUExecutionProvider'])
    return PiperVoice(session=session, config=config)

voices = {
    'female': load_voice(str(Path(os.environ.get('PIPER_MODEL_DIR', '/models')) / 'fr_FR-siwis-medium.onnx')),
    'male': load_voice(str(Path(os.environ.get('PIPER_MODEL_DIR', '/models')) / 'fr_FR-tom-medium.onnx')),
}
lock = threading.Lock()
token = os.environ['TTS_API_KEY']
if len(token) < 32:
    raise RuntimeError('TTS_API_KEY must contain at least 32 characters')

class Voice(str, Enum):
    female = 'female'
    male = 'male'

class AudioFormat(str, Enum):
    wav = 'wav'
    mp3 = 'mp3'

class Speech(BaseModel):
    text: str = Field(min_length=1, max_length=3000)
    voice: Voice = Voice.female
    format: AudioFormat = AudioFormat.wav

@app.get('/health')
def health():
    return {'status': 'ok', 'engine': 'piper', 'voices': list(voices)}

@app.post('/synthesize')
def synthesize(body: Speech, authorization: str = Header(default='')):
    if not hmac.compare_digest(authorization, 'Bearer ' + token):
        raise HTTPException(status_code=401, detail='Authentication required')
    if not body.text.strip():
        raise HTTPException(status_code=422, detail='Text cannot be empty')
    if not lock.acquire(blocking=False):
        raise HTTPException(status_code=429, detail='Voice engine busy', headers={'Retry-After':'2'})
    try:
        output = io.BytesIO()
        voice = voices[body.voice.value]
        with wave.open(output, 'wb') as wav:
            wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(voice.config.sample_rate)
            for passage in split_passages(body.text.strip()):
                fragment = io.BytesIO()
                with wave.open(fragment, 'wb') as fragment_wav:
                    voice.synthesize_wav(passage, fragment_wav, syn_config=SynthesisConfig(length_scale=1.08) if body.voice == Voice.male else None)
                with wave.open(io.BytesIO(fragment.getvalue()), 'rb') as fragment_wav:
                    wav.writeframes(fragment_wav.readframes(fragment_wav.getnframes()))
        audio = output.getvalue()
        if body.voice == Voice.male:
            # Lower pitch by about two semitones, compensating the tempo.
            # The slightly slower delivery comes from Piper, not a slowed recording.
            result = subprocess.run([
                'ffmpeg', '-hide_banner', '-loglevel', 'error', '-threads', '1',
                '-i', 'pipe:0', '-af',
                'asetrate=39249,aresample=44100,atempo=1.1235955,bass=g=1.5:f=140,alimiter=limit=0.95:level=false',
                '-ar', '44100', '-ac', '1', '-f', 's16le', 'pipe:1',
            ], input=audio, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
            if result.returncode != 0 or not result.stdout:
                raise HTTPException(status_code=503, detail='Voice processing unavailable')
            adjusted = io.BytesIO()
            with wave.open(adjusted, 'wb') as wav:
                wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(44100)
                wav.writeframes(result.stdout)
            audio = adjusted.getvalue()
        mime_type = 'audio/wav'
        if body.format == AudioFormat.mp3:
            encoded = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-threads', '1', '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-b:a', '128k', '-f', 'mp3', 'pipe:1'], input=audio, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
            if encoded.returncode != 0 or not encoded.stdout:
                raise HTTPException(status_code=503, detail='Audio encoding unavailable')
            audio = encoded.stdout
            mime_type = 'audio/mpeg'
        return Response(content=audio, media_type=mime_type, headers={'Cache-Control':'no-store'})
    finally:
        lock.release()
