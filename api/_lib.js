"use strict";
function send(res, status, payload) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}
function allowedOrigin(req) {
  const configured = process.env.IA_ALLOWED_ORIGIN;
  const origin = req.headers.origin;
  return configured ? origin === configured : !origin;
}
function authorize(req) {
  const expected = process.env.IA_BACKEND_TOKEN;
  if (!expected) return { ok: false, status: 503, error: "backend_auth_not_configured" };
  const header = String(req.headers.authorization || "");
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!supplied || supplied.length !== expected.length) return { ok: false, status: 401, error: "unauthorized" };
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return diff === 0 ? { ok: true } : { ok: false, status: 401, error: "unauthorized" };
}
function readJson(req, maxBytes = 12000) {
  return new Promise((resolve, reject) => {
    let raw = "", size = 0;
    req.on("data", chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(Object.assign(new Error("request_too_large"), { status: 413 }));
        req.destroy();
        return;
      }
      raw += chunk.toString("utf8");
    });
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); }
      catch (_) { reject(Object.assign(new Error("invalid_json"), { status: 400 })); }
    });
    req.on("error", reject);
  });
}
module.exports = { send, allowedOrigin, authorize, readJson };
