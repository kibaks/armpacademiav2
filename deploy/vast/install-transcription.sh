#!/bin/bash
set -euo pipefail
umask 077
base=/workspace/academia
export UV_NO_CACHE=1
uv venv --python 3.12 "$base/stt-venv" > "$base/logs/stt-install.log" 2>&1
uv pip install --python "$base/stt-venv/bin/python" -r "$base/app/deploy/transcription/requirements.txt" >> "$base/logs/stt-install.log" 2>&1
python3 - <<'PY'
from pathlib import Path
import secrets
p=Path('/workspace/academia/private/engines.env')
s=p.read_text()
if not any(l.startswith('STT_API_KEY=') for l in s.splitlines()):p.write_text(s.rstrip()+'\nSTT_API_KEY='+secrets.token_hex(32)+'\n')
p.chmod(0o600)
PY
"$base/stt-venv/bin/python" -c 'from huggingface_hub import snapshot_download; snapshot_download(repo_id="Systran/faster-whisper-small", local_dir="/workspace/academia/models/whisper-stt")' > "$base/logs/stt-download.log" 2>&1
cat > /opt/supervisor-scripts/academia-transcription.sh <<'WRAPPER'
#!/bin/bash
set -e
set -a
source /workspace/academia/private/engines.env
set +a
export OMP_NUM_THREADS=4 OPENBLAS_NUM_THREADS=1
cd /workspace/academia/app/deploy/transcription
exec /workspace/academia/stt-venv/bin/uvicorn app:app --host 127.0.0.1 --port 8062 --no-access-log
WRAPPER
chmod 700 /opt/supervisor-scripts/academia-transcription.sh
cat > /etc/supervisor/conf.d/academia-transcription.conf <<CFG
[program:academia-transcription]
command=/opt/supervisor-scripts/academia-transcription.sh
autostart=true
autorestart=unexpected
stdout_logfile=$base/logs/transcription.log
redirect_stderr=true
stdout_logfile_maxbytes=10485760
CFG
supervisorctl reread
supervisorctl update
printf 'TRANSCRIPTION_INSTALLED\n'
