from huggingface_hub import hf_hub_download
from pathlib import Path
import urllib.request
root=Path('/opt/MuseTalk/models')
for repo,files,sub in [
 ('TMElyralab/MuseTalk',['musetalkV15/musetalk.json','musetalkV15/unet.pth'],''),
 ('stabilityai/sd-vae-ft-mse',['config.json','diffusion_pytorch_model.bin'],'sd-vae'),
 ('openai/whisper-tiny',['config.json','pytorch_model.bin','preprocessor_config.json'],'whisper'),
 ('yzd-v/DWPose',['dw-ll_ucoco_384.pth'],'dwpose')]:
 for file in files:
  path=hf_hub_download(repo_id=repo,filename=file,local_dir=str(root/sub))
  print(repo,file,Path(path).stat().st_size,flush=True)
import gdown
p=root/'face-parse-bisent/79999_iter.pth'
if not p.exists():gdown.download(id='154JgKpzCPW82qINcVieuPH3fZ2e0P812',output=str(p),quiet=False)
p=root/'face-parse-bisent/resnet18-5c106cde.pth'
if not p.exists():urllib.request.urlretrieve('https://download.pytorch.org/models/resnet18-5c106cde.pth',p)
print('MODELS_READY',flush=True)
