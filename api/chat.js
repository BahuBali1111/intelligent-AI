"use strict";

const { send, allowedOrigin, authorize, readJson } = require("./_lib");

function validProviderUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch (_) {
    return false;
  }
}

module.exports = async function chat(req, res) {
  if (req.method === "OPTIONS") {
    if (!allowedOrigin(req)) return send(res, 403, { error: "origin_not_allowed" });
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Vary", "Origin");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return send(res, 405, { error: "method_not_allowed" });
  }
  if (!allowedOrigin(req)) return send(res, 403, { error: "origin_not_allowed" });

  const auth = authorize(req);
  if (!auth.ok) return send(res, auth.status, { error: auth.error });

  const endpoint = process.env.AI_PROVIDER_URL || "";
  const apiKey = process.env.AI_PROVIDER_API_KEY || "";
  const model = process.env.AI_MODEL || "";
  if (!endpoint || !apiKey || !model) {
    return send(res, 503, { error: "model_not_configured", message: "The secure backend is installed, but no model provider has been configured." });
  }
  if (!validProviderUrl(endpoint)) return send(res, 500, { error: "invalid_provider_url" });

  let body;
  try { body = await readJson(req); }
  catch (error) { return send(res, error.status || 400, { error: error.message || "invalid_request" }); }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length || messages.length > 30) return send(res, 400, { error: "invalid_messages" });
  const safeMessages = [];
  let total = 0;
  for (const item of messages) {
    if (!item || !["system", "user", "assistant"].includes(item.role) || typeof item.content !== "string") {
      return send(res, 400, { error: "invalid_message_shape" });
    }
    total += item.content.length;
    if (item.content.length > 8000 || total > 24000) return send(res, 413, { error: "message_limit_exceeded" });
    safeMessages.push({ role: item.role, content: item.content });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
      body: JSON.stringify({ model, messages: safeMessages, stream: false }),
      signal: controller.signal
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return send(res, 502, { error: "provider_error", providerStatus: response.status });
    const answer = result && result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content;
    if (typeof answer !== "string") return send(res, 502, { error: "invalid_provider_response" });
    return send(res, 200, { ok: true, model, answer });
  } catch (error) {
    return send(res, 502, { error: error.name === "AbortError" ? "provider_timeout" : "provider_unavailable" });
  } finally {
    clearTimeout(timer);
  }
};
