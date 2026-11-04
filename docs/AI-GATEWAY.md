# Secure AI Gateway — Implementation Plan

## Purpose
The public GitHub Pages site is only the user interface. A real model must be called through a private server-side gateway so provider credentials never reach the browser.

## Request contract
The browser will eventually send a same-origin HTTPS request:

`POST /api/chat`

Example request:
```json
{
  "conversation_id": "client-generated-or-server-issued-id",
  "messages": [
    { "role": "user", "content": "Explain this topic simply." }
  ],
  "language": "hi"
}
```

The server validates the request, applies authentication and rate limits, checks message size, selects an approved model, and calls the configured provider using a server-side secret.

## Response contract
The first version should return a predictable response:

```json
{
  "message": {
    "role": "assistant",
    "content": "Model response text"
  },
  "usage": {
    "input_tokens": 0,
    "output_tokens": 0
  },
  "model": "provider/model-id"
}
```

Token counts and model identifiers are supplied only when the provider returns them. Streaming can be added after the basic request/response path is tested.

## Required server controls
- Keep provider API keys in the backend host's encrypted environment variables.
- Never put keys in `app.js`, HTML, CSS, public repository files, or browser storage.
- Validate roles and payload size; reject unsupported fields.
- Add per-user/IP rate limits and a configurable spending ceiling.
- Set request timeouts and safe error messages; do not expose stack traces or secrets.
- Log operational metadata without storing full private prompts by default.
- Keep provider adapters modular so the model vendor can be changed without redesigning the chat UI.
- Require authentication before enabling persistent cross-device history.
- Add tests for validation, provider failures, rate limiting and secret redaction.

## Deployment shape
```
Mobile/Desktop browser
       |
       | HTTPS /api/chat (no provider key)
       v
Private backend / serverless function
       |
       +-- authentication + rate limits
       +-- request validation + usage budget
       +-- provider adapter (secret stays here)
       |
       v
Approved AI model provider
```

## Current status
This document defines the planned contract only. No backend endpoint or live model is connected yet. The static GitHub Pages site cannot safely hold provider secrets or execute private server-side model calls.

## Owner decisions needed before live activation
1. Select the initial model provider and model.
2. Agree a monthly spending cap and per-user limits.
3. Choose a backend host for this project (separate from the Savarkundla Ride and Worker Network projects).
4. Add the provider key directly to that host's secret/environment settings; never paste it into chat or commit it to GitHub.
