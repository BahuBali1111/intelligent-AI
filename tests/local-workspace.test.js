"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const workspace = require("../local-workspace.js");

test("normalizes nested relative paths", () => {
  assert.deepEqual(workspace.cleanRelativePath("src/components/App.js"), ["src", "components", "App.js"]);
  assert.deepEqual(workspace.cleanRelativePath("src\\components\\App.js"), ["src", "components", "App.js"]);
});
test("rejects absolute paths and traversal segments", () => {
  assert.throws(() => workspace.cleanRelativePath("/storage/file.js"), /relative/);
  assert.throws(() => workspace.cleanRelativePath("../outside.js"), /Unsafe folder or file name/);
  assert.throws(() => workspace.cleanRelativePath("src/../../outside.js"), /Unsafe folder or file name/);
});
test("rejects secret and private-key files at every depth", () => {
  assert.throws(() => workspace.cleanRelativePath(".env"), /Secret and private-key/);
  assert.throws(() => workspace.cleanRelativePath("config/.env.production"), /Secret and private-key/);
  assert.throws(() => workspace.cleanRelativePath("keys/server.pem"), /Secret and private-key/);
  assert.throws(() => workspace.cleanRelativePath("credentials.json"), /Secret and private-key/);
});
test("rejects unsafe path characters and oversized segments", () => {
  assert.throws(() => workspace.cleanRelativePath("src/bad:name.js"), /Unsafe folder or file name/);
  assert.throws(() => workspace.cleanRelativePath("a".repeat(121) + ".js"), /Unsafe folder or file name/);
});
test("reports folder picker support without requesting access", () => {
  assert.equal(workspace.status().connected, false);
  assert.equal(typeof workspace.supported(), "boolean");
});
