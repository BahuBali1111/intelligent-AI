"use strict";
const crypto = require("node:crypto");
const { send, readJson } = require("../_lib");
const { session } = require("./_session");

const OWNER = "BahuBali1111";
const REPO = "intelligent-AI";
const FULL = OWNER + "/" + REPO;
const BASE_BRANCH = "integration/full-build";
const EDITABLE = new Set([
  "assistant-brain.js", "research-engine.js", "knowledge.js", "memory.js",
  "context-engine.js", "code-workbench.js", "research-analyzer.js", "research-desk.js"
]);
const GH_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28"
};

function cors(req, res) {
  const origin = req.headers.origin;
  if (origin === "https://bahubali1111.github.io") {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Vary", "Origin");
  }
}
async function github(token, path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch("https://api.github.com" + path, {
      ...options,
      headers: { ...GH_HEADERS, Authorization: "Bearer " + token, ...(options.headers || {}) },
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error("github_api_error");
      error.status = response.status;
      error.detail = data.message || "GitHub API request failed";
      throw error;
    }
    return data;
  } catch (error) {
    if (error && error.name === "AbortError") {
      error.status = 504;
      error.message = "github_api_timeout";
      error.detail = "GitHub API request timed out after 15 seconds.";
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
function safePath(value) {
  const path = String(value || "").trim().replace(/^\/+/, "");
  if (!EDITABLE.has(path)) throw Object.assign(new Error("file_not_allowed_for_ai_proposal"), { status: 400 });
  return path;
}
function decodeContent(value) {
  return Buffer.from(String(value || "").replace(/\n/g, ""), "base64").toString("utf8");
}
function encodeContent(value) {
  return Buffer.from(value, "utf8").toString("base64");
}

module.exports = async function githubBridge(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return send(res, 405, { error: "method_not_allowed" });

  const auth = String(req.headers.authorization || "");
  const ticket = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const current = session({ headers: { authorization: "Bearer " + ticket, cookie: "" } });
  if (!current || !current.token || current.user !== "BahuBali1111") {
    return send(res, 401, { error: "github_session_missing_or_expired" });
  }
  let body;
  try { body = await readJson(req, 24000); }
  catch (error) { return send(res, error.status || 400, { error: error.message || "invalid_json" }); }

  try {
    const token = current.token;
    const action = String(body.action || "");
    if (action === "status") {
      const [user, repo] = await Promise.all([
        github(token, "/user"),
        github(token, "/repos/" + FULL)
      ]);
      return send(res, 200, {
        connected: user.login === current.user && repo.full_name === FULL,
        account: user.login,
        repository: repo.full_name,
        canRead: !!repo.permissions?.pull,
        canWrite: !!repo.permissions?.push
      });
    }
    if (action === "list") {
      const entries = await github(token, "/repos/" + FULL + "/contents?ref=" + encodeURIComponent(BASE_BRANCH)");
      const files = (Array.isArray(entries) ? entries : []).map(item => ({
        name: item.name, path: item.path, type: item.type, size: item.size,
        url: item.html_url
      }));
      return send(res, 200, { repository: FULL, branch: BASE_BRANCH, files });
    }
    if (action === "inspect") {
      const repo = await github(token, "/repos/" + FULL);
      const paths = [...EDITABLE];
      const files = [];
      for (const path of paths) {
        try {
          const file = await github(token, "/repos/" + FULL + "/contents/" + encodeURIComponent(path) + "?ref=" + encodeURIComponent(BASE_BRANCH)");
          if (file.type === "file" && file.content) {
            const content = decodeContent(file.content);
            files.push({ path, sha: file.sha, size: content.length, content: content.slice(0, 4500) });
          }
        } catch (error) {
          if (error.status !== 404) throw error;
        }
      }
      return send(res, 200, { repository: FULL, branch: BASE_BRANCH, canWrite: !!repo.permissions?.push, files });
    }
    if (action === "file") {
      const path = safePath(body.path);
      const ref = String(body.ref || BASE_BRANCH).slice(0, 120);
      const file = await github(token, "/repos/" + FULL + "/contents/" + encodeURIComponent(path) + "?ref=" + encodeURIComponent(ref));
      if (file.type !== "file" || !file.content) return send(res, 400, { error: "not_a_text_file" });
      const content = decodeContent(file.content);
      return send(res, 200, { repository: FULL, path, ref, sha: file.sha, content, totalLines: content.split(/\r?\n/).length });
    }
    if (action === "runs") {
      const count = Math.min(20, Math.max(1, Number(body.perPage) || 8));
      const result = await github(token, "/repos/" + FULL + "/actions/runs?per_page=" + count);
      return send(res, 200, { runs: (result.workflow_runs || []).map(run => ({
        id: run.id, name: run.name, branch: run.head_branch, sha: run.head_sha,
        status: run.status, conclusion: run.conclusion, url: run.html_url,
        created_at: run.created_at, updated_at: run.updated_at
      })) });
    }
    if (action === "run") {
      const id = String(body.runId || "");
      if (!/^\d{6,}$/.test(id)) return send(res, 400, { error: "invalid_workflow_run_id" });
      const [run, jobData] = await Promise.all([
        github(token, "/repos/" + FULL + "/actions/runs/" + id),
        github(token, "/repos/" + FULL + "/actions/runs/" + id + "/jobs?per_page=50")
      ]);
      return send(res, 200, {
        run: { id: run.id, name: run.name, branch: run.head_branch, sha: run.head_sha, status: run.status, conclusion: run.conclusion, url: run.html_url },
        jobs: (jobData.jobs || []).map(job => ({
          name: job.name, status: job.status, conclusion: job.conclusion, url: job.html_url,
          steps: (job.steps || []).map(step => ({ name: step.name, status: step.status, conclusion: step.conclusion }))
        }))
      });
    }
    if (action === "propose") {
      const title = String(body.title || "").trim().slice(0, 180);
      const description = String(body.body || "").trim().slice(0, 5000);
      const patches = body.patches;
      if (!title || !Array.isArray(patches) || patches.length < 1 || patches.length > 3) {
        return send(res, 400, { error: "proposal_requires_title_and_1_to_3_patches" });
      }
      const repo = await github(token, "/repos/" + FULL);
      if (!repo.permissions?.push) return send(res, 403, { error: "repository_write_permission_required" });

      const changes = [];
      const grouped = new Map();
      for (const patch of patches) {
        const path = safePath(patch.path);
        if (typeof patch.find !== "string" || !patch.find.trim() || typeof patch.replace !== "string") {
          return send(res, 400, { error: "invalid_patch_shape" });
        }
        const list = grouped.get(path) || [];
        list.push(patch);
        grouped.set(path, list);
      }
      for (const [path, list] of grouped) {
        const file = await github(token, "/repos/" + FULL + "/contents/" + encodeURIComponent(path) + "?ref=" + encodeURIComponent(BASE_BRANCH)");
        let content = decodeContent(file.content);
        for (const patch of list) {
          const first = content.indexOf(patch.find);
          if (first < 0 || content.indexOf(patch.find, first + patch.find.length) >= 0) {
            return send(res, 409, { error: "patch_anchor_not_unique", path, message: "No repository changes were made." });
          }
          content = content.slice(0, first) + patch.replace + content.slice(first + patch.find.length);
        }
        changes.push({ path, sha: file.sha, content });
      }
      const main = await github(token, "/repos/" + FULL + "/git/ref/heads/" + encodeURIComponent(BASE_BRANCH)");
      const branch = "ai-proposal/assistant-" + Date.now().toString(36) + "-" + crypto.randomBytes(3).toString("hex");
      await github(token, "/repos/" + FULL + "/git/refs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: "refs/heads/" + branch, sha: main.object.sha })
      });
      for (const change of changes) {
        await github(token, "/repos/" + FULL + "/contents/" + encodeURIComponent(change.path), {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "AI proposal: " + change.path,
            content: encodeContent(change.content),
            branch,
            sha: change.sha
          })
        });
      }
      const pr = await github(token, "/repos/" + FULL + "/pulls", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          head: branch,
          base: BASE_BRANCH,
          body: (description || "AI-generated proposal.") + "\n\nSafety: separate branch, allowlisted source files, exact-match patches, no automatic merge or deployment."
        })
      });
      return send(res, 201, { number: pr.number, url: pr.html_url, branch, files: changes.map(item => item.path), merged: false });
    }
    return send(res, 400, { error: "unknown_github_action" });
  } catch (error) {
    const status = [400, 401, 403, 404, 409, 422, 504].includes(error.status) ? error.status : 502;
    return send(res, status, { error: error.message || "github_bridge_failed", detail: error.detail || undefined });
  }
};

module.exports.BASE_BRANCH = BASE_BRANCH;
