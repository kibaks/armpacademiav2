"""Image-build-only dependency: prepare isolated runtimes in HF's managed image.

Never install on a workstation: this build hook downloads the public model
weights and installs the two runtimes under /opt. Runtime startup fails closed
if the manifest is absent. No credential is read, persisted or printed here.
"""
import base64
import csv
import hashlib
import io
import json
import os
from pathlib import Path
import runpy
import sys
import urllib.request
import zipfile

NAME = 'academia_runtime_builder'
VERSION = '0.1.0'
DIST = NAME + '-' + VERSION + '.dist-info'
SOURCE_REVISION = '30866eba1dd75fe2f7c742e53799f84591c0e789'
FILES = ['handler.py', 'worker.py', 'setup_runtime.py', 'download_models.py',
         'qwen_engine.py', 'realtime_engine.py', 'course_motion.py', 'source.mp4']


def metadata():
    return {'METADATA': f'Metadata-Version: 2.1\nName: {NAME}\nVersion: {VERSION}\nSummary: Prepare the Academia managed inference image at build time\n',
            'WHEEL': 'Wheel-Version: 1.0\nGenerator: academia-image-builder\nRoot-Is-Purelib: true\nTag: py3-none-any\n'}


def prepare_runtime():
    package, work, cache = map(Path, ['/opt/academia-package', '/opt/academia-runtime', '/opt/academia-models'])
    for directory in [package, work, cache]: directory.mkdir(parents=True, exist_ok=True)
    os.environ.update(HF_HOME=str(cache), UV_CACHE_DIR=str(work/'uv-cache'),
        UV_PYTHON_INSTALL_DIR=str(work/'python'), OMP_NUM_THREADS='4', OPENBLAS_NUM_THREADS='1')
    base=f'https://raw.githubusercontent.com/kibaks/armpacademiav2/{SOURCE_REVISION}/deploy/huggingface/musetalk/'
    for name in FILES:
        with urllib.request.urlopen(base+name, timeout=60) as response:
            (package/name).write_bytes(response.read())
    print('ACADEMIA_MANAGED_IMAGE_PREPARING source='+SOURCE_REVISION, flush=True)
    previous=sys.argv
    try:
        sys.argv=[str(package/'setup_runtime.py'),str(package),str(work)]
        runpy.run_path(str(package/'setup_runtime.py'),run_name='__main__')
    finally: sys.argv=previous
    (work/'runtime-ready.json').write_text(json.dumps({'version':1,'source':SOURCE_REVISION,'prebuilt':True}))
    # uv cache uses hard links; removing it retains the installed environments.
    import subprocess, uv
    subprocess.run([uv.find_uv_bin(),'cache','clean'],check=True)
    print('ACADEMIA_MANAGED_IMAGE_READY',flush=True)


def get_requires_for_build_wheel(config_settings=None): return []


def prepare_metadata_for_build_wheel(metadata_directory, config_settings=None):
    directory=Path(metadata_directory)/DIST
    directory.mkdir(parents=True,exist_ok=True)
    for name,value in metadata().items(): (directory/name).write_text(value)
    return DIST


def build_wheel(wheel_directory, config_settings=None, metadata_directory=None):
    prepare_runtime()
    files={DIST+'/'+name:value.encode() for name,value in metadata().items()}
    files['academia_prebuilt_runtime.py']=b"ROOT = '/opt/academia-runtime'\n"
    records=[]
    for name,data in files.items():
        digest=base64.urlsafe_b64encode(hashlib.sha256(data).digest()).decode().rstrip('=')
        records.append([name,'sha256='+digest,str(len(data))])
    records.append([DIST+'/RECORD','',''])
    stream=io.StringIO();csv.writer(stream).writerows(records)
    files[DIST+'/RECORD']=stream.getvalue().encode()
    filename=f'{NAME}-{VERSION}-py3-none-any.whl'
    with zipfile.ZipFile(Path(wheel_directory)/filename,'w',zipfile.ZIP_DEFLATED) as archive:
        for name,data in files.items():archive.writestr(name,data)
    return filename
