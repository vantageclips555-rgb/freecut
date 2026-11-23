# Base44 Code — continue AGAR Engine from the existing source

**Existing branch:** `agar/self-hosted-generation` in `vantageclips555-rgb/freecut`. Never replace the editor with a generic video editor or start from a blank web application.

## Goal

Build a working AGAR-branded video-creation website using the existing FreeCut editor. Keep AGAR AI generation natively in its media sidebar. The user describes a shot or uploads an image; the job is sent to an AGAR-owned AI service; real MP4 footage is imported into FreeCut; it is edited on the real timeline and exported as an MP4.

## Work Base44 can complete without renting a GPU

1. Inspect the entire existing repository and `AGAR_ENGINE_SETUP.md`, `AGAR_VERIFICATION_POLICY.md`, `ops/agar-gpu/README.md`. Use existing source and matching APIs; do not guess.
2. Install dependencies, run available checks, unit tests, build, and repair failures. State exactly which commands passed and which could not run.
3. Build the responsive, premium AGAR website and native workspace around FreeCut, preserve all existing editing functionality and existing export.
4. Confirm the AGAR panel is wired into the existing editor; allow creating project, typing prompt, uploading reference, checking login/capabilities, tracking job, importing the actual downloaded MP4 and inserting it into a timeline. Never create fake/generated video on the client.
5. Build/validate a working local preview of UI and editor. Test user flows in a real browser. Keep proof of functionality separate from source-only claims.
6. Use AGAR-owned Python API for generation; same-origin /api/v1 backend and a dedicated Linux GPU process will be deployed separately. **The Python AGAR backend bundle is not yet committed into this fork**; obtain and integrate the existing owner-provided backend package instead of replacing its API contract. Its source files are `agar_api/main.py`, `db.py`, `security.py`, `worker.py`, `gpu_ready.py`; compose, tests and scripts are supplied in the AGAR_Engine_GPU_Worker_Checked_2026-11-23.zip package.
7. Never claim model inference works until a real self-hosted GPU has generated a playable verified MP4. No Base44 paid video APIs, no fake backend, no sample video masquerading as generated footage.
8. Keep work on an isolated branch and open PR. Don't merge until all meaningful checks pass. If a blocker requires external GPU provision, report that fact exactly.

## Expected status report

- Implemented and tested in Base44 preview
- Implemented but not yet tested
- Blocked by real GPU hosting/model installation
- Exact build/test errors, fixes and final PR URL
