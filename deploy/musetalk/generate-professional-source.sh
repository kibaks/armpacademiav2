#!/usr/bin/env bash
set -euo pipefail
cd /opt/academia-wan
OMP_NUM_THREADS=8 .venv/bin/python generate.py \
  --task ti2v-5B --size '704*1280' --ckpt_dir models \
  --t5_cpu --offload_model True --convert_model_dtype \
  --frame_num 121 --sample_steps 50 --base_seed 77184 \
  --image tutor.jpg --prompt "$(cat professional-source-prompt.txt)" \
  --save_file tutor-professional-candidate.mp4
# Keep this as a candidate until its frontal pose and lip-sync are reviewed.
