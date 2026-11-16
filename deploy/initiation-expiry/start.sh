#!/bin/bash
set -euo pipefail
set -a
source /workspace/academia/private/initiation-scheduler.env
set +a
exec python3 /workspace/academia/initiation-expiry/poll.py
