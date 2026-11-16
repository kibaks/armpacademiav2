import unittest
from types import SimpleNamespace
from speech_cache import SpeechCache, speech_key

class CacheTests(unittest.TestCase):
    def test_expiry_and_memory_limit(self):
        now = [0]
        cache = SpeechCache(max_bytes=8, max_entries=2, ttl=5, clock=lambda: now[0])
        cache.put('a', {'audioData': '12345'})
        cache.put('b', {'audioData': '67890'})
        self.assertIsNone(cache.get('a'))
        self.assertEqual(cache.get('b')['audioData'], '67890')
        self.assertLessEqual(cache.size, 8)
        now[0] = 5
        self.assertIsNone(cache.get('b'))
    def test_language_voice_and_tones_do_not_share_cached_audio(self):
        base = dict(language='ln', voice='female', voiceMode='consistent', text='Mbóte.')
        key = lambda **changes: speech_key(SimpleNamespace(**{**base, **changes}))
        self.assertEqual(key(), key(text='Mbo\u0301te.'))
        for changes in [{'text':'Mbote.'},{'language':'fr'},{'voice':'male'},{'voiceMode':'native'}]:
            self.assertNotEqual(key(), key(**changes))
if __name__ == '__main__': unittest.main()
