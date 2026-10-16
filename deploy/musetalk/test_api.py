"""No GPU required: signed playback authorization, expiry and byte ranges."""
import hashlib
import hmac
import os
from pathlib import Path
import tempfile
import time
import unittest
from unittest.mock import patch
os.environ['MUSETALK_API_KEY'] = 'unit-test-only-key'
import academia_api as worker
from fastapi.testclient import TestClient

class PlaybackTests(unittest.TestCase):
    def test_ninety_two_second_narration_reaches_inference(self):
        with tempfile.TemporaryDirectory() as tmp:
            original = worker.JOBS
            worker.JOBS = Path(tmp)
            job = 'c' * 64
            directory = worker.JOBS / job
            directory.mkdir()
            (directory / 'input.audio').write_bytes(b'input')
            commands = []
            def fake_run(args, **kwargs):
                commands.append(args)
                if 'generate-video' in str(args[0]):
                    result = directory / 'results/v15/source_reply.mp4'
                    result.parent.mkdir(parents=True)
                    result.write_bytes(b'video')
                else:
                    Path(args[-1]).write_bytes(b'video')
            try:
                with patch.object(worker.subprocess, 'run', side_effect=fake_run), patch.object(worker.subprocess, 'check_output', return_value=b'92.45'):
                    worker.run_job(job)
                self.assertIn('COMPLETED', (directory / 'status.json').read_text())
                self.assertTrue(any('generate-video' in str(command[0]) for command in commands))
            finally:
                worker.JOBS = original

    def test_private_progress_and_expiring_native_range_playback(self):
        with tempfile.TemporaryDirectory() as tmp:
            original = worker.JOBS
            worker.JOBS = Path(tmp)
            try:
                job = 'a' * 64
                directory = worker.JOBS / job
                directory.mkdir()
                (directory / 'result.mp4').write_bytes(b'0123456789abcdef')
                client = TestClient(worker.app)
                self.assertEqual(client.get('/health').status_code, 401)
                expires = int(time.time()) + 600
                token = hmac.new(worker.KEY.encode(), f'{job}:{expires}'.encode(), hashlib.sha256).hexdigest()
                url = f'/jobs/{job}/play?expires={expires}&token={token}'
                response = client.get(url, headers={'Range': 'bytes=2-5'})
                self.assertEqual(response.status_code, 206)
                self.assertEqual(response.content, b'2345')
                self.assertEqual(response.headers['content-range'], 'bytes 2-5/16')
                self.assertEqual(client.get(url.replace(token, 'b' * 64)).status_code, 403)
                past = int(time.time()) - 1
                expired = hmac.new(worker.KEY.encode(), f'{job}:{past}'.encode(), hashlib.sha256).hexdigest()
                self.assertEqual(client.get(f'/jobs/{job}/play?expires={past}&token={expired}').status_code, 403)
            finally:
                worker.JOBS = original

if __name__ == '__main__':
    unittest.main()
