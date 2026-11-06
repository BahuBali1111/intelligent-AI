# Intelligent AI — Backend Foundation

This repository now includes a minimal Vercel serverless API foundation.

## Routes
- `GET /api/health` — reports service health and whether authentication/model configuration exists. It never returns secret values.
- `POST /api/chat` — accepts OpenAI-compatible chat messages, authenticates with a server-side bearer secret, validates payload size and roles, calls only the fixed HTTPS provider URL configured in server environment variables, and returns a plain answer. It does not accept a provider URL from the caller.

## Required Vercel environment variables
Set these only in the Vercel project's encrypted Environment Variables UI; never commit them:
- `IA_BACKEND_TOKEN`: long random secret used by trusted server-side callers.
- `IA_ALLOWED_ORIGIN`: exact HTTPS origin allowed for browser calls. Leave unset to reject browser-origin calls by default.
- `AI_PROVIDER_URL`: full HTTPS chat-completions endpoint for an OpenAI-compatible provider.
- `AI_PROVIDER_API_KEY`: provider key, held only on the server.
- `AI_MODEL`: exact model identifier.

No provider, API key, paid plan, billing account, or model has been selected or enabled by this change. The backend reports model-not-configured until the owner chooses a compatible free/local model and configures its credentials. Do not put `IA_BACKEND_TOKEN` in public browser JavaScript; a future authenticated user-session layer is required before exposing chat to the public app.

## Safety and limitations
- The API never accepts arbitrary outbound URLs from a request, limiting SSRF exposure.
- Only HTTPS provider endpoints are accepted.
- Request method, message roles, message count and character sizes are validated.
- Provider errors and secrets are not echoed to clients.
- This is a gateway foundation, not a trained AI model, account system, persistent memory service, GitHub self-modification agent, or deployment controller.
- Vercel Git integration can build/deploy commits after they reach the configured production branch. This code does not grant the deployed AI permission to change its own credentials, security rules, GitHub permissions, merge code or publish production releases.

## Next implementation stages
1. Verify Vercel preview build and API health route.
2. Choose a free/local model runtime based on license, capacity and actual available hardware; no paid fallback.
3. Add user authentication and per-user authorization before connecting the browser chat.
4. Add a GitHub App/OAuth server-side installation with narrowly scoped repository permissions; keep proposals isolated and audited.
5. Run generated code in a disposable sandbox with tests, dependency/license and security scans.
6. Automate low-risk preview deployments and health checks. Keep production releases, credential/permission changes, destructive data operations and security-boundary changes behind owner approval and rollback controls.
