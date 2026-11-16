#!/bin/bash
set -e
set -a
source /workspace/academia/private/engines.env
set +a
exec python3 -u /workspace/academia/app/deploy/gateway-discovery/publish.py
