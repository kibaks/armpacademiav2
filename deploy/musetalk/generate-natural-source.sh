#!/usr/bin/env bash
set -euo pipefail
# Run in the separate official Wan checkout; never in MuseTalk's environment.
cd /opt/academia-wan
test -f models/config.json
test -f tutor.jpg
OMP_NUM_THREADS=8 .venv/bin/python generate.py \
  --task ti2v-5B --size '704*1280' --ckpt_dir models \
  --t5_cpu --offload_model True --convert_model_dtype \
  --frame_num 121 --sample_steps 50 --base_seed 77183 \
  --image tutor.jpg --prompt "$(cat natural-source-prompt.txt)" \
  --save_file tutor-natural-candidate.mp4
# Candidate only. Do not replace the live MuseTalk source before visual review.
