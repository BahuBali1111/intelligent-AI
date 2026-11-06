"use strict";
const { send } = require("../_lib");
const { clearCookie } = require("./_session");
module.exports=(req,res)=>{
 if(req.method!=="POST") return send(res,405,{error:"method_not_allowed"});
 clearCookie(res,"ia_github_session");
 return send(res,200,{disconnected:true});
};
