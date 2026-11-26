"""Bounded snapshots of a growing fragmented MP4; no arbitrary file paths."""
import base64
import json

MAX_BYTES = 24000000
CHUNK_BYTES = 262144

def read_chunk(directory, offset):
    if type(offset) is not int or not 0 <= offset <= MAX_BYTES:
        raise ValueError('Invalid video offset')
    state = json.loads((directory / 'status.json').read_text())
    if state.get('status') == 'FAILED':
        raise ValueError('Video rendering failed')
    path = directory / 'result.mp4'
    if state.get('status') not in ('STREAMING', 'COMPLETED') or not path.exists():
        return {'data': '', 'offset': offset, 'complete': False}
    size = path.stat().st_size
    if size > MAX_BYTES or offset > size:
        raise ValueError('Invalid video size')
    with path.open('rb') as media:
        media.seek(offset)
        binary = media.read(CHUNK_BYTES)
    end = offset + len(binary)
    return {'data': base64.b64encode(binary).decode(), 'offset': end,
            'complete': state.get('status') == 'COMPLETED' and end == size}
