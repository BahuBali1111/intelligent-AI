(function(root) {
  "use strict";
  async function run(input, context) {
    // Validate input, enforce size limits, and use only explicitly granted capabilities.
    return { ok: true, input, context: { requestId: context && context.requestId || null } };
  }
  root.IntelligentPluginTemplate = Object.freeze({
    id: "replace-with-plugin-id",
    name: "Replace with plugin name",
    version: "0.1.0",
    description: "Describe the plugin and its capability boundaries.",
    register(api) {
      // Register optional tools with api.registerTool("tool-name", "description", handler).
    },
    run,
    async test() {
      const result = await run({ sample: true }, { requestId: "test" });
      if (!result || result.ok !== true) throw new Error("Template plugin smoke test failed.");
      return true;
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
