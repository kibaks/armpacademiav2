"""CPU build-time downloads only; serving never installs dependencies or weights."""
import json,os,subprocess,sys
from pathlib import Path
from huggingface_hub import snapshot_download,hf_hub_download
ROOT=Path(os.environ['ACADEMIA_RUNTIME'])/'national';ROOT.mkdir(exist_ok=True)
models=[('facebook/nllb-200-distilled-600M','f8d333a098d19b4fd9a8b18f94170487ad3f821d','translation',['*.json','*.model','pytorch_model.bin','README.md']),('facebook/mms-tts-swh','c66a113bf598cd86fe1dfd3c0b5b56d4caa4e6f5','swahili',['*.json','model.safetensors','README.md']),('k2-fsa/OmniVoice','3fc979d1cd72492cd679c5ac2611e0d7ac047ba1','omnivoice',['*.json','*.safetensors','*.jinja','*.md','audio_tokenizer/*'])]
for repo,revision,folder,patterns in models:
 snapshot_download(repo,revision=revision,local_dir=str(ROOT/folder),allow_patterns=patterns)
refs=ROOT/'references';refs.mkdir(exist_ok=True)
import pyarrow.parquet as pq
import imageio_ffmpeg
ff=imageio_ffmpeg.get_ffmpeg_exe()
for language,config in [('ln','lingala_lin'),('kg','kikongo_ya_leta_ktu'),('lua','tshiluba_lua')]:
 path=hf_hub_download('AfriSpeech/african-speech-public_v1',config+'/validation-00000-of-00001.parquet',repo_type='dataset',revision='b814069f6aeddfc823df246b43cc3d5e4ea46005',local_dir=str(ROOT/'corpus'))
 rows=pq.read_table(path).to_pylist()
 row=next(r for r in rows if 5<float(r['duration'])<8 and 40<len(r['text'])<100 and '\u200b' not in r['text'] and not any(s in r['text'] for s in ['MUYIMBU','Yehova','YESU','Te.','—']))
 source=refs/(language+'.mp3');source.write_bytes(row['audio']['bytes'])
 subprocess.run([ff,'-v','error','-y','-i',str(source),'-ar','24000','-ac','1',str(refs/(language+'.wav'))],check=True)
 (refs/(language+'.json')).write_text(json.dumps({'file':language+'.wav','text':row['text'],'source':'AfriSpeech/african-speech-public_v1','revision':'b814069f6aeddfc823df246b43cc3d5e4ea46005','config':config,'originalPath':row['audio']['path'],'reviewRequired':True},ensure_ascii=False))
# Fixed synthetic identities preserve the former consistent-voice contract.
import wave
from piper import PiperVoice
text='Bonjour. Je vous accompagne pour comprendre les marchés publics et progresser dans votre formation.'
for voice,file in [('female','fr_FR-siwis-medium.onnx'),('male','fr_FR-tom-medium.onnx')]:
 model=PiperVoice.load(str(Path(os.environ['ACADEMIA_RUNTIME'])/'voices'/file))
 with wave.open(str(refs/(voice+'.wav')),'wb') as output:model.synthesize_wav(text,output)
 (refs/(voice+'.json')).write_text(json.dumps({'file':voice+'.wav','text':text,'source':'Piper synthetic tutor identity','reviewRequired':True}))
# Validate real model inference on the CPU builder before advertising a language.
import tempfile
samples={'ln':'Mbote. Tokoyekola elongo.','sw':'Habari. Tutajifunza pamoja.','kg':'Mbote. Beto ke longuka kisika mosi.','lua':'Moyo. Tuetu tulonga pamue.'}
engine=Path(__file__).with_name('national_engine.py')
env={**os.environ,'ACADEMIA_FFMPEG':ff,'CUDA_VISIBLE_DEVICES':'','HF_HUB_OFFLINE':'1','TRANSFORMERS_OFFLINE':'1','OMP_NUM_THREADS':'2','OPENBLAS_NUM_THREADS':'1'}
for language,text in samples.items():
 for operation,body in [('translate',{'text':'Bonjour.','sourceLanguage':'fr','language':language}),('speech',{'text':text,'language':language})]:
  with tempfile.TemporaryDirectory() as tmp:
   output=Path(tmp)/'result.json'
   subprocess.run([sys.executable,str(engine),operation,str(output)],input=json.dumps(body).encode(),env=env,check=True,timeout=180)
   result=json.loads(output.read_text())
   if result.get('language')!=language or not result.get('text',result.get('audioData')):raise RuntimeError('National smoke check failed')
  print('NATIONAL_INFERENCE_VERIFIED',language,operation,flush=True)
(ROOT/'installed.json').write_text(json.dumps({'translation':['ln','sw','kg','lua'],'speech':['ln','sw','kg','lua'],'reviewRequired':True,'experimental':['kg'],'local':True,'models':[(r,rev) for r,rev,_,_ in models]}))
print('NATIONAL_MODELS_INSTALLED',flush=True)
