"""Exercise the real HTTP adapter without GPU dependencies or external services."""
import importlib.util
import json
from pathlib import Path
import socket
import threading
import time
import unittest
import urllib.error
import urllib.request
from unittest.mock import patch
from http.server import ThreadingHTTPServer


class ContainerHTTPTest(unittest.TestCase):
    def test_readiness_input_limits_and_error_boundaries(self):
        spec = importlib.util.spec_from_file_location('academia_container', Path(__file__).with_name('container_server.py'))
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        loaded, release = threading.Event(), threading.Event()
        class FakeEngine:
            def __init__(self, path):
                release.wait(3)
                loaded.set()
            def __call__(self, body):
                if body.get('fail'): raise RuntimeError('private diagnostic')
                return {'statusCode': 200, 'body': {'reply': 'Une offre.'}}
        servers=[]
        def server(address, handler):
            instance=ThreadingHTTPServer(('127.0.0.1',0),handler)
            servers.append(instance)
            return instance
        with patch.object(module,'EndpointHandler',FakeEngine), patch.object(module,'ThreadingHTTPServer',server):
            thread=threading.Thread(target=module.main,daemon=True)
            thread.start()
            deadline=time.monotonic()+3
            while not servers and time.monotonic()<deadline: time.sleep(.01)
            self.assertTrue(servers)
            root='http://127.0.0.1:'+str(servers[0].server_port)
            def request(path='/', body=None):
                r=urllib.request.Request(root+path,data=body,headers={'Content-Type':'application/json'})
                try:
                    with urllib.request.urlopen(r,timeout=3) as response:
                        return response.status,json.load(response)
                except urllib.error.HTTPError as error:
                    return error.code,json.load(error)
            try:
                self.assertEqual(request('/health')[0],503)
                self.assertEqual(request(body=b'{}')[0],503)
                release.set()
                self.assertTrue(loaded.wait(3))
                deadline=time.monotonic()+3
                while request('/health')[0]!=200 and time.monotonic()<deadline: time.sleep(.01)
                self.assertEqual(request('/health'),(200,{'ready':True,'failed':False}))
                self.assertEqual(request('/'),(200,{'ready':True,'failed':False}))
                self.assertEqual(request(body=b'{')[0],400)
                self.assertEqual(request(body=b'')[0],413)
                self.assertEqual(request('/unknown',body=b'{}')[0],404)
                self.assertEqual(request(body=b'{"inputs":{}}'),(200,{'statusCode':200,'body':{'reply':'Une offre.'}}))
                code,result=request(body=b'{"fail":true}')
                self.assertEqual(code,500)
                self.assertNotIn('private diagnostic',json.dumps(result))
                self.assertEqual(request('/health')[0],200)
            finally:
                release.set()
                servers[0].shutdown()
                servers[0].server_close()
                thread.join(3)


if __name__ == '__main__': unittest.main()
