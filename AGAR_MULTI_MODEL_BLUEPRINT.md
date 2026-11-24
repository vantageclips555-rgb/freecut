# AGAR Engine — one product, multiple independently operated AI engines
Last checked: 23 November 2026
Owner requirement: AGAR is an **all-in-one professional website** for AI generation, realistic footage, cartoon/character and stick-figure animation, narration, editing, and export. **Never reduce this product to Kandinsky-only.** Preserve the FreeCut editor. No runtime paid video-generation APIs, hosted third-party generator platforms or mandatory Base44 backend.

## Real current status
- FreeCut-derived React editor in this repo; AGAR generation panel and API transport presently hardcode `model: "kandinsky6"`.
- AGAR Python API/queue/worker are packaged **separately**, not yet imported into this repository or connected to any running GPU.
- Backend unit checks reported passing, but **there is no physical inference evidence**; no generated AGAR MP4 has been observed, and the full frontend build has not been verified. Treat every other model as **PLANNED — NOT INTEGRATED**.
- Do not describe this file as a deployed feature or use it as an excuse to bypass setup checks.

## Model shortlist: roles, official sources, and caveats

| Engine | Proposed AGAR function | Upstream evidence | Gate before activation |
| --- | --- | --- | --- |
| Kandinsky 6 Lite / Pro | Text/image-to-video **with audio**, 5-second scene generation | https://github.com/kandinskylab/kandinsky-6 (official README and `docs/quickstart/quick_start.md`); inspected CLI revision `73b892b730885e02ab58fbf7fc5cb10b78e1e3da` | Real model smoke with matching CUDA preset, image and audio tests, licence review |
| Wan 2.2 TI2V-5B | Realistic text/image-to-video on 24 GB class GPUs | https://github.com/Wan-Video/Wan2.2 (official `generate.py --task ti2v-5B` 24 GB + offloading documented) | Set up own Python environment, video test, verify actual output quality and hardware |
| LTX-2.5 | Cinematic audio/video; multimodal and editing experiments | https://github.com/Lightricks/LTX-2 and https://huggingface.co/Lightricks/LTX-2.5 | Check LTX-2.x **Community License** on weights, gated HF access, RAM/VRAM and real performance |
| Wan-Animate-2 | Driving-video-controlled character animation/identity continuity | https://github.com/Wan-Video/Wan-Animate-2 | Requires driving video; confirm weights, licence and CUDA requirements, real test |
| HunyuanVideo 1.5 | Additional text/image-to-video candidate for A/B tests | https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5 | Review model-weight licence, model-specific GPU and quality test |

The fact that a model offers 'cinematic' features does **not** establish it is the best for AGAR. Do not assert a ranking until equivalent prompt, image, audio and consistency benchmark videos have been inspected.

## Stick-figure and 2D animation are separate
Build reliable joint/keyframe-based 2D characters and SVG/Lottie assets rather than assuming generative models will produce perfectly accurate stick poses. FreeCut already advertises shapes, SVG/Lottie and keyframe animation. Integrate this natively with timeline editing; do not substitute fixed demo footage. Use generated video only when free-form visual effects are needed.

## Final desired in-app workflow
1. User creates an AGAR project, enters prompt and optionally reference images/first+last frame or driving clip.
2. User chooses **Auto (recommended)**, Realistic, Animated Character, Cinematic with Audio, or 2D Stick Figure.
3. AGAR queries **live installed-worker capabilities**. Only *licence-approved, installed and inference-tested* models can receive jobs. Auto chooses amongst ready models by supported modality, detected limits, benchmarked quality, and remaining capacity. Never fabricate 'ready'.
4. Dedicated adapter per engine exposes `model_id`, `version`, input modes, supported duration/resolution, VRAM/RAM/disk requirement, licence and health, queue route and settings. Each adapter pins upstream source and model weights; each has its **own dependency environment**.
5. One AGAR-owned API endpoint dispatches to a per-GPU queue and process; on a single GPU do **not** load several huge models simultaneously. Selectively load/unload and control concurrency. Validate file MIME, duration, dimensions and ffprobe decode before accepting success. Reject absent engines with clear errors.
6. Same AGAR media library stores all generated assets with prompt, seed, model/version, settings and user/project ID. Import actual files to FreeCut's timeline through the existing bridge.
7. Continue scenes with reference images, reusable characters and consistent metadata; assemble shots, text, sound and narration, then export actual MP4 with FreeCut. Continuity is a test target, not a guaranteed capability.

## Engineering tasks in order
**A — Current branch correctness**: run `npm install`, `npm run check`, `npm run test:run`, `npm run build`; fix failures; verify FreeCut import/edit/export browser flow. Existing AGAR panel must not be broken.

**B — Consolidate backend**: import and review actual existing Python backend source into separate `backend/` or `services/` folder with Docker development setup. Do not invent backend files from their names; use real checked contents. Match /api/v1 contract and auth.

**C — Expand multi-model registry without breaking default**: preserve existing Kandinsky request path and tests; add optional model selector and capability discovery. Never offer unsupported models as live generation choices. Version adapter schemas, no secrets in browser, no paid hosted API fallback.

**D — Prove first generation**: pick one compatible NVIDIA GPU; test current Kandinsky with installed weights; record prompt, device, memory, output duration and playable MP4; wire FreeCut to completed assets.

**E — Add second model**: Wan 2.2 TI2V-5B is the 24 GB class candidate. Validate model quality/VRAM/duration; then LTX-2.5 after accepting/reviewing actual weight licence; then Wan-Animate-2, then other models as justified.

**F — Benchmark and route**: run identical meaningful prompts for realistic people, landscapes, stylised animation, motion continuity, multilingual speech, image-to-video and audio. Record output fidelity, time, VRAM, cost, model licence, failures. 'Best' is based on measured results, not marketing statements.

## On an 8 GB RAM / GTX 1650 4 GB laptop
Only local UI/editor and lightweight backend development are currently realistic. These heavyweight open-weight generators require substantially more capacity, even if aggressively offloaded. Do not claim they run on this laptop; a rented/owned NVIDIA GPU server is part of running actual generation, not an external generation API.

## Failure policy
Always distinguish **implemented code**, **passing automated tests**, **tested end-to-end on a real GPU**, and **not implemented**. Don't declare “fully working” or “the best” without relevant real tests. Keep existing PR draft until all meaningful checks have completed.

## Related project requirements
Read `AGAR_VERIFICATION_POLICY.md`, `AGAR_ENGINE_SETUP.md`, and `AGAR_WINDOWS_PREFLIGHT.md` before changing code.
