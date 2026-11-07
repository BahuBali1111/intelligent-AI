# Multi-file AI coding workflow

The Coding Workshop includes an opt-in multi-file project generator.

## Workflow

1. The owner describes the application and chooses a preferred stack and a file limit (4, 6 or 8).
2. The connected model returns a JSON architecture manifest.
3. The coding agent validates relative paths, rejects duplicates and blocks common secret/private-key filenames.
4. The agent requests each complete file sequentially, checks for empty/truncated output and applies per-file and total size limits.
5. Each generated file is saved as a local code draft with a reviewable patch. The owner can inspect and export drafts.

## Safety boundaries

- Generation requires an explicitly connected provider.
- Provider keys are used by the existing model client; they are not copied into generated files.
- Generated code is untrusted. It is not executed in the browser, and the generator does not install packages, run shell commands, modify the repository, merge pull requests or deploy.
- Drafts are stored in browser local storage on the current device. Export them before clearing browser data or moving to another device.
- Review code, run static checks and tests in an isolated development environment, inspect dependencies and permissions, then propose repository changes on a feature branch.
- A model may omit requirements or return incomplete code. Passing generation validation is not proof that the application works.

## Current limitations

This is a first multi-file generation workflow, not yet an autonomous coding agent with a filesystem, terminal, browser automation, test execution, repair loop or long-lived project workspace. Those capabilities require a controlled server-side execution environment and explicit permissions.
