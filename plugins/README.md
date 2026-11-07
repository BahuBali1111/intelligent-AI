# Intelligent AI plugins

Plugins are explicitly bundled JavaScript modules. They are **not downloaded or evaluated from arbitrary URLs**. Add a script to the reviewed page build and register it with the plugin host.

Each plugin must export:
- `id`: unique lowercase id (2–64 chars, letters/numbers/hyphens).
- `name`, `version`, `description`.
- `register(api)`: declare optional namespaced tools.
- `run(input, context)`: execute the plugin's primary operation.
- `test()`: run a deterministic smoke test and throw or return false on failure.

The host namespaces registered tools as `plugin.<plugin-id>.<tool-name>`, prevents duplicate plugin/tool registration, rolls back failed registration, reports tests, and removes plugin tools on unregister. The host passes a narrow registration API, but **this is not a security sandbox**: plugin JavaScript runs in the same page origin and can access browser globals and same-origin storage/APIs. Treat every bundled plugin as trusted application code and review it like core code. Do not put secrets in browser storage or grant plugins privileged integrations.

See [example-echo](./example-echo/index.js) and [plugin-template](./plugin-template/index.js). Review permissions, network destinations, data handling, input limits and error paths before adding a plugin.
