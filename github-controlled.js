(() => {
  "use strict";
  const OWNER = "BahuBali1111";
  const REPO = "intelligent-AI";
  const API = "https://api.github.com";
  const $ = (id) => document.getElementById(id);
  let token = "";
  let connected = false;
  const status = $("githubReadStatus");
  const say = (message) => { status.textContent = message; };
  const headers = () => ({
    "Accept": "application/vnd.github+json",
    "Authorization": "Bearer " + token,
    "X-GitHub-Api-Version": "2022-11-28"
  });
  async function api(path, options = {}) {
    const response = await fetch(API + path, {
      ...options,
      headers: { ...headers(), ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data.message ? " — " + data.message : "";
      throw new Error("GitHub API " + response.status + detail);
    }
    return data;
  }
  function disconnect() {
    token = "";
    connected = false;
    $("githubReadToken").value = "";
    $("githubReadConnectButton").disabled = false;
    $("githubWriteForm").hidden = true;
    $("githubReadFiles").replaceChildren();
    $("githubReadPreview").textContent = "";
    say("Disconnected. Token memory से साफ कर दिया गया।");
  }
  async function connect(event) {
    event.preventDefault();
    const supplied = $("githubReadToken").value.trim();
    if (!supplied) return say("पहले अपना Fine-grained GitHub token डालें।");
    token = supplied;
    $("githubReadToken").value = "";
    $("githubReadConnectButton").disabled = true;
    say("GitHub repository और Write permission जाँच रहे हैं…");
    try {
      const repo = await api("/repos/" + OWNER + "/" + REPO);
      if (repo.full_name !== OWNER + "/" + REPO) throw new Error("गलत repository मिली।");
      if (!repo.permissions || repo.permissions.push !== true) {
        throw new Error("Token में Contents: Read and write अनुमति नहीं मिली।");
      }
      connected = true;
      $("githubWriteForm").hidden = false;
      say("Connected ✓ " + repo.full_name + " · Contents write permission verified. बदलाव केवल नई branch और PR में होंगे।");
    } catch (error) {
      token = "";
      connected = false;
      say("Connection failed: " + error.message + " · Token memory से साफ कर दिया गया।");
    } finally {
      $("githubReadConnectButton").disabled = false;
    }
  }
  function safePath(path) {
    const p = path.trim().replace(/^\/+/, "");
    if (!p || p.split("/").some(part => !part || part === "." || part === "..")) {
      throw new Error("Valid repository file path लिखें।");
    }
    if (/^\.github\/workflows\//i.test(p) || /(^|\/)\.env($|\.)/i.test(p) ||
        /(^|\/)(secrets?|credentials?)(\/|\.|$)/i.test(p) ||
        /\.(pem|key|p12|pfx)$/i.test(p)) {
      throw new Error("पहले चरण में workflow, secret और private-key फाइलें बदलने की अनुमति नहीं है।");
    }
    return p;
  }
  function toBase64Utf8(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  }
  async function createProposal(event) {
    event.preventDefault();
    if (!connected || !token) return say("पहले GitHub connect करें।");
    let path;
    try { path = safePath($("githubWritePath").value); }
    catch (error) { return say(error.message); }
    const content = $("githubWriteContent").value;
    const title = $("githubWriteTitle").value.trim();
    const message = $("githubWriteMessage").value.trim() || "Propose AI update: " + path;
    if (!title || !content.trim()) return say("PR title और file content दोनों भरें।");
    if (!confirm("यह बदलाव " + path + " फाइल में नई branch पर लिखकर main के लिए Pull Request बनाएगा। main सीधे नहीं बदलेगा। आगे बढ़ें?")) return;
    $("githubWriteSubmit").disabled = true;
    try {
      const base = await api("/repos/" + OWNER + "/" + REPO + "/git/ref/heads/main");
      const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z").toLowerCase();
      const branch = "ai-proposal/browser-" + stamp;
      await api("/repos/" + OWNER + "/" + REPO + "/git/refs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: "refs/heads/" + branch, sha: base.object.sha })
      });
      let sha;
      try {
        const existing = await api("/repos/" + OWNER + "/" + REPO + "/contents/" + path.split("/").map(encodeURIComponent).join("/") + "?ref=" + encodeURIComponent(branch));
        sha = existing.sha;
      } catch (error) {
        if (!String(error.message).includes("404")) throw error;
      }
      await api("/repos/" + OWNER + "/" + REPO + "/contents/" + path.split("/").map(encodeURIComponent).join("/"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          content: toBase64Utf8(content),
          branch,
          ...(sha ? { sha } : {})
        })
      });
      const pr = await api("/repos/" + OWNER + "/" + REPO + "/pulls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          head: branch,
          base: "main",
          body: "Proposed from Intelligent AI browser GitHub connection.\n\nPlease inspect the changed files and CI results. This connection never merges or deploys automatically."
        })
      });
      say("Proposal uploaded ✓ Pull Request #" + pr.number + " created. Review: " + pr.html_url);
      $("githubReadPreview").textContent = "Branch: " + branch + "\nFile: " + path + "\nPull Request: " + pr.html_url;
      $("githubWriteContent").value = "";
    } catch (error) {
      say("Proposal failed: " + error.message + ". अगर branch बन गई हो तो भी main नहीं बदला; GitHub में branch जाँच सकते हैं।");
    } finally {
      $("githubWriteSubmit").disabled = false;
    }
  }
  $("githubReadConnect").addEventListener("submit", connect);
  $("githubReadDisconnect").addEventListener("click", disconnect);
  $("githubWriteForm").addEventListener("submit", createProposal);
  window.addEventListener("pagehide", () => { token = ""; connected = false; });
})();