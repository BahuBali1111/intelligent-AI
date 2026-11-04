# Self-Improvement Modes

This is the planned behaviour of the future self-improvement engine. The current frontend toggle is only a local UI preference; none of these modes is active yet.

## Master switch
OFF pauses scheduled discovery, analysis and update preparation. ON permits only the modes explicitly enabled below. The owner must be able to pause the system from a separate control path.

## Modes
1. **Observe** — inspect capability status, trusted release notes, documentation and security advisories; do not change code.
2. **Recommend** — identify gaps and produce a proposal with source links, benefits, compatibility, risks, time and cost estimates.
3. **Prepare** — create a change on a disposable branch or sandbox, run tests and present a diff. Never deploy.
4. **Approved release** — after owner approval, merge/deploy through a protected workflow, monitor health and rollback if checks fail.

## What can be automated
Routine discovery, documentation review, test execution, draft changes and non-production experiments can be automated within configured limits. Production releases, credential changes, data migrations, permission changes, purchases and actions with external consequences require explicit owner approval.

## Reliability requirements
- Keep a visible activity log and current version.
- Show what changed and why.
- Include estimated cost and resource usage before enabling paid services.
- Keep backups and a rollback target.
- Use isolated execution and dependency/license/security checks.
- The AI cannot change its own permission boundary or disable the master switch.
