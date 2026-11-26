"""Bounded national inference: GPU under the shared gate, CPU fallback, RAM cache."""
import json,os,time
from pathlib import Path
import subprocess,tempfile,threading
from national_engine import validate
from national_cache import NationalCache,request_key

class NationalWorker:
    def __init__(self,package,work,ffmpeg,gpu_session=None):
        self.package,self.work,self.ffmpeg=Path(package),Path(work),str(ffmpeg)
        self.gate=threading.BoundedSemaphore(1);self.gpu_session=gpu_session;self.cache=NationalCache()
    def capabilities(self):
        manifest=self.work/'national/installed.json'
        if not manifest.is_file() or not (self.work/'venv-national/bin/python').is_file():
            return {'translation':[],'speech':[],'reviewRequired':True}
        return json.loads(manifest.read_text())
    def _run(self,operation,body,device,timeout):
        with tempfile.TemporaryDirectory(prefix='academia-national-') as tmp:
            output=Path(tmp)/'output.json'
            env={**os.environ,'OMP_NUM_THREADS':'2','OPENBLAS_NUM_THREADS':'1','NATIONAL_DEVICE':device,'ACADEMIA_FFMPEG':self.ffmpeg,'HF_HUB_OFFLINE':'1','TRANSFORMERS_OFFLINE':'1'}
            if device=='cpu':env['CUDA_VISIBLE_DEVICES']=''
            with (Path(tmp)/'private.log').open('wb') as log:
                subprocess.run([str(self.work/'venv-national/bin/python'),str(self.package/'national_engine.py'),operation,str(output)],input=json.dumps(body).encode(),stdout=log,stderr=log,env=env,timeout=timeout,check=True)
            if output.stat().st_size>5500000:raise ValueError('National output too large')
            result=json.loads(output.read_text());result['device']=device
            return result
    def request(self,operation,body):
        try:validate(operation,body)
        except ValueError as error:return 422,{'error':str(error)}
        if not self.capabilities()['translation']:return 503,{'error':'National models unavailable'}
        key=request_key(operation,body);cached=self.cache.get(key)
        if cached is not None:return 200,{**cached,'cacheHit':True}
        if not self.gate.acquire(blocking=False):return 429,{'error':'National engine busy'}
        started=time.monotonic();budget=60 if operation=='translate' else 165
        try:
            result=None
            if self.gpu_session is not None:
                try:
                    with self.gpu_session() as ready:
                        if ready:result=self._run(operation,body,'cuda:0',20 if operation=='translate' else 30)
                except Exception as error:
                    # A child process releases its CUDA context before fallback.
                    print('NATIONAL_GPU_FALLBACK',operation,type(error).__name__,flush=True)
            if result is None:
                remaining=budget-(time.monotonic()-started)
                if remaining<=0:raise TimeoutError('National request deadline')
                result=self._run(operation,body,'cpu',remaining)
            self.cache.put(key,result)
            return 200,{**result,'cacheHit':False}
        except Exception as error:
            print('NATIONAL_REQUEST_FAILED',operation,type(error).__name__,flush=True)
            return 503,{'error':'National inference unavailable'}
        finally:self.gate.release()
