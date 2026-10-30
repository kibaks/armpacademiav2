#!/bin/bash
set -euo pipefail
base=/workspace/academia
umask 077
cat > "$base/Gateway.Caddyfile" <<'CADDY'
{
 admin off
 auto_https off
}
http://:18090 {
 bind 127.0.0.1
 @play path /musetalk/jobs/*/play
 header @play Access-Control-Allow-Origin https://armpacademiav2.vercel.app
 header @play Access-Control-Expose-Headers "Accept-Ranges, Content-Range, Content-Length"
 handle_path /files-api/* {
  reverse_proxy 127.0.0.1:8063
 }
 handle_path /stt/* {
  reverse_proxy 127.0.0.1:8062
 }
 handle_path /piper/* {
  reverse_proxy 127.0.0.1:8060
 }
 handle_path /musetalk/* {
  reverse_proxy 127.0.0.1:8061 {
   flush_interval -1
  }
 }
 handle {
  respond "Moteurs Academia — les API audio et vidéo nécessitent une authentification." 200
 }
}
CADDY
caddy validate --config "$base/Gateway.Caddyfile" --adapter caddyfile
cat > /etc/supervisor/conf.d/academia-gateway.conf <<CFG
[program:academia-gateway]
command=/opt/instance-tools/bin/caddy run --config $base/Gateway.Caddyfile --adapter caddyfile
autostart=true
autorestart=unexpected
stdout_logfile=$base/logs/gateway.log
redirect_stderr=true
stdout_logfile_maxbytes=10485760
CFG
python3 - <<'PY'
from pathlib import Path
import yaml,shlex,re
p=Path('/etc/portal.yaml');d=yaml.safe_load(p.read_text());existing=d['applications'].get('Moteurs Academia');assert not any(v.get('external_port')==10200 and k!='Moteurs Academia' for k,v in d['applications'].items())
backup=Path('/workspace/academia/private/portal-before-gateway.yaml')
if not backup.exists():backup.write_text(p.read_text());backup.chmod(0o600)
d['applications']['Moteurs Academia']={'hostname':'localhost','external_port':10200,'internal_port':18090,'open_path':'/','name':'Moteurs Academia'};p.write_text(yaml.safe_dump(d,sort_keys=False))
p=Path('/workspace/.env');text=p.read_text() if p.exists() else '';m=re.search(r'^AUTH_EXCLUDE=(.*)$',text,re.M);ports=(shlex.split(m.group(1))[0].split(',') if m else [])
if '10200' not in ports:ports.append('10200')
line='AUTH_EXCLUDE="'+','.join(ports)+'"'
text=text[:m.start()]+line+text[m.end():] if m else text.rstrip()+'\n'+line+'\n';p.write_text(text);p.chmod(0o600)
PY
cat > /etc/supervisor/conf.d/academia-tunnel.conf <<CFG
[program:academia-tunnel]
command=/opt/instance-tools/bin/cloudflared tunnel --url http://127.0.0.1:10200 --no-autoupdate
autostart=true
autorestart=unexpected
stdout_logfile=$base/logs/tunnel.log
redirect_stderr=true
stdout_logfile_maxbytes=10485760
CFG
supervisorctl reread
supervisorctl update
supervisorctl restart caddy
printf 'GATEWAY_INSTALLED\n'
