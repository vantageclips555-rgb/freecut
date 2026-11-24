# AGAR Engine — Windows laptop preflight and first launch (23 Nov 2026)

**Status:** This is a checked procedure, NOT a claim that the complete FreeCut build has passed. Run commands in PowerShell on Windows. **Use branch `agar/self-hosted-generation`**, not `main`.

## 0. Hard acceptance rules

- Do not pay for GPU hardware or RunPod to test the website/editor.
- Do not claim the AI model is working on a GTX 1650 (4 GB VRAM). Test the editor locally; real Kandinsky 6 inference is blocked without compatible NVIDIA GPU infrastructure and installed weights.
- Do not claim finished until real import -> timeline edit -> playable MP4 export succeeds. Keep AGAR PR #1 in draft.
- Do not send passwords/tokens in chat or commit them to GitHub. Keep `APP_ORIGIN` and browser host exactly consistent: `http://localhost:5173`.
- The Python backend is **separate from the FreeCut fork**. Starting the editor alone will not start the backend.

## 1. Non-destructive prerequisite checks

Open **PowerShell** (not Python), and run each:

```powershell
git --version
node --version
npm --version
```

Expected:
- Git installed.
- Node.js **22 or newer** (FreeCut README recommends Node 22+).
- npm **11.x** (current package.json identifies `npm@11.8.0`).
- A modern Microsoft Edge or Chrome browser (Chromium/WebGPU/WebCodecs/File System Access API).
- Some spare storage for repository, npm dependencies, imported media and exports. **Allow 10 GB free as a conservative planning target; it is not a measured minimum.**
- Close memory-heavy applications: an 8 GB system may be constrained by large media or builds.

If npm is older than 11 and Node is compatible, you may run `npm install --global npm@11.8.0`. Check its output and version; do not repeat failing commands blindly.

## 2. Download exactly our AGAR development branch

```powershell
git clone --branch agar/self-hosted-generation --single-branch https://github.com/vantageclips555-rgb/freecut.git agar-engine
cd agar-engine
git branch --show-current
```

The last command must print `agar/self-hosted-generation`.

Confirm these existing source files are present:
- `src/features/editor/components/agar-generation-panel.tsx`
- `src/features/editor/services/agar-api.ts`
- `src/features/editor/services/agar-video-integration.ts`
- `AGAR_ENGINE_SETUP.md`

If the directory `agar-engine` already exists, **do not run clone again or delete it**. Enter that folder and inspect `git status` and `git branch --show-current` before any pull or checkout.

## 3. Install and verify before preview

```powershell
npm install
npm run check
npm run test:run
npm run build
```

Stop at the **first** failing command. Keep the exact command and error output for debugging. Do not skip a failing check and report success.

The project uses Vite+ and can involve substantial package downloads. These frontend checks have **NOT** yet been executed on the full AGAR fork in the present ChatGPT runtime because the repository cannot be cloned here.

## 4. Run editor and inspect real media functionality

```powershell
npm run dev
```

Open `http://localhost:5173` in **Microsoft Edge** or Chrome.

Verify:
1. Project/workspace opens without unhandled errors.
2. Media tab displays `AGAR Engine`; GPU worker offline is expected.
3. Import a short local MP4; add it to an unlocked video track.
4. Trim it and make a basic effect/transition edit.
5. Export an MP4, open it in a media player, and check video, duration and audio where applicable.

If any item fails, record the real error. Not all FreeCut functionality has been acceptance tested in this fork.

## 5. Add AGAR Python backend *after* editor passes

The existing AGAR backend is in the supplied `AGAR_Engine_GPU_Worker_Checked_2026-11-23.zip`, NOT in this GitHub repo. It includes `agar_api/main.py`, tests, a local workbench, GPU setup instructions and worker scripts.

For backend prerequisites on Windows: Python 3.13 and FFmpeg/ffprobe on PATH. Follow the backend README; set a strong owner password (12+ characters), session secret (32+ characters), `APP_ORIGIN=http://localhost:5173`, and `COOKIE_SECURE=false` **only for local testing**. The FreeCut development proxy sends `/api/v1` to `http://127.0.0.1:8000` by default.

Backend checks measured on the isolated Linux test runner, 23 Nov 2026:
- `python -m pytest -q tests`: **12 passed**.
- SHA256 integrity check on backend package: **passed**.
- Independent FastAPI TestClient smoke: health 200, unauthenticated capabilities 401, login 200, authenticated capabilities 200, GPU offline, generation rejected 503.
These are **backend-only checks**, NOT the AGAR full frontend build, a Windows installation test or actual AI inference.

## 6. Last milestone: true AI generation (requires separate hardware)

Install official compatible Kandinsky model and weights on a supported NVIDIA GPU host. Run a genuine text-to-video and image-to-video smoke test, validate the MP4 via ffprobe, then test import into FreeCut and final export. Until then, the generation button must fail closed.

Further acceptance rules: `AGAR_VERIFICATION_POLICY.md`.
