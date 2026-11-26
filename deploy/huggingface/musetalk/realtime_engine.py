"""Persistent MuseTalk v1.5 engine; publish one synchronized fragmented MP4.

Uses the official cached Avatar materials, without its image-per-frame output.
Only the worker's single executor may call this engine.
"""
from concurrent.futures import ThreadPoolExecutor
from contextlib import nullcontext
from video_pipeline import FaceCompositor, pipeline_batches
import hashlib
import shutil
from pathlib import Path
import subprocess
import time
from types import SimpleNamespace


def load_video_models(device):
    """Avoid a full-precision GPU copy while Qwen occupies the shared T4."""
    import json
    import torch
    from diffusers import UNet2DConditionModel
    from musetalk.models.vae import VAE
    from musetalk.models.unet import PositionalEncoding

    vae = VAE(model_path='models/sd-vae', use_float16=True)
    with Path('models/musetalkV15/musetalk.json').open() as file:
        model = UNet2DConditionModel(**json.load(file))
    weights = torch.load('models/musetalkV15/unet.pth', map_location='cpu')
    model.load_state_dict(weights)
    del weights
    # Cast on CPU before transfer: the upstream wrapper first copies FP32 to
    # CUDA, temporarily doubling the UNet's GPU footprint and causing OOM.
    model = model.half().to(device).eval()
    unet = SimpleNamespace(model=model, device=device)
    pe = PositionalEncoding(d_model=384).half().to(device)
    return vae, unet, pe


# Preserve the original 25fps portrait motion while synthesizing fewer mouth
# frames. The 720p lesson compositor keeps its own 25fps animations.
VIDEO_FPS = 20

def avatar_frame_index(index, count):
    return (index * 25 // VIDEO_FPS) % count

class RealtimeEngine:
    def __init__(self, source):
        import torch
        from transformers import WhisperModel
        import scripts.realtime_inference as rt
        from musetalk.utils.audio_processor import AudioProcessor
        from musetalk.utils.face_parsing import FaceParsing

        torch.set_num_threads(4)
        rt.args = SimpleNamespace(version='v15', extra_margin=10, parsing_mode='jaw')
        rt.device = torch.device('cuda:0')
        rt.vae, rt.unet, rt.pe = load_video_models(rt.device)
        rt.pe = rt.pe.half().to(rt.device)
        rt.vae.vae = rt.vae.vae.half().to(rt.device).eval()
        rt.unet.model = rt.unet.model.half().to(rt.device).eval()
        rt.weight_dtype = rt.unet.model.dtype
        rt.timesteps = torch.tensor([0], device=rt.device)
        rt.audio_processor = AudioProcessor(feature_extractor_path='models/whisper')
        rt.whisper = WhisperModel.from_pretrained('models/whisper').to(
            device=rt.device, dtype=rt.weight_dtype).eval()
        rt.whisper.requires_grad_(False)
        rt.fp = FaceParsing(left_cheek_width=90, right_cheek_width=90)
        avatar_id = 'academia-' + hashlib.sha256(Path(source).read_bytes()).hexdigest()[:16]
        cache = Path(f'results/v15/avatars/{avatar_id}')
        prepared = all((cache / name).exists() for name in ('latents.pt', 'coords.pkl', 'mask_coords.pkl', 'avator_info.json'))
        if not prepared and cache.exists():
            # Official Avatar otherwise prompts interactively after interrupted prep.
            shutil.rmtree(cache)
        self.avatar = rt.Avatar(avatar_id, str(source), 0, 20, not prepared)
        self.rt = rt
        self.compositor = FaceCompositor()
        # Prime CUDA kernels before accepting a user request.
        with torch.inference_mode():
            features, length = rt.audio_processor.get_audio_feature('data/academia/reply.wav', weight_dtype=rt.weight_dtype)
            chunks = rt.audio_processor.get_whisper_chunk(features, rt.device, rt.weight_dtype, rt.whisper, length, fps=VIDEO_FPS)
            self._decode(chunks[:2], 0)
            self._decode(chunks[:4], 0)
        torch.cuda.synchronize()

    def _decode(self, chunks, offset):
        import torch
        rt, avatar = self.rt, self.avatar
        latents = torch.cat([avatar.input_latent_list_cycle[avatar_frame_index(offset+i, len(avatar.input_latent_list_cycle))] for i in range(len(chunks))])
        audio = rt.pe(chunks.to(device=rt.device, dtype=rt.weight_dtype))
        predicted = rt.unet.model(latents.to(device=rt.device, dtype=rt.weight_dtype), rt.timesteps, encoder_hidden_states=audio).sample
        return rt.vae.decode_latents(predicted.to(dtype=rt.vae.vae.dtype))

    def render(self, audio, output, on_playable, gpu_gate=None):
        import cv2
        import numpy as np
        import torch
        from musetalk.utils.blending import get_image_blending
        started = time.monotonic()
        rt, avatar = self.rt, self.avatar
        with torch.inference_mode():
            features, length = rt.audio_processor.get_audio_feature(str(audio), weight_dtype=rt.weight_dtype)
            with gpu_gate.hold() if gpu_gate else nullcontext():
                chunks = rt.audio_processor.get_whisper_chunk(features, rt.device, rt.weight_dtype, rt.whisper, length, fps=VIDEO_FPS)
                torch.cuda.synchronize()
            feature_ms = round((time.monotonic()-started)*1000)
            timings = {'audioFeaturesMs': feature_ms, 'gpuDecodeMs': 0, 'assembleEncodeMs': 0, 'frames': len(chunks), 'fps': VIDEO_FPS, 'pipelineDepth': 2, 'cpuWorkers': 2}
            height, width = avatar.frame_list_cycle[0].shape[:2]
            # The portal displays a small portrait. Encode 480p rather than
            # transporting 720p raw frames through the CPU encoder.
            output_height = min(height, 480)
            output_width = max(2, round(width * output_height / height / 2) * 2)
            command = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{output_width}x{output_height}', '-r', str(VIDEO_FPS), '-i', 'pipe:0', '-i', str(audio), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-threads', '2', '-preset', 'superfast', '-tune', 'zerolatency', '-profile:v', 'main', '-level:v', '3.1', '-crf', '24', '-maxrate', '850k', '-bufsize', '1700k', '-g', '6', '-keyint_min', '6', '-sc_threshold', '0', '-bf', '0', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '64k', '-ac', '1', '-shortest', '-movflags', '+frag_keyframe+empty_moov+default_base_moof', '-flush_packets', '1', str(output)]
            announced = False
            # stderr goes to a file: never risk a full pipe blocking the encoder.
            with output.with_suffix('.encode.log').open('wb') as log:
                process = subprocess.Popen(command, stdin=subprocess.PIPE, stderr=log)
                try:
                    cv2.setNumThreads(1)
                    def batches():
                        offset = 0
                        while offset < len(chunks):
                            count = 2 if offset == 0 else 4
                            yield (offset, count)
                            offset += count

                    def decode(batch):
                        offset, count = batch
                        with gpu_gate.hold() if gpu_gate else nullcontext():
                            tick = time.monotonic()
                            with torch.inference_mode():
                                frames = self._decode(chunks[offset:offset+count], offset)
                                torch.cuda.synchronize()
                            timings['gpuDecodeMs'] += (time.monotonic()-tick)*1000
                            return frames

                    def composite(item):
                        index, face = item
                        pos = avatar_frame_index(index, len(avatar.frame_list_cycle))
                        bbox = avatar.coord_list_cycle[pos]
                        x1, y1, x2, y2 = bbox
                        face = cv2.resize(face.astype(np.uint8), (x2-x1, y2-y1))
                        try:
                            combined = self.compositor.blend(avatar.frame_list_cycle[pos], face, bbox, avatar.mask_list_cycle[pos], avatar.mask_coords_list_cycle[pos], pos)
                        except ValueError:
                            combined = get_image_blending(avatar.frame_list_cycle[pos], face, bbox, avatar.mask_list_cycle[pos], avatar.mask_coords_list_cycle[pos])
                        if (width, height) != (output_width, output_height):
                            combined = cv2.resize(combined, (output_width, output_height), interpolation=cv2.INTER_AREA)
                        return combined.tobytes()

                    with ThreadPoolExecutor(max_workers=2, thread_name_prefix='video-composite') as compositors:
                        def encode(frames, batch):
                            nonlocal announced
                            tick = time.monotonic()
                            offset, _ = batch
                            for binary in compositors.map(composite, enumerate(frames, offset)):
                                process.stdin.write(binary)
                            if not announced and output.exists():
                                with output.open('rb') as media:
                                    announced = b'moof' in media.read(262144)
                                if announced:
                                    on_playable(round((time.monotonic()-started)*1000))
                            timings['assembleEncodeMs'] += (time.monotonic()-tick)*1000
                        pipeline_batches(batches(), decode, encode, abort=process.kill)
                    process.stdin.close()
                    if process.wait(timeout=30) != 0:
                        raise RuntimeError('Fragment encoder failed')
                    if not announced:
                        on_playable(round((time.monotonic()-started)*1000))
                    timings['renderMs'] = round((time.monotonic()-started)*1000)
                    return {key: round(value, 3) for key, value in timings.items()}
                except BaseException:
                    process.kill()
                    process.wait()
                    raise
