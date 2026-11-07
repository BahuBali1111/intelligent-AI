(function(root) {
  "use strict";
  const DB_NAME = "intelligent-ai-workspace";
  const DB_VERSION = 1;
  const STORE_NAME = "handles";
  const HANDLE_KEY = "root-directory";
  const MAX_FILE_CHARS = 40000;
  const MAX_PROJECT_CHARS = 160000;

  function supported() {
    return typeof root.showDirectoryPicker === "function" && typeof root.indexedDB !== "undefined";
  }
  function openDb() {
    return new Promise((resolve, reject) => {
      const request = root.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open workspace storage."));
    });
  }
  async function storeHandle(handle) {
    const db = await openDb();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error("Could not remember workspace folder."));
        tx.onabort = () => reject(tx.error || new Error("Workspace permission storage was aborted."));
      });
    } finally { db.close(); }
  }
  async function loadHandle() {
    const db = await openDb();
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(HANDLE_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error("Could not restore workspace folder."));
      });
    } finally { db.close(); }
  }
  async function clearHandle() {
    const db = await openDb();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(HANDLE_KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error("Could not forget workspace folder."));
      });
    } finally { db.close(); }
  }
  async function permission(handle, request) {
    if (!handle) return false;
    const options = { mode: "readwrite" };
    let state = await handle.queryPermission(options);
    if (state !== "granted" && request) state = await handle.requestPermission(options);
    return state === "granted";
  }
  function cleanSegment(value) {
    const segment = String(value || "").trim();
    if (!segment || segment === "." || segment === ".." || /[\/\\<>:"|?*\u0000-\u001f]/.test(segment) || segment.length > 120) {
      throw new Error("Unsafe folder or file name: " + segment);
    }
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(segment)) throw new Error("This file name is reserved by the operating system: " + segment);
    return segment;
  }
  function cleanRelativePath(value) {
    const raw = String(value || "").replace(/\\/g, "/");
    if (!raw || raw.startsWith("/") || raw.length > 500) throw new Error("Workspace path must be relative.");
    const parts = raw.split("/").map(cleanSegment);
    if (parts.some(part => /^\.env($|\.)/i.test(part) || /^(id_rsa|id_ed25519|credentials\.json|secrets?\.(json|ya?ml))$/i.test(part) || /\.(pem|p12|pfx|key)$/i.test(part))) {
      throw new Error("Secret and private-key files cannot be written to the workspace.");
    }
    return parts;
  }
  async function getDirectory(rootHandle, parts, create) {
    let current = rootHandle;
    for (const part of parts) current = await current.getDirectoryHandle(part, { create: !!create });
    return current;
  }
  async function writeText(rootHandle, relativePath, content) {
    const parts = cleanRelativePath(relativePath);
    const text = String(content == null ? "" : content);
    if (text.length > MAX_FILE_CHARS) throw new Error("File is larger than the workspace limit: " + relativePath);
    const parent = await getDirectory(rootHandle, parts.slice(0, -1), true);
    const fileHandle = await parent.getFileHandle(parts[parts.length - 1], { create: true });
    const writable = await fileHandle.createWritable();
    try { await writable.write(text); await writable.close(); }
    catch (error) { try { await writable.abort(); } catch (_) {} throw error; }
    return { path: parts.join("/"), chars: text.length };
  }
  function slug(value) {
    const result = String(value || "new-project").toLowerCase().normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
    return result || "new-project";
  }
  async function uniqueProjectFolder(rootHandle, projectName) {
    const projects = await rootHandle.getDirectoryHandle("Projects", { create: true });
    const base = slug(projectName);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const name = base + "-" + stamp;
    const folder = await projects.getDirectoryHandle(name, { create: true });
    return { folder, path: "Projects/" + name };
  }
  let rootHandle = null;
  let rootName = "";
  async function connect() {
    if (!supported()) throw new Error("This browser does not support folder access. Open Intelligent AI in a recent Chrome browser on Android or desktop.");
    const handle = await root.showDirectoryPicker({ id: "intelligent-ai-workspace", mode: "readwrite", startIn: "documents" });
    if (!(await permission(handle, true))) throw new Error("Write permission was not granted for the selected folder.");
    rootHandle = handle;
    rootName = handle.name;
    await storeHandle(handle);
    return status();
  }
  async function restore() {
    if (!supported()) return status();
    try {
      const handle = await loadHandle();
      if (!handle) return status();
      rootHandle = handle;
      rootName = handle.name;
    } catch (_) { rootHandle = null; rootName = ""; }
    return status();
  }
  async function ensurePermission() {
    if (!rootHandle) throw new Error("पहले Workspace Folder चुनें।");
    if (!(await permission(rootHandle, false))) throw new Error("Workspace permission expired. Press Connect Workspace again and allow read/write access.");
    return rootHandle;
  }
  async function writeProject(manifest, drafts) {
    const handle = await ensurePermission();
    if (!Array.isArray(drafts) || !drafts.length) throw new Error("There are no generated files to save.");
    const total = drafts.reduce((sum, item) => sum + String(item.content || "").length, 0);
    if (total > MAX_PROJECT_CHARS) throw new Error("Project exceeds the workspace size limit.");
    const project = await uniqueProjectFolder(handle, manifest && manifest.projectName);
    const written = [];
    for (const item of drafts) written.push(await writeText(project.folder, cleanRelativePath(item.path).join("/"), item.content));
    const readme = ["# " + String(manifest.projectName || "AI Generated Project"), "", String(manifest.summary || ""), "", "## Architecture", "", String(manifest.architecture || ""), "", "## Generated files", "", ...written.map(item => "- " + item.path)].join("\n") + "\n";
    await writeText(project.folder, written.some(item => item.path.toLowerCase() === "readme.md") ? "WORKSPACE-README.md" : "README.md", readme);
    return { folder: project.path, files: written, readme: true };
  }
  function status() {
    return { supported: supported(), connected: !!rootHandle, folderName: rootName,
      canCreateFolders: !!(rootHandle && typeof rootHandle.getDirectoryHandle === "function"),
      canWriteFiles: !!(rootHandle && typeof rootHandle.getFileHandle === "function") };
  }
  async function disconnect() { rootHandle = null; rootName = ""; await clearHandle(); return status(); }
  const api = { supported, connect, restore, status, writeProject, disconnect, cleanRelativePath };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IntelligentLocalWorkspace = api;
})(typeof window !== "undefined" ? window : globalThis);
