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

  const EDITABLE_PATHS = ["assistant-brain.js","research-engine.js","knowledge.js","memory.js","context-engine.js","code-workbench.js","research-analyzer.js","research-desk.js"];
  function decodeBase64Utf8(value) {
    const binary = atob(String(value || "").replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  function isConnected() { return connected && !!token; }

  // Read-only GitHub tools: these methods use the token already connected in Settings.
  async function listWorkflowRuns(options = {}) {
    if (!isConnected()) throw new Error("पहले Settings में GitHub connect करें।");
    const branch = options.branch ? "&branch=" + encodeURIComponent(options.branch) : "";
    const perPage = Math.min(20, Math.max(1, Number(options.perPage) || 10));
    const data = await api("/repos/" + OWNER + "/" + REPO + "/actions/runs?per_page=" + perPage + branch);
    return (data.workflow_runs || []).map(run => ({
      id: run.id, name: run.name, title: run.display_title, branch: run.head_branch,
      sha: run.head_sha, status: run.status, conclusion: run.conclusion,
      event: run.event, created_at: run.created_at, updated_at: run.updated_at,
      url: run.html_url, jobs_url: run.jobs_url
    }));
  }
  async function inspectWorkflowRun(runId) {
    if (!isConnected()) throw new Error("पहले Settings में GitHub connect करें।");
    const id = String(runId || "").trim();
    if (!/^\d{6,}$/.test(id)) throw new Error("Workflow Run ID केवल अंकों में दें।");
    const base = "/repos/" + OWNER + "/" + REPO + "/actions/runs/" + id;
    const [run, jobData] = await Promise.all([
      api(base),
      api(base + "/jobs?per_page=50")
    ]);
    const jobs = (jobData.jobs || []).map(job => ({
      id: job.id, name: job.name, status: job.status, conclusion: job.conclusion,
      started_at: job.started_at, completed_at: job.completed_at,
      html_url: job.html_url,
      steps: (job.steps || []).map(step => ({
        name: step.name, status: step.status, conclusion: step.conclusion, number: step.number
      }))
    }));
    return {
      run: {
        id: run.id, name: run.name, title: run.display_title, branch: run.head_branch,
        sha: run.head_sha, status: run.status, conclusion: run.conclusion,
        event: run.event, created_at: run.created_at, updated_at: run.updated_at,
        url: run.html_url
      },
      jobs,
      note: "यह GitHub Actions API से आया वास्तविक run/job/step डेटा है। विस्तृत raw console logs के लिए run या failed job का GitHub URL खोलें।"
    };
  }
  async function inspectRepositoryFile(path, ref = "main", line = null) {
    if (!isConnected()) throw new Error("पहले Settings में GitHub connect करें।");
    const cleanPath = String(path || "").trim().replace(/^\/+/, "");
    if (!cleanPath || cleanPath.split("/").some(part => !part || part === "." || part === "..")) {
      throw new Error("Valid repository file path दें।");
    }
    const item = await api("/repos/" + OWNER + "/" + REPO + "/contents/" + cleanPath.split("/").map(encodeURIComponent).join("/") + "?ref=" + encodeURIComponent(ref || "main"));
    if (item.type !== "file" || !item.content) throw new Error("यह सामान्य text file नहीं है या GitHub ने content नहीं दिया।");
    const content = decodeBase64Utf8(item.content);
    const lines = content.split(/\r?\n/);
    const target = Number(line);
    const excerpt = Number.isInteger(target) && target > 0
      ? lines.slice(Math.max(0, target - 6), Math.min(lines.length, target + 5)).map((value, index) => ({ number: Math.max(1, target - 5) + index, text: value }))
      : lines.slice(0, 300).map((value, index) => ({ number: index + 1, text: value }));
    return { repository: OWNER + "/" + REPO, path: cleanPath, ref: ref || "main", sha: item.sha, totalLines: lines.length, excerpt, content: line ? undefined : content };
  }
  async function inspect() {
    if (!isConnected()) throw new Error("GitHub is not connected in this page session.");
    const files = [];
    for (const path of EDITABLE_PATHS) {
      if (files.length >= 4) break;
      try {
        const item = await api("/repos/" + OWNER + "/" + REPO + "/contents/" + path + "?ref=main");
        if (item.type !== "file" || !item.content) continue;
        const text = decodeBase64Utf8(item.content);
        files.push({ path, sha: item.sha, size: text.length, content: text.slice(0, 9000) });
      } catch (error) {
        if (!String(error.message).includes("404")) throw error;
      }
    }
    return { repository: OWNER + "/" + REPO, branch: "main", files };
  }
  async function proposePatches(patches, title, body) {
    if (!isConnected()) throw new Error("GitHub is not connected in this page session.");
    if (!Array.isArray(patches) || patches.length < 1 || patches.length > 5) throw new Error("A proposal must contain 1–5 small patches.");
    const grouped = new Map();
    for (const patch of patches) {
      const path = safePath(String(patch.path || ""));
      if (!EDITABLE_PATHS.includes(path)) throw new Error("This trial can edit only approved application source files; blocked: " + path);
      if (typeof patch.find !== "string" || !patch.find.trim() || typeof patch.replace !== "string") throw new Error("Each patch needs exact find and replace text.");
      const list = grouped.get(path) || [];
      list.push(patch);
      grouped.set(path, list);
    }
    const changes = [];
    for (const [path, list] of grouped) {
      const current = await api("/repos/" + OWNER + "/" + REPO + "/contents/" + path + "?ref=main");
      if (!current.content) throw new Error("Could not read current file: " + path);
      let text = decodeBase64Utf8(current.content);
      for (const patch of list) {
        const first = text.indexOf(patch.find);
        if (first < 0 || text.indexOf(patch.find, first + patch.find.length) >= 0) {
          throw new Error("Patch anchor must occur exactly once in " + path + ". No repository changes were made.");
        }
        text = text.slice(0, first) + patch.replace + text.slice(first + patch.find.length);
      }
      changes.push({ path, sha: current.sha, content: text });
    }
    const base = await api("/repos/" + OWNER + "/" + REPO + "/git/ref/heads/main");
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z").toLowerCase();
    const branch = "ai-proposal/chat-" + stamp;
    await api("/repos/" + OWNER + "/" + REPO + "/git/refs", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: "refs/heads/" + branch, sha: base.object.sha })
    });
    for (const change of changes) {
      await api("/repos/" + OWNER + "/" + REPO + "/contents/" + change.path.split("/").map(encodeURIComponent).join("/"), {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "AI proposal: " + change.path, content: toBase64Utf8(change.content), branch, sha: change.sha })
      });
    }
    const pr = await api("/repos/" + OWNER + "/" + REPO + "/pulls", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: String(title || "Intelligent AI self-improvement proposal").slice(0, 180), head: branch, base: "main",
        body: String(body || "AI-generated trial proposal. Review all changes and CI checks. No automatic merge or deployment.") + "\n\nTrial safeguards: separate branch, exact-match patches, limited source-file allowlist, no workflow/secrets changes, no automatic merge." })
    });
    say("Chat proposal created ✓ Pull Request #" + pr.number + " · " + pr.html_url);
    return { number: pr.number, url: pr.html_url, branch, files: changes.map(x => x.path) };
  }
  window.IntelligentGitHubBridge = {
    isConnected, inspect, proposePatches, listWorkflowRuns, inspectWorkflowRun, inspectRepositoryFile,
    repository: OWNER + "/" + REPO
  };

  $("githubReadConnect").addEventListener("submit", connect);
  $("githubReadDisconnect").addEventListener("click", disconnect);
  $("githubWriteForm").addEventListener("submit", createProposal);
  window.addEventListener("pagehide", () => { token = ""; connected = false; });
})();