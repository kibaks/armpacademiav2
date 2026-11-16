"""Announce tunnel rotations with the existing worker key; no cloud credentials."""
import hashlib,hmac,json,logging,os,re,time,urllib.request,urllib.error
from pathlib import Path
KEY=os.environ['MUSETALK_API_KEY']
if len(KEY)<32:raise RuntimeError('Worker key required')
LOG=Path('/workspace/academia/logs/app-tunnel.log')
logging.basicConfig(level=logging.INFO,format='%(asctime)s %(message)s',handlers=[logging.StreamHandler(),logging.FileHandler('/workspace/academia/logs/gateway-discovery.log')])
previous=None
while True:
    try:
        matches=re.findall(r'https://[a-z0-9]+(?:-[a-z0-9]+)*\.trycloudflare\.com',LOG.read_text(errors='replace')[-10_000_000:])
        base=matches[-1] if matches else None
        if base and base!=previous:
            timestamp=int(time.time()*1000)
            payload=json.dumps({'baseUrl':base,'timestamp':timestamp}).encode()
            message=f'academia-gateway-v1\n60042833\n{timestamp}\n{base}'.encode()
            signature=hmac.new(KEY.encode(),message,hashlib.sha256).hexdigest()
            request=urllib.request.Request('https://armpacademiav2.vercel.app/api/engine-gateway/register',data=payload,headers={'Content-Type':'application/json','x-academia-signature':signature},method='POST')
            with urllib.request.urlopen(request,timeout=25) as response:
                if response.status==200 and json.load(response).get('registered') is True:
                    previous=base;logging.info('Current gateway registered')
    except urllib.error.HTTPError as error:logging.warning('Registration pending: HTTP %s',error.code)
    except Exception as error:logging.warning('Registration pending: %s',type(error).__name__)
    time.sleep(15)
