"""Authenticated CPU-only translation/TTS worker; no French voice fallback."""
import base64
from functools import lru_cache
import hmac
import io
import os
from pathlib import Path
import subprocess
import threading
import unicodedata

from fastapi import FastAPI, Header, HTTPException, Depends
from pydantic import BaseModel, Field

ROOT = Path(os.environ.get('NATIONAL_MODEL_DIR', '/workspace/academia/models/national-language-evaluation'))
KEY = os.environ['MUSETALK_API_KEY']
if len(KEY) < 32:
    raise RuntimeError('A private server key is required')
LANGUAGES = {'ln': 'lin_Latn', 'sw': 'swh_Latn', 'kg': 'kon_Latn', 'lua': 'lua_Latn'}
VOICES = {'ln': 'lingala-tts', 'sw': 'swahili-tts'}
gate = threading.BoundedSemaphore(1)
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

def authorize(authorization: str = Header(default='')):
    if not hmac.compare_digest(authorization, 'Bearer ' + KEY):
        raise HTTPException(401, 'Unauthorized')

class Translation(BaseModel):
    sourceLanguage: str = Field(default='fr', min_length=2, max_length=3)
    text: str = Field(min_length=1, max_length=6000)
    language: str = Field(min_length=2, max_length=3)

class Speech(BaseModel):
    text: str = Field(min_length=1, max_length=600)
    language: str = Field(min_length=2, max_length=3)

@lru_cache(maxsize=1)
def translation_engine():
    import torch
    from transformers import AutoConfig, AutoTokenizer, AutoModelForSeq2SeqLM
    torch.set_num_threads(4)
    folder = ROOT / 'national-translation'
    tokenizer = AutoTokenizer.from_pretrained(folder, src_lang='fra_Latn', local_files_only=True, trust_remote_code=False, use_fast=True)
    state = torch.load(folder / 'pytorch_model.bin', map_location='cpu', weights_only=True)
    config = AutoConfig.from_pretrained(folder, local_files_only=True, trust_remote_code=False)
    model = AutoModelForSeq2SeqLM.from_pretrained(None, config=config, state_dict=state).eval()
    return tokenizer, model

@lru_cache(maxsize=2)
def voice_engine(language):
    from safetensors.torch import load_file
    from transformers import AutoTokenizer, VitsModel, VitsConfig
    folder = ROOT / VOICES[language]
    tokenizer = AutoTokenizer.from_pretrained(folder, local_files_only=True, trust_remote_code=False)
    state = load_file(str(folder / 'model.safetensors'))
    # Equivalent g/v tensors: support the older PyTorch used by the installed worker.
    state = {k.replace('.parametrizations.weight.original0', '.weight_g').replace('.parametrizations.weight.original1', '.weight_v'): v for k, v in state.items()}
    model, info = VitsModel.from_pretrained(None, config=VitsConfig.from_pretrained(folder, local_files_only=True), state_dict=state, output_loading_info=True)
    if info['missing_keys'] or info['unexpected_keys'] or info.get('mismatched_keys'):
        raise RuntimeError('Incompatible voice checkpoint')
    return tokenizer, model.eval()

def unsupported_letters(text, vocabulary):
    return sorted({char for char in unicodedata.normalize('NFC', text.lower()) if unicodedata.category(char)[0] in 'LMN' and char not in vocabulary})

@app.get('/capabilities', dependencies=[Depends(authorize)])
def capabilities():
    return {'provider': 'national-local', 'translation': list(LANGUAGES), 'speech': list(VOICES), 'limitations': {'ln': 'Les lettres ɛ, ɔ et les tons ne sont pas pris en charge par la voix installée.', 'sw': 'Accent congolais non validé.', 'kg': 'Lecture audio indisponible.', 'lua': 'Lecture audio indisponible.'}, 'translationModel': 'facebook/nllb-200-distilled-600M', 'reviewRequired': True, 'license': 'non-commercial'}

@app.post('/translate', dependencies=[Depends(authorize)])
def translate(body: Translation):
    if body.language not in {'fr', *LANGUAGES} or body.sourceLanguage not in {'fr', *LANGUAGES} or not body.text.strip():
        raise HTTPException(422, 'Unsupported language or empty text')
    if not gate.acquire(blocking=False):
        raise HTTPException(429, 'Language engine busy', headers={'Retry-After': '2'})
    try:
        import torch
        tokenizer, model = translation_engine()
        tokenizer.src_lang = 'fra_Latn' if body.sourceLanguage == 'fr' else LANGUAGES[body.sourceLanguage]
        # Keep paragraph boundaries; never silently truncate a legal condition.
        parts = unicodedata.normalize('NFC', body.text)
        translated = []
        for paragraph in parts.split('\n'):
            if not paragraph.strip():
                translated.append(paragraph)
                continue
            inputs = tokenizer(paragraph, return_tensors='pt', truncation=False)
            if inputs['input_ids'].shape[1] > 480:
                raise HTTPException(422, 'Paragraph too long for a complete translation')
            with torch.inference_mode():
                output = model.generate(**inputs, forced_bos_token_id=tokenizer.convert_tokens_to_ids('fra_Latn' if body.language == 'fr' else LANGUAGES[body.language]), max_new_tokens=768, num_beams=3)
            if int(output[0, -1]) != tokenizer.eos_token_id:
                raise HTTPException(503, 'Incomplete translation')
            text = tokenizer.batch_decode(output, skip_special_tokens=True)[0].strip()
            if not text:
                raise HTTPException(503, 'Empty translation')
            translated.append(unicodedata.normalize('NFC', text))
        return {'text': '\n'.join(translated), 'language': body.language, 'provider': 'nllb-200', 'reviewRequired': True}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(503, 'Translation unavailable') from None
    finally:
        gate.release()

@app.post('/speech', dependencies=[Depends(authorize)])
def speech(body: Speech):
    if body.language not in VOICES or not body.text.strip():
        raise HTTPException(422, 'No voice for this language')
    if not gate.acquire(blocking=False):
        raise HTTPException(429, 'Language engine busy', headers={'Retry-After': '2'})
    try:
        import numpy as np
        import torch
        from scipy.io.wavfile import write
        tokenizer, model = voice_engine(body.language)
        text = unicodedata.normalize('NFC', body.text)
        missing = unsupported_letters(text, tokenizer.get_vocab())
        if missing:
            raise HTTPException(422, detail={'code': 'UNSUPPORTED_CHARACTERS', 'characters': missing})
        with torch.inference_mode():
            audio = model(**tokenizer(text, return_tensors='pt')).waveform.squeeze().float().numpy()
        if not np.isfinite(audio).all() or len(audio) < 100 or np.max(np.abs(audio)) < 0.001:
            raise HTTPException(503, 'Invalid voice output')
        wav = io.BytesIO()
        write(wav, model.config.sampling_rate, (np.clip(audio, -1, 1) * 32767).astype(np.int16))
        result = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-b:a', '96k', '-f', 'mp3', 'pipe:1'], input=wav.getvalue(), capture_output=True, timeout=30, check=True)
        if not result.stdout or len(result.stdout) > 4_000_000:
            raise HTTPException(503, 'Invalid voice output')
        return {'audioData': base64.b64encode(result.stdout).decode(), 'mimeType': 'audio/mpeg', 'provider': 'national-vits', 'language': body.language, 'wordBoundaries': []}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(503, 'Voice unavailable') from None
    finally:
        gate.release()
