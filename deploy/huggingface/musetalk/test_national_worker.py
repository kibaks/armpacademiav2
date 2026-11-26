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
    self.assertEqual(kwargs['timeout'],60)
    Path(args[-1]).write_text(json.dumps({'text':'Mbote.','language':'ln'}))
   with patch('national_worker.subprocess.run',side_effect=run):
    code,result=worker.request('translate',{'text':'Bonjour.','language':'ln'});self.assertEqual(code,200);self.assertEqual(result['language'],'ln')
   worker.gate.acquire()
   self.assertEqual(worker.request('speech',{'text':'Mbote.','language':'ln'})[0],429)
   worker.gate.release()
   self.assertEqual(worker.request('speech',{'text':'x','language':'xx'})[0],422)
