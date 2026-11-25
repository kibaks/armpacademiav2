"""Install the known MuseTalk Python 3.10 stack without changing HF's server."""
from pathlib import Path
import shutil
import subprocess
import sys
import urllib.request
import zipfile

REVISION = '0a89dec45a0192b824e3cf4daf96c239440c5ed8'


def main():
    package, work = map(Path, sys.argv[1:])
    repo = work / 'MuseTalk'
    if not repo.exists():
        archive = work / 'musetalk.zip'
        urllib.request.urlretrieve(
            f'https://codeload.github.com/TMElyralab/MuseTalk/zip/{REVISION}', archive)
        with zipfile.ZipFile(archive) as z:
            z.extractall(work)
        (work / f'MuseTalk-{REVISION}').rename(repo)
        archive.unlink()
    import uv
    uvbin = uv.find_uv_bin()
    python = work / 'venv/bin/python'
    if not python.exists():
        subprocess.run([uvbin, 'venv', '--python', '3.10', str(work / 'venv')], check=True)
    def install(*args):
        subprocess.run([uvbin, 'pip', 'install', '--python', str(python), *args], check=True)
    install('torch==2.0.1', 'torchvision==0.15.2', 'torchaudio==2.0.2',
            '--index-url', 'https://download.pytorch.org/whl/cu118')
    install('numpy==1.23.5', 'diffusers==0.30.2', 'accelerate==0.28.0',
            'opencv-python==4.9.0.80', 'soundfile==0.12.1', 'transformers==4.39.2',
            'huggingface_hub==0.30.2', 'librosa==0.11.0', 'einops==0.8.1',
            'imageio', 'imageio-ffmpeg==0.6.0', 'omegaconf', 'ffmpeg-python',
            'moviepy==1.0.3', 'gdown', 'face-alignment==1.4.1',
            'mmengine==0.10.7', 'pip', 'setuptools==69.5.1', 'wheel', 'piper-tts==1.8.0', 'onnxruntime==1.20.1')
    install('mmcv==2.0.1', '--find-links',
            'https://download.openmmlab.com/mmcv/dist/cu118/torch2.0/index.html',
            '--only-binary', 'mmcv')
    install('chumpy==0.70', '--no-build-isolation')
    install('mmdet==3.1.0', 'mmpose==1.1.0', 'numpy==1.23.5', 'opencv-python==4.9.0.80')
    # Headless OpenCV avoids requiring system libGL in HF's serving image.
    subprocess.run([uvbin, 'pip', 'uninstall', '--python', str(python), 'opencv-python'], check=True)
    install('opencv-python-headless==4.9.0.80')
    for directory in ['musetalkV15', 'sd-vae', 'whisper', 'dwpose', 'face-parse-bisent']:
        (repo / 'models' / directory).mkdir(parents=True, exist_ok=True)
    (repo / 'data/academia').mkdir(parents=True, exist_ok=True)
    (repo / 'results').mkdir(exist_ok=True)
    shutil.copy2(package / 'source.mp4', repo / 'data/academia/source-input.mp4')
    subprocess.run([str(python), str(package / 'download_models.py'), str(repo / 'models')], check=True)
    voices=work / 'voices'
    voices.mkdir(exist_ok=True)
    subprocess.run([str(python), '-m', 'piper.download_voices', 'fr_FR-siwis-medium', 'fr_FR-tom-medium'], cwd=voices, check=True)
    llm_python=work / 'venv-llm/bin/python'
    if not llm_python.exists():
        subprocess.run([uvbin,'venv','--python','3.10',str(work/'venv-llm')],check=True)
    subprocess.run([uvbin,'pip','install','--python',str(llm_python),'torch==2.6.0',
        '--index-url','https://download.pytorch.org/whl/cu118'],check=True)
    subprocess.run([uvbin,'pip','install','--python',str(llm_python),
        'transformers==4.56.2','accelerate==1.10.1','numpy==1.26.4'],check=True)
    subprocess.run([str(llm_python),'-c',
        "from huggingface_hub import snapshot_download; snapshot_download('Qwen/Qwen3-4B-Instruct-2507', revision='cdbee75f17c01a7cc42f958dc650907174af0554', allow_patterns=['*.json','*.safetensors','*.txt','*.model','*.tiktoken'])"],check=True)
    print('MUSETALK_RUNTIME_INSTALLED', flush=True)


if __name__ == '__main__':
    main()
