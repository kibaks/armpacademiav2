"""Private, bounded, five-minute cache; no text or recordings written to disk."""
from collections import OrderedDict
import hashlib
import json
import threading
import time
import unicodedata

class SpeechCache:
    def __init__(self, max_bytes=32_000_000, max_entries=64, ttl=300, clock=time.monotonic):
        self.max_bytes, self.max_entries, self.ttl, self.clock = max_bytes, max_entries, ttl, clock
        self.entries, self.size, self.lock = OrderedDict(), 0, threading.Lock()
    def get(self, key):
        with self.lock:
            item = self.entries.pop(key, None)
            if item is None:
                return None
            deadline, size, value = item
            if deadline <= self.clock():
                self.size -= size
                return None
            self.entries[key] = item
            return dict(value)
    def put(self, key, value):
        size = len(value['audioData'])
        if size > self.max_bytes:
            return
        with self.lock:
            old = self.entries.pop(key, None)
            if old:
                self.size -= old[1]
            self.entries[key] = (self.clock() + self.ttl, size, dict(value))
            self.size += size
            while self.size > self.max_bytes or len(self.entries) > self.max_entries:
                self.size -= self.entries.popitem(last=False)[1][1]

def speech_key(body):
    return hashlib.sha256(json.dumps([
        'native32-shared-speaker-v1', body.language, body.voiceMode, body.voice,
        unicodedata.normalize('NFC', body.text).strip()
    ], ensure_ascii=False).encode()).hexdigest()
