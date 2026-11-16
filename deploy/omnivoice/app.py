"""Private local Tshiluba and experimental Bandundu Kituba speech engine."""
import base64, hmac, io, json, os, subprocess, threading, unicodedata
from functools import lru_cache
from pathlib import Path
from fastapi import Response, FastAPI, Depends, Header, HTTPException
from typing import Literal
from pydantic import BaseModel, Field
from speech_cache import SpeechCache, speech_key
cache = SpeechCache()

KEY = os.environ['MUSETALK_API_KEY']
if len(KEY) < 32: raise RuntimeError('Private key required')
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
gate = threading.BoundedSemaphore(1)
class Speech(BaseModel):
    language: str
    voice: Literal['female', 'male'] = 'female'
    voiceMode: Literal['native', 'consistent'] = 'native'
    text: str = Field(min_length=1, max_length=3000)
def authorize(authorization: str = Header(default='')):
    if not hmac.compare_digest(authorization, 'Bearer ' + KEY): raise HTTPException(401, 'Unauthorized')
@lru_cache(maxsize=1)
def engine():
    import torch
    from omnivoice import OmniVoice
    torch.set_num_threads(4)
    device = os.environ.get('OMNIVOICE_DEVICE', 'cpu')
    if device == 'cuda:0' and not torch.cuda.is_available(): raise RuntimeError('CUDA unavailable')
    return OmniVoice.from_pretrained(os.environ.get('OMNIVOICE_MODEL_DIR', '/workspace/academia/models/omnivoice'), device_map=device, dtype=torch.float16 if device.startswith('cuda') else torch.float32)
@lru_cache(maxsize=3)
def native_prompt(language):
    import torch
    import soundfile as sf
    folder = {'ln': 'lingala-corpus', 'lua': 'tshiluba-corpus', 'kg': 'kikongo-corpus'}[language]
    reference = json.loads(Path('/workspace/academia/models/' + folder + '/reference.json').read_text())
    audio, rate = sf.read(reference['audio'], dtype='float32', always_2d=True)
    return engine().create_voice_clone_prompt(ref_audio=(torch.from_numpy(audio.T), rate), ref_text=reference['text'])
@lru_cache(maxsize=2)
def consistent_prompt(voice):
    import torch
    import soundfile as sf
    reference = json.loads(Path('/workspace/academia/models/tutor-identity/' + voice + '.json').read_text())
    audio, rate = sf.read(reference['audio'], dtype='float32', always_2d=True)
    return engine().create_voice_clone_prompt(ref_audio=(torch.from_numpy(audio.T), rate), ref_text=reference['text'])
@app.on_event('startup')
def warmup():
    engine()
@app.get('/health', dependencies=[Depends(authorize)])
def health():
    return {'ready': True, 'languages': ['fr', 'ln', 'sw', 'lua', 'kg'], 'consistentVoice': True, 'experimental': ['kg'], 'local': True}
def synthesize(body):
    text = unicodedata.normalize('NFC', body.text).strip()
    if not text: raise HTTPException(422, 'Empty text')
    if body.language in {'ln', 'lua', 'kg'} or body.voiceMode == 'consistent':
        import numpy as np
        import soundfile as sf
        import textwrap
        chunks = textwrap.wrap(text, width=350, break_long_words=False, break_on_hyphens=False)
        if any(len(c)>500 for c in chunks): raise HTTPException(422, 'Word too long')
        # Speaker identity never depends on the target language in consistent mode.
        prompt = consistent_prompt(body.voice) if body.voiceMode == 'consistent' else native_prompt(body.language)
        pieces = []
        for chunk in chunks:
            if body.voiceMode == 'consistent':
                import torch
                torch.manual_seed(271828 if body.voice == 'female' else 314159)
            pieces.append(engine().generate(text=chunk, language=body.language if body.language in {'fr', 'sw', 'ln', 'lua'} else None, voice_clone_prompt=prompt, num_step=32)[0])
        audio = np.concatenate([p for i,a in enumerate(pieces) for p in ([np.zeros(2880),a] if i else [a])])
        if not np.isfinite(audio).all() or len(audio)<2400 or np.max(np.abs(audio))<0.001: raise RuntimeError('Invalid output')
        wav = io.BytesIO(); sf.write(wav, audio, 24000, format='WAV', subtype='PCM_16')
        return wav.getvalue(), 'national-omnivoice'
    raise HTTPException(422, 'Unsupported language')
@app.post('/speech', dependencies=[Depends(authorize)])
def speech(body: Speech, response: Response):
    if body.language not in {'fr', 'sw', 'ln', 'lua', 'kg'} or (body.language in {'fr', 'sw'} and body.voiceMode != 'consistent'): raise HTTPException(422, 'Unsupported language')
    key = speech_key(body)
    cached = cache.get(key)
    if cached is not None:
        response.headers['X-Speech-Cache'] = 'HIT'
        return cached
    response.headers['X-Speech-Cache'] = 'MISS'
    if not gate.acquire(blocking=False): raise HTTPException(429, 'Speech engine busy', headers={'Retry-After':'2'})
    try:
        wav, provider=synthesize(body)
        result=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i','pipe:0','-codec:a','libmp3lame','-b:a','96k','-f','mp3','pipe:1'],input=wav,capture_output=True,timeout=30,check=True)
        if not 44<len(result.stdout)<4_000_000: raise RuntimeError('Invalid output size')
        payload = {'audioData':base64.b64encode(result.stdout).decode(),'mimeType':'audio/mpeg','provider':provider,'language':body.language,'wordBoundaries':[], **({'voiceId': 'academia-' + body.voice + '-v1'} if body.voiceMode == 'consistent' else {})}
        cache.put(key, payload)
        return payload
    except HTTPException: raise
    except Exception as e:
        print('National speech failed:',type(e).__name__,flush=True)
        raise HTTPException(503,'Speech generation unavailable') from None
    finally: gate.release()
