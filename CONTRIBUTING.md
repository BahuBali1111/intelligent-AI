# Contributing to Intelligent AI

## Add a feature as a separate, reviewable change

1. Start from the current `integration/full-build` branch (or the issue's explicitly named base).
2. Create one feature branch, for example `feature/plugin-calendar`.
3. Keep the change focused. Do not edit authentication, secrets, deployment permissions or safety controls as part of an unrelated feature.
4. Add or update automated tests. Use Node's built-in test runner; no new dependency is needed for browser-independent modules.
5. Run the quality workflow and inspect the complete diff.
6. Open a pull request targeting `integration/full-build`. Do not merge into `main` or deploy production.
7. Describe behaviour, limitations, permissions, data flow, costs, test evidence and rollback steps in the PR.

## Add a plugin

1. Copy `plugins/plugin-template/index.js` into `plugins/<your-plugin-id>/index.js`.
2. Choose a unique id matching `^[a-z][a-z0-9-]{1,63}$`.
3. Implement all three required functions: `register(api)`, `run(input, context)` and `test()`.
4. Register tools only through `api.registerTool(name, description, handler)`; names are automatically scoped to your plugin.
5. Validate untrusted input, cap payload sizes, handle timeouts/errors, and avoid logging private data.
6. Add unit tests under `tests/` and include the plugin in `index.html`, `service-worker.js` and the GitHub Pages build allowlist.
7. Run `node --test tests/*.test.js` and check browser behaviour on desktop and mobile.
8. Open a PR to `integration/full-build`. Wait for checks and human review.

## Security and compatibility

- Never commit API keys, tokens, private user data or local environment files.
- Do not use `eval`, `new Function`, shell execution, or remote script loading.
- Treat model output, web pages and plugin input as untrusted data.
- Request the smallest required capability. Plugins do not inherit privileged GitHub access.
- Avoid breaking changes to `core.js`; extend through the versioned plugin host.
- Document external network calls, third-party data sharing, licensing, quota and possible costs.
- Production changes require explicit human approval and a separate release process.
