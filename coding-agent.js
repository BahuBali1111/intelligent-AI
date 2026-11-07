(function(root) {
  "use strict";
  const MAX_FILES = 8;
  const MAX_FILE_CHARS = 40000;
  const MAX_TOTAL_CHARS = 160000;
  function safePath(value) {
    const path = String(value || "").trim().replace(/\\/g, "/");
    if (!path || path.length > 200 || path.startsWith("/") || path.split("/").some(part => !part || part === "." || part === "..") || /[\u0000-\u001f]/.test(path)) throw new Error("Unsafe project file path: " + path);
    const lower = path.toLowerCase();
    if (/(^|\/)\.env($|\.)/.test(lower) || /(^|\/)(id_rsa|id_ed25519|credentials\.json|secrets?\.(json|ya?ml))$/.test(lower) || /\.(pem|p12|pfx|key)$/.test(lower)) throw new Error("Secret or private-key files cannot be generated into a project draft.");
    return path;
  }
  function parseJsonResponse(value) {
    let text = String(value || "").trim().replace(/^\uFEFF/, "");
    const fenced = text.match(/^\x60{3}(?:json)?\s*([\s\S]*?)\s*\x60{3}$/i);
    if (fenced) text = fenced[1].trim();
    try { return JSON.parse(text); }
    catch (_) {
      const start = text.indexOf("{"), end = text.lastIndexOf("}");
      if (start >= 0 && end > start) { try { return JSON.parse(text.slice(start, end + 1)); } catch (_) {} }
      throw new Error("AI did not return valid project JSON. Please retry with a shorter project brief.");
    }
  }
  function parseManifest(value, maxFiles) {
    const data = typeof value === "string" ? parseJsonResponse(value) : value;
    if (!data || typeof data !== "object" || !Array.isArray(data.files)) throw new Error("Project plan must contain a files array.");
    const limit = Math.min(MAX_FILES, Math.max(1, Number(maxFiles) || MAX_FILES));
    if (!data.files.length || data.files.length > limit) throw new Error("The plan must contain between 1 and " + limit + " files.");
    const seen = new Set();
    const files = data.files.map((file, index) => {
      const path = safePath(file && file.path);
      if (seen.has(path.toLowerCase())) throw new Error("Duplicate project file path: " + path);
      seen.add(path.toLowerCase());
      const purpose = String(file && file.purpose || "").trim();
      if (!purpose) throw new Error("Every planned file needs a purpose: " + path);
      return { path, purpose: purpose.slice(0, 1200), order: index + 1 };
    });
    return { projectName: String(data.projectName || "New project").trim().slice(0, 120), summary: String(data.summary || "").trim().slice(0, 2000), architecture: String(data.architecture || "").trim().slice(0, 3000), files };
  }
  function extractCode(value, path, finishReason) {
    if (finishReason === "length" || finishReason === "max_tokens") throw new Error("AI output for " + path + " was truncated by the model token limit. Regenerate this file with a smaller scope.");
    let text = String(value || "").trim();
    const match = text.match(/^\x60{3}[a-zA-Z0-9_+.-]*\s*([\s\S]*?)\s*\x60{3}$/);
    if (match) text = match[1].trim();
    if (!text) throw new Error("AI returned empty code for " + path + ".");
    if (text.length > MAX_FILE_CHARS) throw new Error("Generated file is too large: " + path);
    return text + "\n";
  }
  async function generateProject(options) {
    const opts = options || {}, client = opts.client, workbench = opts.workbench;
    const brief = String(opts.brief || "").trim(), stack = String(opts.stack || "Choose a suitable, simple stack").trim();
    const maxFiles = Math.min(MAX_FILES, Math.max(1, Number(opts.maxFiles) || 6));
    if (!client || typeof client.chat !== "function" || typeof client.isConnected !== "function" || !client.isConnected()) throw new Error("Connect an AI provider in Settings before generating a project.");
    if (!workbench || typeof workbench.create !== "function") throw new Error("Local code draft storage is unavailable.");
    if (brief.length < 20) throw new Error("Describe the project in at least 20 characters.");
    if (brief.length > 8000) throw new Error("Project brief must be 8,000 characters or fewer.");
    const progress = typeof opts.onProgress === "function" ? opts.onProgress : function() {};
    progress({ stage: "planning", message: "Designing project architecture…" });
    const planReply = await client.chat([
      { role: "system", content: "You are a senior software architect. Return ONLY valid JSON, no markdown. Design a practical, runnable multi-file project. Include source files, configuration, README and meaningful tests where appropriate. Keep scope coherent and avoid unnecessary dependencies. Never include secrets, API keys, credentials, private keys, or .env files. Schema: {\"projectName\":string,\"summary\":string,\"architecture\":string,\"files\":[{\"path\":string,\"purpose\":string}]}. Use 1 to " + maxFiles + " files. Paths must be relative to the project root." },
      { role: "user", content: "Project brief:\n" + brief + "\nPreferred stack: " + stack + "\nPlan the smallest complete implementation that can be expanded later." }
    ], { maxTokens: 3000 });
    if (planReply.finishReason === "length" || planReply.finishReason === "max_tokens") throw new Error("The project plan was truncated. Reduce the brief or choose fewer files.");
    const manifest = parseManifest(planReply.text, maxFiles), drafts = [];
    let totalChars = 0;
    for (const file of manifest.files) {
      progress({ stage: "generating", index: file.order, total: manifest.files.length, path: file.path, message: "Generating " + file.path + " (" + file.order + "/" + manifest.files.length + ")…" });
      const reply = await client.chat([
        { role: "system", content: "You are a senior software engineer implementing one file in a multi-file project. Output ONLY the complete file contents, with no markdown fences or explanation. Write maintainable code with clear errors, input validation and useful comments. Do not include secrets. Do not leave TODO placeholders for core requested behavior. Respect the file purpose and architecture. If this file is a test, write executable tests for the described behavior." },
        { role: "user", content: "Project: " + manifest.projectName + "\nBrief: " + brief + "\nStack: " + stack + "\nArchitecture: " + manifest.architecture + "\nProject summary: " + manifest.summary + "\nAll planned files:\n" + manifest.files.map(x => x.order + ". " + x.path + " — " + x.purpose).join("\n") + "\n\nNow generate file " + file.order + ": " + file.path + "\nPurpose: " + file.purpose + "\nReturn the entire file, not a diff." }
      ], { maxTokens: 8192 });
      const code = extractCode(reply.text, file.path, reply.finishReason);
      totalChars += code.length;
      if (totalChars > MAX_TOTAL_CHARS) throw new Error("Project exceeded the total draft size limit. Reduce the number or size of files.");
      const draft = workbench.create({ path: file.path, reason: "AI-generated project draft: " + manifest.projectName + ". " + file.purpose, before: "", after: code });
      drafts.push({ path: file.path, draftId: draft.id, chars: code.length });
    }
    progress({ stage: "complete", message: "Generated " + drafts.length + " project files as local review drafts." });
    return { manifest, drafts, complete: true, totalChars };
  }
  const api = { MAX_FILES, MAX_FILE_CHARS, MAX_TOTAL_CHARS, safePath, parseManifest, extractCode, generateProject };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IntelligentCodingAgent = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
