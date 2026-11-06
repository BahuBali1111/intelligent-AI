"use strict";
const { send } = require("./_lib");
module.exports = function health(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { ok: false, error: "method_not_allowed" });
  }
  return send(res, 200, {
    ok: true, service: "intelligent-ai-backend", version: "0.1.0",
    runtime: "serverless",
    modelConfigured: Boolean(process.env.AI_PROVIDER_URL && process.env.AI_PROVIDER_API_KEY && process.env.AI_MODEL),
    authenticationConfigured: Boolean(process.env.IA_BACKEND_TOKEN),
    timestamp: new Date().toISOString()
  });
};
