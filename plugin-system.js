(function(root) {
  "use strict";
  const API_VERSION = "1.0.0";
  const ID_PATTERN = /^[a-z][a-z0-9-]{1,63}$/;

  function createPluginHost(core) {
    if (!core || typeof core.registerTool !== "function" || typeof core.runTool !== "function") {
      throw new TypeError("A compatible IntelligentCore instance is required.");
    }
    const plugins = new Map();

    function register(plugin) {
      if (!plugin || typeof plugin !== "object") throw new TypeError("Plugin must be an object.");
      const id = String(plugin.id || "");
      if (!ID_PATTERN.test(id)) throw new TypeError("Plugin id must be 2-64 lowercase letters, numbers or hyphens.");
      if (plugins.has(id)) throw new Error("Plugin already registered: " + id);
      if (typeof plugin.register !== "function" || typeof plugin.run !== "function" || typeof plugin.test !== "function") {
        throw new TypeError("Plugin must implement register(api), run(input, context) and test().");
      }
      const tools = [];
      const api = Object.freeze({
        apiVersion: API_VERSION,
        registerTool(name, description, run) {
          const localName = String(name || "").trim();
          if (!/^[a-z][a-z0-9-]{0,47}$/.test(localName)) throw new TypeError("Invalid plugin tool name.");
          if (typeof run !== "function") throw new TypeError("Plugin tool run must be a function.");
          const fullName = "plugin." + id + "." + localName;
          core.registerTool({ name: fullName, description: String(description || "").slice(0, 240), run });
          tools.push(fullName);
          return fullName;
        }
      });
      let dispose;
      try {
        dispose = plugin.register(api);
      } catch (error) {
        throw new Error("Plugin registration failed (" + id + "): " + String(error && error.message || error));
      }
      plugins.set(id, {
        id,
        name: String(plugin.name || id).slice(0, 100),
        version: String(plugin.version || "0.0.0").slice(0, 40),
        description: String(plugin.description || "").slice(0, 500),
        run: plugin.run,
        test: plugin.test,
        tools,
        dispose: typeof dispose === "function" ? dispose : null
      });
      return describe(id);
    }

    function describe(id) {
      const plugin = plugins.get(id);
      if (!plugin) return null;
      return { id: plugin.id, name: plugin.name, version: plugin.version, description: plugin.description, tools: plugin.tools.slice() };
    }

    function list() {
      return Array.from(plugins.keys(), describe);
    }

    async function run(id, input, context) {
      const plugin = plugins.get(String(id || ""));
      if (!plugin) throw new Error("Plugin is not registered: " + id);
      return plugin.run(input, context || {});
    }

    async function test(id) {
      const plugin = plugins.get(String(id || ""));
      if (!plugin) throw new Error("Plugin is not registered: " + id);
      const result = await plugin.test();
      if (result === false) throw new Error("Plugin test returned false: " + id);
      return { id: plugin.id, passed: true, result: result === undefined ? null : result };
    }

    async function testAll() {
      const results = [];
      for (const id of plugins.keys()) {
        try { results.push(await test(id)); }
        catch (error) { results.push({ id, passed: false, error: String(error && error.message || error) }); }
      }
      return { total: results.length, passed: results.filter(x => x.passed).length, failed: results.filter(x => !x.passed).length, results };
    }

    function unregister(id) {
      const plugin = plugins.get(String(id || ""));
      if (!plugin) return false;
      if (plugin.dispose) plugin.dispose();
      plugins.delete(plugin.id);
      return true;
    }

    return Object.freeze({ apiVersion: API_VERSION, register, describe, list, run, test, testAll, unregister });
  }

  const api = { API_VERSION, createPluginHost };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IntelligentPlugins = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
