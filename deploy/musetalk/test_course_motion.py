import json
import tempfile
import unittest
from pathlib import Path
from course_motion import read_story, frame, fitted_text, compose, assemble, pictogram_kind, animated_illustration
from PIL import Image, ImageDraw

STORY={'title':'Définir le besoin','chapter':'Un achat au service des citoyens','sceneIndex':0,'sceneCount':2,'terms':['Besoin','Usage','Caractéristiques'],'cues':[{'text':'Décrivez ce qui est nécessaire, sans imposer une marque.','start':0,'phase':'explanation'},{'text':'Vérifiez les caractéristiques utiles avant la consultation.','start':.7,'phase':'rule'}],'legalRef':'Extrait pédagogique du cours','music':False}
class MotionTests(unittest.TestCase):
 def test_source_captions_and_motion_are_preserved(self):
  story=read_story(STORY)
  first,last=frame(story,0,4),frame(story,3.9,4)
  self.assertEqual(first.size,(1280,720));self.assertNotEqual(first.tobytes(),last.tobytes())
  self.assertEqual(story['cues'][0]['text'],STORY['cues'][0]['text'])
 def test_pictograms_match_source_concepts_and_keep_animating(self):
  for term,kind in [('autorité contractante','building'),('travaux','works'),('prix','coins'),('citoyens','people'),('contrôle','shield'),('égalité','scales'),('DAO','document')]:
   self.assertEqual(pictogram_kind(term),kind)
   images=[]
   for t in [2,2.5]:
    image=Image.new('RGB',(879,420),'white');draw=ImageDraw.Draw(image)
    animated_illustration(draw,{**STORY,'terms':[term]},STORY['cues'][0],t,t)
    images.append(image.tobytes())
   self.assertNotEqual(*images,term)
 def test_invalid_metadata_never_reaches_the_encoder(self):
  for patch in [{'sceneIndex':-1},{'sceneCount':100},{'music':'yes'},{'cues':[{'text':'X','start':float('nan'),'phase':'rule'}]}]:
   with self.assertRaises(ValueError):read_story({**STORY,**patch})
 def test_oversized_text_is_refused_instead_of_ellipsized(self):
  image=Image.new('RGB',(100,100));draw=ImageDraw.Draw(image)
  with self.assertRaises(ValueError):fitted_text(draw,'Une condition importante. '*100,(0,0),50,20)
 def test_encoder_has_video_audio_and_faststart_and_can_assemble(self):
  import subprocess
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);avatar=root/'avatar.mp4';output=root/'result.mp4'
   subprocess.run(['ffmpeg','-v','error','-y','-f','lavfi','-i','color=c=0x123457:s=260x360:r=25:d=1','-f','lavfi','-i','sine=frequency=440:sample_rate=24000:duration=1','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-shortest',str(avatar)],check=True)
   compose(avatar,output,{**STORY,'music':True},1)
   data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(output)]))
   self.assertEqual({s['codec_type'] for s in data['streams']},{'audio','video'})
   video=next(s for s in data['streams'] if s['codec_type']=='video');self.assertEqual((video['width'],video['height']),(1280,720))
   movie=root/'movie.mp4';assemble([output,output],movie)
   duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(movie)]));self.assertGreater(duration,1.8)
if __name__=='__main__':unittest.main()
