# Secure GitHub connection for Intelligent AI

This repository now includes a server-side GitHub OAuth foundation. It deliberately does not accept or store a Personal Access Token in browser JavaScript.

## Vercel environment variables (server-side only)

- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`
- `GITHUB_OAUTH_REDIRECT_URI` — exact callback URL: `https://YOUR-PRODUCTION-DOMAIN/api/github/oauth/callback`
- `GITHUB_SESSION_SECRET` — at least 32 random characters; never commit it.

Create a GitHub OAuth App under the repository owner's GitHub account and set its Authorization callback URL to the exact redirect URI above. Keep the client secret only in Vercel Environment Variables. The user must authorize the app while signed into the GitHub account that has write access to `BahuBali1111/intelligent-AI`.

## Routes

- `GET /api/github/oauth/start` begins OAuth authorization.
- `GET /api/github/oauth/callback` validates state, exchanges the one-time code server-side, verifies repository write access and sets an encrypted, HttpOnly, Secure, SameSite=Lax session cookie.
- `GET /api/github/status` reports whether the session is connected (never returns the token).
- `POST /api/github/disconnect` clears the session cookie.

The encrypted cookie expires after seven days. The browser never receives the OAuth access token. This is a foundation, not yet the complete repository-write API or finished UI integration. Do not enable public write operations until same-origin/CSRF protection, strict path and operation allowlists, audit logging, rate limits, tests and owner approval are in place.

## Required owner setup

The OAuth Client ID/Secret and a strong session secret cannot be created by a repository commit. Add them only in the correct Intelligent AI Vercel project's server-side Environment Variables. Do not put them in GitHub files, HTML, localStorage or screenshots. After setting them, deploy and test the OAuth flow.
