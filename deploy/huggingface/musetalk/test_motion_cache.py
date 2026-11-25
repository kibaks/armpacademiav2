"""Captions are reused without freezing illustrations or leaking scene content."""
import unittest
from pathlib import Path
import course_motion as motion
from PIL import Image

class CaptionCacheTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not Path(motion.FONT).exists():
            motion.FONT='/System/Library/Fonts/Supplemental/Arial.ttf'
            motion.BOLD='/System/Library/Fonts/Supplemental/Arial Bold.ttf'
    def test_cached_caption_is_not_modified_when_composited(self):
        motion.text_plate.cache_clear()
        args=('Une offre conforme',(0,0),300,50,22,motion.NAVY,True)
        image=Image.new('RGB',(320,60),'white')
        motion.blit_text(image,*args)
        plate=motion.text_plate(args[0],*args[2:]);snapshot=plate.tobytes()
        motion.blit_text(Image.new('RGBA',(320,60)),*args)
        self.assertEqual(plate.tobytes(),snapshot)
        self.assertGreater(motion.text_plate.cache_info().hits,0)
        self.assertLessEqual(motion.text_plate.cache_info().maxsize,96)
        other=motion.text_plate('Une autre leçon',*args[2:])
        self.assertNotEqual(snapshot,other.tobytes())
    def test_portrait_sampling_preserves_source_timing_and_loops(self):
        from realtime_engine import avatar_frame_index, VIDEO_FPS
        self.assertEqual(VIDEO_FPS,20)
        self.assertEqual(avatar_frame_index(20,100),25)
        self.assertEqual(avatar_frame_index(80,100),0)
        self.assertEqual([avatar_frame_index(i,100) for i in range(5)],[0,1,2,3,5])
    def test_oversized_caption_remains_rejected(self):
        with self.assertRaises(ValueError):
            motion.blit_text(Image.new('RGB',(50,20)),'Une condition importante. '*100,(0,0),50,20)

if __name__=='__main__':unittest.main()
