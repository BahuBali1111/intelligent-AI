# Intelligent AI Roadmap

## Build philosophy
- Build the application, orchestration, memory controls, tools and user experience with our own code.
- Do not add paid APIs, paid model subscriptions, payment gateways or surprise charges.
- Prefer local execution and free/open-source components with licenses checked before adoption.
- Do not pretend ordinary application code alone is a trained language model. Strong language intelligence requires model weights; first investigate a small open model that can run locally or on genuinely free available compute.
- If no suitable free runtime is available, continue building and testing the complete engine with a clearly labelled mock adapter until a free model can be run. Never silently switch to a paid service.
- Any future cost-bearing service requires the owner's explicit decision first.

## Phase 0 — Foundation (complete)
- [x] Separate GitHub repository
- [x] Responsive desktop/mobile interface
- [x] PWA manifest and basic offline app-shell caching
- [x] Demo chat and capability overview
- [x] Two-sided chat bubbles, local chat history and export
- [x] Self-update control prototype and safety design
- [x] Architecture, security and gateway plan documents
- [x] GitHub Pages deployment and static quality checks

## Phase 1 — Build our own AI application engine (next)
- [ ] Define a provider-free internal model adapter interface
- [x] Build initial message validation and local conversation history
- [x] Build explicit user-controlled local memory notes with search, delete and export
- [x] Build intent router and task planner modules
- [ ] Build a permissioned tool registry and tool-result format
- [ ] Build local settings, language handling and capability status
- [x] Add automated tests for core and local memory modules
- [ ] Evaluate free/open-source models for local execution; verify device/server requirements and licenses
- [ ] Connect only a model that can run without a paid API; otherwise keep the adapter clearly marked as not connected
- [ ] Add streaming UI once a free local runtime is selected

## Phase 2 — Free/local tools
- [x] Local searchable knowledge library with categories, tags, ranked retrieval, delete and JSON backup
- [ ] File upload and document/data analysis using free libraries
- [x] Multi-source browser research links and local source notebook; automatic page ingestion remains a later connector task
- [x] Local code change workbench with before/after drafts, patch preview and JSON export (no direct repository writes yet)
- [ ] Planner and specialist agent orchestration
- [ ] Optional local voice and image understanding where device capability permits

## Phase 3 — Accounts and memory
- [ ] Authentication and recovery using a free/self-hostable approach where practical
- [ ] Database with access controls and a clear storage plan
- [ ] User-controlled memory, export and deletion
- [ ] Device/session management and audit logs

## Phase 4 — Controlled improvement
- [x] Local capability registry and gap analysis
- [ ] Trusted-source update discovery
- [x] Local improvement proposal ledger with risk labels and audit trail
- [ ] Isolated code generation and automated tests
- [ ] Protected branch and pull-request workflow
- [ ] Explicit approval, staged deploy and rollback

## Phase 5 — Reliability and scale
- [ ] Monitoring, backups and incident response
- [ ] Accessibility, performance and security review
- [ ] Model portability and evaluation
- [ ] Mobile install and release readiness
