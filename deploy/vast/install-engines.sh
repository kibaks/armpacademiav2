#!/bin/bash
set -euo pipefail
umask 077
base=/workspace/academia
app=$base/app
mkdir -p "$base" "$base/private" "$base/logs" "$base/models/piper"
chmod 700 "$base/private"
export DEBIAN_FRONTEND=noninteractive UV_NO_CACHE=1
apt-get update > "$base/logs/packages.log" 2>&1
apt-get install -y espeak-ng libsndfile1 zstd > "$base/logs/packages-install.log" 2>&1
uv venv --python 3.12 "$base/piper-venv" > "$base/logs/piper-install.log" 2>&1
uv pip install --python "$base/piper-venv/bin/python" piper-tts==1.8.0 fastapi==0.115.14 uvicorn==0.34.3 >> "$base/logs/piper-install.log" 2>&1
cd "$base/models/piper"
"$base/piper-venv/bin/python" -m piper.download_voices fr_FR-siwis-medium fr_FR-tom-medium > "$base/logs/piper-download.log" 2>&1
python3 - <<'PY'
from pathlib import Path
import secrets
base=Path('/workspace/academia')
p=base/'private/engines.env'
if not p.exists():p.write_text('TTS_API_KEY='+secrets.token_hex(32)+'\nMUSETALK_API_KEY='+secrets.token_hex(32)+'\nPIPER_MODEL_DIR='+str(base/'models/piper')+'\nMUSETALK_REALTIME=true\n')
p.chmod(0o600)

PY
cat > /opt/supervisor-scripts/academia-piper.sh <<'SCRIPT'
#!/bin/bash
set -e
set -a
. /workspace/academia/private/engines.env
set +a
export OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1
cd /workspace/academia/app/deploy/piper
exec /workspace/academia/piper-venv/bin/uvicorn app:app --host 127.0.0.1 --port 8060 --workers 1 --no-access-log
SCRIPT
chmod 700 /opt/supervisor-scripts/academia-piper.sh
cat > /etc/supervisor/conf.d/academia-piper.conf <<CFG
[program:academia-piper]
command=/opt/supervisor-scripts/academia-piper.sh
autostart=true
autorestart=unexpected
stopasgroup=true
killasgroup=true
stdout_logfile=$base/logs/piper.log
redirect_stderr=true
stdout_logfile_maxbytes=10485760
CFG
supervisorctl reread
supervisorctl update
printf 'PIPER_INSTALLED\n'
# Isolate MuseTalk's Python/CUDA dependencies from both the portal and Piper.
if [ ! -d /opt/MuseTalk/.git ]; then
 git clone https://github.com/TMElyralab/MuseTalk.git /opt/MuseTalk
 git -C /opt/MuseTalk checkout 0a89dec45a0192b824e3cf4daf96c239440c5ed8
fi
uv venv --python 3.10 /opt/MuseTalk/.venv > "$base/logs/musetalk-install.log" 2>&1
uv pip install --python /opt/MuseTalk/.venv/bin/python torch==2.0.1 torchvision==0.15.2 torchaudio==2.0.2 --index-url https://download.pytorch.org/whl/cu118 >> "$base/logs/musetalk-install.log" 2>&1
uv pip install --python /opt/MuseTalk/.venv/bin/python numpy==1.23.5 diffusers==0.30.2 accelerate==0.28.0 opencv-python==4.9.0.80 soundfile==0.12.1 transformers==4.39.2 huggingface_hub==0.30.2 librosa==0.11.0 einops==0.8.1 requests imageio imageio-ffmpeg omegaconf ffmpeg-python moviepy==1.0.3 fastapi==0.115.14 uvicorn==0.34.3 gdown face-alignment==1.4.1 mmengine==0.10.7 >> "$base/logs/musetalk-install.log" 2>&1
uv pip install --python /opt/MuseTalk/.venv/bin/python 'mmcv==2.0.1' --find-links https://download.openmmlab.com/mmcv/dist/cu118/torch2.0/index.html --only-binary mmcv >> "$base/logs/musetalk-install.log" 2>&1
uv pip install --python /opt/MuseTalk/.venv/bin/python pip setuptools==69.5.1 wheel
uv pip install --python /opt/MuseTalk/.venv/bin/python chumpy==0.70 --no-build-isolation >> "$base/logs/musetalk-install.log" 2>&1
uv pip install --python /opt/MuseTalk/.venv/bin/python mmdet==3.1.0 mmpose==1.1.0 >> "$base/logs/musetalk-install.log" 2>&1
cd /opt/MuseTalk
mkdir -p models/musetalkV15 models/sd-vae models/whisper models/dwpose models/face-parse-bisent data/academia
cp "$app/deploy/musetalk/app.py" academia_api.py
cp "$app/deploy/musetalk/realtime_engine.py" "$app/deploy/musetalk/tutor_llm.py" .
cp "$app/public/assets/tutrice-professionnelle-v3.mp4" data/academia/source.mp4
/opt/MuseTalk/.venv/bin/python "$app/deploy/vast/download-models.py" > "$base/logs/musetalk-download.log" 2>&1
printf 'MUSETALK_MODELS_INSTALLED\n'
