"""Announce tunnel rotations and recover a dead quick tunnel without touching models."""
import hashlib,hmac,json,logging,os,re,time,urllib.request,urllib.error,subprocess
from pathlib import Path
LOG=Path('/workspace/academia/logs/app-tunnel.log')
STATE=Path('/workspace/academia/logs/current-gateway.json')
PATTERN=r'https://[a-z0-9]+(?:-[a-z0-9]+)*\.trycloudflare\.com'
def latest_gateway(log=LOG,state=STATE):
    for path in [log,Path(str(log)+'.1'),Path(str(log)+'.2')]:
        try:
            with path.open('rb') as f:
                f.seek(0,2);size=f.tell();f.seek(max(0,size-500000))
                matches=re.findall(PATTERN,f.read().decode(errors='replace'))
            if matches:return matches[-1]
        except OSError:pass
    try:
        value=json.loads(state.read_text()).get('baseUrl')
        if isinstance(value,str) and re.fullmatch(PATTERN,value):return value
    except (OSError,ValueError):pass
    return None

def healthy(base,key):
    try:
        request=urllib.request.Request(base+'/national/capabilities',headers={'Authorization':'Bearer '+key})
        with urllib.request.urlopen(request,timeout=12) as response:return response.status==200 and json.load(response).get('provider')=='national-local'
    except Exception:return False

def run():
    key=os.environ['MUSETALK_API_KEY']
    if len(key)<32:raise RuntimeError('Worker key required')
    logging.basicConfig(level=logging.INFO,format='%(asctime)s %(message)s',handlers=[logging.StreamHandler(),logging.FileHandler('/workspace/academia/logs/gateway-discovery.log')])
    previous=None;last_registered=0;next_probe=0;failures=0;last_restart=0;next_registration=0
    while True:
        try:
            base=latest_gateway();now=time.monotonic()
            if now>=next_probe:
                next_probe=now+45
                ok=bool(base) and healthy(base,key)
                failures=0 if ok else failures+1
                # A broken public tunnel is restarted only when the internal gateway responds.
                if failures>=3 and now-last_restart>=180 and healthy('http://127.0.0.1:18090',key):
                    logging.warning('Public tunnel unavailable; restarting academia-tunnel')
                    subprocess.run(['supervisorctl','restart','academia-tunnel'],check=True,timeout=35,stdout=subprocess.DEVNULL)
                    last_restart=now;failures=0;previous=None
                    time.sleep(15);continue
            if base and now>=next_registration and (base!=previous or now-last_registered>=600):
                timestamp=int(time.time()*1000)
                payload=json.dumps({'baseUrl':base,'timestamp':timestamp}).encode()
                message=f'academia-gateway-v1\n60042833\n{timestamp}\n{base}'.encode()
                signature=hmac.new(key.encode(),message,hashlib.sha256).hexdigest()
                request=urllib.request.Request('https://armpacademiav2.vercel.app/api/engine-gateway/register',data=payload,headers={'Content-Type':'application/json','x-academia-signature':signature},method='POST')
                with urllib.request.urlopen(request,timeout=25) as response:
                    if response.status==200 and json.load(response).get('registered') is True:
                        previous=base;last_registered=now
                        STATE.write_text(json.dumps({'baseUrl':base}));logging.info('Current gateway registered')
        except urllib.error.HTTPError as error:
            logging.warning('Registration pending: HTTP %s',error.code)
            try:code=json.load(error).get('code')
            except Exception:code=None
            if error.code==429 or code=='GATEWAY_REGISTRY_UNAVAILABLE':next_registration=time.monotonic()+900
        except Exception as error:logging.warning('Registration pending: %s',type(error).__name__)
        time.sleep(15)
if __name__=='__main__':run()
