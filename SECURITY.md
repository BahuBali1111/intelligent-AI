# Security Policy

## Supported version
Security work targets the latest version on the default branch.

## Reporting
Do not publish passwords, API keys, access tokens, private user data or an exploitable vulnerability in a public issue. Contact the repository owner privately through GitHub's available private reporting channel.

## Project security rules
- Never commit secrets, provider API keys, database service-role keys or personal credentials.
- Browser code is public. All privileged model and tool calls must eventually run behind a server-side gateway.
- Use least-privilege access tokens and rotate credentials if exposed.
- Run generated code in a disposable sandbox, not on the production host.
- Require tests and owner approval for production changes.
- Keep release history, backups, monitoring and a tested rollback path.
- Never allow an agent to disable owner controls, erase audit logs or remove recovery mechanisms.
