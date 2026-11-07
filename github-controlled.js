"use strict";
(() => {
  const BACKEND = "https://intelligent-ai-backend.vercel.app";
  const KEY = "ia_github_encrypted_session";
  const OWNER = "BahuBali1111";
  const REPO = "intelligent-AI";
  let verified = false;
  let account = null;
  function ticket() { try { return localStorage.getItem(KEY) || ""; } catch (_) { return ""; } }
  async function call(action, payload = {}) {
    const value = ticket();
    if (!value) throw new Error("GitHub OAuth session ticket is missing. Open Settings and connect GitHub.");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(BACKEND + "/api/github/bridge", {
        method: "POST",
        headers: { "Authorization": "Bearer " + value, "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }), cache: "no-store", credentials: "omit", signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error("GitHub bridge: " + (data.detail || data.error || ("HTTP " + response.status)));
      return data;
    } catch (error) {
      if (error.name === "AbortError") throw new Error("GitHub backend timed out after 15 seconds.");
      throw error;
    } finally { clearTimeout(timer); }
  }
  async function verify() {
    if (!ticket()) { verified = false; account = null; return false; }
    try {
      const data = await call("status");
      verified = !!data.connected && !!data.canRead;
      account = data.account || null;
      return verified;
    } catch (_) { verified = false; account = null; return false; }
  }
  const bridge = {
    repository: OWNER + "/" + REPO,
    isConnected: () => !!ticket(),
    isVerified: () => verified,
    account: () => account,
    verify,
    inspect: () => call("inspect"),
    inspectRepositoryFile: (path, ref = "main") => call("file", { path, ref }),
    listWorkflowRuns: (options = {}) => call("runs", { perPage: options.perPage || 8 }),
    inspectWorkflowRun: async runId => ({ ...(await call("run", { runId })), note: "Live data returned by GitHub Actions API." }),
    proposePatches: async (patches, title, body) => {
      if (!Array.isArray(patches) || patches.length < 1 || patches.length > 3) throw new Error("A proposal must contain 1–3 small patches.");
      return call("propose", { patches, title, body });
    }
  };
  window.IntelligentGitHubBridge = bridge;
  verify().then(ok => {
    const status = document.getElementById("githubOAuthStatus");
    if (status && ok) status.textContent = "Connected ✓ GitHub account: " + account + " · " + bridge.repository;
  });
  window.addEventListener("storage", event => { if (event.key === KEY) verify(); });
})();
