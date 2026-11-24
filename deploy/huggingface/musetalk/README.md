---
license: mit
pipeline_tag: image-to-video
tags:
- endpoints-template
- musetalk
---
# ARMP Academia — MuseTalk endpoint test

Real MuseTalk 1.5 lip synchronization using the existing synthetic tutor video.
Upstream: https://github.com/TMElyralab/MuseTalk, revision
0a89dec45a0192b824e3cf4daf96c239440c5ed8. Preserve upstream notices and
the separate licenses of the downloaded model weights.

Deploy with the default HF Inference Toolkit, task **Custom**, **private**
authentication, one NVIDIA T4 (16 GB, 0.50 USD/hour at creation), maximum one replica, scale to zero after 15 minutes.
Do not deploy the original upstream weights repository alone: it lacks handler.py.

The handler creates an isolated Python 3.10 environment during initialization,
downloads the pinned source and required public model weights, then warms the
avatar. Dependency and GPU compatibility still require a real endpoint test.
Setup has a 25-minute timeout and warmup a five-minute timeout. Pause the endpoint
explicitly after testing; these timeouts are not a provider-enforced dollar cap.

Input: `{"inputs":{"audioData":"BASE64_AUDIO"}}`. Audio must be under 1 MB and
15 seconds. Output: H.264/AAC MP4 in `videoData`, plus `mimeType` and duration.
No external speech or LLM API is used. This test animates lips; body movement
comes from the reference video. National-language pronunciation is not validated.

No production connection, learner data, credentials or voice reference is included.

## Application connection

Set server-only Vercel variables `MUSETALK_PROVIDER=huggingface`,
`HF_MUSETALK_URL` to the private endpoint URL and `HF_MUSETALK_TOKEN` to the
fine-grained token restricted to calling this endpoint. Preserve the existing
Vast/Qwen/national-language credentials. `TUTOR_VIDEO_ENABLED=true` enables it.

JSON operations `/speech` (French Piper Siwis/Tom), `/jobs`, `/jobs/<id>`,
`/jobs/<id>/media` and `/films` bridge the existing app protocol. Job submissions
are idempotent by their owner-specific hash. Audio supports up to 4 MB / 120 s;
outputs are limited to 24 MB. Existing course illustrations are composed locally.
National speech remains on its separately configured engine; it is not replaced
with French speech.

HF 503 responses are treated as model wakeup. Pending audio/text are saved in
private Firestore job payloads, then submitted after readiness. Completed MP4s
are cached in 450 KB chunks, served only after app authentication and ownership
checks, and no longer require a running GPU. Cache lifetime is 24 h; one expired
cache is purged on each new video request. Firestore reads, writes and storage
quotas still apply. The browser never receives the HF token.
