"use strict";
(() => {
  const BACKEND = "https://intelligent-ai-backend.vercel.app";
  const KEY = "ia_github_encrypted_session";
  const status = document.getElementById("githubOAuthStatus");
  const connect = document.getElementById("githubOAuthConnect");
  const disconnect = document.getElementById("githubOAuthDisconnect");
  if (!status || !connect || !disconnect) return;

  // The OAuth callback returns a short-lived encrypted ticket in the URL fragment.
  // Fragments are not sent to the server; capture it immediately and remove it
  // from browser history before making any network request.
  const params = new URLSearchParams(location.hash.slice(1));
  const returned = params.get("github_session");
  let ticketSaved = false;
  if (returned) {
    try {
      sessionStorage.setItem(KEY, returned);
      ticketSaved = sessionStorage.getItem(KEY) === returned;
    } catch (_) {}
    history.replaceState({}, "", location.pathname + location.search);
  }
  const getTicket = () => {
    try { return sessionStorage.getItem(KEY) || ""; } catch (_) { return ""; }
  };
  let retryButton = document.getElementById("githubOAuthRetry");
  if (!retryButton) {
    retryButton = document.createElement("button");
    retryButton.id = "githubOAuthRetry";
    retryButton.type = "button";
    retryButton.textContent = "Retry connection check";
    retryButton.hidden = true;
    status.insertAdjacentElement("afterend", retryButton);
  }

  async function api(path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const headers = new Headers(options.headers || {});
    const value = getTicket();
    if (value) headers.set("Authorization", "Bearer " + value);
    try {
      return await fetch(BACKEND + path, {
        ...options, headers, credentials: "omit", cache: "no-store",
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }
  }

  async function refresh() {
    retryButton.hidden = true;
    const value = getTicket();
    if (!value) {
      status.textContent = returned && !ticketSaved
        ? "GitHub returned successfully, but this browser could not save the secure session. Enable site storage and reconnect."
        : "Not connected · Tap “Connect GitHub securely” and approve access on GitHub.";
      return;
    }
    status.textContent = "Checking secure GitHub connection…";
    try {
      const response = await api("/api/github/status");
      let data;
      try { data = await response.json(); }
      catch (_) { throw new Error("Backend returned an unreadable response (HTTP " + response.status + ")."); }
      if (!response.ok) throw new Error((data.error || "status_check_failed") + " (HTTP " + response.status + ")");
      if (data.connected) {
        status.textContent = "Connected ✓ GitHub account: " + data.account + " · " + data.repository;
      } else {
        status.textContent = "Session was not accepted by the backend. Please reconnect GitHub.";
        retryButton.hidden = false;
      }
    } catch (error) {
      status.textContent = error.name === "AbortError"
        ? "Connection check timed out after 10 seconds. Check the backend and retry."
        : "Connection check failed: " + (error.message || "network or CORS error") + ".";
      retryButton.hidden = false;
    }
  }

  connect.addEventListener("click", () => {
    status.textContent = "Opening GitHub authorization…";
  });
  retryButton.addEventListener("click", refresh);
  disconnect.addEventListener("click", async () => {
    disconnect.disabled = true;
    try { await api("/api/github/disconnect", { method: "POST" }); } catch (_) {}
    try { sessionStorage.removeItem(KEY); } catch (_) {}
    status.textContent = "Disconnected from GitHub.";
    retryButton.hidden = true;
    disconnect.disabled = false;
  });
  refresh();
})();
