# Self-Update Engine

## Intended workflow
Inspect declared capabilities → identify gaps → research trusted documentation → prepare a proposal → generate code in an isolated branch/sandbox → run tests and security checks → show diff, risks, effort and estimated cost → request owner approval → deploy through protected workflow → health-check and rollback if needed.

## Controls
- Master switch OFF: stop update discovery and proposal jobs.
- ON: permit only configured discovery and proposal preparation.
- Each production release requires explicit owner approval.
- Emergency pause and credential revocation must be available.
- Keep backups, release history and tested rollback.

## Every proposal must explain
Current/target version, reason, changed files, source references, dependency/licence changes, security/privacy impact, tests, estimated time/cost and rollback plan.

## Security boundaries
Never run arbitrary downloaded code in production. Never put GitHub tokens, AI keys or database credentials in browser JavaScript. Use narrow server-side credentials. Protect the default branch and require review/tests. The assistant must not remove its own safeguards or audit trail.

## Current implementation
Design document only. The UI switch is a local preference; it does not browse, write repository files or deploy updates.\n\n## Long-term research direction: independent evolution\nBuild an auditable, modular improvement system rather than an unrestricted self-rewriting loop. Its differentiators to investigate and prototype are: capability graph with dependency and regression mapping; persistent experiment ledger; automatic hypothesis generation from failed tests and user-approved feedback; competing candidate patches in isolated worktrees; reproducible evaluation suites; resource-aware model/tool selection; signed change manifests; staged rollout with health gates; instant rollback; and a durable explanation trail. The system may improve its own application code and tools under explicit owner policy, but must never rewrite its security boundary, steal credentials, bypass review, or silently deploy.\n\nNo claim is made that this design is unprecedented. Novelty must be researched and validated before making such a claim. The goal is to build a distinctive, reliable system through measured iterations.\n