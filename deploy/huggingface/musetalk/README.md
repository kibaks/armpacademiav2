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


## LLM on the same T4
Official Qwen/Qwen3-4B-Instruct-2507 revision
`cdbee75f17c01a7cc42f958dc650907174af0554`, FP16, SDPA, no 4-bit compression.
`qwen_engine.py` runs in a separate modern Python/PyTorch runtime, loopback only.
MuseTalk keeps its tested legacy stack. Both processes share the GPU render lock.
No second endpoint. Remote model code disabled. Input8192tokens, output700tokens,
32seconds; truncated replies rejected. Set TUTOR_LLM_PROVIDER=huggingface after
GPU validation. The existing endpoint-only token stays server-side. Cold starts
return TUTOR_WARMING; chat retries every12seconds for at most10minutes. Session
changes and cancellation stop retries. The four national voice engines remain
separate and are not installed by this package.

Oversized structured course contexts are measured with the actual tokenizer. Whole
profile/history/source units are removed until they fit; the system policy and
the learner question are kept unchanged. Omitted context is explicitly marked.

T4 attention compatibility (Torch2.6 / Transformers4.56.2): explicit KV repetition
avoids the GQA math fallback, which allocates a quadratic attention matrix on T4.
Startup probes the fused memory-efficient kernel. If unavailable, the model uses
a3072-token input budget with the math kernel. Logits are computed only for the
last token. A GPU OOM retries once with the smaller context after tensor cleanup.

## Prebuilt image and chat-first startup (2026-11-25)

`Dockerfile` installs both pinned Python/CUDA runtimes, MuseTalk weights, Qwen3
weights and Piper voices on a CPU builder. `ACADEMIA_PREBUILT=1` makes startup
require a runtime manifest and skip installation entirely. `HF_HOME` points to
the image's model cache. The GPU starts Qwen before accepting requests; avatar
preparation happens lazily, under the shared GPU lock, on the first video job.
The existing app already displays text before starting its asynchronous video.
The initial video can therefore take longer than subsequent videos.

`container_server.py` exposes `/health` (503 until chat ready) and `POST /` with
the existing HF JSON protocol. Keep the endpoint authenticated, port8080,
healthRoute `/health`, one T4, min0/max1, idle timeout15minutes. No GPU or
billing control credentials belong in the image or in the browser.

The GitHub image workflow is currently blocked by the account's billing lock.
Do not claim that its failed job produced an image. A Docker Space can build the
same public code on CPU; use only a verified, immutable image digest on the
private endpoint. The build-only Space must expose a static status page, never
an unauthenticated inference API. Pause its temporary CPU after building.


Managed-image fallback: `../runtime_build` is an explicit build-only PEP517
dependency for the HF requirements phase. It downloads the pinned public source,
prepares `/opt/academia-runtime` and `/opt/academia-models` in the managed image,
then emits a marker wheel. It must not be installed on a workstation. Metadata
resolution does not install anything. Disable binary/wheel cache for this
dependency so a cached marker cannot skip image preparation. At runtime set
ACADEMIA_PREBUILT=1, ACADEMIA_RUNTIME=/opt/academia-runtime,
ACADEMIA_PACKAGE=/opt/academia-package, HF_HOME=/opt/academia-models. This avoids
requiring the endpoint platform to pull a Docker Space image.
