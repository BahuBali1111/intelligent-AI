"use strict";
const crypto = require("node:crypto");
const { send } = require("../../_lib");
const { STATE_COOKIE, cookies, setCookie, clearCookie, seal } = require("../_session");
module.exports = async (req,res) => {
  if (req.method !== "GET") return send(res,405,{error:"method_not_allowed"});
  const { code,state,error }=req.query||{};
  const c=cookies(req)[STATE_COOKIE]||"";
  const [saved,mac]=c.split(".");
  const secret=process.env.GITHUB_SESSION_SECRET||"";
  const expected=secret ? crypto.createHmac("sha256",secret).update(String(state||"")).digest("base64url") : "";
  const valid=!!state&&!!saved&&saved===state&&!!mac&&crypto.timingSafeEqual(Buffer.from(mac),Buffer.from(expected||"x"));
  clearCookie(res,STATE_COOKIE);
  if(error||!valid) return send(res,400,{error:"github_oauth_state_invalid"});
  try {
    const tokenResponse=await fetch("https://github.com/login/oauth/access_token",{
      method:"POST",headers:{"Accept":"application/json","Content-Type":"application/json"},
      body:JSON.stringify({client_id:process.env.GITHUB_OAUTH_CLIENT_ID,client_secret:process.env.GITHUB_OAUTH_CLIENT_SECRET,code})
    });
    const tokenData=await tokenResponse.json();
    if(!tokenResponse.ok||!tokenData.access_token) return send(res,502,{error:"github_token_exchange_failed"});
    const userResponse=await fetch("https://api.github.com/user",{headers:{Authorization:"Bearer "+tokenData.access_token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"}});
    const user=await userResponse.json();
    if(!userResponse.ok) return send(res,502,{error:"github_identity_check_failed"});
    const repoResponse=await fetch("https://api.github.com/repos/BahuBali1111/intelligent-AI",{headers:{Authorization:"Bearer "+tokenData.access_token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"}});
    const repo=await repoResponse.json();
    if(!repoResponse.ok||repo.full_name!=="BahuBali1111/intelligent-AI"||!repo.permissions?.push)
      return send(res,403,{error:"repository_write_access_required",message:"The authorized GitHub account needs write access to the Intelligent AI repository."});
    setCookie(res,"ia_github_session",seal({token:tokenData.access_token,user:user.login,exp:Date.now()+7*86400000}),7*86400);
    res.statusCode=302; res.setHeader("Cache-Control","no-store"); res.setHeader("Location","/?github=connected"); res.end();
  } catch (_) { return send(res,502,{error:"github_oauth_callback_failed"}); }
};
