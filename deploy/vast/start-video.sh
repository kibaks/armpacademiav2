#!/bin/bash
set -euo pipefail
# Prime the avatar with local Piper audio if no warmup sample exists yet.
if [ ! -s /opt/MuseTalk/data/academia/reply.wav ]; then
 python3 - <<'PYAUDIO'
import json, urllib.request
from pathlib import Path
keys = dict(line.split('=', 1) for line in Path('/workspace/academia/private/engines.env').read_text().splitlines() if '=' in line)
request = urllib.request.Request('http://127.0.0.1:8060/synthesize', data=json.dumps({'text': 'Bonjour, bienvenue dans votre espace de formation.', 'voice': 'female', 'format': 'wav'}).encode(), headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + keys['TTS_API_KEY']})
with urllib.request.urlopen(request, timeout=120) as response:
    audio = response.read()
assert audio[:4] == b'RIFF'
Path('/opt/MuseTalk/data/academia/reply.wav').write_bytes(audio)
PYAUDIO
fi
cat > /opt/supervisor-scripts/academia-video.sh <<'WRAPPER'
#!/bin/bash
set -a
source /workspace/academia/private/engines.env
set +a
export TUTOR_LLM_PROVIDER_LABEL=qwen2.5-7b-instruct
export OMP_NUM_THREADS=4 OPENBLAS_NUM_THREADS=1
cd /opt/MuseTalk
exec /opt/MuseTalk/.venv/bin/uvicorn academia_api:app --host 127.0.0.1 --port 8061 --no-access-log
WRAPPER
chmod 700 /opt/supervisor-scripts/academia-video.sh
cat > /etc/supervisor/conf.d/academia-video.conf <<'CONF'
[program:academia-video]
command=/opt/supervisor-scripts/academia-video.sh
autostart=true
autorestart=unexpected
stdout_logfile=/workspace/academia/logs/video.log
redirect_stderr=true
stdout_logfile_maxbytes=10485760
CONF
supervisorctl reread
supervisorctl update
