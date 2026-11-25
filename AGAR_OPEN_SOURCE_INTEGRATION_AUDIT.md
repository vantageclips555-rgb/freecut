# AGAR Engine — open-source integration audit (25 November 2026)

## Source of truth
This is an evidence-based integration map, NOT a statement that the listed features all work. FreeCut is the single editor, AGAR uses its own same-origin API, and GPU inference is self-operated. Never replace the timeline with another editor or silently switch to paid video API services.

## Existing AGAR code verified in Git
- FreeCut editor with multitrack workflow, effects, keyframes and local export code, under upstream MIT terms. Source: https://github.com/walterlow/freecut
- AGAR media sidebar panel, same-origin /api/v1 client, owner authentication, reference upload, job polling and generated MP4/timeline integration.
- On this branch: model selection **from models with execution_tested=true**, optional human-readable style/camera/lighting **prompt instructions only**. Prompt guidance is not native lens or physical camera control.
- Python API and renderer separately packaged, with Kandinsky 6 CLI path. Optional self-hosted ComfyUI execution adapter and tests are available in the separate backend update package. They are not yet committed into this frontend repo.

## What to borrow as *ideas* or integrate as independent licensed services

| Source | Real engineering value for AGAR | Licensing and integration boundary | Current status |
| --- | --- | --- | --- |
| FreeCut (walterlow/freecut) | Multitrack editing, frame-accurate timeline, masks, shapes, captions, local MP4 export | MIT; retain existing notices | EXISTING SOURCE, production tests outstanding |
| ComfyUI (Comfy-Org/ComfyUI) | Self-hosted model graph orchestration, custom nodes, repeatable API-format workflows | GPL-3.0; run as separate owner-controlled process; comply with distribution terms | OPTIONAL HTTP ADAPTER, real workflow not installed |
| Wan2.2 (Wan-Video/Wan2.2) | Text/image-to-video, 5B option for 24 GB class GPU, subject to actual workload | Apache-2.0 weights; pin revision and review checkpoint terms | RESEARCHED ONLY |
| LTX-2.5 (Lightricks/LTX-2) | Synchronized audio-video and controllable video workflows | LTX-2.x community weight license; not Apache 2.0; check restrictions | RESEARCHED ONLY |
| VACE (ali-vilab/VACE) | Mask- and video-conditioned editing and replacement | Verify both repository code and selected weights licenses | RESEARCHED ONLY |
| Wan-Animate-2 (Wan-Video/Wan-Animate-2) | Driving-video-guided character performance | Verify exact weight licence/hardware before any deployment | RESEARCHED ONLY |
| aftertake (ItsSNOWMOBILE/aftertake) | Self-hosted production concepts: generate/recast/enhance/cut, model provenance and tested outputs | MIT project; inspect version/source before porting any implementation | REFERENCE, NOT COPIED |
| MakeMyClip/editor (MakeMyClip/editor) | Transcript-driven deterministic editing and local processing concepts | MIT; inspect and avoid duplicating FreeCut's existing transcript tools | REFERENCE, NOT COPIED |
| Higgsfield / Runway | Shot/camera/actor controls, edits, consistent references | Proprietary services/models; **do not extract/copy source or weights** | COMPETITOR FEATURE COMPARISON |

Official-source references:
- https://github.com/walterlow/freecut
- https://github.com/Comfy-Org/ComfyUI
- https://github.com/Wan-Video/Wan2.2
- https://github.com/Lightricks/LTX-2
- https://github.com/ali-vilab/VACE
- https://github.com/ItsSNOWMOBILE/aftertake
- https://github.com/MakeMyClip/editor
- https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-cinema-studio

## Feature acceptance gates (do not fake these with interface-only controls)

1. **Editor reliability:** npm/vp install, type-check, boundary checks, unit tests, production build, Chromium real media import/edit/export; retained FreeCut features. Not yet demonstrated on this integration branch.
2. **Backend:** actual FastAPI service, authentication/session/cookie, database, assets, real FFmpeg render. Tested locally for the separate bundle; not yet deployed.
3. **Kandinsky:** RunPod NVIDIA GPU, pinned upstream source and real smoke MP4, API job -> local generated clip -> FreeCut timeline -> exported MP4; text and reference image variations. **BLOCKED: NO GPU**.
4. **Multi-model:** separate installed and licensed Wan and LTX workflows, real per-model smoke certificates; model selection only when verified; image/voice/video modalities tested separately. **NOT YET PROVEN**.
5. **Reference/character continuity:** user saves reusable character/location records, produces multiple shots with independent reference and seed, evaluates face/clothes/location consistency. **NOT IMPLEMENTED**.
6. **True camera controls:** implement actual supported model conditioning/motion LoRAs/pose paths, with measured impact; prompt-only camera text must remain labelled accurately. **NOT IMPLEMENTED**.
7. **AI video editing:** mask/region-conditioned VACE/Wan workflow applied to a real existing video with source preservation and result review. **NOT IMPLEMENTED**.
8. **Narration/captions/music:** verify FreeCut's existing transcript workflow, integrate independent licensed TTS/audio models if missing, validate timing and export. **AUDIT INCOMPLETE**.
9. **2D/stick-figure:** deterministic SVG/Lottie/joint/keyframe motion from FreeCut; allow reproducible poses, not probabilistic text-to-video pose claims. **NOT INTEGRATED AS GENERATION MODE**.
10. **Benchmarks:** reproduce prompt suites (human movement, landscape, illustrated animation, lipsync, camera, character continuity, long sequence), record resolution, FPS, VRAM, duration, failure rate, media validity and human ratings. **NO RESULTS YET**.

## Security / release
- No remote paid video-generation calls or browser GPU secrets.
- License-gate model weights and record revisions. Do not bundle ComfyUI GPL code in MIT FreeCut source without license review.
- Keep the original FreeCut copyright and MIT licence.
- Smoke tests are not established by a job being queued or a CUDA device being listed. Inspect and decode the actual MP4.
- Never merge unfinished feature work automatically; PR tests and real user workflow evidence first.

## Order of implementation
(1) Pass frontend CI and render smoke; (2) consolidate separate Python backend into repository with Docker; (3) deploy one real GPU model; (4) add Wan / LTX workflows with per-model smoke certification; (5) continuity and true camera-control contracts; (6) VACE video-editing conditioning; (7) 2D/character/audio workflows; (8) benchmark, polish and ship.
