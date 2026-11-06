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
    try {
      sessionStorage.setItem(KEY, returned);
      status.textContent = "GitHub authorization received. Verifying repository access…";
    } catch (_) {
      status.textContent = "Authorization returned, but this browser blocked session storage. Allow site storage and reconnect.";
    }
    history.replaceState({}, "", location.pathname + location.search);
  }

  const getTicket = () => {
    try { return sessionStorage.getItem(KEY) || ""; }
    catch (_) { return ""; }
  };

  async function api(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const ticket = getTicket();
    if (ticket) headers.set("Authorization", "Bearer " + ticket);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      return await fetch(BACKEND + path, {
        ...options, headers, signal: controller.signal,
        credentials: "omit", cache: "no-store"
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async function refresh() {
    const ticket = getTicket();
    if (!ticket) {
      status.textContent = "Not connected · Tap “Connect GitHub securely” to authorize this browser session.";
      return;
    }
    status.textContent = "Authorization received · checking secure backend and repository permissions…";
    try {
      const response = await api("/api/github/status");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || ("HTTP " + response.status));
      if (data.connected === true) {
        status.textContent = "Connected ✓ GitHub account: " + data.account + " · " + data.repository;
      } else {
        try { sessionStorage.removeItem(KEY); } catch (_) {}
        status.textContent = "GitHub authorization could not be verified. Please reconnect once.";
      }
    } catch (error) {
      const reason = error.name === "AbortError" ? "Backend check timed out after 10 seconds" : (error.message || "network/CORS error");
      status.textContent = "GitHub check failed: " + reason + ". Check the backend deployment, then tap Connect GitHub securely again.";
    }
  }

  connect.addEventListener("click", () => {
    status.textContent = "Opening GitHub authorization…";
  });

  disconnect.addEventListener("click", async () => {
    disconnect.disabled = true;
    try { await api("/api/github/disconnect", { method: "POST" }); } catch (_) {}
    try { sessionStorage.removeItem(KEY); } catch (_) {}
    status.textContent = "Disconnected from GitHub on this browser.";
    disconnect.disabled = false;
  });

  refresh();
})();