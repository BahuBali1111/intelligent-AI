"use strict";
const { send } = require("../_lib");
const { session } = require("./_session");
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
 if(req.method==="OPTIONS"){res.setHeader("Access-Control-Allow-Methods","GET, OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");return res.status(204).end();}
 if(req.method!=="GET") return send(res,405,{error:"method_not_allowed"});
 const s=session(req);
 return send(res,200,{connected:!!s,account:s?.user||null,repository:"BahuBali1111/intelligent-AI",mode:"server-side-oauth"});
};
