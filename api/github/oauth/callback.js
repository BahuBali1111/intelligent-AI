"use strict";
const crypto = require("node:crypto");
const { send } = require("../../_lib");
const { STATE_COOKIE, cookies, clearCookie, seal } = require("../_session");
module.exports = async (req,res) => {
  if (req.method !== "GET") return send(res,405,{error:"method_not_allowed"});
  const { code,state,error }=req.query||{};
  const c=cookies(req)[STATE_COOKIE]||"";
  const [saved,mac]=c.split(".");
  const secret=process.env.GITHUB_SESSION_SECRET||"";
  const expected=secret ? crypto.createHmac("sha256",secret).update(String(state||"")).digest("base64url") : "";
  const valid=!!state&&!!saved&&saved===state&&!!mac&&Buffer.byteLength(mac)===Buffer.byteLength(expected)&&crypto.timingSafeEqual(Buffer.from(mac),Buffer.from(expected));
  clearCookie(res,STATE_COOKIE);
  if(error||!valid) return send(res,400,{error:"github_oauth_state_invalid"});
  if(!process.env.GITHUB_OAUTH_CLIENT_ID||!process.env.GITHUB_OAUTH_CLIENT_SECRET||secret.length<32)
    return send(res,503,{error:"github_oauth_not_configured"});
  try {
    const tokenResponse=await fetch("https://github.com/login/oauth/access_token",{
      method:"POST",headers:{"Accept":"application/json","Content-Type":"application/json"},
      body:JSON.stringify({client_id:process.env.GITHUB_OAUTH_CLIENT_ID,client_secret:process.env.GITHUB_OAUTH_CLIENT_SECRET,code})
    });
    const tokenData=await tokenResponse.json();
    if(!tokenResponse.ok||!tokenData.access_token) return send(res,502,{error:"github_token_exchange_failed"});
    const headers={Authorization:"Bearer "+tokenData.access_token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};
    const userResponse=await fetch("https://api.github.com/user",{headers});
    const user=await userResponse.json();
    if(!userResponse.ok||!user.login) return send(res,502,{error:"github_identity_check_failed"});
    const repoResponse=await fetch("https://api.github.com/repos/BahuBali1111/intelligent-AI",{headers});
    const repo=await repoResponse.json();
    if(!repoResponse.ok||repo.full_name!=="BahuBali1111/intelligent-AI"||!repo.permissions?.push)
      return send(res,403,{error:"repository_write_access_required",message:"The authorized GitHub account needs write access to the Intelligent AI repository."});
    // AES-GCM encrypted, short-lived ticket; only this backend can decrypt it.
    const ticket=seal({token:tokenData.access_token,user:user.login,exp:Date.now()+7*86400000});
    res.statusCode=302;
    res.setHeader("Cache-Control","no-store, no-cache, must-revalidate");
    res.setHeader("Referrer-Policy","no-referrer");
    res.setHeader("Location","https://bahubali1111.github.io/intelligent-AI/github-return.html#github_session="+encodeURIComponent(ticket));
    res.end();
  } catch (_) { return send(res,502,{error:"github_oauth_callback_failed"}); }
};
