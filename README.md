# Intelligent AI

**Advanced Intelligent AI Assistant — Foundation v0.1.0**

A separate project designed to grow into a multilingual, multimodal assistant for research, reasoning, coding, files, data, specialist agents and controlled self-improvement.

## What is in this first build
- Responsive desktop and mobile interface
- PWA manifest and basic offline app-shell caching
- English/Hindi interface toggle
- Demo chat interface (no live AI model connected yet)
- Capability overview and self-update control prototype
- Architecture, roadmap and safe update design

## Important current limitations
This is the frontend foundation, not a functioning AI model yet. Live intelligence, internet research, voice, file processing, login, online memory and database require later secure backend/model integrations. The chat currently returns an explicit demo response. The self-update switch stores a local preference only and does not change repository code.

## Run
Open `index.html` for a basic preview. Service-worker/PWA features require HTTPS or localhost. GitHub Pages can host this static frontend after Pages is enabled in repository settings.

## Project documents
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Self-update design](docs/SELF-UPDATE.md)

## Safety principles
Honest capability reporting · user control · privacy · least privilege · reviewed updates · backups and rollback. Never put API keys or private tokens in browser files.
