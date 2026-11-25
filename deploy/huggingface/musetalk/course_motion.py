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

@lru_cache(maxsize=96)
def text_plate(text,width,height,size,color,bold):
    # Typography is immutable within a scene. Shape/rasterize each caption once,
    # then composite its alpha mask into every animated frame.
    plate=Image.new('RGBA',(width,height),(0,0,0,0))
    fitted_text(ImageDraw.Draw(plate),text,(0,0),width,height,size,color,bold)
    return plate

def blit_text(image,text,xy,width,height,size=38,color=INK,bold=True):
    plate=text_plate(text,width,height,size,color,bold)
    image.paste(plate,xy,plate)

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

def pictogram_kind(text):
    import unicodedata
    value=''.join(c for c in unicodedata.normalize('NFD',text.lower()) if unicodedata.category(c)!='Mn')
    groups=[('people',('citoyen','famille','communaute','personne','eleve','soumissionnaire','attributaire','titulaire')),('building',('autorite','entreprise','institution','ecole','administration')),('coins',('prix','budget','credit','paiement','financ','montant')),('works',('travaux','ouvrage','chantier','construction')),('shield',('controle','verifi','conform','garantie')),('scales',('egalite','equite','concurrence','transparence')),('document',('dossier','document','dao','contrat','engagement','offre','ppm','besoin','caracteristique'))]
    for kind,words in groups:
        if any(word in value for word in words):return kind
    return 'document'

def pictogram(draw,kind,cx,cy,scale,t,entry):
    """Code-native vector primitives; large semantic motion, no remote artwork."""
    def box(a,b,c,d):return (cx+a*scale,cy+b*scale,cx+c*scale,cy+d*scale)
    def line(points,color=NAVY,width=3):draw.line([(cx+x*scale,cy+y*scale) for x,y in points],fill=color,width=max(1,round(width*scale)),joint='curve')
    def rect(a,b,c,d,fill,outline=None):draw.rounded_rectangle(box(a,b,c,d),max(1,round(4*scale)),fill=fill,outline=outline,width=max(1,round(2*scale)))
    beat=(math.sin(t*1.7)+1)/2
    if kind=='building':
        draw.polygon([(cx+x*scale,cy+y*scale) for x,y in [(-38,-16),(0,-40),(38,-16)]],fill=NAVY)
        rect(-35,-12,35,-5,GOLD)
        for x in (-25,-5,15):rect(x,0,x+10,29,'#6D9D99')
        rect(-39,33,39,40,NAVY)
        # A document travels toward the institution, then starts again.
        travel=(t*.24)%1;rect(-70+travel*35,14-travel*7,-51+travel*35,37-travel*7,'#FFFFFF',GOLD)
    elif kind=='people':
        for x,dy in [(-28,7),(28,7),(0,0)]:
            rise=round(math.sin(t*1.5+x*.04)*3)
            draw.ellipse(box(x-10,-34+dy+rise,x+10,-14+dy+rise),fill=NAVY if x==0 else '#6D9D99')
            rect(x-14,-7+dy+rise,x+14,28+dy+rise,NAVY if x==0 else '#6D9D99')
        line([(-48,37),(-20,43),(20,43),(48,37)],GOLD,3)
    elif kind=='coins':
        for i in range(3):
            height=(16+i*13)*ease(min(1,entry*1.5-i*.15))
            rect(-38+i*27,34-height,-18+i*27,34,[NAVY,'#6D9D99',GOLD][i])
        coin_y=-30+beat*13
        draw.ellipse(box(8,coin_y,37,coin_y+29),fill='#F9E9C4',outline=GOLD,width=max(1,round(3*scale)))
        line([(18,coin_y+14),(28,coin_y+14)],GOLD,3)
    elif kind=='works':
        line([(-40,35),(41,35)],NAVY,4)
        line([(-20,32),(-20,-39),(25,-39),(25,-28)],NAVY,4)
        line([(-38,-26),(44,-26)],GOLD,5)
        hook_x=14+math.sin(t*1.2)*16
        line([(hook_x,-26),(hook_x,4)],NAVY,2)
        rect(hook_x-12,4,hook_x+12,18,'#6D9D99')
        for i in range(3):rect(0+i*13,23,10+i*13,33,'#D8AA4B')
    elif kind=='shield':
        points=[(-32,-35),(0,-44),(32,-35),(28,7),(0,38),(-28,7),(-32,-35)]
        draw.polygon([(cx+x*scale,cy+y*scale) for x,y in points],fill='#E5F1EF');line(points,'#6D9D99',3)
        check=[(-17,-5),(-4,10),(20,-17)];progress=min(1,entry*1.6)
        if progress<.5:
            q=progress*2;line([check[0],(check[0][0]+13*q,check[0][1]+15*q)],NAVY,5)
        else:
            q=(progress-.5)*2;line([check[0],check[1],(-4+24*q,10-27*q)],NAVY,5)
        scan=-32+((t*.3)%1)*58;line([(-22,scan),(22,scan)],GOLD,2)
    elif kind=='scales':
        tilt=math.sin(t*1.1)*(2+3*(1-entry))
        line([(0,-38),(0,34),(-24,34),(24,34)],NAVY,4)
        line([(-38,-20+tilt),(38,-20-tilt)],GOLD,4)
        for x,offset in [(-30,tilt),(30,-tilt)]:
            line([(x,-20+offset),(x-14,11+offset),(x+14,11+offset),(x,-20+offset)],NAVY,2)
            draw.arc(box(x-14,0+offset,x+14,21+offset),0,180,fill='#6D9D99',width=max(2,round(5*scale)))
    else:
        rect(-30,-40,30,39,'#F1F5FA',NAVY)
        draw.polygon([(cx+10*scale,cy-40*scale),(cx+30*scale,cy-20*scale),(cx+10*scale,cy-20*scale)],fill='#CADBEA')
        for i in range(4):
            reveal=ease(entry*2-i*.18);line([(-18,-17+i*12),(-18+(36 if i!=3 else 23)*reveal,-17+i*12)],GOLD if i==0 else '#6D9D99',3)
        # Visible page-to-page motion, confined to the document illustration.
        scan=-22+((t*.25)%1)*53;line([(-21,scan),(21,scan)],'#BACDDF',1)

def animated_illustration(draw,story,cue,seconds,cue_age,image=None):
    # Labels only from the source; links are associative, never legal process arrows.
    terms=story['terms'] or [story['title']]
    count=len(terms);centers=[439] if count==1 else [245,620] if count==2 else [160,439,718]
    for i in range(count-1):
        left,right=centers[i]+62,centers[i+1]-62
        draw.line((left,196,right,196),fill='#D8E4ED',width=3)
        dot=left+((seconds*.35)%1)*(right-left)
        draw.ellipse((dot-4,192,dot+4,200),fill=GOLD)
    for i,term in enumerate(terms):
        entry=ease((cue_age-i*.16)/.65);cx=centers[i];cy=190+round((1-entry)*32)
        active=term.casefold() in cue['text'].casefold()
        draw.ellipse((cx-58,cy-58,cx+58,cy+58),fill='#FFF3D8' if active else '#F0F5FA')
        pictogram(draw,pictogram_kind(term),cx,cy,.95*(.65+.35*entry),seconds,entry)
        if image is None: fitted_text(draw,term,(cx-105,257),210,43,19,NAVY)
        else: blit_text(image,term,(cx-105,257),210,43,19,NAVY)

def frame(story,seconds,duration):
    p=max(0,min(1,seconds/duration));image=Image.new('RGB',(W,H),'#F0F4F8');d=ImageDraw.Draw(image)
    d.rectangle((0,0,W,142),fill=NAVY)
    d.text((44,24),'ARMP  /  ACADEMIA',font=font(17,True),fill='#F2CF88')
    blit_text(image,story['chapter'],(44,61),1180,70,31,'#FFFFFF')
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
    animated_illustration(ld,story,cue,seconds,max(0,seconds-begin),image=layer)
    blit_text(layer,story['title'],(28,77),810,55,25,NAVY)
    blit_text(layer,cue['text'],(28,310),806,100,28)
    if appear<1:layer.putalpha(layer.getchannel('A').point(lambda a:int(a*appear)))
    image.paste(layer,(356,166+round((1-appear)*12)),layer)
    d=ImageDraw.Draw(image)
    for i,term in enumerate(story['terms']):
        x=45+i*399;entry=ease((p-.05-i*.06)/.15);y=608+round((1-entry)*10)
        d.rounded_rectangle((x,y,x+382,y+49),12,fill='#FFFFFF')
        d.ellipse((x+16,y+19,x+26,y+29),fill=GOLD if entry>.5 else '#C3D4E5')
        blit_text(image,term,(x+42,y+11),321,31,20,NAVY)
    blit_text(image,story.get('legalRef') or 'Repère pédagogique : vérifier les textes applicables.',(45,675),1050,24,13,'#587088',False)
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
