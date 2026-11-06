# Intelligent AI — Backend Foundation
This repository contains a minimal Vercel serverless API foundation.

## Routes
- `GET /api/health`: reports service health and whether authentication/model configuration exists. It never returns secret values.
- `POST /api/chat`: accepts OpenAI-compatible chat messages, authenticates with a server-side bearer secret, validates payload size and roles, calls only the fixed HTTPS provider URL configured in server environment variables, and returns a plain answer. It does not accept a provider URL from the caller.

## Required Vercel environment variables
Set only in the Vercel project's encrypted Environment Variables UI; never commit them:
- `IA_BACKEND_TOKEN`: long random secret for trusted server-side callers.
- `IA_ALLOWED_ORIGIN`: exact HTTPS origin allowed for browser calls. Leave unset to reject browser-origin calls by default.
- `AI_PROVIDER_URL`: full HTTPS chat-completions endpoint for an OpenAI-compatible provider.
- `AI_PROVIDER_API_KEY`: provider key, held only on the server.
- `AI_MODEL`: exact model identifier.

No provider, API key, paid plan, billing account, or model has been selected or enabled. The chat route intentionally returns `model_not_configured` until a free/local model is chosen and server environment variables are configured. Do not put `IA_BACKEND_TOKEN` in public browser JavaScript; an authenticated user-session layer is required before exposing chat to the public app.

## Safety and limitations
- No arbitrary outbound URLs are accepted from requests, limiting SSRF exposure.
- Only HTTPS provider endpoints are accepted.
- Request method, message roles, message count and character sizes are validated.
- Provider errors and secrets are not echoed to clients.
- This is a gateway foundation, not a trained AI model, account system, persistent memory service, GitHub self-modification agent, or deployment controller.
- Vercel Git integration can build/deploy commits after they reach the configured production branch. This code does not grant the deployed AI permission to change credentials, security rules, GitHub permissions, merge code or publish production releases.

## Next stages
1. Verify Vercel preview build and API health route.
2. Choose a free/local model runtime based on license, capacity and actual available hardware; no paid fallback.
3. Add user authentication and per-user authorization before connecting browser chat.
4. Add a narrowly scoped GitHub App/OAuth server-side installation for repository access.
5. Run generated code in a disposable sandbox with tests, dependency/license and security scans.
6. Automate low-risk preview deployments and health checks. Keep production releases, credential/permission changes, destructive data operations and security-boundary changes behind owner approval and rollback controls.
