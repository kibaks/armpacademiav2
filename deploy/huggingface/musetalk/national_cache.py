"""Bounded private RAM cache; keys include every inference setting and accent."""
from collections import OrderedDict
import hashlib,json,threading,time,unicodedata

class NationalCache:
    def __init__(self,max_bytes=32000000,max_entries=64,ttl=600,clock=time.monotonic):
        self.max_bytes,self.max_entries,self.ttl,self.clock=max_bytes,max_entries,ttl,clock
        self.items=OrderedDict();self.size=0;self.lock=threading.Lock()
    def get(self,key):
        with self.lock:
            item=self.items.pop(key,None)
            if item is None:return None
            expires,data=item
            if expires<=self.clock():self.size-=len(data);return None
            self.items[key]=item
        return json.loads(data)
    def put(self,key,value):
        data=json.dumps(value,ensure_ascii=False).encode()
        if len(data)>self.max_bytes:return
        with self.lock:
            old=self.items.pop(key,None)
            if old:self.size-=len(old[1])
            self.items[key]=(self.clock()+self.ttl,data);self.size+=len(data)
            while self.size>self.max_bytes or len(self.items)>self.max_entries:
                self.size-=len(self.items.popitem(last=False)[1][1])

def request_key(operation,body):
    normalized={**body,'text':unicodedata.normalize('NFC',body['text'])}
    return hashlib.sha256(json.dumps(['national32-context-gpu-v1',operation,normalized],ensure_ascii=False,sort_keys=True).encode()).hexdigest()
