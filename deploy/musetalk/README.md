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
at a time, with at most two queued. Audio is limited to 4 MB and 90 seconds.
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
