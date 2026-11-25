"""Small private HF-compatible HTTP adapter; all credentials stay at HF's proxy."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
import threading
import traceback
from handler import EndpointHandler


def main():
    state = {'handler': None, 'failed': False}

    def load():
        try:
            state['handler'] = EndpointHandler(os.environ.get('ACADEMIA_PACKAGE', '/opt/academia-package'))
        except Exception:
            state['failed'] = True
            traceback.print_exc()

    threading.Thread(target=load, daemon=True).start()

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def reply(self, code, value):
            payload = json.dumps(value).encode()
            self.send_response(code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def do_GET(self):
            if self.path not in ('/health', '/'):
                return self.reply(404, {'error': 'Not found'})
            ready = state['handler'] is not None
            self.reply(200 if ready else 503, {'ready': ready, 'failed': state['failed']})

        def do_POST(self):
            if self.path != '/':
                return self.reply(404, {'error': 'Not found'})
            if state['handler'] is None:
                return self.reply(503, {'error': 'Tutor initializing'})
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 6500000:
                    return self.reply(413, {'error': 'Invalid payload size'})
                result = state['handler'](json.loads(self.rfile.read(length)))
                self.reply(200, result)
            except (ValueError, TypeError):
                self.reply(400, {'error': 'Invalid tutor request'})
            except Exception:
                traceback.print_exc()
                self.reply(500, {'error': 'Tutor operation failed'})

    ThreadingHTTPServer(('0.0.0.0', int(os.environ.get('PORT', '8080'))), Handler).serve_forever()


if __name__ == '__main__':
    main()
