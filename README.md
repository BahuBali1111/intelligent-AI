# Intelligent AI

A modular multilingual AI assistant application, currently delivered as a browser/PWA frontend with optional model-provider and secure GitHub integrations.

## Current architecture

- `index.html`, `app.js`, `style.css`: responsive client application.
- `core.js`: message validation, intent routing and core tool registry.
- `plugin-system.js` + `plugins/`: explicit, versioned plugin host and examples.
- `model-client.js`: optional OpenAI-compatible provider adapters; model intelligence depends on the provider/runtime selected by the owner.
- `research-engine.js`: multi-source public-index search and bounded page reading.
- `memory.js`, `knowledge.js`, `context-engine.js`: browser-local memory and knowledge.
- `api/`: Vercel serverless API, including encrypted GitHub OAuth/session and a least-privilege repository bridge.
- `tests/`: Node built-in test suite.

## Plugin development

Read [plugins/README.md](plugins/README.md) and [CONTRIBUTING.md](CONTRIBUTING.md). Plugins are bundled and explicitly registered; arbitrary remote plugin code is never loaded. Each plugin implements `register(api)`, `run(input, context)` and `test()`.

## Run and test

Open `index.html` for a basic preview. PWA/service-worker behaviour requires HTTPS or localhost.

Run the browser-independent tests with Node.js 22 or newer:

```sh
node --test tests/*.test.js
```

GitHub Actions also runs syntax, manifest, file-reference and test checks. The GitHub Pages workflow deploys only `main`; integration/staging work must use a separate preview environment.

## Important boundaries

- This repository is application/orchestration code, not a newly trained foundation model.
- Language generation depends on a connected external or self-hosted model runtime.
- Browser-local memory does not automatically sync across devices.
- Web research uses selected public providers and may be incomplete.
- GitHub changes are proposed on separate branches and require review. The plugin API does not pass GitHub credentials, but plugins run in the same page origin and are not a sandbox; review all plugin code as trusted application code.
- Never commit API keys, tokens, or private environment values.
- Production merges and deployments require explicit human approval.

## Project documents

- [Architecture](docs/ARCHITECTURE.md)
- [Product vision](docs/PROJECT-VISION.md)
- [Roadmap](docs/ROADMAP.md)
- [AI gateway](docs/AI-GATEWAY.md)
- [Self-update design](docs/SELF-UPDATE.md)
- [Security policy](SECURITY.md)
