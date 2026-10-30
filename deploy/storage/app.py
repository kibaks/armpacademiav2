"""Owner-scoped file storage. Only the application can issue upload/access tickets."""
import base64, hashlib, hmac, json, mimetypes, os, re, shutil, sqlite3, time, uuid
from pathlib import Path
from datetime import datetime, timezone
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(os.environ.get('STORAGE_ROOT', '/workspace/academia/storage'))
ROOT.mkdir(parents=True, exist_ok=True)
KEY = os.environ['ACADEMIA_STORAGE_KEY'].encode()
assert len(KEY) >= 32
PUBLIC_URL = os.environ['ACADEMIA_STORAGE_URL'].rstrip('/')
APP_URL = os.environ.get('APP_ORIGIN', 'https://armpacademiav2.vercel.app').rstrip('/')
LIMIT = 100 * 1024 * 1024
QUOTA = int(os.environ.get('STORAGE_QUOTA_BYTES', str(5 * 1024**3)))
ALLOWED = set('pdf jpg jpeg png gif webp doc docx xls xlsx ppt pptx odt ods odp txt csv rtf zip rar 7z mp3 mp4 wav avi mov webm mkv json xml ogg m4a flac aac'.split())
IMAGES = {'jpg','jpeg','png','gif','webp'}
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(CORSMiddleware, allow_origins=[APP_URL], allow_methods=['POST','GET','OPTIONS'], allow_headers=['Authorization','Content-Type'], expose_headers=['Content-Length','Content-Range','Accept-Ranges'])
def db():
    c = sqlite3.connect(ROOT / 'files.sqlite', timeout=30)
    c.row_factory = sqlite3.Row
    return c
with db() as c:
    c.execute('PRAGMA journal_mode=WAL')
    c.execute('CREATE TABLE IF NOT EXISTS tickets (id TEXT PRIMARY KEY, size INTEGER NOT NULL, expires INTEGER NOT NULL)')
    c.execute('CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, metadata TEXT NOT NULL)')

def encode(data):
    p = base64.urlsafe_b64encode(json.dumps(data, separators=(',',':')).encode()).decode().rstrip('=')
    return p + '.' + base64.urlsafe_b64encode(hmac.new(KEY, p.encode(), hashlib.sha256).digest()).decode().rstrip('=')
def verify(token):
    try:
        p, sig = token.split('.')
        expected = base64.urlsafe_b64encode(hmac.new(KEY, p.encode(), hashlib.sha256).digest()).decode().rstrip('=')
        if not hmac.compare_digest(sig, expected): raise ValueError()
        data = json.loads(base64.urlsafe_b64decode(p + '=' * (-len(p)%4)))
        if data['exp'] < time.time(): raise ValueError()
        return data
    except Exception: raise HTTPException(401, 'Ticket invalide ou expiré.')
def identity(req, scope='manage'):
    data = verify(req.headers.get('authorization','').removeprefix('Bearer '))
    if data.get('scope') != scope or not data.get('sub'): raise HTTPException(403, 'Accès refusé.')
    return data

def record(fid):
    with db() as c: row = c.execute('SELECT metadata FROM files WHERE id=?',(fid,)).fetchone()
    if not row: raise HTTPException(404, 'Fichier introuvable.')
    return json.loads(row[0])
def permitted(item, actor):
    if item['uploadedBy'] != actor['sub'] and actor.get('role') not in ['super_admin','dfat_admin']:
        raise HTTPException(403, 'Accès au fichier refusé.')
def view(item):
    return {**item, 'url': f"{PUBLIC_URL}/storage/academia/{item['storedName']}" if item['visibility']=='public' else f"{APP_URL}/api/storage/files/{item['id']}/preview"}

def valid_image(head, ext):
    if ext=='png': return head.startswith(b'\x89PNG\r\n\x1a\n')
    if ext in ['jpg','jpeg']: return head.startswith(b'\xff\xd8\xff')
    if ext=='gif': return head[:6] in [b'GIF87a',b'GIF89a']
    return head[:4]==b'RIFF' and head[8:12]==b'WEBP'

@app.get('/health')
def health(): return {'ready':True, 'service':'academia-storage'}

@app.post('/api/files', status_code=201)
async def upload(req: Request):
    actor = identity(req, 'upload')
    name = actor.get('name',''); ext = name.rsplit('.',1)[-1].lower()
    if ext not in ALLOWED or len(name)>180 or re.search(r'[/\\\x00-\x1f]',name): raise HTTPException(400,'Format ou nom invalide.')
    size = actor.get('size',0)
    if not isinstance(size,int) or size<=0 or size>(3*1024**2 if ext in IMAGES else LIMIT): raise HTTPException(413,'Taille de fichier refusée.')
    if shutil.disk_usage(ROOT).free < size + 512*1024**2: raise HTTPException(507,'Espace disque insuffisant.')
    if not actor.get('jti'): raise HTTPException(401,'Ticket invalide.')
    with db() as c:
        c.execute('BEGIN IMMEDIATE')
        c.execute('DELETE FROM tickets WHERE expires < ?', (int(time.time())-3600,))
        total = sum(json.loads(r[0])['size'] for r in c.execute('SELECT metadata FROM files'))
        reserved = c.execute('SELECT COALESCE(SUM(size),0) FROM tickets').fetchone()[0]
        if total+reserved+size > QUOTA: raise HTTPException(507,'Quota de stockage atteint.')
        try: c.execute('INSERT INTO tickets VALUES (?,?,?)',(actor['jti'],size,actor['exp']))
        except sqlite3.IntegrityError: raise HTTPException(409,'Ticket déjà utilisé. Relancez l’import.')
    fid = str(uuid.uuid4()); stored = fid+'.'+ext; temp=ROOT/(stored+'.part'); dest=ROOT/stored
    received=0; head=b''
    try:
        with temp.open('xb') as f:
            async for chunk in req.stream():
                received+=len(chunk)
                if received>size: raise HTTPException(413,'Taille déclarée dépassée.')
                if len(head)<16: head=(head+chunk)[:16]
                f.write(chunk)
        if received!=size: raise HTTPException(400,'Transfert incomplet.')
        if ext in IMAGES and not valid_image(head,ext): raise HTTPException(422,'Contenu image invalide.')
        now=datetime.now(timezone.utc).isoformat()
        item={'id':fid,'originalName':name,'storedName':stored,'path':stored,'disk':'academia_public' if actor['visibility']=='public' else 'academia','mimeType':mimetypes.guess_type(name)[0] or 'application/octet-stream','extension':ext,'size':received,'category':actor['category'],'entityId':actor.get('entityId'),'description':actor.get('description'),'visibility':actor['visibility'],'uploadedBy':actor['sub'],'createdAt':now,'updatedAt':now}
        temp.rename(dest)
        with db() as c: c.execute('INSERT INTO files VALUES (?,?)',(fid,json.dumps(item)))
        return {'data':view(item)}
    except BaseException:
        temp.unlink(missing_ok=True); dest.unlink(missing_ok=True)
        raise
    finally:
        with db() as c: c.execute('UPDATE tickets SET size=0 WHERE id=?',(actor['jti'],))

@app.get('/api/files')
def listing(req: Request):
    actor=identity(req)
    with db() as c: items=[json.loads(r[0]) for r in c.execute('SELECT metadata FROM files ORDER BY rowid DESC')]
    items=[i for i in items if i['uploadedBy']==actor['sub'] or actor.get('role') in ['super_admin','dfat_admin']]
    for param,field in [('category','category'),('entity_id','entityId'),('visibility','visibility')]:
        if req.query_params.get(param): items=[i for i in items if i[field]==req.query_params[param]]
    return {'data':[view(i) for i in items[:max(1,min(int(req.query_params.get('limit','100')) if req.query_params.get('limit','100').isdigit() else 100,500))]]}

@app.get('/api/files/{fid}')
def details(fid: str, req: Request):
    actor=identity(req); item=record(fid); permitted(item,actor)
    return {'data':view(item)}

@app.delete('/api/files/{fid}')
def delete(fid: str, req: Request):
    actor=identity(req); item=record(fid); permitted(item,actor)
    # Soft delete: an administrator can recover the original and metadata on disk.
    trash=ROOT/'trash'; trash.mkdir(exist_ok=True)
    (ROOT/item['storedName']).rename(trash/item['storedName'])
    (trash/(fid+'.json')).write_text(json.dumps(item))
    with db() as c: c.execute('DELETE FROM files WHERE id=?',(fid,))
    return {'ok':True}

@app.get('/api/files/{fid}/{action}')
def link(fid: str, action: str, req: Request):
    if action not in ['preview','download']: raise HTTPException(404)
    actor=identity(req); item=record(fid); permitted(item,actor)
    token=encode({'scope':'read','fid':fid,'exp':int(time.time())+300,'download':action=='download'})
    return {'url':f'{PUBLIC_URL}/content/{fid}?ticket={token}'}

@app.get('/content/{fid}')
def content(fid: str, ticket: str):
    data=verify(ticket)
    if data.get('scope')!='read' or data.get('fid')!=fid: raise HTTPException(403)
    item=record(fid)
    return FileResponse(ROOT/item['storedName'], media_type=item['mimeType'],filename=item['originalName'],content_disposition_type='attachment' if data.get('download') else 'inline', headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'})

@app.get('/storage/academia/{stored}')
def public(stored: str):
    if not re.fullmatch(r'[a-f0-9-]{36}\.[a-z0-9]+', stored): raise HTTPException(404)
    item=record(stored.split('.')[0])
    if item['visibility']!='public' or item['storedName']!=stored: raise HTTPException(404)
    return FileResponse(ROOT/stored,media_type=item['mimeType'],filename=item['originalName'],content_disposition_type='inline' if item['extension'] in IMAGES|{'mp3','mp4','wav','webm','ogg','m4a'} else 'attachment',headers={'Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'})

@app.get('/api/storage-stats')
def stats(req: Request):
    actor=identity(req)
    with db() as c: items=[json.loads(r[0]) for r in c.execute('SELECT metadata FROM files')]
    items=[i for i in items if i['uploadedBy']==actor['sub'] or actor.get('role') in ['super_admin','dfat_admin']]
    if req.query_params.get('category'): items=[i for i in items if i['category']==req.query_params['category']]
    groups={}
    for i in items:
        group=groups.setdefault(i['category'],{'category':i['category'],'count':0,'size':0});group['count']+=1;group['size']+=i['size']
    return {'data':{'totalFiles':len(items),'totalSize':sum(i['size'] for i in items),'byCategory':list(groups.values()),'quota':QUOTA}}
