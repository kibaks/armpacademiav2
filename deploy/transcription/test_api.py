import os
os.environ['STT_API_KEY']='unit-test-key-with-thirty-two-characters'
import app as worker
import base64
import tempfile
import wave
from pathlib import Path
from types import SimpleNamespace
from unittest import TestCase, main
from unittest.mock import patch
from fastapi.testclient import TestClient
client=TestClient(worker.app)
headers={'Authorization':'Bearer '+os.environ['STT_API_KEY']}
body={'audio':base64.b64encode(b'a'*64).decode(),'mimeType':'audio/webm','owner':'learner'}
def decode_fixture(command, **kwargs):
 with wave.open(command[-1], 'wb') as wav:
  wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(16000);wav.writeframes(b'\x00'*32000)

class VoiceTests(TestCase):
 def test_authorization(self):
  self.assertEqual(client.post('/transcribe',json=body).status_code,401)
 def test_recording_storage_is_owner_bound_and_supports_ranges(self):
  with tempfile.TemporaryDirectory() as folder:
   root=Path(folder);rec=root/('a'*64);rec.mkdir();(rec/'recording.audio').write_bytes(b'123456789');(rec/'metadata.json').write_text('{"owner":"learner","mimeType":"audio/mpeg"}')
   with patch.object(worker,'RECORDINGS',root):
    self.assertEqual(client.get('/recordings/'+'a'*64+'?owner=other',headers=headers).status_code,404)
    response=client.get('/recordings/'+'a'*64+'?owner=learner',headers={**headers,'Range':'bytes=0-2'});self.assertEqual(response.status_code,206);self.assertEqual(response.content,b'123')
 def test_silence_releases_capacity_and_does_not_store_audio(self):
  model=SimpleNamespace(transcribe=lambda *args,**kwargs:([],None))
  with tempfile.TemporaryDirectory() as folder,patch.object(worker,'RECORDINGS',Path(folder)),patch.object(worker,'model',model),patch.object(worker.subprocess,'run',side_effect=decode_fixture),patch.object(worker.subprocess,'check_output',return_value=b'5'):
   response=client.post('/transcribe',json=body,headers=headers);self.assertEqual(response.status_code,422);self.assertEqual(list(Path(folder).iterdir()),[])
  self.assertTrue(worker.gate.acquire(blocking=False));worker.gate.release()
 def test_busy_and_invalid_audio(self):
  with patch.object(worker,'model',object()):
   worker.gate.acquire()
   try:self.assertEqual(client.post('/transcribe',json=body,headers=headers).status_code,429)
   finally:worker.gate.release()
  self.assertEqual(client.post('/transcribe',json={**body,'audio':'???'},headers=headers).status_code,422)
if __name__=='__main__':main()
