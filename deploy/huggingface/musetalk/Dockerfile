FROM python:3.10-slim-bookworm
ENV PYTHONUNBUFFERED=1 PIP_DISABLE_PIP_VERSION_CHECK=1 \
    ACADEMIA_RUNTIME=/opt/academia-runtime ACADEMIA_PACKAGE=/opt/academia-package \
    ACADEMIA_PREBUILT=1 HF_HOME=/opt/academia-models \
    UV_CACHE_DIR=/opt/academia-runtime/uv-cache \
    UV_PYTHON_INSTALL_DIR=/opt/academia-runtime/python \
    OMP_NUM_THREADS=4 OPENBLAS_NUM_THREADS=1 PORT=8080
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates build-essential git libglib2.0-0 libgomp1 && \
    rm -rf /var/lib/apt/lists/* && pip install --no-cache-dir uv==0.9.10 && \
    useradd -m -u 1000 academia && \
    mkdir -p /opt/academia-runtime /opt/academia-models /opt/academia-package && \
    chown -R academia:academia /opt/academia-runtime /opt/academia-models /opt/academia-package
USER academia
WORKDIR /opt/academia-package
COPY --chown=academia:academia *.py source.mp4 ./
# All installation and model downloads happen on the CPU builder, never at wakeup.
RUN python setup_runtime.py /opt/academia-package /opt/academia-runtime && \
    /opt/academia-runtime/venv/bin/python -c "import torch, cv2, piper, mmpose; assert not torch.cuda.is_available()" && \
    /opt/academia-runtime/venv-llm/bin/python -c "import torch, transformers; assert torch.__version__.startswith('2.6.')" && \
    python -c "import json,pathlib; pathlib.Path('/opt/academia-runtime/runtime-ready.json').write_text(json.dumps({'version':1,'llm':'Qwen3-4B-Instruct-2507','video':'MuseTalk-1.5','prebuilt':True}))" && \
    uv cache clean
ENV HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1
EXPOSE 8080
CMD ["python", "container_server.py"]
