"""Fixed Qwen3 in an isolated modern PyTorch process on the shared T4."""
import atexit
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import re
from pathlib import Path
import subprocess
import time
import urllib.request

MODEL = 'Qwen/Qwen3-4B-Instruct-2507'
REVISION = 'cdbee75f17c01a7cc42f958dc650907174af0554'


def validate_chat(body):
    if not isinstance(body, dict):
        raise ValueError('Expected chat object')
    for key, limit in [('system', 8000), ('prompt', 48000)]:
        if not isinstance(body.get(key), str) or not 1 <= len(body[key].strip()) <= limit:
            raise ValueError('Invalid ' + key)
    return [{'role': 'system', 'content': body['system']},
            {'role': 'user', 'content': body['prompt']}]


def fit_chat(body, measure, limit=8192):
    """Retain system/question exactly; remove whole context units, never cut a rule."""
    messages=validate_chat(body)
    if measure(messages)<=limit: return messages
    prompt=body['prompt']
    start=prompt.find('{')
    if start<0: raise ValueError('Course context too long')
    try: data=json.loads(prompt[start:])
    except (ValueError,TypeError): raise ValueError('Course context too long') from None
    if not isinstance(data,dict) or not isinstance(data.get('question'),str):
        raise ValueError('Course context too long')
    data['contexteReduit']=True
    data['profil']=''  # server-verified level remains in the unmodified system policy
    history=data.get('historique')
    data['historique']=history[-2:] if isinstance(history,list) else []
    def current():
        return [messages[0],{'role':'user','content':prompt[:start]+json.dumps(data,ensure_ascii=False)}]
    def fits(): return measure(current())<=limit
    if fits(): return current()
    while data['historique']:
        data['historique'].pop(0)
        if fits(): return current()
    sources=data.get('extraitsDuCours')
    if isinstance(sources,str):
        chunks=re.split(r'(?=\n• Cours)',sources)
        while len(chunks)>1:
            chunks.pop()
            data['extraitsDuCours']=''.join(chunks)
            if fits(): return current()
    # Prefer the complete active lesson to a partial retrieved legal provision.
    data['extraitsDuCours']=''
    if fits(): return current()
    data['lecon']=''
    if fits(): return current()
    raise ValueError('Question and system policy exceed the model context')


class QwenClient:
    def __init__(self, package, work):
        env = os.environ.copy()
        site = work / 'venv-llm/lib/python3.10/site-packages'
        # Never mix MuseTalk's legacy CUDA libraries with the modern LLM runtime.
        libs = [site / 'torch/lib', *sorted((site / 'nvidia').glob('*/lib'))]
        env['LD_LIBRARY_PATH'] = os.pathsep.join(map(str, libs))
        self.process = subprocess.Popen([str(work / 'venv-llm/bin/python'),
            str(package / 'qwen_engine.py')], env=env, stderr=subprocess.STDOUT)
        atexit.register(self.process.terminate)
        deadline = time.monotonic() + 240
        while time.monotonic() < deadline:
            if self.process.poll() is not None:
                raise RuntimeError('Qwen process exited; inspect endpoint logs')
            try:
                with urllib.request.urlopen('http://127.0.0.1:18062/health',timeout=2) as r:
                    if json.load(r).get('ready'): return
            except OSError: pass
            time.sleep(2)
        self.process.terminate()
        raise TimeoutError('Qwen startup timed out')

    def chat(self, body):
        validate_chat(body)
        request=urllib.request.Request('http://127.0.0.1:18062/chat',
            data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
        with urllib.request.urlopen(request,timeout=38) as response:
            return json.load(response)


class QwenEngine:
    def __init__(self):
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM
        from transformers.integrations import sdpa_attention
        from torch.nn.attention import SDPBackend, sdpa_kernel
        # In pinned Transformers 4.56, GQA selects Flash/math only. T4 cannot
        # use Flash; explicit KV repetition permits the efficient CUDA kernel.
        sdpa_attention.use_gqa_in_sdpa = lambda *_: False
        self.sdpa_kernel = sdpa_kernel
        self.backends = [SDPBackend.EFFICIENT_ATTENTION]
        self.context_limit = 8192
        torch.set_num_threads(3)
        self.torch = torch
        self.tokenizer = AutoTokenizer.from_pretrained(MODEL, revision=REVISION, trust_remote_code=False,local_files_only=True)
        self.model = AutoModelForCausalLM.from_pretrained(
            MODEL, revision=REVISION, trust_remote_code=False,local_files_only=True,
            torch_dtype=torch.float16, device_map={'': 0},attn_implementation='sdpa')
        self.model.eval()
        probe = self.tokenizer('Bonjour', return_tensors='pt').to('cuda:0')
        try:
            with torch.inference_mode(), sdpa_kernel(self.backends):
                self.model(**probe, use_cache=False, logits_to_keep=1)
        except RuntimeError as error:
            if 'kernel' not in str(error).lower(): raise
            self.backends = [SDPBackend.MATH]
            self.context_limit = 3072
        del probe
        torch.cuda.empty_cache()
        print('ACADEMIA_QWEN3_READY context_limit=' + str(self.context_limit), flush=True)

    def chat(self, body):
        try:
            try:
                return self._chat(body)
            except self.torch.OutOfMemoryError:
                print('QWEN_CONTEXT_MEMORY_RETRY', flush=True)
            # Leave the except block before retrying so failed tensor frames are released.
            self.torch.cuda.empty_cache()
            return self._chat(body, limit=3072)
        finally:
            self.torch.cuda.empty_cache()

    def _chat(self, body, limit=None):
        def measure(messages):
            return len(self.tokenizer.apply_chat_template(messages,tokenize=True,add_generation_prompt=True))
        budget=min(limit or self.context_limit, self.context_limit)
        messages=fit_chat(body,measure,limit=budget)
        text=self.tokenizer.apply_chat_template(messages,tokenize=False,add_generation_prompt=True)
        inputs=self.tokenizer(text,return_tensors='pt').to('cuda:0')
        length=inputs.input_ids.shape[-1]
        if length>budget: raise ValueError('Course context too long; shorten the supplied extracts')
        with self.torch.inference_mode(), self.sdpa_kernel(self.backends):
            output=self.model.generate(**inputs,max_new_tokens=700,max_time=32,
                do_sample=False,temperature=1.0,top_p=1.0,top_k=0,use_cache=True,
                pad_token_id=self.tokenizer.eos_token_id,logits_to_keep=1)
        generated=output[0,length:]
        eos=self.model.generation_config.eos_token_id
        eos=eos if isinstance(eos,list) else [eos]
        if not len(generated) or int(generated[-1]) not in eos:
            raise RuntimeError('Incomplete tutor reply')
        reply=self.tokenizer.decode(generated,skip_special_tokens=True).strip()
        if not reply or len(reply)>12000: raise RuntimeError('Invalid tutor reply')
        return {'reply':reply,'model':'academia-tuteur','provider':'qwen3-4b-instruct-2507-hf'}


def main():
    engine=QwenEngine()
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args): pass
        def reply(self,code,value):
            data=json.dumps(value).encode()
            self.send_response(code);self.send_header('Content-Type','application/json')
            self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
        def do_GET(self): self.reply(200 if self.path=='/health' else 404,{'ready':True})
        def do_POST(self):
            try:
                size=int(self.headers.get('Content-Length','0'))
                if self.path!='/chat' or not 0<size<350000: return self.reply(400,{'error':'Invalid request'})
                return self.reply(200,engine.chat(json.loads(self.rfile.read(size))))
            except ValueError: return self.reply(400,{'error':'Invalid chat context'})
            except Exception:
                import traceback
                traceback.print_exc()
                return self.reply(503,{'error':'Tutor generation unavailable'})
    HTTPServer(('127.0.0.1',18062),Handler).serve_forever()


if __name__=='__main__': main()
