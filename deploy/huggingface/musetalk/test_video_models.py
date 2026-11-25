import importlib.util
import json
from pathlib import Path
import tempfile
from types import ModuleType, SimpleNamespace
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('academia_realtime',Path(__file__).with_name('realtime_engine.py'))
realtime=importlib.util.module_from_spec(spec);spec.loader.exec_module(realtime)
class VideoMemoryTest(unittest.TestCase):
    def test_shared_gpu_never_receives_full_precision_unet_weights(self):
        transfers=[]
        class Model:
            def __init__(self,**kwargs):self.dtype='fp32'
            def load_state_dict(self,weights):self.weights=weights
            def half(self):self.dtype='fp16';return self
            def to(self,device):
                transfers.append(self.dtype)
                if self.dtype!='fp16':raise MemoryError('FP32 transfer exhausts the shared GPU')
                return self
            def eval(self):return self
        torch=ModuleType('torch')
        def load(path,*,map_location):
            self.assertEqual(map_location,'cpu');return {'checkpoint':'CPU weights'}
        torch.load=load
        diffusers=ModuleType('diffusers');diffusers.UNet2DConditionModel=Model
        vae=ModuleType('musetalk.models.vae');vae.VAE=lambda **kw:SimpleNamespace(vae=Model().half())
        unet=ModuleType('musetalk.models.unet');unet.PositionalEncoding=Model
        modules={'torch':torch,'diffusers':diffusers,'musetalk':ModuleType('musetalk'),'musetalk.models':ModuleType('musetalk.models'),'musetalk.models.vae':vae,'musetalk.models.unet':unet}
        with tempfile.TemporaryDirectory() as tmp, patch.dict('sys.modules',modules), patch.object(realtime,'Path',lambda name:Path(tmp)/name):
            p=Path(tmp)/'models/musetalkV15/musetalk.json';p.parent.mkdir(parents=True);p.write_text('{}')
            _,model,_=realtime.load_video_models('cuda:0')
            self.assertEqual(model.device,'cuda:0');self.assertEqual(transfers,['fp16','fp16'])
if __name__=='__main__':unittest.main()
