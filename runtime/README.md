# Intelligent AI — Private Qwen Runtime Bridge

This folder contains the first server-side bridge between the Intelligent AI
application and the tested Qwen3.5-9B model. It speaks a small
OpenAI-compatible `/v1/chat/completions` interface so the application can
change model runtimes later without rewriting its assistant brain.

## Important status

- The model was successfully loaded and tested in a temporary Kaggle notebook.
- Kaggle is a test environment, not a permanent API server. Its session, GPU
  quota and non-persistent storage mean this runtime is **not yet deployed**.
- This bridge is server code only. The static GitHub Pages app does not contain
  model weights, API secrets or a live model connection yet.
- The first version accepts text messages only. Image input is not enabled.

## Requirements

Use a machine with a CUDA-compatible NVIDIA GPU and enough VRAM/RAM for the
chosen model. Install a PyTorch build matching that machine's CUDA driver, then:

```bash
python -m pip install -r runtime/requirements.txt
```

Set environment variables on the server (never commit them):

- `IA_MODEL_PATH`: local folder containing the downloaded Qwen3.5-9B weights.
- `IA_API_KEY`: a long random secret used for Bearer authentication.
- `IA_ALLOWED_ORIGINS`: exact trusted web origins, comma-separated.
- `IA_MAX_OUTPUT_TOKENS`: server-side output ceiling (default 512).

Example local launch:

```bash
export IA_MODEL_PATH=/models/Qwen3.5-9B
export IA_API_KEY='replace-with-a-long-random-secret'
export IA_ALLOWED_ORIGINS='http://localhost:8000'
uvicorn runtime.server:app --host 127.0.0.1 --port 8001
```

Check `GET /health`; authenticated chat requests go to
`POST /v1/chat/completions` with `Authorization: Bearer <secret>`.

## Security rules

- Bind to localhost for local testing. Do not expose this port directly to the
  public internet.
- For remote access, use HTTPS, a private network/VPN or a properly configured
  authenticated reverse proxy and strict origin policy.
- Never put `IA_API_KEY` in `index.html`, `app.js`, browser storage, or a
  public GitHub repository.
- Do not configure paid-provider fallback or metered services.
- Repository writes, self-updates and deployments remain owner-approved.

## Next integration stage

Add a browser-safe authenticated session mechanism before enabling the chat UI
to call this endpoint from a public website. A static site cannot safely hide a
shared bearer key. Until that is built, the bridge should be tested locally
or on a private network only.
