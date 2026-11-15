import os
os.environ['MUSETALK_API_KEY'] = 'local-test-' + 'x' * 32
import unittest
from unittest.mock import patch
import numpy as np
from fastapi.testclient import TestClient
import app as service

class Engine:
    def __init__(self): self.calls = []
    def generate(self, **kwargs):
        self.calls.append(kwargs)
        return [np.sin(np.arange(4800, dtype=np.float32) * 0.04) * 0.1]

class NativeSpeechTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(service.app)
        self.headers = {'Authorization': 'Bearer ' + service.KEY}
    def test_private_endpoint_and_busy_guard(self):
        self.assertEqual(self.client.get('/health').status_code, 401)
        service.gate.acquire()
        try:
            self.assertEqual(self.client.post('/speech',headers=self.headers,json={'text':'Moyo','language':'lua'}).status_code,429)
        finally: service.gate.release()
    def test_all_native_profiles_keep_unicode_and_reference_configuration(self):
        for language,text in [('ln','Mbɔ́tɛ. ɛ́ ɔ́.'),('lua','Mêyi a mbangilu.'),('kg','Beto ke longuka.')]:
            model = Engine()
            with patch.object(service,'engine',return_value=model),patch.object(service,'native_prompt',return_value='native-reference') as prompt:
                response = self.client.post('/speech',headers=self.headers,json={'language':language,'text':text})
            self.assertEqual(response.status_code,200)
            self.assertEqual(response.json()['provider'],'national-omnivoice')
            self.assertEqual(model.calls[0]['text'],text)
            self.assertEqual(model.calls[0]['num_step'],32)
            self.assertEqual(model.calls[0]['voice_clone_prompt'],'native-reference')
            self.assertEqual(model.calls[0]['language'],language if language!='kg' else None)
            prompt.assert_called_once_with(language)
if __name__ == '__main__': unittest.main()
