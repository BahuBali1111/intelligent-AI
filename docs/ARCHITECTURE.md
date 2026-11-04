# Intelligent AI Architecture

## Current status — foundation v0.3.1
Responsive static frontend and PWA shell. The chat UI stores demo conversation history on the device. No real language model, backend, internet-search tool, file processor, voice service, database, login or autonomous agent runtime is connected.

## Build policy
Build the application engine and tools with our own code. Do not add paid APIs, subscriptions, metered hosting or paid services without a new explicit owner decision. Prefer local/free/open-source components after license and hardware checks. Application code is not itself a trained language model: real language generation requires model weights and compute. Do not label mock responses as real AI.

## Planned modular architecture
1. Experience: accessible desktop/mobile web UI, English/Hindi first, Gujarati next.
2. Conversation core: message validation, session state, context window and history controls.
3. Orchestrator: intent routing, planning, tool selection, task state and error handling.
4. Model runtime interface: provider-neutral adapter; first investigate free local/self-hosted model runtimes. No paid-provider fallback.
5. Tools: permissioned local file/data analysis, optional free/public web research, and isolated coding workspace.
6. Memory: user-consented preferences and project context, with review, export and deletion controls.
7. Agents: research, coding, documents/data, planning, language and quality-review roles.
8. Improvement engine: capability registry, update proposals, isolated tests, owner approval, release and rollback.
9. Security: least privilege, resource limits, audit logs, backups and monitoring.

## Deployment path
GitHub repository → GitHub Pages static frontend → separately hosted local/self-hosted runtime when suitable hardware is available → permissioned tools and user-controlled memory. GitHub Pages hosts static assets only; it cannot securely host server-side runtime processes or private credentials.

## Principles
Honest capability disclosure; no surprise costs; user control; minimum data collection; trusted sources; reproducible versioned changes; protected secrets; reversible releases.
