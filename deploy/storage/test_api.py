import base64, importlib.util, json, os, tempfile, unittest, uuid
os.environ['STORAGE_ROOT']=tempfile.mkdtemp(prefix='academia-storage-test-')
os.environ['ACADEMIA_STORAGE_KEY']='test-storage-key-with-at-least-32-characters'
os.environ['ACADEMIA_STORAGE_URL']='https://storage.example.com/files-api'
from fastapi.testclient import TestClient
spec=importlib.util.spec_from_file_location('storage',os.path.join(os.path.dirname(__file__),'app.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
client=TestClient(m.app)
png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aYBsAAAAASUVORK5CYII=')
def token(scope='manage',sub='owner',**extra):
 return m.encode(dict(scope=scope,sub=sub,exp=int(m.time.time())+300,**extra))
def headers(t): return {'Authorization':'Bearer '+t}
def upload(data=png,name='photo.png',visibility='public',**extra):
 ticket=token('upload',name=name,size=len(data),category='tests',visibility=visibility,jti=str(uuid.uuid4()),**extra)
 return client.post('/api/files',content=data,headers=headers(ticket))
class StorageTests(unittest.TestCase):
 def test_unauthenticated(self):
  self.assertEqual(client.post('/api/files',content=png).status_code,401)
  self.assertEqual(client.get('/api/files').status_code,401)
 def test_public_upload_read_and_owner_enforcement(self):
  r=upload();self.assertEqual(r.status_code,201,r.text);item=r.json()['data']
  path=item['url'].split('/files-api')[1]
  self.assertEqual(client.get(path).content,png)
  self.assertEqual(client.get('/api/files/'+item['id'],headers=headers(token(sub='other'))).status_code,403)
  self.assertEqual(client.delete('/api/files/'+item['id'],headers=headers(token(sub='other'))).status_code,403)
  self.assertEqual(client.get('/api/files/'+item['id'],headers=headers(token(sub='admin',role='super_admin'))).status_code,200)
 def test_private_download_signed_owner_scoped_and_range(self):
  item=upload(data=b'Example confidential document',name='lettre.pdf',visibility='private').json()['data']
  self.assertIn('/api/storage/files/',item['url'])
  self.assertEqual(client.get('/storage/academia/'+item['storedName']).status_code,404)
  path='/api/files/'+item['id']+'/preview'
  self.assertEqual(client.get(path,headers=headers(token(sub='other'))).status_code,403)
  url=client.get(path,headers=headers(token())).json()['url'].split('/files-api')[1]
  self.assertEqual(client.get(url).status_code,200)
  self.assertEqual(client.get(url,headers={'Range':'bytes=0-6'}).status_code,206)
  self.assertEqual(client.get(url+'bad').status_code,401)
 def test_validation_expiry_replay_and_incomplete_transfer(self):
  self.assertEqual(upload(b'not an image').status_code,422)
  self.assertEqual(upload(b'x',name='../x.pdf').status_code,400)
  self.assertEqual(upload(b'x',name='x.html').status_code,400)
  t=token('upload',name='x.pdf',size=1,category='tests',visibility='private',jti=str(uuid.uuid4()))
  self.assertEqual(client.post('/api/files',content=b'x',headers=headers(t)).status_code,201)
  self.assertEqual(client.post('/api/files',content=b'x',headers=headers(t)).status_code,409)
  self.assertEqual(client.get('/api/files',headers=headers(m.encode({'scope':'manage','sub':'owner','exp':1}))).status_code,401)
  t=token('upload',name='x.pdf',size=3,category='tests',visibility='private',jti=str(uuid.uuid4()))
  self.assertEqual(client.post('/api/files',content=b'x',headers=headers(t)).status_code,400)
 def test_soft_delete_and_stats(self):
  item=upload().json()['data'];fid=item['id']
  self.assertEqual(client.delete('/api/files/'+fid,headers=headers(token())).status_code,200)
  self.assertEqual(client.get('/api/files/'+fid,headers=headers(token())).status_code,404)
  self.assertTrue((m.ROOT/'trash'/item['storedName']).exists())
  self.assertGreaterEqual(client.get('/api/storage-stats',headers=headers(token())).json()['data']['totalFiles'],0)
if __name__=='__main__':unittest.main()
