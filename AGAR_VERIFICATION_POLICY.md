# AGAR Engine — evidence-first engineering and acceptance rules

These are the owner's requirements for **every** AGAR Engine implementation task, including changes made from Base44 Code.

1. **Check before changing.** Inspect actual checked-in source and upstream documentation at a specific revision before using CLI flags, SDK APIs, file paths, CUDA support claims, model memory claims or licences. Do not rely on an unverified memory of a tool or an old README.
2. **Correct mistakes proactively.** Compare the feature to real source, run syntax/build/tests, examine failures and fix them before telling the owner it works. Explicitly correct any previous inaccurate claim. Avoid making the owner repeat requirements already documented.
3. **Preserve one independent AGAR product.** Base44 is a development environment. Production runtime must be AGAR-owned code/services, using open-source components under their own licences. No paid hosted video generation APIs or external editor UIs as runtime dependencies.
4. **Never confuse a UI with a working feature.** A prompt box or queued job is not a generated video. A GPU detected by CUDA is not a model with installed weights. A healthy process is not evidence that inference works.
5. **Fail closed on missing infrastructure.** Generation must not claim success until genuine output is produced by an owner-operated, licence-compliant inference worker and validated as a playable video.
6. **Keep status categories truthful:** VERIFIED WORKING (test and environment recorded), IMPLEMENTED BUT UNTESTED, BLOCKED BY INFRASTRUCTURE, NOT IMPLEMENTED. Include commands and evidence for every VERIFIED claim.
7. **Acceptance test before release:** From inside AGAR, describe a video or provide a reference image -> self-hosted model generates a genuine clip -> generated clip is imported into FreeCut's actual media library and added to timeline -> user edits it -> user exports a playable MP4. Test both text-to-video and image-to-video.
8. **Keep source clean.** Never overwrite FreeCut functionality with a fake editor. Keep FreeCut licence/copyright and review model-weight licences. Use PRs, code reviews and real test results before merging.
9. **No secrets in GitHub/browser.** Use environment variables and server-side cookies; never commit GPU SSH keys, authentication tokens, model provider tokens or user media.
10. **When blocked**, state exactly which account provisioning, server, model or CI requirement is missing. Finish all work possible without asking the owner to repeat established decisions.

## Model-specific verified contract (23 November 2026)

Kandinsky 6 official source: https://github.com/kandinskylab/kandinsky-6
Pinned checked revision: `73b892b730885e02ab58fbf7fc5cb10b78e1e3da`
Commands checked in official quickstart: `just setup`, `just download pro-distill`, `just generate PROMPT --configs DEVICE_PRESET --out output.mp4`, optional `--image file.png`.
Device preset must correspond to the actual GPU. Model's CUDA PyTorch environment is `KANDINSKY_ROOT/.venv`, NOT AGAR API's Python environment.

## Current measured status

The Python backend/GPU contract tests passed locally (12 passing as of 23 November 2026). This is **not** a real GPU inference result. GPU provisioning, model installation, live model generation, full FreeCut bundle/CI, Base44 preview runtime and end-to-end editing export still require verification. Keep the integration PR in draft until checked.

This file is a standing quality gate so the owner does not need to re-explain these requirements to future contributors or coding agents.
