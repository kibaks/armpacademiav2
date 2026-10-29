#!/bin/bash
set -euo pipefail
umask 077
base=/workspace/academia
mkdir -p /opt/ollama "$base/models/ollama"
curl -fL --retry 3 https://ollama.com/download/ollama-linux-amd64.tar.zst -o "$base/ollama.tar.zst" > "$base/logs/ollama-download.log" 2>&1
tar --zstd -xf "$base/ollama.tar.zst" -C /opt/ollama
rm "$base/ollama.tar.zst"
cat > /etc/supervisor/conf.d/academia-dialogue.conf <<CFG
[program:academia-dialogue]
command=/opt/ollama/bin/ollama serve
environment=OLLAMA_HOST="127.0.0.1:11434",OLLAMA_MODELS="$base/models/ollama",OLLAMA_MAX_LOADED_MODELS="1",OLLAMA_NUM_PARALLEL="1"
autostart=true
autorestart=unexpected
stdout_logfile=$base/logs/dialogue.log
redirect_stderr=true
stdout_logfile_maxbytes=10485760
CFG
supervisorctl reread
supervisorctl update
for i in $(seq 1 30);do curl -fsS http://127.0.0.1:11434/api/tags >/dev/null && break || sleep 1;done
export OLLAMA_HOST=127.0.0.1:11434 OLLAMA_MODELS="$base/models/ollama"
/opt/ollama/bin/ollama pull qwen2.5:7b-instruct > "$base/logs/dialogue-model.log" 2>&1
cp "$base/app/deploy/vast/Tutor.Modelfile" "$base/Tutor.Modelfile"
/opt/ollama/bin/ollama create academia-tuteur -f "$base/Tutor.Modelfile" > "$base/logs/dialogue-create.log" 2>&1
# Load the GPU model before the first Vercel request (which has a shorter timeout).
python3 - <<'PYWARM'
import json, urllib.request
payload = {'model': 'academia-tuteur', 'messages': [{'role': 'user', 'content': 'Bonjour'}], 'stream': False, 'keep_alive': -1, 'options': {'num_ctx': 8192, 'num_predict': 8}}
request = urllib.request.Request('http://127.0.0.1:11434/api/chat', data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(request, timeout=180) as response:
    assert json.load(response).get('done')
PYWARM
printf 'DIALOGUE_INSTALLED\n'
