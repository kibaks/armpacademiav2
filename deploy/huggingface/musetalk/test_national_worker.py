import json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
from national_engine import validate
from national_worker import NationalWorker

class NationalTest(unittest.TestCase):
 def test_validation_preserves_diacritics_and_explicit_codes(self):
  for language in ['ln','sw','kg','lua']:
   self.assertEqual(validate('speech',{'text':'Mbɔ́tɛ ɛ́','language':language}),'Mbɔ́tɛ ɛ́')
  for body in [{},{'text':'','language':'ln'},{'text':'x','language':'en'},{'text':'x','language':'ln','sourceLanguage':'xx'}]:
   with self.assertRaises(ValueError):validate('translate',body)
 def test_installed_capabilities_and_subprocess_isolation(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);(root/'national').mkdir();(root/'national/installed.json').write_text(json.dumps({'translation':['ln','sw','kg','lua'],'speech':['ln','sw','kg','lua']}))
   (root/'venv-national/bin').mkdir(parents=True);(root/'venv-national/bin/python').touch()
   worker=NationalWorker(root,root,'ffmpeg')
   def run(args,**kwargs):
    self.assertEqual(kwargs['env']['CUDA_VISIBLE_DEVICES'],'')
    self.assertGreater(kwargs['timeout'],50);self.assertLessEqual(kwargs['timeout'],60)
    Path(args[-1]).write_text(json.dumps({'text':'Mbote.','language':'ln'}))
   with patch('national_worker.subprocess.run',side_effect=run):
    code,result=worker.request('translate',{'text':'Bonjour.','language':'ln'});self.assertEqual(code,200);self.assertEqual(result['language'],'ln')
   worker.gate.acquire()
   self.assertEqual(worker.request('speech',{'text':'Mbote.','language':'ln'})[0],429)
   worker.gate.release()
   self.assertEqual(worker.request('speech',{'text':'x','language':'xx'})[0],422)

class TerminologyTest(unittest.TestCase):
 def test_context_keeps_the_full_sentence_and_official_terms_for_review(self):
  from national_engine import legal_context
  text="Nous apprenons les marchés publics. Le marché de fournitures porte sur 15 tables, le 26 novembre."
  context,terms=legal_context(text)
  self.assertEqual(context,"Nous apprenons les contrats d’achat de l’État. Le contrat d’achat de biens porte sur 15 tables, le 26 novembre.")
  self.assertEqual(terms,['marchés publics','marché de fournitures'])
  self.assertEqual(legal_context('L’ARMP contrôle le DAO.')[0],'L’ARMP contrôle le DAO.')

class AccelerationTest(unittest.TestCase):
 def worker(self,root,session):
  (root/'national').mkdir();(root/'national/installed.json').write_text(json.dumps({'translation':['ln'],'speech':['ln']}))
  (root/'venv-national/bin').mkdir(parents=True);(root/'venv-national/bin/python').touch()
  return NationalWorker(root,root,'ffmpeg',gpu_session=session)
 def test_gpu_gate_is_owned_until_child_finishes_and_cache_skips_inference(self):
  from contextlib import contextmanager
  active=[];calls=[]
  @contextmanager
  def session():
   active.append(True)
   try:yield True
   finally:active.pop()
  with tempfile.TemporaryDirectory() as tmp:
   worker=self.worker(Path(tmp),session)
   def run(args,**kwargs):
    self.assertTrue(active);self.assertEqual(kwargs['env']['NATIONAL_DEVICE'],'cuda:0');calls.append(1)
    Path(args[-1]).write_text(json.dumps({'audioData':'a'*100,'language':'ln','voiceId':'academia-female-v1'}))
   body={'text':'Mbɔ́tɛ.','language':'ln','voice':'female','voiceMode':'consistent'}
   with patch('national_worker.subprocess.run',side_effect=run):
    first=worker.request('speech',body);second=worker.request('speech',body)
   self.assertEqual(first[1]['device'],'cuda:0');self.assertFalse(first[1]['cacheHit']);self.assertTrue(second[1]['cacheHit']);self.assertEqual(len(calls),1);self.assertFalse(active)
 def test_failed_gpu_is_released_before_same_profile_cpu_fallback(self):
  from contextlib import contextmanager
  import subprocess
  active=[];devices=[]
  @contextmanager
  def session():
   active.append(True)
   try:yield True
   finally:active.pop()
  with tempfile.TemporaryDirectory() as tmp:
   worker=self.worker(Path(tmp),session)
   def run(args,**kwargs):
    device=kwargs['env']['NATIONAL_DEVICE'];devices.append(device)
    if device=='cuda:0':raise subprocess.CalledProcessError(1,args)
    self.assertFalse(active);self.assertEqual(kwargs['env']['CUDA_VISIBLE_DEVICES'],'')
    body=json.loads(kwargs['input']);self.assertEqual(body['voiceMode'],'consistent')
    Path(args[-1]).write_text(json.dumps({'audioData':'a'*100,'language':'ln'}))
   with patch('national_worker.subprocess.run',side_effect=run):
    code,result=worker.request('speech',{'text':'Mbote.','language':'ln','voiceMode':'consistent'})
   self.assertEqual(code,200);self.assertEqual(result['device'],'cpu');self.assertEqual(devices,['cuda:0','cpu'])
 def test_parking_restores_all_video_modules_without_changing_precision(self):
  from realtime_engine import RealtimeEngine
  from types import SimpleNamespace
  calls=[]
  class Module:
   def __init__(self,name):self.name=name
   def to(self,device):calls.append((self.name,device));return self
  engine=RealtimeEngine.__new__(RealtimeEngine)
  engine.rt=SimpleNamespace(unet=SimpleNamespace(model=Module('unet')),vae=SimpleNamespace(vae=Module('vae')),pe=Module('pe'),whisper=Module('whisper'),device='cuda:0')
  engine.park();self.assertTrue(engine.parked);engine.resume();engine.resume()
  self.assertEqual(calls,[(name,'cpu') for name in ['unet','vae','pe','whisper']]+[(name,'cuda:0') for name in ['unet','vae','pe','whisper']])

class CacheTest(unittest.TestCase):
 def test_accents_language_voice_direction_ttl_and_memory_bounds(self):
  from national_cache import NationalCache,request_key
  now=[0];cache=NationalCache(max_bytes=100,max_entries=2,ttl=10,clock=lambda:now[0])
  body={'text':'Mbɔ́tɛ.','language':'ln','voice':'female'}
  key=request_key('speech',body)
  for other in [{**body,'language':'lua'},{**body,'voice':'male'},{**body,'text':'Mbote.'}]:self.assertNotEqual(key,request_key('speech',other))
  self.assertNotEqual(key,request_key('translate',body));cache.put(key,{'audioData':'a'*30});value=cache.get(key);value['audioData']='changed';self.assertEqual(cache.get(key)['audioData'],'a'*30)
  cache.put('b',{'audioData':'b'*30});cache.put('c',{'audioData':'c'*30});self.assertLessEqual(cache.size,100);self.assertIsNone(cache.get(key))
  now[0]=11;self.assertIsNone(cache.get('c'))
