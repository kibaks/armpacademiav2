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

class TerminologyTest(unittest.TestCase):
 def test_context_keeps_the_full_sentence_and_official_terms_for_review(self):
  from national_engine import legal_context
  text="Nous apprenons les marchés publics. Le marché de fournitures porte sur 15 tables, le 26 novembre."
  context,terms=legal_context(text)
  self.assertEqual(context,"Nous apprenons les contrats d’achat de l’État. Le contrat d’achat de biens porte sur 15 tables, le 26 novembre.")
  self.assertEqual(terms,['marchés publics','marché de fournitures'])
  self.assertEqual(legal_context('L’ARMP contrôle le DAO.')[0],'L’ARMP contrôle le DAO.')
