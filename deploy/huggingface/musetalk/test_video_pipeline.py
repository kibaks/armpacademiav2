import concurrent.futures
import importlib.util
from pathlib import Path
import threading
import time
import unittest
from unittest.mock import patch
from video_pipeline import FaceCompositor, GpuGate, pipeline_batches


class PipelineTest(unittest.TestCase):
    def test_decode_overlaps_ordered_encoding_with_at_most_two_batches(self):
        encoding, next_decode = threading.Event(), threading.Event()
        written, decoded = [], []
        def decode(batch):
            if batch == 1:
                self.assertTrue(encoding.wait(2))
                next_decode.set()
            decoded.append(batch)
            self.assertLessEqual(len(decoded)-len(written), 2)
            return batch
        def encode(frame, batch):
            if batch == 0:
                encoding.set()
                self.assertTrue(next_decode.wait(2))
            written.append(frame)
        pipeline_batches(range(6), decode, encode)
        self.assertEqual(written, list(range(6)))

    def test_encoder_failure_terminates_the_pipeline(self):
        def fail(*args):
            raise RuntimeError('encoder stopped')
        with self.assertRaisesRegex(RuntimeError, 'encoder stopped'):
            pipeline_batches(range(20), lambda n: n, fail)

    def test_a_stalled_writer_is_released_before_executor_shutdown(self):
        release=threading.Event()
        with self.assertRaises(TimeoutError):
            pipeline_batches([0],lambda n:n,lambda *args:release.wait(2),abort=release.set,timeout=.01)
        self.assertTrue(release.is_set())

    def test_waiting_chat_gets_the_next_gpu_turn_without_concurrent_inference(self):
        gate = GpuGate()
        order, active = [], []
        def run(name, chat):
            with gate.hold(chat=chat, timeout=2):
                self.assertEqual(active, [])
                active.append(name);order.append(name);active.pop()
        with concurrent.futures.ThreadPoolExecutor(2) as pool:
            with gate.hold():
                chat = pool.submit(run, 'chat', True)
                end = time.monotonic()+2
                while not gate.waiting_chat and time.monotonic()<end:
                    time.sleep(.001)
                self.assertEqual(gate.waiting_chat, 1)
                video = pool.submit(run, 'video', False)
            chat.result(3);video.result(3)
        self.assertEqual(order, ['chat', 'video'])
        with gate.hold():
            with self.assertRaises(TimeoutError):
                with gate.hold(chat=True, timeout=.01): pass
        with gate.hold(timeout=.1): pass

    def test_chat_priority_cannot_starve_a_waiting_video(self):
        gate=GpuGate();order=[]
        def run(name,chat):
            with gate.hold(chat=chat,timeout=3):order.append(name)
        with concurrent.futures.ThreadPoolExecutor(5) as pool:
            with gate.hold():
                jobs=[pool.submit(run,'chat',True) for _ in range(4)]
                jobs.append(pool.submit(run,'video',False))
                end=time.monotonic()+2
                while (gate.waiting_chat<4 or gate.waiting_video<1) and time.monotonic()<end:time.sleep(.001)
                self.assertEqual(gate.waiting_chat,4)
            for job in jobs:job.result(4)
        self.assertLessEqual(order.index('video'),2)

    def test_http_status_is_not_serialized_behind_a_chat_request(self):
        spec=importlib.util.spec_from_file_location('parallel_handler',Path(__file__).with_name('handler.py'))
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        handler=module.EndpointHandler.__new__(module.EndpointHandler)
        handler.slots=threading.BoundedSemaphore(4)
        entered, release=threading.Event(),threading.Event()
        class Response:
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self):return b'{"statusCode":200}'
        def open_request(request,timeout):
            if b'chat' in request.data:
                entered.set();release.wait(3)
            return Response()
        with patch.object(module.urllib.request,'urlopen',open_request),concurrent.futures.ThreadPoolExecutor(2) as pool:
            chat=pool.submit(handler,{'inputs':{'operation':'/chat'}})
            try:
                self.assertTrue(entered.wait(2))
                self.assertEqual(pool.submit(handler,{'inputs':{'operation':'/jobs/test'}}).result(1),{'statusCode':200})
                self.assertFalse(chat.done())
            finally:release.set();chat.result(3)


class CompositorTest(unittest.TestCase):
    def test_roi_composition_matches_pillow_without_mutating_the_avatar(self):
        import numpy as np
        from PIL import Image
        rng=np.random.default_rng(42);compositor=FaceCompositor(max_masks=2)
        for index in range(5):
            image=rng.integers(0,256,(48,40,3),dtype=np.uint8)
            face=rng.integers(0,256,(15,15,3),dtype=np.uint8)
            mask=rng.integers(0,256,(30,30,3) if index%2 else (30,30),dtype=np.uint8)
            original=image.copy();box=(10,10,25,25);crop=(5,5,35,35)
            body=Image.fromarray(image[:,:,::-1]);large=body.crop(crop)
            large.paste(Image.fromarray(face[:,:,::-1]),(5,5,20,20))
            body.paste(large,crop[:2],Image.fromarray(mask).convert('L'))
            expected=np.array(body)[:,:,::-1]
            actual=compositor.blend(image,face,box,mask,crop,index)
            np.testing.assert_array_equal(actual,expected)
            np.testing.assert_array_equal(image,original)
            self.assertLessEqual(len(compositor.masks),2)


if __name__=='__main__':unittest.main()
