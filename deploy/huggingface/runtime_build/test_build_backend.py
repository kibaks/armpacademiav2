import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile

spec=importlib.util.spec_from_file_location('academia_image_build',Path(__file__).with_name('build_backend.py'))
build=importlib.util.module_from_spec(spec);spec.loader.exec_module(build)
class BuildTest(unittest.TestCase):
    def test_metadata_never_downloads_models(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(build,'prepare_runtime',side_effect=AssertionError('Unexpected install')):
            directory=build.prepare_metadata_for_build_wheel(tmp)
            self.assertIn('academia_runtime_builder',directory)
            self.assertTrue((Path(tmp)/directory/'METADATA').is_file())
    def test_wheel_prepares_runtime_once_and_includes_valid_record(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(build,'prepare_runtime') as prepare:
            name=build.build_wheel(tmp)
            prepare.assert_called_once()
            with zipfile.ZipFile(Path(tmp)/name) as archive:
                self.assertIsNone(archive.testzip())
                record=archive.read(build.DIST+'/RECORD').decode()
                for entry in ['METADATA','WHEEL','academia_prebuilt_runtime.py']: self.assertIn(entry,record)
    def test_failed_install_never_yields_a_ready_wheel(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(build,'prepare_runtime',side_effect=RuntimeError('build failed')):
            with self.assertRaises(RuntimeError):build.build_wheel(tmp)
            self.assertFalse(list(Path(tmp).glob('*.whl')))
if __name__=='__main__':unittest.main()
