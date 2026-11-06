"use strict";
const crypto = require("node:crypto");
const { send } = require("../../_lib");
const { STATE_COOKIE, setCookie } = require("../_session");
module.exports = (req,res) => {
  if (req.method !== "GET") return send(res,405,{error:"method_not_allowed"});
  const { GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_REDIRECT_URI, GITHUB_SESSION_SECRET } = process.env;
  if (!GITHUB_OAUTH_CLIENT_ID || !GITHUB_OAUTH_REDIRECT_URI || !GITHUB_SESSION_SECRET || GITHUB_SESSION_SECRET.length<32)
    return send(res,503,{error:"github_oauth_not_configured",message:"GitHub OAuth app settings are required on the server."});
  const state=crypto.randomBytes(32).toString("base64url");
  const mac=crypto.createHmac("sha256",GITHUB_SESSION_SECRET).update(state).digest("base64url");
  setCookie(res,STATE_COOKIE,state+"."+mac,600);
  const url=new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id",GITHUB_OAUTH_CLIENT_ID);
  url.searchParams.set("redirect_uri",GITHUB_OAUTH_REDIRECT_URI);
  url.searchParams.set("scope","repo");
  url.searchParams.set("state",state);
  res.statusCode=302; res.setHeader("Cache-Control","no-store"); res.setHeader("Location",url.toString()); res.end();
};
