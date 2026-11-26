"""HF endpoint handler; isolate MuseTalk's legacy CUDA/Python dependencies."""
import atexit
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import time
import urllib.request


class EndpointHandler:
    def __init__(self, path=''):
        self.root = Path(os.environ.get('ACADEMIA_PACKAGE') or path or __file__).resolve()
        if self.root.is_file():
            self.root = self.root.parent
        self.slots = threading.BoundedSemaphore(4)
        self.work = Path(os.environ.get('ACADEMIA_RUNTIME', '/tmp/academia-musetalk'))
        self.work.mkdir(parents=True, exist_ok=True)
        env = os.environ.copy()
        env.update(UV_CACHE_DIR=str(self.work / 'uv-cache'),
                   UV_PYTHON_INSTALL_DIR=str(self.work / 'python'),
                   OMP_NUM_THREADS='4', OPENBLAS_NUM_THREADS='1')
        if os.environ.get('ACADEMIA_PREBUILT') == '1':
            # Fail closed: a broken image must never reinstall packages on a GPU.
            if not (self.work / 'runtime-ready.json').is_file():
                raise RuntimeError('Prebuilt runtime manifest missing')
        else:
            # Compatibility with the previous HF toolkit deployment.
            subprocess.run([sys.executable, str(self.root / 'setup_runtime.py'),
                            str(self.root), str(self.work)], env=env,
                           stderr=subprocess.STDOUT, check=True, timeout=1500)
        self.process = subprocess.Popen([
            str(self.work / 'venv/bin/python'), str(self.root / 'worker.py'),
            str(self.root), str(self.work)], env=env,
            stderr=subprocess.STDOUT)
        atexit.register(self.process.terminate)
        deadline = time.monotonic() + 600
        while time.monotonic() < deadline:
            if self.process.poll() is not None:
                raise RuntimeError('MuseTalk worker exited; inspect endpoint logs')
            try:
                with urllib.request.urlopen('http://127.0.0.1:18061/health', timeout=2) as r:
                    if json.load(r).get('ready'):
                        return
            except OSError:
                pass
            time.sleep(2)
        self.process.terminate()
        raise TimeoutError('Tutor worker startup exceeded ten minutes')

    def __call__(self, data):
        if not isinstance(data, dict):
            raise ValueError('Expected JSON object')
        body = data.get('inputs', data)
        if not isinstance(body, dict):
            raise ValueError('inputs must contain audioData')
        with self.slots:
            request = urllib.request.Request('http://127.0.0.1:18061/predict',
                data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(request, timeout=180) as response:
                return json.load(response)
