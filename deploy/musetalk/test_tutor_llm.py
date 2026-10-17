import io
import json
import unittest
from unittest.mock import patch
from fastapi import FastAPI, Header, HTTPException
from fastapi.testclient import TestClient
import tutor_llm

def authorize(authorization: str = Header(default='')):
    if authorization != 'Bearer test-only':
        raise HTTPException(401)

app = FastAPI()
app.include_router(tutor_llm.create_router(authorize))
client = TestClient(app)
headers = {'authorization': 'Bearer test-only'}
body = {'system': 'Tu es Aïsha.', 'prompt': 'Données du cours.'}

class TutorTests(unittest.TestCase):
    def test_auth_and_bounds(self):
        self.assertEqual(client.post('/chat', json=body).status_code, 401)
        self.assertEqual(client.post('/chat', json={**body, 'prompt': 'x'*48001}, headers=headers).status_code, 422)

    def test_fixed_model_no_thinking_and_system_separation(self):
        def upstream(request, **kwargs):
            payload = json.loads(request.data)
            self.assertEqual(payload['model'], 'academia-tuteur')
            self.assertFalse(payload['think'])
            self.assertEqual(payload['messages'][0]['role'], 'system')
            self.assertEqual(payload['messages'][1]['content'], body['prompt'])
            return io.BytesIO(json.dumps({'done': True, 'message': {'content': 'Réponse.'}}).encode())
        with patch.object(tutor_llm.urllib.request, 'urlopen', side_effect=upstream):
            response = client.post('/chat', json=body, headers=headers)
        self.assertEqual(response.json()['reply'], 'Réponse.')

    def test_failure_releases_capacity_and_returns_no_internal_details(self):
        with patch.object(tutor_llm.urllib.request, 'urlopen', side_effect=ValueError('secret')):
            response = client.post('/chat', json=body, headers=headers)
        self.assertEqual(response.status_code, 503)
        self.assertNotIn('secret', response.text)
        self.assertTrue(tutor_llm.gate.acquire(blocking=False))
        try:
            self.assertEqual(client.post('/chat', json=body, headers=headers).status_code, 429)
        finally:
            tutor_llm.gate.release()

if __name__ == '__main__':
    unittest.main()
