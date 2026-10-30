#!/bin/bash
set -euo pipefail
base=/workspace/academia
umask 077
mkdir -p "$base/storage" "$base/private" "$base/logs"
export ACADEMIA_STORAGE_URL="${ACADEMIA_STORAGE_URL:?HTTPS gateway required}/files-api"
python3 - <<'PY'
import os,secrets
from pathlib import Path
p=Path('/workspace/academia/private/storage.env')
if not p.exists():
 p.write_text('ACADEMIA_STORAGE_KEY='+secrets.token_urlsafe(48)+'\nACADEMIA_STORAGE_URL='+os.environ['ACADEMIA_STORAGE_URL']+'\nAPP_ORIGIN=https://armpacademiav2.vercel.app\nSTORAGE_ROOT=/workspace/academia/storage\n')
p.chmod(0o600)
PY
cat > /opt/supervisor-scripts/academia-storage.sh <<'SH'
#!/bin/bash
set -euo pipefail
set -a
. /workspace/academia/private/storage.env
set +a
cd /workspace/academia/app/deploy/storage
exec /workspace/academia/stt-venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8063 --no-access-log
SH
chmod +x /opt/supervisor-scripts/academia-storage.sh
cat > /etc/supervisor/conf.d/academia-storage.conf <<CFG
[program:academia-storage]
command=/opt/supervisor-scripts/academia-storage.sh
autostart=true
autorestart=unexpected
stdout_logfile=$base/logs/storage.log
redirect_stderr=true
stdout_logfile_maxbytes=10485760
CFG
python3 - <<'PY'
from pathlib import Path
p=Path('/workspace/academia/Gateway.Caddyfile');s=p.read_text()
if 'handle_path /files-api/*' not in s:
 Path('/workspace/academia/private/Gateway-before-storage.Caddyfile').write_text(s)
 s=s.replace(' handle_path /stt/* {',' handle_path /files-api/* {\n  reverse_proxy 127.0.0.1:8063\n }\n handle_path /stt/* {')
 p.write_text(s)
PY
/opt/instance-tools/bin/caddy validate --config "$base/Gateway.Caddyfile" --adapter caddyfile
supervisorctl reread
supervisorctl update
supervisorctl restart academia-gateway
