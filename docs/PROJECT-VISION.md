# Intelligent AI — Product Vision and Agreed Requirements

## Identity and independence
- Product name: **Intelligent AI**.
- This is a standalone project, separate from Savarkundla Ride and Worker Network India. Never mix their repositories, users, databases, credentials or data.
- The project is being built from a GitHub-first foundation. Add online login, database and hosted AI services later, deliberately and securely.

## Product ambition
Build a full-featured intelligent assistant, not a small scripted chatbot. It should grow toward strong reasoning, planning, research, coding, multilingual conversation, voice, image understanding, file/document/data analysis, task automation and specialist-agent collaboration.

## Platforms and languages
- Desktop browser and mobile browser.
- Installable Progressive Web App (PWA), with a later native Android package considered if useful.
- English and Hindi initially; Gujarati and additional languages planned.
- Responsive, accessible interface and clear status for features that are not yet connected.

## Intelligence and tools (planned)
- Understand user intent, ask clarifying questions when needed, plan multi-step tasks and check its own work.
- Research the web, compare trustworthy sources and provide citations.
- Create, explain, test and debug code in an isolated workspace.
- Read and analyse supported files, documents, tables and datasets.
- Support voice input/output and image understanding when suitable models/services are connected.
- Use specialist agents for research, coding, documents/data, planning, translation, vision/voice and quality review; coordinate their work through one assistant.
- Automate approved workflows and show progress, results and failures honestly.
- Maintain a capability registry so it can distinguish available, unavailable, experimental and planned skills.

## Memory and personalisation
- Later add user-controlled long-term memory for preferences, project context and ongoing work.
- Make saved information inspectable, correctable, exportable and deletable.
- Use consent, data minimisation and clear retention rules. Do not silently store sensitive information.

## Self-improvement and updates
The user wants a central ON/OFF control and an assistant that can progressively improve its own capabilities. The intended end-to-end workflow is:
1. When enabled, inspect its capability registry and identify gaps.
2. Research relevant documentation, tools, model updates and security advisories.
3. Prepare a proposal describing benefits, changed components, sources, risks, compatibility, estimated time and estimated cost.
4. Generate changes in a disposable sandbox or isolated Git branch.
5. Run automated tests, dependency/license checks and security checks.
6. Show a human-readable summary and proposed diff.
7. Deploy only through an explicitly configured release policy, with approval for consequential or production changes.
8. Keep version history, backups, health checks and a rollback route.
9. Let the owner pause or disable update activity at any time.

The ON/OFF control must have a clear explanation of what it enables. A switch in the current static prototype is only a local preference and does not yet execute updates.

## Non-negotiable engineering safeguards
The goal is maximum useful capability, not arbitrary execution. Never expose API keys or GitHub credentials in browser code; never execute untrusted downloaded code on production; do not let the AI erase its audit trail, disable owner controls or remove the recovery path. Use least-privilege credentials, isolated execution, reviewed releases, backups and rollback. These safeguards protect the project and keep the owner in control.

## Build approach
Build in small, working, testable phases. Do not claim a capability is live until it is connected and tested. Prefer a modular architecture and provider portability so future model/tool upgrades do not require rewriting the whole app.

## Current state
Foundation v0.1.0 is a static frontend/PWA shell with demo chat. There is no live model, backend, database, account system, internet-search agent, file processor, voice service or autonomous update engine yet.
