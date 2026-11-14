import os
os.environ['MUSETALK_API_KEY'] = 'test-only-' + 'x' * 32
import unittest
from unittest.mock import patch
import torch
from fastapi.testclient import TestClient
import app as service

class Tokenizer:
    eos_token_id = 2
    src_lang = None
    def __call__(self, text, **kwargs): return {'input_ids': torch.ones(1, 3, dtype=torch.long)}
    def convert_tokens_to_ids(self, code): return {'fra_Latn': 10, 'lin_Latn': 11, 'swh_Latn': 12, 'kon_Latn': 13, 'lua_Latn': 14}[code]
    def batch_decode(self, output, **kwargs): return ['Réponse entière.']
    def get_vocab(self): return {char: index for index, char in enumerate('abcdefghijklmnopqrstuvwxyz')}
class Model:
    def generate(self, **kwargs): return torch.tensor([[0, kwargs['forced_bos_token_id'], 2]])
class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(service.app)
        self.headers = {'Authorization': 'Bearer ' + service.KEY}
    def test_authentication_and_capabilities(self):
        self.assertEqual(self.client.get('/capabilities').status_code, 401)
        response = self.client.get('/capabilities', headers=self.headers)
        self.assertEqual(response.json()['translation'], ['ln', 'sw', 'kg', 'lua'])
        self.assertEqual(response.json()['speech'], ['ln', 'sw'])
    def test_directions_and_complete_paragraphs(self):
        tokenizer = Tokenizer()
        with patch.object(service, 'translation_engine', return_value=(tokenizer, Model())):
            response = self.client.post('/translate', headers=self.headers, json={'text': 'Mbote', 'sourceLanguage': 'ln', 'language': 'fr'})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(tokenizer.src_lang, 'lin_Latn')
            self.assertEqual(response.json()['language'], 'fr')
    def test_unsupported_characters_are_rejected_before_synthesis(self):
        with patch.object(service, 'voice_engine', return_value=(Tokenizer(), None)):
            response = self.client.post('/speech', headers=self.headers, json={'text': 'Mbɔ́tɛ', 'language': 'ln'})
            self.assertEqual(response.status_code, 422)
            self.assertIn('ɛ', response.json()['detail']['characters'])
    def test_missing_voices_and_busy_engine(self):
        self.assertEqual(self.client.post('/speech', headers=self.headers, json={'text': 'Texte', 'language': 'kg'}).status_code, 422)
        service.gate.acquire()
        try: self.assertEqual(self.client.post('/translate', headers=self.headers, json={'text': 'Bonjour', 'language': 'sw'}).status_code, 429)
        finally: service.gate.release()
    def test_limits_and_empty_text(self):
        self.assertEqual(self.client.post('/translate', headers=self.headers, json={'text': 'x' * 6001, 'language': 'sw'}).status_code, 422)
        self.assertEqual(self.client.post('/translate', headers=self.headers, json={'text': ' ', 'language': 'sw'}).status_code, 422)
if __name__ == '__main__': unittest.main()
