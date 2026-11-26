"""Bounded CPU/GPU overlap; one GPU owner, prioritized short chat requests."""
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
import threading
import time


class GpuGate:
    def __init__(self):
        self.condition = threading.Condition()
        self.busy = False
        self.waiting_chat = 0
        self.waiting_video = 0
        self.chat_turns = 0

    @contextmanager
    def hold(self, chat=False, timeout=None):
        deadline = None if timeout is None else time.monotonic() + timeout
        with self.condition:
            if chat:
                self.waiting_chat += 1
            else:
                self.waiting_video += 1
            try:
                while self.busy or (chat and self.waiting_video and self.chat_turns >= 2) or (not chat and self.waiting_chat and self.chat_turns < 2):
                    remaining = None if deadline is None else deadline - time.monotonic()
                    if remaining is not None and remaining <= 0:
                        raise TimeoutError('GPU busy')
                    self.condition.wait(remaining)
                self.busy = True
                self.chat_turns = self.chat_turns + 1 if chat else 0
            finally:
                if chat:
                    self.waiting_chat -= 1
                else:
                    self.waiting_video -= 1
                self.condition.notify_all()
        try:
            yield
        finally:
            with self.condition:
                self.busy = False
                self.condition.notify_all()


def pipeline_batches(batches, decode, encode, abort=None, timeout=30):
    """Decode next batch during ordered encoding, retaining at most 2 batches."""
    previous = None
    pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix='video-encoder')
    try:
        for batch in batches:
            if previous is not None and previous.done():
                previous.result()
            frames = decode(batch)
            if previous is not None:
                previous.result(timeout=timeout)
            previous = pool.submit(encode, frames, batch)
        if previous is not None:
            previous.result(timeout=timeout)
    except BaseException:
        # Kill the encoder before joining a writer potentially blocked on its pipe.
        if abort is not None:
            try:
                abort()
            except Exception:
                pass
        raise
    finally:
        pool.shutdown(wait=True, cancel_futures=True)


class FaceCompositor:
    """Blend the changing face ROI only; avoid full-frame BGR/RGB/Pillow copies."""
    def __init__(self, max_masks=64):
        self.masks = OrderedDict()
        self.max_masks = max_masks
        self.lock = threading.Lock()

    def blend(self, image, face, box, mask, crop, key):
        import numpy as np
        x, y, right, bottom = map(int, box)
        sx, sy, ex, ey = map(int, crop)
        if not (0 <= x < right <= image.shape[1] and 0 <= y < bottom <= image.shape[0]):
            raise ValueError('Face outside portrait')
        if face.shape != (bottom-y, right-x, 3) or mask.ndim not in (2, 3):
            raise ValueError('Unexpected face or mask')
        with self.lock:
            material = self.masks.get(key)
            if material is None:
                if mask.ndim == 3:
                    from PIL import Image
                    mask = np.asarray(Image.fromarray(mask).convert('L'))
                if not (0 <= x-sx < right-sx <= mask.shape[1] and 0 <= y-sy < bottom-sy <= mask.shape[0]):
                    raise ValueError('Face outside mask')
                alpha = mask[y-sy:bottom-sy, x-sx:right-sx].astype(np.uint16)[..., None]
                material = (alpha, 255-alpha)
                self.masks[key] = material
                if len(self.masks) > self.max_masks:
                    self.masks.popitem(last=False)
            self.masks.move_to_end(key)
        alpha, inverse = material
        output = image.copy()
        # Match Pillow's integer alpha-paste rounding exactly.
        mixed = image[y:bottom, x:right].astype(np.uint16)*inverse + face.astype(np.uint16)*alpha + 128
        output[y:bottom, x:right] = ((mixed+(mixed >> 8)) >> 8).astype(np.uint8)
        return output
