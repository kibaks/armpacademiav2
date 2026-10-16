"""Exercise source-cache behavior without GPU or optional API dependencies."""
import ast
import json
from pathlib import Path
import subprocess
import tempfile
import threading
import unittest
from unittest.mock import patch

source = Path(__file__).with_name('app.py').read_text()
helper = next(node for node in ast.parse(source).body if isinstance(node, ast.FunctionDef) and node.name == 'normalized_source')
namespace = {'json': json, 'subprocess': subprocess, 'source_lock': threading.Lock()}
exec(compile(ast.Module(body=[helper], type_ignores=[]), 'app.py', 'exec'), namespace)

class SourceCacheTests(unittest.TestCase):
    def test_reuse_and_source_change(self):
        with tempfile.TemporaryDirectory() as tmp:
            namespace['ROOT'] = Path(tmp)
            original = Path(tmp) / 'data/academia/source.mp4'
            original.parent.mkdir(parents=True)
            original.write_bytes(b'original')
            def convert(command, **kwargs):
                Path(command[-1]).write_bytes(b'converted')
            with patch.object(subprocess, 'run', side_effect=convert) as run:
                cached = namespace['normalized_source']()
                self.assertEqual(cached.name, 'source-25fps.mp4')
                self.assertEqual(namespace['normalized_source'](), cached)
                self.assertEqual(run.call_count, 1)
                original.write_bytes(b'new source content')
                namespace['normalized_source']()
                self.assertEqual(run.call_count, 2)
                cached.unlink()
                namespace['normalized_source']()
                self.assertEqual(run.call_count, 3)

    def test_conversion_failure_does_not_publish_partial_video(self):
        with tempfile.TemporaryDirectory() as tmp:
            namespace['ROOT'] = Path(tmp)
            original = Path(tmp) / 'data/academia/source.mp4'
            original.parent.mkdir(parents=True)
            original.write_bytes(b'original')
            def fail(command, **kwargs):
                Path(command[-1]).write_bytes(b'partial')
                raise subprocess.CalledProcessError(1, command)
            with patch.object(subprocess, 'run', side_effect=fail):
                with self.assertRaises(subprocess.CalledProcessError):
                    namespace['normalized_source']()
            self.assertFalse(original.with_name('source-25fps.mp4').exists())
            self.assertFalse(original.with_name('source-25fps.tmp.mp4').exists())

if __name__ == '__main__':
    unittest.main()
