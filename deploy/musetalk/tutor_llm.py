"""Authenticated, bounded gateway to the local fixed Ollama tutor model."""
import json
import threading
import urllib.request
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

gate = threading.BoundedSemaphore(1)

class Chat(BaseModel):
    system: str = Field(min_length=1, max_length=8000)
    prompt: str = Field(min_length=1, max_length=48000)

def create_router(authorize):
    router = APIRouter()

    @router.post('/chat', dependencies=[Depends(authorize)])
    def chat(body: Chat):
        if not gate.acquire(blocking=False):
            raise HTTPException(429, 'Tutor busy')
        try:
            payload = {'model': 'academia-tuteur', 'messages': [
                {'role': 'system', 'content': body.system},
                {'role': 'user', 'content': body.prompt},
            ], 'stream': False, 'think': False, 'keep_alive': -1,
                'options': {'num_ctx': 8192, 'num_predict': 700, 'temperature': 0.2}}
            request = urllib.request.Request('http://127.0.0.1:11434/api/chat', data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(request, timeout=40) as response:
                result = json.loads(response.read(128000))
            reply = result.get('message', {}).get('content', '').strip()
            if not reply or not result.get('done') or result.get('done_reason') == 'length':
                raise ValueError('Incomplete reply')
            return {'reply': reply, 'model': 'academia-tuteur', 'provider': 'qwen3-14b'}
        except Exception:
            raise HTTPException(503, 'Tutor unavailable') from None
        finally:
            gate.release()

    return router
