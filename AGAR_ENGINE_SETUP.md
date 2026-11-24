# AGAR Engine: integration status

This development branch connects a FreeCut-derived editor to an independently operated AGAR inference service.

Implemented:
- AGAR prompt/reference-image panel in the FreeCut media sidebar
- same-origin API, owner login, worker availability checks, persistent job polling
- generated MP4 import through FreeCut's native media-library service
- timeline placement through FreeCut's undoable addItem API
- API client tests and local development reverse proxy

The backend is packaged separately in AGAR_Engine_Repo_Connection_Ready_2026-11-22.zip from the Taha ChatGPT project. It is NOT deployed here. You must install that backend on AGAR-owned infrastructure, configure the database, owner secret, HTTPS and worker, and separately deploy a suitable GPU/model.

Development configuration:
- Start AGAR API on http://127.0.0.1:8000 with APP_ORIGIN=http://localhost:5173 and COOKIE_SECURE=false for local testing only.
- In FreeCut, use AGAR_API_ORIGIN=http://127.0.0.1:8000 (the default) and run vp install then vp dev.
- In production, reverse-proxy the frontend and /api/v1 under a single HTTPS origin with secure cookies.

Verification gates (not yet completed for this branch):
- vp run check
- vp test run
- vp build
- npm run check:boundaries
- npm run check:deps-contracts
- browser project -> owner auth -> prompt/image -> actual GPU job -> MP4 import -> timeline edit -> FreeCut export

Do not claim a working AI generation system until a GPU job has really generated an MP4 and the full end-to-end workflow has been demonstrated. No paid video API fallback is implemented.

Preserve FreeCut's upstream MIT licence and original copyright notices. Model weight licences must be reviewed separately.