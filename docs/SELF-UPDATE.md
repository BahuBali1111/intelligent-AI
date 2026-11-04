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
Design document only. The UI switch is a local preference; it does not browse, write repository files or deploy updates.