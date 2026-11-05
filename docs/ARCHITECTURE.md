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


## Local coding workshop
`code-workbench.js` stores owner-authored before/after code drafts locally, validates repository-relative paths, previews a readable patch and exports JSON. It does not execute untrusted code, write to GitHub or deploy. A future isolated runner and repository integration must run syntax/tests, inspect dependencies/licences, keep backups and require the single owner-controlled auto-update preference before unattended updates.


## Federated browser research
`research-engine.js` queries five public indexes directly from the browser: Wikipedia, Crossref, OpenAlex, GitHub repository search and Stack Exchange/Stack Overflow. It normalizes, deduplicates and ranks results, reports per-provider failures, and keeps partial results when one provider is unavailable. Users can open original sources or save result notes into the local research notebook. No API key or paid provider is required. These indexes do not cover the entire web; broader search engines remain available as external search links. Source claims must be checked at origin. Public APIs may rate-limit or change their CORS policies.


## Conversation continuity engine
`context-engine.js` keeps a local index of recent user instructions and a transparent set of confirmed Intelligent AI project rules. It supports keyword retrieval, bounded local history, common-secret redaction, export and clearing the recent index. The confirmed rules are versioned in source; recent user instructions remain in the current browser only. This is continuity support, not a language model: it does not understand every nuance or synchronize across devices. The app must continue to be honest about those limits.


## Request understanding and response planning
`assistant-brain.js` normalizes English/Hindi text, detects common task intents, identifies question/command/greeting patterns, extracts simple constraints and requested formats, marks low-confidence requests for clarification, and creates a structured response plan. The chat uses the selected interface language and can retrieve related local knowledge entries. This is a deterministic starter layer, not a trained language model: nuanced Hinglish, complex multi-part instructions and factual reasoning still require model weights and evaluation. The engine must never present its confidence score as a guarantee of correctness.


## Provider-neutral model adapter
`model-adapter.js` defines a provider-independent contract for connect, disconnect, connection state and chat. It validates message roles/content, normalizes model responses and maintains a registry that exposes only safe provider metadata. Provider implementations can be swapped without changing orchestration code. The current OpenRouter/Qwen client is not yet migrated to this contract; this milestone establishes and tests the interface only.


## Provider adapter integration
The existing OpenRouter/Qwen browser client is now wrapped by the provider-neutral `model-adapter.js` contract. The app continues using a compatibility facade, while connection, status and chat calls route through the registered `openrouter-qwen` adapter. This is an incremental migration: credentials remain browser-side/session-only for this prototype and must move behind a trusted server-side gateway before production.
