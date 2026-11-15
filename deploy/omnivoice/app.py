"""Private local Tshiluba and experimental Bandundu Kituba speech engine."""
import base64, hmac, io, json, os, subprocess, threading, unicodedata
from functools import lru_cache
from pathlib import Path
from fastapi import FastAPI, Depends, Header, HTTPException
from pydantic import BaseModel, Field

KEY = os.environ['MUSETALK_API_KEY']
if len(KEY) < 32: raise RuntimeError('Private key required')
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
gate = threading.BoundedSemaphore(1)
class Speech(BaseModel):
    language: str
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
@app.on_event('startup')
def warmup():
    engine()
@app.get('/health', dependencies=[Depends(authorize)])
def health():
    return {'ready': True, 'languages': ['ln', 'lua', 'kg'], 'experimental': ['kg'], 'local': True}
def synthesize(body):
    text = unicodedata.normalize('NFC', body.text).strip()
    if not text: raise HTTPException(422, 'Empty text')
    if body.language in {'ln', 'lua', 'kg'}:
        import numpy as np
        import soundfile as sf
        import textwrap
        chunks = textwrap.wrap(text, width=350, break_long_words=False, break_on_hyphens=False)
        if any(len(c)>500 for c in chunks): raise HTTPException(422, 'Word too long')
        # Both profiles use the native reference and the 32-step configuration heard in review.
        pieces = []
        for chunk in chunks:
            pieces.append(engine().generate(text=chunk, language=body.language if body.language in {'ln', 'lua'} else None, voice_clone_prompt=native_prompt(body.language), num_step=32)[0])
        audio = np.concatenate([p for i,a in enumerate(pieces) for p in ([np.zeros(2880),a] if i else [a])])
        if not np.isfinite(audio).all() or len(audio)<2400 or np.max(np.abs(audio))<0.001: raise RuntimeError('Invalid output')
        wav = io.BytesIO(); sf.write(wav, audio, 24000, format='WAV', subtype='PCM_16')
        return wav.getvalue(), 'national-omnivoice'
    raise HTTPException(422, 'Unsupported language')
@app.post('/speech', dependencies=[Depends(authorize)])
def speech(body: Speech):
    if body.language not in {'ln', 'lua', 'kg'}: raise HTTPException(422, 'Unsupported language')
    if not gate.acquire(blocking=False): raise HTTPException(429, 'Speech engine busy', headers={'Retry-After':'2'})
    try:
        wav, provider=synthesize(body)
        result=subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-i','pipe:0','-codec:a','libmp3lame','-b:a','96k','-f','mp3','pipe:1'],input=wav,capture_output=True,timeout=30,check=True)
        if not 44<len(result.stdout)<4_000_000: raise RuntimeError('Invalid output size')
        return {'audioData':base64.b64encode(result.stdout).decode(),'mimeType':'audio/mpeg','provider':provider,'language':body.language,'wordBoundaries':[]}
    except HTTPException: raise
    except Exception as e:
        print('National speech failed:',type(e).__name__,flush=True)
        raise HTTPException(503,'Speech generation unavailable') from None
    finally: gate.release()
