#!/bin/bash
set -e
set -a
source /workspace/academia/private/engines.env
set +a
export OMP_NUM_THREADS=4 OPENBLAS_NUM_THREADS=1 NATIONAL_EXTRA_VOICES=ln,kg,lua
cd /workspace/academia/app/deploy/national
exec /workspace/academia/national-venv/bin/python -m uvicorn app:app --host 127.0.0.1 --port 8064 --workers 1 --no-access-log
