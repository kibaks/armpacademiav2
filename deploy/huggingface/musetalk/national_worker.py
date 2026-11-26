"""CPU subprocess boundary: do not retain national weights beside GPU models."""
import json,os
from pathlib import Path
import subprocess,tempfile,threading
from national_engine import validate

class NationalWorker:
    def __init__(self,package,work,ffmpeg):
        self.package,self.work,self.ffmpeg=Path(package),Path(work),str(ffmpeg)
        self.gate=threading.BoundedSemaphore(1)
    def capabilities(self):
        manifest=self.work/'national/installed.json'
        if not manifest.is_file() or not (self.work/'venv-national/bin/python').is_file():
            return {'translation':[],'speech':[],'reviewRequired':True}
        return json.loads(manifest.read_text())
    def request(self,operation,body):
        try:validate(operation,body)
        except ValueError as error:return 422,{'error':str(error)}
        if not self.capabilities()['translation']:return 503,{'error':'National models unavailable'}
        if not self.gate.acquire(blocking=False):return 429,{'error':'National engine busy'}
        try:
            with tempfile.TemporaryDirectory(prefix='academia-national-') as tmp:
                output=Path(tmp)/'output.json'
                env={**os.environ,'OMP_NUM_THREADS':'2','OPENBLAS_NUM_THREADS':'1','CUDA_VISIBLE_DEVICES':'','ACADEMIA_FFMPEG':self.ffmpeg,'HF_HUB_OFFLINE':'1','TRANSFORMERS_OFFLINE':'1'}
                with (Path(tmp)/'private.log').open('wb') as log:
                    subprocess.run([str(self.work/'venv-national/bin/python'),str(self.package/'national_engine.py'),operation,str(output)],input=json.dumps(body).encode(),stdout=log,stderr=log,env=env,timeout=60 if operation=='translate' else 165,check=True)
                if output.stat().st_size>5500000:raise ValueError('National output too large')
                return 200,json.loads(output.read_text())
        except Exception as error:
            print('NATIONAL_REQUEST_FAILED',operation,type(error).__name__,flush=True)
            return 503,{'error':'National inference unavailable'}
        finally:self.gate.release()
