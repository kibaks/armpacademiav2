#!/bin/bash
set -e
set -a
source /workspace/academia/private/engines.env
set +a
export OMP_NUM_THREADS=4 OPENBLAS_NUM_THREADS=1 HF_HUB_OFFLINE=1 OMNIVOICE_DEVICE=cuda:0
speech_site=/workspace/academia/omnivoice-venv/lib/python3.11/site-packages
speech_libs=$(find "$speech_site/nvidia" -type d -name lib -printf '%p:' 2>/dev/null)
export LD_LIBRARY_PATH="${speech_libs}/usr/local/cuda/lib64${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
cd /workspace/academia/app/deploy/omnivoice
exec /workspace/academia/omnivoice-venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8065 --workers 1 --no-access-log
