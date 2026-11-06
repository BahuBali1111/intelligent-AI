"use strict";
const crypto = require("node:crypto");
const COOKIE = "ia_github_session";
const STATE_COOKIE = "ia_github_state";
function key() {
  const secret = process.env.GITHUB_SESSION_SECRET || "";
  if (secret.length < 32) throw new Error("github_session_secret_not_configured");
  return crypto.createHash("sha256").update(secret).digest();
}
function seal(value) {
  const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}
function open(value) {
  try {
    const raw = Buffer.from(value, "base64url");
    if (raw.length < 29) return null;
    const iv = raw.subarray(0,12), tag = raw.subarray(12,28), body = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8"));
  } catch (_) { return null; }
}
function cookies(req) {
  return Object.fromEntries(String(req.headers.cookie || "").split(";").map(v => v.trim()).filter(Boolean).map(v => {
    const i=v.indexOf("="); return [v.slice(0,i), decodeURIComponent(v.slice(i+1))];
  }));
}
function setCookie(res, name, value, maxAge, sameSite="Lax") {
  const line = name+"="+encodeURIComponent(value)+"; Path=/api/github; HttpOnly; Secure; SameSite="+sameSite+"; Max-Age="+maxAge;
  const old=res.getHeader("Set-Cookie"); res.setHeader("Set-Cookie", old ? [].concat(old,line) : line);
}
function clearCookie(res,name) { setCookie(res,name,"",0,"Lax"); }
function session(req) {
  const auth=String(req.headers.authorization||"");
  const bearer=auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const c=cookies(req)[COOKIE];
  const s=(bearer && open(bearer)) || (c && open(c));
  return s && s.exp>Date.now() ? s : null;
}
module.exports = { COOKIE, STATE_COOKIE, seal, open, cookies, setCookie, clearCookie, session };
