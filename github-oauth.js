"use strict";
(() => {
  const BACKEND = "https://intelligent-ai-backend.vercel.app";
  const status = document.getElementById("githubOAuthStatus");
  const connect = document.getElementById("githubOAuthConnect");
  const disconnect = document.getElementById("githubOAuthDisconnect");
  if (!status || !connect || !disconnect) return;
  async function refresh() {
    try {
      const response = await fetch(BACKEND + "/api/github/status", { credentials: "include", cache: "no-store" });
      const data = await response.json();
      status.textContent = data.connected
        ? "Connected ✓ GitHub account: " + data.account + " · " + data.repository
        : "Not connected · Authorize GitHub to link this repository.";
    } catch (_) {
      status.textContent = "Connection status could not be checked. Open this page in a browser that allows the secure backend session.";
    }
  }
  connect.addEventListener("click", () => { status.textContent = "Opening GitHub authorization…"; });
  disconnect.addEventListener("click", async () => {
    disconnect.disabled = true;
    try {
      await fetch(BACKEND + "/api/github/disconnect", { method: "POST", credentials: "include" });
      status.textContent = "Disconnected from GitHub.";
    } catch (_) {
      status.textContent = "Could not confirm disconnect. Close this browser tab to end the session.";
    } finally { disconnect.disabled = false; }
  });
  refresh();
  if (new URLSearchParams(location.search).get("github") === "connected") {
    history.replaceState({}, "", location.pathname);
    status.textContent = "GitHub authorization completed. Checking repository access…";
    refresh();
  }
})();
