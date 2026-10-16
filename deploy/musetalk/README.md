# MuseTalk tutor worker

MuseTalk 1.5 runs on the existing GPU server at 107.170.55.226, in
`/opt/MuseTalk`, using its installed virtual environment and model weights.
Upstream: https://github.com/TMElyralab/MuseTalk (installed revision
`0a89dec45a0192b824e3cf4daf96c239440c5ed8`). Keep upstream and dependency notices.

`app.py` is deployed as `/opt/MuseTalk/academia_api.py`. The service reads its
private `MUSETALK_API_KEY` from `/opt/MuseTalk/academia.env` (mode 600).
Never commit that file, SSH private keys, narration audio or private job output.

The worker listens only on 127.0.0.1:8061. Its dedicated SSH tunnel forwards
that port to the existing HTTPS gateway at
`https://academia.137.184.59.184.nip.io/musetalk`. Nginx preserves the Bearer
header. The restricted gateway SSH key is limited to the reverse port;
the gateway host key is pinned in `/opt/MuseTalk/gateway_known_hosts`.

Vercel Production needs `MUSETALK_API_URL`, `MUSETALK_API_KEY`,
`MUSETALK_VIDEO_DAILY_LIMIT` (6), and `TUTOR_VIDEO_ENABLED=true`.
Piper/Cartesia/ElevenLabs produce the narration; MuseTalk changes the lips of
the clean source video at `/opt/MuseTalk/data/academia/source.mp4`.
Head movements and blinks come from that source, not from semantic gesture generation.
Only female tutor personas are enabled; Henri keeps the existing presentation.

Private worker API: POST `/jobs` with `{id: sha256, audio: base64}`, GET
`/jobs/:id`, GET `/jobs/:id/media`; all require the Bearer key. One GPU task runs
at a time, with at most two queued. Audio is limited to 4 MB and 120 seconds.
Intermediate frames are removed after rendering. Jobs older than 24 hours are
removed on subsequent submission; the application expires their access after 24 hours.
Do not resubmit ambiguous jobs automatically. Restarted queued jobs are marked failed.

Application routes remain `/api/ai/tutor-video`; Firebase/JWT authentication,
Firestore job ownership and daily reservations protect access. MP4s stream through
the application; the worker key never reaches the browser. New replies do not call Veo.

Check `systemctl status academia-musetalk academia-musetalk-tunnel` on the GPU
host. Logs are in the journal and each private job directory. To suspend generation,
set `TUTOR_VIDEO_ENABLED=false` in Vercel and redeploy; audio remains available.

Validation: a French 7.94-second H.264/AAC clip was rendered successfully on the
GPU and a second job completed through the HTTPS API. Automated application tests
cover duplicate requests, quotas, ownership and private media. Visual quality and
full in-app playback should also be checked with an authenticated learner session.

## Natural source v2

The source was generated on the same H100 with the official Wan2.2 TI2V-5B
checkpoint in an independent `/opt/academia-wan/.venv`. MuseTalk dependencies
are unchanged. Upstream Wan revision: `1ea34ff48f87168174e12956e200b1d908b1c5ff`.
Reproduction files: `generate-natural-source.sh`, `natural-source-prompt.txt`,
`requirements-natural-source.txt`. Seed 77183, 121 frames, 50 steps, 24 fps.
The original portrait is the image input. The generated source is 800 x 1088,
5.042 seconds. SHA256: `83346de5eb239e8bfc4efca7a73da635ffc889171be41cf1dfa30492088979b4`.

The original limited-motion source is preserved as
`/opt/MuseTalk/data/academia/source-before-natural-v2.mp4`.
The new source includes torso, shoulder and head movement; it does not provide
word-specific semantic gestures. MuseTalk repeats its frame cycle for longer
narration. An eight-second French H.264/AAC render was checked at multiple
timestamps, including the side-facing pose. Mouth motion changes with the audio;
the body motion is inherited from the source. The cache revision is v2 so old
limited-motion results are not reused for new requests.

## Professional source v3

The professional presentation replaces the v2 lateral turns with an upright
frontal stance, steady eye contact, small nods, relaxed shoulders and hands
outside the frame. Same isolated Wan installation and portrait; seed 77184,
121 frames at 24 fps, 50 steps. Reproduction: `professional-source-prompt.txt`
and `generate-professional-source.sh`.
Source SHA256: `000e4b9dca4499c2f5e67dedd8db993a545386eaf5701b0822b683acc1a52fde`.
Keep the v2 source as `/opt/MuseTalk/data/academia/source-natural-v2.mp4` for rollback.
The application uses a v3 cache key to avoid reusing the more demonstrative v2 video.

Henri continues using the existing portrait renderer, with a professional motion
limit applied at rendering time: restrained head/shoulder movement, frontal gaze,
discreet smile and no raised hand animation. Speech articulation and blink timing
are preserved. This is not a newly generated male MP4.

## Lightweight playback and duration repair

Two production narrations were rejected before inference at 91.90 and 92.45
seconds because the worker limit was 90 seconds. The worker now accepts up to
120 seconds without truncating the narration. Its private retry endpoint only
requeues an explicitly requested failed job. Application polling can recover a
previously failed record after the worker job has been repaired.

New outputs use 720-pixel height, preserve the normalized 25 fps cadence,
H.264 CRF 24 / maxrate 850k and mono
AAC 64k. The presentation uses a versioned light asset (about 278 KB versus
1.6 MB previously), retaining the original v3 asset for rollback.

After an authenticated ownership check, the application issues a 15-minute
read-only HMAC playback URL. `/jobs/:id/play` validates that ticket; no worker
key is sent to the browser. Native MP4 byte-range playback avoids full-file
buffering in browser memory and the application proxy. Test both valid Range
requests (206) and invalid/expired tickets (403) with `test_api.py`.
The TLS gateway uses the `musetalk_private` access-log format with `$uri`,
excluding query parameters because they contain a temporary playback capability.

## Loading latency

The worker keeps `data/academia/source-25fps.mp4` between jobs instead of
repeating the same source conversion for every answer. A size/mtime/version
signature invalidates it when `source.mp4` changes. Conversion is serialized and
published atomically; job cleanup never removes this shared file.

Completed jobs return a fresh signed playback URL directly from the creation
request and cached status checks, without polling the GPU worker again. New jobs
are checked immediately, then every 1.5 seconds while pending. Generated answers
use native video preloading; signed playback and byte ranges remain enabled.

Run `python3 deploy/musetalk/test_source_cache.py` without GPU/API dependencies.
## Warm engine and progressive replies

Self-hosted video has no daily account quota and no fixed 120-second duration
ceiling. `MUSETALK_VIDEO_DAILY_LIMIT` is obsolete and ignored, including existing
values in Vercel. Historical quota records do not block new jobs. Speech inputs
retain Piper's 3,000-character per-passage validation, transport size bounds and
the single-GPU queue capacity; these are technical bounds, not usage quotas.
Long playback uses an inactivity timeout rather than a maximum stream duration.

Install `realtime_engine.py` beside `academia_api.py` in `/opt/MuseTalk` and set
`MUSETALK_REALTIME=true` in the private worker environment, then restart only
when `/health` reports no pending jobs. The single executor loads the models,
prepares/caches the avatar once and warms GPU kernels before processing jobs.
`/health` reports `ready`, `realtime` and `warmupFailed`; wait for readiness.
Initial preparation is outside the per-answer latency budget and may take tens
of seconds. Set `MUSETALK_REALTIME=false` to return to the offline renderer.

The source is normalized once to 25 fps and 720p (the output resolution).
Frames are piped directly to FFmpeg, avoiding PNG writes and per-reply face
parsing. A single H.264/AAC fragmented MP4 publishes a keyframe every second.
Status becomes `STREAMING` after the first fragment; authenticated ownership
checks still issue short-lived signed URLs. The private playback endpoint follows
the growing file, with proxy buffering disabled. Completed files retain native
byte-range playback. The application polls rapidly during the first ten seconds
and starts the same audio/video stream before generation finishes.

On the H100, an eight-second narration reached HTTP playback in 0.93 seconds
after audio submission, with full rendering in 4.73 seconds. These measurements
exclude language-model response time, speech synthesis, queues and client
network/buffering. Five seconds from the user's question is an objective, not a
guaranteed SLA. Validate these stages in a real session before claiming it.
