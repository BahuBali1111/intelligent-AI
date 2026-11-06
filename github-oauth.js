"use strict";
(() => {
  const BACKEND = "https://intelligent-ai-backend.vercel.app";
  const KEY = "ia_github_encrypted_session";
  const status = document.getElementById("githubOAuthStatus");
  const connect = document.getElementById("githubOAuthConnect");
  const disconnect = document.getElementById("githubOAuthDisconnect");
  if (!status || !connect || !disconnect) return;
  const params = new URLSearchParams(location.hash.slice(1));
  const returned = params.get("github_session");
  if (returned) {
    try { sessionStorage.setItem(KEY, returned); } catch (_) {}
    history.replaceState({}, "", location.pathname + location.search);
  }
  const getTicket = () => { try { return sessionStorage.getItem(KEY) || ""; } catch (_) { return ""; } };
  async function api(path, options={}) {
    const headers = new Headers(options.headers || {});
    const value = getTicket();
    if (value) headers.set("Authorization", "Bearer " + value);
    return fetch(BACKEND + path, {...options, headers, credentials:"omit", cache:"no-store"});
  }
  async function refresh() {
    try {
      const response = await api("/api/github/status");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "status_check_failed");
      status.textContent = data.connected ? "Connected ✓ GitHub account: " + data.account + " · " + data.repository : "Not connected · Authorize GitHub to link this repository.";
    } catch (_) { status.textContent = "Connection check failed. Please reconnect GitHub once."; }
  }
  connect.addEventListener("click", () => { status.textContent = "Opening GitHub authorization…"; });
  disconnect.addEventListener("click", async () => {
    disconnect.disabled = true;
    try { await api("/api/github/disconnect", {method:"POST"}); } catch (_) {}
    try { sessionStorage.removeItem(KEY); } catch (_) {}
    status.textContent = "Disconnected from GitHub.";
    disconnect.disabled = false;
  });
  refresh();
})();
