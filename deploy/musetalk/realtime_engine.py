"""Persistent MuseTalk v1.5 engine; publish one synchronized fragmented MP4.

Uses the official cached Avatar materials, without its image-per-frame output.
Only the worker's single executor may call this engine.
"""
import hashlib
import shutil
from pathlib import Path
import subprocess
import time
from types import SimpleNamespace


class RealtimeEngine:
    def __init__(self, source):
        import torch
        from transformers import WhisperModel
        import scripts.realtime_inference as rt
        from musetalk.utils.utils import load_all_model
        from musetalk.utils.audio_processor import AudioProcessor
        from musetalk.utils.face_parsing import FaceParsing

        torch.set_num_threads(4)
        rt.args = SimpleNamespace(version='v15', extra_margin=10, parsing_mode='jaw')
        rt.device = torch.device('cuda:0')
        rt.vae, rt.unet, rt.pe = load_all_model(
            unet_model_path='models/musetalkV15/unet.pth', vae_type='sd-vae',
            unet_config='models/musetalkV15/musetalk.json', device=rt.device)
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
        # Prime CUDA kernels before accepting a user request.
        with torch.inference_mode():
            features, length = rt.audio_processor.get_audio_feature('data/academia/reply.wav', weight_dtype=rt.weight_dtype)
            chunks = rt.audio_processor.get_whisper_chunk(features, rt.device, rt.weight_dtype, rt.whisper, length, fps=25)
            self._decode(chunks[:20], 0)
        torch.cuda.synchronize()

    def _decode(self, chunks, offset):
        import torch
        rt, avatar = self.rt, self.avatar
        latents = torch.cat([avatar.input_latent_list_cycle[(offset+i) % len(avatar.input_latent_list_cycle)] for i in range(len(chunks))])
        audio = rt.pe(chunks.to(device=rt.device, dtype=rt.weight_dtype))
        predicted = rt.unet.model(latents.to(device=rt.device, dtype=rt.weight_dtype), rt.timesteps, encoder_hidden_states=audio).sample
        return rt.vae.decode_latents(predicted.to(dtype=rt.vae.vae.dtype))

    def render(self, audio, output, on_playable):
        import cv2
        import numpy as np
        import torch
        from musetalk.utils.blending import get_image_blending
        started = time.monotonic()
        rt, avatar = self.rt, self.avatar
        with torch.inference_mode():
            features, length = rt.audio_processor.get_audio_feature(str(audio), weight_dtype=rt.weight_dtype)
            chunks = rt.audio_processor.get_whisper_chunk(features, rt.device, rt.weight_dtype, rt.whisper, length, fps=25)
            height, width = avatar.frame_list_cycle[0].shape[:2]
            command = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{width}x{height}', '-r', '25', '-i', 'pipe:0', '-i', str(audio), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-threads', '4', '-preset', 'veryfast', '-tune', 'zerolatency', '-crf', '24', '-maxrate', '850k', '-bufsize', '1700k', '-g', '25', '-keyint_min', '25', '-sc_threshold', '0', '-bf', '0', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '64k', '-ac', '1', '-shortest', '-movflags', '+frag_keyframe+empty_moov+default_base_moof', '-flush_packets', '1', str(output)]
            announced = False
            # stderr goes to a file: never risk a full pipe blocking the encoder.
            with output.with_suffix('.encode.log').open('wb') as log:
                process = subprocess.Popen(command, stdin=subprocess.PIPE, stderr=log)
                try:
                    for offset in range(0, len(chunks), 20):
                        frames = self._decode(chunks[offset:offset+20], offset)
                        for index, face in enumerate(frames, offset):
                            pos = index % len(avatar.frame_list_cycle)
                            bbox = avatar.coord_list_cycle[pos]
                            x1,y1,x2,y2 = bbox
                            face = cv2.resize(face.astype(np.uint8), (x2-x1,y2-y1))
                            combined = get_image_blending(avatar.frame_list_cycle[pos], face, bbox, avatar.mask_list_cycle[pos], avatar.mask_coords_list_cycle[pos])
                            process.stdin.write(combined.tobytes())
                        if not announced and output.exists():
                            with output.open('rb') as media:
                                # An initial moov alone is not playable; wait for a fragment.
                                announced = b'moof' in media.read(262144)
                            if announced:
                                on_playable(round((time.monotonic()-started)*1000))
                    process.stdin.close()
                    if process.wait(timeout=30) != 0:
                        raise RuntimeError('Fragment encoder failed')
                    if not announced:
                        on_playable(round((time.monotonic()-started)*1000))
                except BaseException:
                    process.kill()
                    process.wait()
                    raise
