"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { cookies } = require("../api/github/_session");
const githubBridge = require("../api/github/bridge");
const { send, allowedOrigin, authorize, readJson } = require("../api/_lib");
const health = require("../api/health");

function response() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; return this; },
    end(value = "") { this.body = value; return this; }
  };
}

test("send returns JSON and disables caching", () => {
  const res = response();
  send(res, 202, { ok: true });
  assert.equal(res.statusCode, 202);
  assert.equal(res.headers["Cache-Control"], "no-store");
  assert.deepEqual(JSON.parse(res.body), { ok: true });
});

test("origin policy rejects browser requests unless exact origin is configured", () => {
  const previous = process.env.IA_ALLOWED_ORIGIN;
  delete process.env.IA_ALLOWED_ORIGIN;
  assert.equal(allowedOrigin({ headers: { origin: "https://example.com" } }), false);
  assert.equal(allowedOrigin({ headers: {} }), true);
  process.env.IA_ALLOWED_ORIGIN = "https://example.com";
  assert.equal(allowedOrigin({ headers: { origin: "https://example.com" } }), true);
  assert.equal(allowedOrigin({ headers: { origin: "https://evil.example" } }), false);
  if (previous === undefined) delete process.env.IA_ALLOWED_ORIGIN;
  else process.env.IA_ALLOWED_ORIGIN = previous;
});

test("authorization requires a configured server secret and valid bearer", () => {
  const previous = process.env.IA_BACKEND_TOKEN;
  delete process.env.IA_BACKEND_TOKEN;
  assert.equal(authorize({ headers: {} }).status, 503);
  process.env.IA_BACKEND_TOKEN = "test-secret-value";
  assert.equal(authorize({ headers: { authorization: "Bearer wrong" } }).ok, false);
  assert.equal(authorize({ headers: { authorization: "Bearer test-secret-value" } }).ok, true);
  if (previous === undefined) delete process.env.IA_BACKEND_TOKEN;
  else process.env.IA_BACKEND_TOKEN = previous;
});

test("readJson parses valid request body", async () => {
  const req = new EventEmitter();
  const pending = readJson(req);
  req.emit("data", Buffer.from('{"messages":[]}'));
  req.emit("end");
  assert.deepEqual(await pending, { messages: [] });
});

test("health endpoint reports model configuration without exposing secrets", () => {
  const res = response();
  const previous = {
    key: process.env.AI_PROVIDER_API_KEY,
    url: process.env.AI_PROVIDER_URL,
    model: process.env.AI_MODEL
  };
  delete process.env.AI_PROVIDER_API_KEY;
  delete process.env.AI_PROVIDER_URL;
  delete process.env.AI_MODEL;
  health({ method: "GET" }, res);
  const body = JSON.parse(res.body);
  assert.equal(res.statusCode, 200);
  assert.equal(body.ok, true);
  assert.equal(body.modelConfigured, false);
  assert.equal(JSON.stringify(body).includes("secret"), false);
  for (const [key, value] of [["AI_PROVIDER_API_KEY", previous.key], ["AI_PROVIDER_URL", previous.url], ["AI_MODEL", previous.model]]) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("health endpoint rejects unsupported methods", () => {
  const res = response();
  health({ method: "POST" }, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "GET");
});

test("malformed cookie encoding is ignored without throwing",()=>{const parsed=cookies({headers:{cookie:"good=value; ia_github_session=%E0%A4%A; other=ok"}});assert.equal(parsed.good,"value");assert.equal(parsed.ia_github_session,"");assert.equal(parsed.other,"ok")});
test("AI GitHub proposals use the integration branch rather than main",()=>{assert.equal(githubBridge.BASE_BRANCH,"integration/full-build")});
