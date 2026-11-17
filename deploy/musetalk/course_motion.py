"""ARMP motion-design compositor around the deployed MuseTalk avatar.
No remote assets, generated claims, shell interpolation or extra paid service.
"""
import math
import json
import subprocess
import wave
from functools import lru_cache
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1280, 720, 25
NAVY, GOLD, INK = '#123457', '#D8AA4B', '#193653'
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
@lru_cache(maxsize=40)
def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else FONT, size)
def wrap(draw, text, face, width):
    rows=[]
    for word in text.split():
        fragments=[word]
        if draw.textlength(word,font=face)>width:
            fragments=[];piece=''
            for char in word:
                if piece and draw.textlength(piece+char,font=face)>width:
                    fragments.append(piece);piece=''
                piece+=char
            if piece:fragments.append(piece)
        for fragment in fragments:
            if rows and draw.textlength(rows[-1]+' '+fragment,font=face)<=width:rows[-1]+=' '+fragment
            else:rows.append(fragment)
    return rows
def fitted_text(draw,text,xy,width,height,size=38,color=INK,bold=True):
    for actual in range(size,9,-1):
        face=font(actual,bold);rows=wrap(draw,text,face,width)
        if len(rows)*actual*1.4<=height:break
    if len(rows)*actual*1.4>height:raise ValueError('Caption cannot fit without truncation')
    x,y=xy
    for row in rows:
        draw.text((x,y),row,font=face,fill=color);y+=actual*1.4

def ease(value):return 1-(1-max(0,min(1,value)))**3

def read_story(value):
    if not isinstance(value,dict):raise ValueError('Invalid storyboard')
    def text(v,limit):return isinstance(v,str) and bool(v.strip()) and len(v)<=limit and not any(ord(c)<32 and c not in '\n\r\t' for c in v)
    count=value.get('sceneCount');index=value.get('sceneIndex')
    if not text(value.get('title'),250) or not text(value.get('chapter'),250) or type(count) is not int or type(index) is not int or not 1<=count<=12 or not 0<=index<count or type(value.get('music')) is not bool:raise ValueError('Invalid storyboard')
    terms=value.get('terms');cues=value.get('cues');legal=value.get('legalRef')
    if not isinstance(terms,list) or len(terms)>3 or not all(text(term,80) for term in terms) or not isinstance(cues,list) or not 1<=len(cues)<=8 or not isinstance(legal,str) or len(legal)>500:raise ValueError('Invalid storyboard')
    previous=-1;normalized=[]
    for cue in cues:
        if not isinstance(cue,dict) or not text(cue.get('text'),500) or type(cue.get('start')) not in (float,int) or not math.isfinite(cue['start']) or not previous<cue['start']<1 or cue['start']<0 or cue.get('phase') not in ('explanation','rule'):raise ValueError('Invalid cue')
        previous=cue['start'];normalized.append({'text':cue['text'],'start':cue['start'],'phase':cue['phase']})
    return {'title':value['title'].strip(),'chapter':value['chapter'].strip(),'sceneIndex':index,'sceneCount':count,'terms':terms,'cues':normalized,'legalRef':legal,'music':value['music']}

def motif(draw,text,t):
    value=text.lower();x,y=770,43+round(math.sin(t*.9)*2)
    if any(word in value for word in ['citoyen','famille','communauté']):
        for dx,dy,color in [(-25,8,'#7BA8A4'),(25,8,'#7BA8A4'),(0,0,NAVY)]:
            draw.ellipse((x+dx-9,y+dy-22,x+dx+9,y+dy-4),fill=color)
            draw.rounded_rectangle((x+dx-13,y+dy,x+dx+13,y+dy+24),10,fill=color)
        draw.arc((x-42,y-31,x+42,y+42),15,165,fill=GOLD,width=3)
    elif any(word in value for word in ['prix','budget','crédit','paiement']):
        for i in range(3):
            dx=(i-1)*23;rise=round((math.sin(t*.7+i)+1)*2)
            draw.rounded_rectangle((x+dx-9,y+19-i*12-rise,x+dx+9,y+34),4,fill=[NAVY,'#6D9D99',GOLD][i])
    else:
        draw.rounded_rectangle((x-27,y-24,x+27,y+32),7,fill='#EDF3F9',outline='#7291AD',width=2)
        draw.line((x-14,y-9,x+14,y-9),fill=GOLD,width=4)
        for i in range(3):draw.line((x-14,y+4+i*9,x+9-(i%2)*6,y+4+i*9),fill=NAVY,width=2)

def frame(story,seconds,duration):
    p=max(0,min(1,seconds/duration));image=Image.new('RGB',(W,H),'#F0F4F8');d=ImageDraw.Draw(image)
    d.rectangle((0,0,W,142),fill=NAVY)
    d.text((44,24),'ARMP  /  ACADEMIA',font=font(17,True),fill='#F2CF88')
    fitted_text(d,story['chapter'],(44,61),1180,70,31,'#FFFFFF')
    d.rounded_rectangle((45,166,331,586),20,fill='#FFFFFF')
    d.rounded_rectangle((57,189,319,557),16,fill=NAVY)
    d.text((77,565),'VOTRE TUTRICE',font=font(13,True),fill='#587088')
    d.rounded_rectangle((356,166,1235,586),22,fill='#FFFFFF')
    cue=story['cues'][0];index=0
    for i,item in enumerate(story['cues']):
        if item['start']<=p:cue=item;index=i
    begin=cue['start']*duration;end=story['cues'][index+1]['start']*duration if index+1<len(story['cues']) else duration
    appear=ease((seconds-begin)/.42)
    layer=Image.new('RGBA',(879,420),(0,0,0,0));ld=ImageDraw.Draw(layer)
    label='LE BON RÉFLEXE' if cue['phase']=='rule' else 'COMPRENDRE'
    ld.rounded_rectangle((27,25,250,62),8,fill='#FFF3D8' if cue['phase']=='rule' else '#EAF3F4')
    ld.text((41,35),label,font=font(15,True),fill='#88601A' if cue['phase']=='rule' else '#286D69')
    motif(ld,cue['text']+' '+' '.join(story['terms']),seconds)
    fitted_text(ld,story['title'],(28,89),810,60,27,NAVY)
    fitted_text(ld,cue['text'],(28,165),806,204,39)
    if appear<1:layer.putalpha(layer.getchannel('A').point(lambda a:int(a*appear)))
    image.paste(layer,(356,166+round((1-appear)*12)),layer)
    d=ImageDraw.Draw(image)
    for i,term in enumerate(story['terms']):
        x=45+i*399;entry=ease((p-.05-i*.06)/.15);y=608+round((1-entry)*10)
        d.rounded_rectangle((x,y,x+382,y+49),12,fill='#FFFFFF')
        d.ellipse((x+16,y+19,x+26,y+29),fill=GOLD if entry>.5 else '#C3D4E5')
        fitted_text(d,term,(x+42,y+11),321,31,20,NAVY)
    fitted_text(d,story.get('legalRef') or 'Repère pédagogique : vérifier les textes applicables.',(45,675),1050,24,13,'#587088',False)
    marker=f"{story['sceneIndex']+1:02d} / {story['sceneCount']:02d}"
    d.text((1130,677),marker,font=font(15,True),fill=NAVY)
    d.rectangle((45,710,1235,715),fill='#D7E2ED');d.rectangle((45,710,45+round(1190*p),715),fill=GOLD)
    return image

def music_bed(path,duration):
    import numpy as np
    rate=24000;t=np.arange(math.ceil(duration*rate),dtype=np.float32)/rate
    chords=[(130.8128,164.8138,195.9977),(110.,130.8128,164.8138),(87.3071,110.,130.8128),(97.9989,123.4708,146.8324)]
    audio=np.zeros_like(t)
    for i,chord in enumerate(chords):
        mask=(np.floor(t/8).astype(int)%4)==i;phase=(t%8)/8
        envelope=np.sin(np.pi*phase)**2
        for frequency in chord:audio+=np.sin(2*np.pi*frequency*t)*envelope*mask*.0025
    fade=np.minimum(np.minimum(t/1.5,(duration-t)/1.5),1).clip(0,1)
    with wave.open(str(path),'wb') as wav:
        wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(rate);wav.writeframes((audio*fade*32767).astype('<i2').tobytes())

def compose(avatar,output,story,duration):
    output=Path(output);temporary=output.with_name('motion-result.tmp.mp4')
    args=['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-i',str(avatar)]
    filters='[1:v]scale=260:360:force_original_aspect_ratio=decrease,pad=260:360:(ow-iw)/2:(oh-ih)/2:color=0x123457,setsar=1[avatar];[0:v][avatar]overlay=58:190:shortest=1[v]'
    if story.get('music'):
        bed=output.with_name('ambience.wav');music_bed(bed,duration);args+=['-i',str(bed)]
        filters+=';[1:a][2:a]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95:level=false[a]';audio='[a]'
    else:audio='1:a:0'
    args+=['-filter_complex',filters,'-map','[v]','-map',audio,'-t',str(duration),'-c:v','libx264','-threads','4','-preset','veryfast','-crf','23','-profile:v','main','-pix_fmt','yuv420p','-r',str(FPS),'-c:a','aac','-b:a','96k','-ac','1','-movflags','+faststart',str(temporary)]
    log=output.with_name('motion-render.log')
    try:
        with log.open('wb') as errors:
            process=subprocess.Popen(args,stdin=subprocess.PIPE,stderr=errors)
            try:
                for index in range(max(1,math.ceil(duration*FPS))):
                    process.stdin.write(frame(story,index/FPS,duration).tobytes())
                process.stdin.close()
                if process.wait(timeout=max(120,duration*3))!=0:raise RuntimeError('Motion encoding failed')
            except BaseException:
                process.kill();process.wait();raise
        temporary.replace(output)
    finally:
        temporary.unlink(missing_ok=True);output.with_name('ambience.wav').unlink(missing_ok=True)

def assemble(parts,output):
    output=Path(output);listing=output.with_name('film-parts.txt');temporary=output.with_name('film-result.tmp.mp4')
    # Inputs are server-owned, validated hexadecimal job folders, never user paths.
    listing.write_text(''.join("file '"+str(Path(part).resolve())+"'\n" for part in parts))
    try:
        subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(listing),'-map','0:v:0','-map','0:a:0','-c','copy','-movflags','+faststart',str(temporary)],check=True,timeout=180,capture_output=True)
        temporary.replace(output)
    finally:listing.unlink(missing_ok=True);temporary.unlink(missing_ok=True)
