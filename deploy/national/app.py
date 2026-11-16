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
from typing import Literal
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
    voice: Literal['female', 'male'] = 'female'
    voiceMode: Literal['native', 'consistent'] = 'native'
    text: str = Field(min_length=1, max_length=3000)
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
    device = os.environ.get('NATIONAL_TRANSLATION_DEVICE', 'cpu')
    if device not in {'cpu', 'cuda:0'} or (device == 'cuda:0' and not torch.cuda.is_available()):
        raise RuntimeError('Translation device unavailable')
    model = model.to(device=device, dtype=torch.float16 if device == 'cuda:0' else torch.float32)
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

@app.on_event('startup')
def warm_translation():
    if os.environ.get('NATIONAL_TRANSLATION_DEVICE') == 'cuda:0':
        translation_engine()

@app.get('/health', dependencies=[Depends(authorize)])
def health():
    return {'translationDevice': os.environ.get('NATIONAL_TRANSLATION_DEVICE', 'cpu'), 'translationReady': translation_engine.cache_info().currsize > 0}

@app.get('/capabilities', dependencies=[Depends(authorize)])
def capabilities():
    return {'provider': 'national-local', 'translation': list(LANGUAGES), 'speech': list(VOICES) + [code for code in ('kg', 'lua') if code in os.environ.get('NATIONAL_EXTRA_VOICES', '').split(',')], 'limitations': {'ln': 'Voix locale lingala avec références natives : prononciation à vérifier.', 'sw': 'Accent congolais non validé.', 'kg': 'Kituba de RDC : voix locale expérimentale, prononciation à valider.', 'lua': 'OmniVoice local : prononciation à valider.'}, 'translationModel': 'facebook/nllb-200-distilled-600M', 'reviewRequired': True, 'license': 'non-commercial'}

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
        parts = unicodedata.normalize('NFC', body.text).split('\n')
        translated = list(parts)
        active = [(index, paragraph) for index, paragraph in enumerate(parts) if paragraph.strip()]
        # Small batches share decoder work without an unbounded GPU allocation.
        for start in range(0, len(active), 4):
            batch = active[start:start + 4]
            inputs = tokenizer([paragraph for _, paragraph in batch], return_tensors='pt', padding=True, truncation=False)
            if inputs['input_ids'].shape[1] > 480:
                raise HTTPException(422, 'Paragraph too long for a complete translation')
            inputs = {key: value.to(model.device) for key, value in inputs.items()}
            with torch.inference_mode():
                output = model.generate(**inputs, forced_bos_token_id=tokenizer.convert_tokens_to_ids('fra_Latn' if body.language == 'fr' else LANGUAGES[body.language]), max_new_tokens=768, num_beams=3)
            for tokens in output.tolist():
                # Batched outputs are padded after their EOS token.
                while tokens and tokens[-1] == tokenizer.pad_token_id:
                    tokens.pop()
                if not tokens or tokens[-1] != tokenizer.eos_token_id:
                    raise HTTPException(503, 'Incomplete translation')
            texts = tokenizer.batch_decode(output, skip_special_tokens=True)
            if len(texts) != len(batch) or any(not text.strip() for text in texts):
                raise HTTPException(503, 'Empty translation')
            for (index, _), text in zip(batch, texts):
                translated[index] = unicodedata.normalize('NFC', text.strip())
        return {'text': '\n'.join(translated), 'language': body.language, 'provider': 'nllb-200', 'reviewRequired': True}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(503, 'Translation unavailable') from None
    finally:
        gate.release()

@app.post('/speech', dependencies=[Depends(authorize)])
def speech(body: Speech):
    if (body.voiceMode == 'consistent' and body.language in {'fr', *LANGUAGES}) or (body.language in {'ln', 'kg', 'lua'} and body.language in os.environ.get('NATIONAL_EXTRA_VOICES', '').split(',')):
        import httpx
        try:
            response = httpx.post('http://127.0.0.1:8065/speech', json=body.model_dump(), headers={'Authorization': 'Bearer ' + KEY}, timeout=175, follow_redirects=False)
            if response.status_code in (422, 429): raise HTTPException(response.status_code, 'Speech engine unavailable')
            response.raise_for_status()
            return response.json()
        except HTTPException: raise
        except Exception: raise HTTPException(503, 'Speech engine unavailable') from None
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
            import textwrap
            chunks = textwrap.wrap(text, width=500, break_long_words=False, break_on_hyphens=False)
            if any(len(chunk)>600 for chunk in chunks):
                raise HTTPException(422, 'Word exceeds voice input limit')
            pieces = []
            for chunk in chunks:
                if pieces: pieces.append(np.zeros(int(model.config.sampling_rate * 0.12), dtype=np.float32))
                pieces.append(model(**tokenizer(chunk, return_tensors='pt')).waveform.squeeze().float().numpy())
            audio = np.concatenate(pieces)
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
