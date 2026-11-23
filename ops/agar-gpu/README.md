# AGAR Engine GPU worker — verified setup boundary

**Code prepared, GPU not yet provisioned or tested.** This document is not a claim of a working public AI generator.

The backend bundle from the Taha project supplies `agar_api/gpu_ready.py`, `agar_api/worker.py`, `scripts/start_gpu_worker.sh`, and tests. This FreeCut repository contains the in-editor AGAR UI, its API connection and the pinned GPU bootstrap script under `ops/agar-gpu/bootstrap_gpu_worker.sh`.

## Confirmed official Kandinsky CLI

Source repository: https://github.com/kandinskylab/kandinsky-6
Inspected revision: `73b892b730885e02ab58fbf7fc5cb10b78e1e3da`
The upstream quickstart at that **exact revision** supports:
- `just setup` (installs the model dependencies in Kandinsky's own `.venv`)
- `just download pro-distill`
- `just generate 'Your prompt' --configs rtx-4090 --out clip.mp4` (RTX 4090 example)
- `--image image.jpg` for image-conditioned video generation

Choose the upstream device preset that matches the actual GPU. Do not blindly use `rtx-4090` on another card. For Ampere/Ada/consumer Blackwell GPUs, upstream says `nvcc` is needed to compile SageAttention. Python 3.13/3.14 is required for its setup.

## Deploy on ONE AGAR-owned NVIDIA GPU host

1. Provision an NVIDIA GPU with enough memory for the chosen upstream checkpoint; install the drivers, CUDA compiler, Python 3.13/3.14, `uv`, `just`, `git`, `ffprobe`.
2. Extract the AGAR Core backend package on that same host. The backend is NOT inside this FreeCut fork.
3. Point `AGAR_BACKEND_ROOT` to that folder, `DATA_ROOT` to the **same absolute path** mounted in the API/render containers, and set `KANDINSKY_PRESET` to the device-matched upstream preset.
4. Run `bash ops/agar-gpu/bootstrap_gpu_worker.sh`. It pins the official Kandinsky source, installs the checkpoint, and invokes `python -m agar_api.gpu_ready smoke`. If it cannot produce and validate a real MP4, readiness remains false.
5. After the real smoke test passes, configure local PostgreSQL `DATABASE_URL` and start **one** GPU queue worker with `bash scripts/start_gpu_worker.sh` from the backend folder.
6. Only advertise generation as ready if both the smoke certificate and the live GPU heartbeat are valid. Test text-to-video, image-to-video, FreeCut timeline insertion, edit, and exported MP4.

The existing API and rendering tests pass separately. The updated GPU readiness contract has **12 local Python tests passing**, including wrong-device preset rejection, official CLI arguments, absence of model virtualenv, expired/missing certificates and nonvideo rejection. There is no real NVIDIA GPU connected to this chat, so live inference and deployment are still **UNVERIFIED**.

Do not merge the draft AGAR PR or promote this as a finished AI generator until the full build and end-to-end tests pass. Model weights and dependencies may carry independent licence requirements.
