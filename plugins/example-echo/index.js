(function(root) {
  "use strict";
  async function run(input) {
    const value = typeof input === "string" ? input : String(input && input.text || "");
    return { plugin: "example-echo", text: value.slice(0, 2000) };
  }
  const plugin = {
    id: "example-echo",
    name: "Example Echo",
    version: "1.0.0",
    description: "A safe example plugin that returns bounded text without network or filesystem access.",
    register(api) {
      api.registerTool("echo", "Return the supplied text (example plugin).", run);
    },
    run,
    async test() {
      const result = await run("plugin test");
      if (result.text !== "plugin test") throw new Error("Echo plugin returned an unexpected result.");
      return { sample: result.text };
    }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = plugin;
  root.IntelligentExampleEcho = Object.freeze(plugin);
})(typeof globalThis !== "undefined" ? globalThis : this);
