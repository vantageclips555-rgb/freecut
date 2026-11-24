#!/usr/bin/env bash
# AGAR GPU installer. This has NOT been tested on a physical GPU in ChatGPT.
# Run from a Linux NVIDIA host after reviewing Kandinsky's weight licences.
set -euo pipefail
umask 077
AGAR_BACKEND_ROOT="${AGAR_BACKEND_ROOT:-}"
: "${AGAR_BACKEND_ROOT:?Set to the extracted AGAR Core backend directory}"
[[ -f "$AGAR_BACKEND_ROOT/agar_api/gpu_ready.py" ]] || { echo 'AGAR Core backend missing' >&2; exit 2; }
: "${KANDINSKY_PRESET:?Select an official device profile matching the physical NVIDIA GPU}"
: "${DATA_ROOT:?Set the absolute directory shared by AGAR API, render and GPU workers}"
: "${KANDINSKY_ROOT:=$HOME/kandinsky-6}"
KANDINSKY_REVISION='73b892b730885e02ab58fbf7fc5cb10b78e1e3da'
export KANDINSKY_ROOT KANDINSKY_PRESET DATA_ROOT
[[ "$DATA_ROOT" == /* ]] || { echo 'DATA_ROOT must be an absolute path' >&2; exit 2; }

for bin in git just uv nvcc nvidia-smi ffprobe; do
  command -v "$bin" >/dev/null 2>&1 || { echo "Missing $bin" >&2; exit 2; }
done
nvidia-smi >/dev/null || { echo 'No accessible NVIDIA GPU' >&2; exit 2; }
if ! command -v python3.13 >/dev/null && ! command -v python3.14 >/dev/null; then
  echo 'Official Kandinsky 6 requires Python 3.13/3.14.' >&2; exit 2
fi
if [[ ! -d "$KANDINSKY_ROOT/.git" ]]; then
  [[ ! -e "$KANDINSKY_ROOT" ]] || { echo 'Refusing to overwrite existing directory' >&2; exit 2; }
  git clone https://github.com/kandinskylab/kandinsky-6.git "$KANDINSKY_ROOT"
fi
[[ -z "$(git -C "$KANDINSKY_ROOT" status --porcelain)" ]] || {
  echo 'Refusing to overwrite locally modified Kandinsky checkout' >&2; exit 2
}
git -C "$KANDINSKY_ROOT" fetch --depth 1 origin "$KANDINSKY_REVISION"
git -C "$KANDINSKY_ROOT" checkout --detach "$KANDINSKY_REVISION"
cd "$KANDINSKY_ROOT"
just setup
just download pro-distill

mkdir -p "$DATA_ROOT"
cd "$AGAR_BACKEND_ROOT"
# The AGAR backend has a version-locked Kandinsky command adapter that
# verifies GPU/model compatibility and refuses readiness without a real MP4.
python -m agar_api.gpu_ready preflight
python -m agar_api.gpu_ready smoke
python -m agar_api.gpu_ready verify

echo 'Real Kandinsky MP4 smoke test passed. Start exactly one GPU worker with the same environment and DATABASE_URL.'
echo '  bash scripts/start_gpu_worker.sh'
