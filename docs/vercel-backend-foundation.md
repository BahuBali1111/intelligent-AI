# Intelligent AI — Vercel Backend Foundation

This backend is intentionally isolated from the existing static application.

## Preservation guarantee
- Existing frontend files, memory/research engines, workflows, and GitHub Pages setup are not modified by this foundation.
- The work is on branch `feature/vercel-secure-backend-foundation`; it is not merged into `main`.
- No deployment is triggered by these files.
- No GitHub Personal Access Token is requested or embedded.

## Initial endpoints
- `GET /api/health` — confirms the Vercel function is running.
- `GET /api/github/status` — reports whether GitHub App server-side configuration exists. It never returns secrets.

## GitHub authorization plan
Use a GitHub App restricted to the `BahuBali1111/intelligent-AI` repository. Store the App ID, private key, and installation ID only as encrypted Vercel environment variables. The server will mint short-lived installation tokens; browser JavaScript will never receive the private key or installation token.

The initial setup deliberately does not enable repository writes. Before enabling them, implement authenticated user sessions, CSRF/state validation, strict repository allowlisting, branch-only writes, audit logging, and PR-based review. No automatic merge or production deployment.

## Vercel project settings
When importing this repository, use the repository root as Root Directory, select the Other framework preset, and do not add environment variables yet. Leave Build Command and Install Command empty/auto-detected; no custom build is required for the API foundation. Do not press Deploy until the project settings and backend authorization are reviewed.

## Next setup steps
1. Create/import the Vercel project in the dedicated account without changing the existing GitHub Pages workflow.
2. Configure the GitHub App and encrypted environment variables.
3. Add authenticated, read-only repository operations first.
4. Add branch/commit/PR operations after tests and explicit approval.
5. Deploy the backend separately; do not replace the existing GitHub Pages website.
