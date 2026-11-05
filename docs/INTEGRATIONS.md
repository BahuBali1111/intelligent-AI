# External Integrations — Safe Connection Plan

## Current implementation
The integration registry is a capability/status catalogue only. It does not authenticate to external services, hold credentials, or perform repository writes. GitHub Actions already runs quality checks and deploys the static Pages site; that is not the same as granting the browser app permission to edit the repository.

## GitHub connection target
Create a GitHub App restricted to the single repository `BahuBali1111/intelligent-AI`. Start with:
- Contents: read/write (only for a future proposal branch).
- Pull requests: read/write (to open a reviewable proposal).
- Actions: read (to inspect CI results).
- Workflows: request write only if a later feature must edit files under `.github/workflows`.
- No Administration, account-wide, organization-wide, secrets, or billing permissions.

GitHub recommends requesting only the minimum permissions required. See https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app.

## Required connection architecture
GitHub Pages is public static JavaScript. It cannot safely hold a GitHub App private key, client secret, installation token, or long-lived personal access token. A real connection needs a trusted server-side token broker:
1. User authorizes the GitHub App for this one repository.
2. Server validates the callback/state and exchanges credentials securely.
3. Server keeps private keys and short-lived installation tokens outside browser code.
4. Browser requests a proposal operation; server validates owner session, repository allowlist, requested file paths and patch limits.
5. Server creates a proposal branch and pull request, never commits directly to main.
6. GitHub Actions runs tests; deployment remains gated by review/approval.
7. Audit log, backups, emergency pause and rollback remain mandatory.

## Other services
- Model runtime: free/local first; never silently switch to paid APIs.
- Research: public read-only indexes and official documentation; respect rate limits and terms.
- Code execution: isolated runner only; never execute downloaded code in the public browser page.

## Not connected yet
No GitHub App has been registered or installed, and no server-side token broker exists. Do not paste tokens or private keys into the app, chat, GitHub source, or screenshots. The next required owner action is to create/install the narrowly scoped GitHub App after the secure server option is selected.
