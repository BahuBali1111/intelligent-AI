"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const agent = require("../coding-agent.js");
function memoryWorkbench() {
  const drafts = [];
  return { drafts, create(input) { const draft = { ...input, id: "draft-" + (drafts.length + 1) }; drafts.push(draft); return draft; } };
}
function manifest() {
  return JSON.stringify({
    projectName: "Tiny task app",
    summary: "A small task application.",
    architecture: "Vanilla JavaScript with local storage.",
    files: [
      { path: "index.html", purpose: "Accessible app shell." },
      { path: "app.js", purpose: "Task behavior and persistence." },
      { path: "tests/app.test.js", purpose: "Tests for task behavior." }
    ]
  });
}
test("parses a fenced project manifest and preserves file order", () => {
  const fence = String.fromCharCode(96).repeat(3);
  const result = agent.parseManifest(fence + "json\n" + manifest() + "\n" + fence, 4);
  assert.equal(result.projectName, "Tiny task app");
  assert.deepEqual(result.files.map(file => file.path), ["index.html", "app.js", "tests/app.test.js"]);
});
test("rejects traversal, duplicate and secret file paths", () => {
  assert.throws(() => agent.safePath("../outside.js"), /Unsafe project file path/);
  assert.throws(() => agent.safePath(".env"), /Secret or private-key/);
  assert.throws(() => agent.safePath("config/private.pem"), /Secret or private-key/);
  assert.throws(() => agent.parseManifest({ files: [{ path: "app.js", purpose: "one" }, { path: "APP.js", purpose: "two" }] }), /Duplicate/);
});
test("enforces the maximum file count and required purpose", () => {
  assert.throws(() => agent.parseManifest({ files: Array.from({ length: 9 }, (_, i) => ({ path: "f" + i + ".js", purpose: "x" })) }), /between 1 and 8/);
  assert.throws(() => agent.parseManifest({ files: [{ path: "app.js", purpose: "" }] }), /needs a purpose/);
});
test("extracts fenced code and rejects truncated or empty model output", () => {
  const fence = String.fromCharCode(96).repeat(3);
  assert.equal(agent.extractCode(fence + "js\nconst answer = 42;\n" + fence, "app.js", "stop"), "const answer = 42;\n");
  assert.throws(() => agent.extractCode("const x = 1", "app.js", "length"), /truncated/);
  assert.throws(() => agent.extractCode("  ", "app.js", "stop"), /empty code/);
});
test("generates a multi-file project sequentially and stores review drafts", async () => {
  const workbench = memoryWorkbench(), calls = [];
  const client = {
    isConnected: () => true,
    async chat(messages) {
      calls.push(messages);
      if (calls.length === 1) return { text: manifest(), finishReason: "stop" };
      return { text: "// generated " + calls.length, finishReason: "stop" };
    }
  };
  const progress = [];
  const result = await agent.generateProject({
    client, workbench, brief: "Build a small task app with create, complete and delete actions.",
    stack: "Vanilla JavaScript", maxFiles: 4, onProgress: event => progress.push(event)
  });
  assert.equal(result.complete, true);
  assert.equal(result.drafts.length, 3);
  assert.equal(workbench.drafts.length, 3);
  assert.equal(calls.length, 4);
  assert.equal(progress[0].stage, "planning");
  assert.equal(progress.at(-1).stage, "complete");
  assert.equal(workbench.drafts[1].path, "app.js");
});
test("does not create drafts when provider is disconnected or brief is too short", async () => {
  const workbench = memoryWorkbench();
  await assert.rejects(() => agent.generateProject({ client: { isConnected: () => false, chat() {} }, workbench, brief: "A sufficiently long project brief." }), /Connect an AI provider/);
  await assert.rejects(() => agent.generateProject({ client: { isConnected: () => true, chat() {} }, workbench, brief: "short" }), /at least 20 characters/);
  assert.equal(workbench.drafts.length, 0);
});
test("preserves completed file drafts when a later model response fails", async () => {
  const workbench = memoryWorkbench();
  let calls = 0;
  const client = { isConnected: () => true, async chat() { calls++; if (calls === 1) return { text: manifest(), finishReason: "stop" }; if (calls === 2) return { text: "valid first file", finishReason: "stop" }; throw new Error("provider timeout"); } };
  await assert.rejects(() => agent.generateProject({ client, workbench, brief: "Build a small task app with persistent tasks." }), /provider timeout/);
  assert.equal(workbench.drafts.length, 1);
});
