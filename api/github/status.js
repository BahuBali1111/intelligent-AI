"use strict";
const { send } = require("../_lib");
const { session } = require("./_session");
module.exports=(req,res)=>{
 if(req.method!=="GET") return send(res,405,{error:"method_not_allowed"});
 const s=session(req);
 return send(res,200,{connected:!!s,account:s?.user||null,repository:"BahuBali1111/intelligent-AI",mode:"server-side-oauth"});
};
