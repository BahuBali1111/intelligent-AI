"use strict";
const { send } = require("../_lib");
const { clearCookie } = require("./_session");
function cors(req,res){
 const origin=req.headers.origin;
 if(origin==="https://bahubali1111.github.io"){
   res.setHeader("Access-Control-Allow-Origin",origin);
   res.setHeader("Access-Control-Allow-Credentials","true");
   res.setHeader("Vary","Origin");
 }
}
module.exports=(req,res)=>{
 cors(req,res);
 if(req.method==="OPTIONS"){res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");return res.status(204).end();}
 if(req.method!=="POST") return send(res,405,{error:"method_not_allowed"});
 clearCookie(res,"ia_github_session");
 return send(res,200,{disconnected:true});
};
