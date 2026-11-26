"""Isolated CPU national-language inference; one process is released per request."""
import base64
import gc
import io
import json
import os
import re
from pathlib import Path
import subprocess
import sys
import unicodedata

LANGUAGES={'fr':'fra_Latn','ln':'lin_Latn','sw':'swh_Latn','kg':'kon_Latn','lua':'lua_Latn'}
def inference_device():
    device=os.environ.get('NATIONAL_DEVICE','cpu')
    if device not in ('cpu','cuda:0'):raise ValueError('Invalid inference device')
    return device

ROOT=Path(os.environ.get('ACADEMIA_RUNTIME','/opt/academia-runtime'))/'national'

def validate(operation, body):
    if not isinstance(body,dict):raise ValueError('Invalid language request')
    language=body.get('language')
    if language not in LANGUAGES:raise ValueError('Unsupported language')
    text=body.get('text')
    limit=6000 if operation=='translate' else 3000
    if not isinstance(text,str) or not 1<=len(text.strip())<=limit:raise ValueError('Invalid text length')
    if operation=='translate' and body.get('sourceLanguage','fr') not in LANGUAGES:raise ValueError('Unsupported source language')
    if operation not in ('translate','speech'):raise ValueError('Unsupported operation')
    return unicodedata.normalize('NFC',text)

# Keep official procurement terms intact rather than turning "marchés" into
# shops or advertising. These French terms are already taught in the course.
LEGAL_TERMS=re.compile(r"\b(?:marchés? (?:publics?|de (?:travaux|fournitures|services|prestations intellectuelles))|prestations? intellectuelles?|autorités? contractantes?|soumissionnaires?|attributaires?|appels? d[’']offres|DAO|PPM|DPAO|ANO|ARMP|DGCMP|CGPMP)\b",re.IGNORECASE)

def legal_context(text):
    originals=[]
    def explain(match):
        term=match.group();lower=term.lower()
        if term not in originals:originals.append(term)
        plural=lower.startswith(('marchés ','autorités ','soumissionnaires','attributaires','appels '))
        contract='contrats' if plural else 'contrat'
        if lower.startswith(('marché ','marchés ')):
            if 'public' in lower:return contract+' d’achat de l’État'
            if 'fournitures' in lower:return contract+' d’achat de biens'
            if 'travaux' in lower:return contract+' pour des travaux'
            if 'prestations intellectuelles' in lower:return contract+' de conseil et d’expertise'
            if 'services' in lower:return contract+' de services'
        if lower.startswith('prestation'):return 'services de conseil et d’expertise'
        # Keep roles and acronyms untouched: do not invent legal definitions.
        return term
    return LEGAL_TERMS.sub(explain,text),originals

def translate(body,text):
    import torch
    from transformers import AutoTokenizer,AutoModelForSeq2SeqLM
    source=body.get('sourceLanguage','fr');target=body['language']
    if source==target:return {'text':text,'language':target,'provider':'nllb-200','reviewRequired':True}
    folder=ROOT/'translation'
    tokenizer=AutoTokenizer.from_pretrained(folder,src_lang=LANGUAGES[source],local_files_only=True,trust_remote_code=False)
    device=inference_device()
    model=AutoModelForSeq2SeqLM.from_pretrained(folder,local_files_only=True,trust_remote_code=False,dtype=torch.float16 if device=='cuda:0' else torch.float32).eval().to(device)
    out=[];official=[]
    for paragraph in text.split('\n'):
        if not paragraph.strip():out.append(paragraph);continue
        # Translate full sentences with explicit purchasing context. Splitting
        # around opaque placeholders caused French copies and unrelated output
        # in low-resource languages. Retain the original official terms below.
        contextual,terms=legal_context(paragraph) if source=='fr' else (paragraph,[])
        for term in terms:
            if term not in official:official.append(term)
        inputs=tokenizer(contextual,return_tensors='pt',truncation=False).to(device)
        if inputs.input_ids.shape[1]>480:raise ValueError('Paragraph too long for complete translation')
        with torch.inference_mode():
            tokens=model.generate(**inputs,forced_bos_token_id=tokenizer.convert_tokens_to_ids(LANGUAGES[target]),max_new_tokens=768,num_beams=3)
        ids=tokens[0].tolist()
        while ids and ids[-1]==tokenizer.pad_token_id:ids.pop()
        if not ids or ids[-1]!=tokenizer.eos_token_id:raise RuntimeError('Incomplete translation')
        result=tokenizer.decode(tokens[0],skip_special_tokens=True).strip()
        if not result:raise RuntimeError('Empty translation')
        out.append(unicodedata.normalize('NFC',result))
    if official:out.extend(['','Repères ARMP : '+ ' ; '.join(official)+'.'])
    return {'text':'\n'.join(out),'language':target,'provider':'nllb-200','reviewRequired':True,'officialTermsPreserved':True,'officialTerms':official}

def speech(body,text):
    import numpy as np
    import torch
    import soundfile as sf
    language=body['language'];consistent=body.get('voiceMode')=='consistent'
    voice='male' if body.get('voice') in ('male','henri') else 'female'
    if language=='sw' and not consistent:
        from transformers import AutoTokenizer,VitsModel
        folder=ROOT/'swahili'
        tokenizer=AutoTokenizer.from_pretrained(folder,local_files_only=True,trust_remote_code=False)
        vocabulary=tokenizer.get_vocab()
        missing={c for c in text.lower() if unicodedata.category(c)[0] in 'LMN' and c not in vocabulary}
        if missing:raise ValueError('Unsupported voice characters: '+''.join(sorted(missing)))
        model=VitsModel.from_pretrained(folder,local_files_only=True,trust_remote_code=False).eval()
        with torch.inference_mode():audio=model(**tokenizer(text,return_tensors='pt')).waveform.squeeze().float().numpy()
        rate=model.config.sampling_rate;provider='national-vits'
    else:
        from omnivoice import OmniVoice
        device=inference_device()
        model=OmniVoice.from_pretrained(str(ROOT/'omnivoice'),device_map=device,dtype=torch.float16 if device=='cuda:0' else torch.float32)
        reference=json.loads((ROOT/'references'/((voice if consistent else language)+'.json')).read_text())
        data,rate=sf.read(ROOT/'references'/reference['file'],dtype='float32',always_2d=True)
        prompt=model.create_voice_clone_prompt(ref_audio=(torch.from_numpy(data.T),rate),ref_text=reference['text'])
        torch.manual_seed(271828 if voice=='female' else 314159)
        audio=model.generate(text=text,language=language if language in ('fr','ln','sw','lua') else None,voice_clone_prompt=prompt,num_step=32)[0]
        rate=model.sampling_rate;provider='national-omnivoice'
    audio=np.asarray(audio)
    if not np.isfinite(audio).all() or audio.size<100 or np.max(np.abs(audio))<.001:raise RuntimeError('Invalid speech output')
    wav=io.BytesIO();sf.write(wav,audio,rate,format='WAV',subtype='PCM_16')
    ffmpeg=os.environ['ACADEMIA_FFMPEG']
    encoded=subprocess.run([ffmpeg,'-v','error','-i','pipe:0','-c:a','libmp3lame','-b:a','96k','-f','mp3','pipe:1'],input=wav.getvalue(),capture_output=True,timeout=25,check=True).stdout
    if not 44<len(encoded)<=4000000:raise RuntimeError('Invalid speech size')
    return {'audioData':base64.b64encode(encoded).decode(),'mimeType':'audio/mpeg','provider':provider,'language':language,'wordBoundaries':[],**({'voiceId':'academia-'+voice+'-v1'} if consistent else {})}

def main():
    import torch
    torch.set_num_threads(2)
    body=json.load(sys.stdin);operation=sys.argv[1];text=validate(operation,body)
    result=translate(body,text) if operation=='translate' else speech(body,text)
    Path(sys.argv[2]).write_text(json.dumps(result,ensure_ascii=False))
if __name__=='__main__':main()
