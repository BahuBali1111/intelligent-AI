"use strict";
const { send } = require("../_lib");
const { seal } = require("./_session");
function cors(req,res){
 const origin=req.headers.origin;
 if(origin==="https://bahubali1111.github.io"){
  res.setHeader("Access-Control-Allow-Origin",origin);
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  res.setHeader("Vary","Origin");
 }
}
module.exports=async(req,res)=>{
 cors(req,res);
 res.setHeader("Cache-Control","no-store, no-cache, must-revalidate");
 res.setHeader("Pragma","no-cache");
 if(req.method==="OPTIONS") return res.status(204).end();
 if(req.method!=="POST") return send(res,405,{error:"method_not_allowed"});
 const origin=req.headers.origin;
 if(origin!=="https://bahubali1111.github.io") return send(res,403,{error:"origin_not_allowed"});
 const secret=process.env.GITHUB_SESSION_SECRET||"";
 if(secret.length<32) return send(res,503,{error:"github_session_secret_not_configured"});
 const token=String(req.body?.token||"").trim();
 if(!token||token.length>500) return send(res,400,{error:"invalid_token_input"});
 try{
  const headers={Authorization:"Bearer "+token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};
  const ur=await fetch("https://api.github.com/user",{headers});
  const user=await ur.json().catch(()=>({}));
  if(!ur.ok||!user.login) return send(res,401,{error:"github_token_invalid_or_expired"});
  const rr=await fetch("https://api.github.com/repos/BahuBali1111/intelligent-AI",{headers});
  const repo=await rr.json().catch(()=>({}));
  if(!rr.ok||repo.full_name!=="BahuBali1111/intelligent-AI") return send(res,403,{error:"repository_access_missing"});
  if(!repo.permissions?.push) return send(res,403,{error:"repository_write_access_required"});
  const ticket=seal({token,user:user.login,exp:Date.now()+7*86400000});
  return send(res,200,{connected:true,account:user.login,repository:repo.full_name,ticket,expiresIn:604800});
 }catch(_){return send(res,502,{error:"github_validation_request_failed"});}
};