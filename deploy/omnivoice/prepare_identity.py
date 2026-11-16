"""Create immutable tutor references from our installed synthetic Piper voices."""
import hashlib, json, os, urllib.request, wave
from pathlib import Path
root = Path('/workspace/academia/models/tutor-identity')
root.mkdir(exist_ok=True)
text = 'Bonjour et bienvenue. Je suis votre guide de formation. Nous allons apprendre ensemble, étape par étape, avec des explications claires et des exemples concrets.'
for voice in ('female', 'male'):
    manifest = root / (voice + '.json')
    if manifest.exists():
        print(voice, 'reference preserved')
        continue
    request = urllib.request.Request('http://127.0.0.1:8060/synthesize', data=json.dumps({'text': text, 'voice': voice, 'format': 'wav'}).encode(), headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + os.environ['TTS_API_KEY']})
    with urllib.request.urlopen(request, timeout=90) as response:
        audio = response.read()
    path = root / (voice + '.wav')
    path.write_bytes(audio)
    with wave.open(str(path)) as wav:
        duration = wav.getnframes() / wav.getframerate()
    if not 5 <= duration <= 30:
        raise RuntimeError('Invalid reference duration')
    manifest.write_text(json.dumps({'audio': str(path), 'text': text, 'source': 'installed-piper-synthetic-' + voice, 'voiceId': 'academia-' + voice + '-v1', 'sha256': hashlib.sha256(audio).hexdigest(), 'duration': duration}, ensure_ascii=False))
    print(voice, 'reference ready', round(duration, 2), 'seconds')
