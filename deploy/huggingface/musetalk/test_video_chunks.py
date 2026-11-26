import base64
import json
from pathlib import Path
import tempfile
import unittest
from video_chunks import read_chunk, CHUNK_BYTES

class ChunksTest(unittest.TestCase):
    def test_growing_file_and_final_offset(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)
            (p/'status.json').write_text(json.dumps({'status':'PROCESSING'}))
            self.assertFalse(read_chunk(p,0)['complete'])
            data=b'abcd'*(CHUNK_BYTES//4+1)
            (p/'result.mp4').write_bytes(data)
            (p/'status.json').write_text(json.dumps({'status':'STREAMING'}))
            first=read_chunk(p,0)
            self.assertEqual(len(base64.b64decode(first['data'])),CHUNK_BYTES)
            self.assertFalse(first['complete'])
            (p/'status.json').write_text(json.dumps({'status':'COMPLETED'}))
            last=read_chunk(p,first['offset'])
            self.assertTrue(last['complete'])
            self.assertEqual(base64.b64decode(first['data'])+base64.b64decode(last['data']),data)
            for offset in [-1,True,'0',len(data)+1]:
                with self.assertRaises(ValueError):read_chunk(p,offset)
            (p/'status.json').write_text(json.dumps({'status':'FAILED'}))
            with self.assertRaises(ValueError):read_chunk(p,0)

class SpeechInputTest(unittest.TestCase):
    def test_queued_speech_is_bounded_and_uses_installed_voice(self):
        from worker import validate_speech
        self.assertEqual(validate_speech({'text':'Bonjour !','language':'fr','voice':'vivienne'})['text'],'Bonjour !')
        for value in [None,{}, {'text':'x','language':'ln','voice':'vivienne'}, {'text':'x','language':'fr','voice':'unknown'}, {'text':' '*8,'language':'fr','voice':'vivienne'}, {'text':'x'*3001,'language':'fr','voice':'vivienne'}]:
            with self.assertRaises(ValueError):validate_speech(value)
