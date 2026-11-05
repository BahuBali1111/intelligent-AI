"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const core=require("../core.js");
test("validates and trims normal messages",()=>assert.deepEqual(core.validateMessage("  hello  "),{ok:true,value:"hello"}));
test("rejects empty and non-text messages",()=>{assert.equal(core.validateMessage("  ").ok,false);assert.equal(core.validateMessage(null).ok,false);});
test("enforces the message size limit",()=>assert.equal(core.validateMessage("x".repeat(core.MAX_MESSAGE_CHARS+1)).ok,false));
test("routes English and Hindi coding requests",()=>{assert.equal(core.classifyIntent("Please debug this JavaScript code").name,"coding");assert.equal(core.classifyIntent("मेरे ऐप का कोड ठीक करो").name,"coding");});
test("routes file and research requests",()=>{assert.equal(core.classifyIntent("Please read this PDF file").name,"files");assert.equal(core.classifyIntent("इस विषय पर रिसर्च करो").name,"research");});
test("creates a structured plan for a task",()=>{const plan=core.createPlan("Write code for an app");assert.equal(plan.intent,"coding");assert.ok(plan.steps.length>=3);});
test("runs low-risk tools and returns a normalized success envelope",async()=>{
 core.registerTool({name:"test.echo",description:"Echo test",run:async value=>({value})});
 const result=await core.runTool("test.echo","hello");
 assert.equal(result.ok,true);assert.equal(result.tool,"test.echo");assert.equal(result.data.value,"hello");assert.equal(result.error,null);assert.ok(result.requestId);assert.ok(result.createdAt);assert.equal(typeof result.durationMs,"number");
 assert.deepEqual(core.listTools(),[{name:"test.echo",description:"Echo test",risk:"low",requiresApproval:false,hasInputValidator:false}]);
});
test("prepares a validated request with analysis and a task plan",()=>{const request=core.prepareRequest("Please debug this app");assert.equal(request.ok,true);assert.equal(request.analysis.name,"coding");assert.equal(request.plan.intent,"coding");assert.ok(request.requestId);});
test("blocks high-risk tools until explicit owner approval",async()=>{
 core.registerTool({name:"test.sensitive",description:"Sensitive test action",risk:"high",run:async()=>({changed:true})});
 const blocked=await core.runTool("test.sensitive",{},{});
 assert.equal(blocked.ok,false);assert.equal(blocked.error.code,"OWNER_APPROVAL_REQUIRED");
 const allowed=await core.runTool("test.sensitive",{},{approved:true});assert.equal(allowed.ok,true);assert.deepEqual(allowed.data,{changed:true});
});
test("requires explicit boolean approval for critical tools",async()=>{
 core.registerTool({name:"test.critical",risk:"critical",run:async()=>true});
 const result=await core.runTool("test.critical",{}, {approved:"yes"});assert.equal(result.ok,false);assert.equal(result.error.code,"OWNER_APPROVAL_REQUIRED");
});
test("unknown tools return a safe failure envelope",async()=>{const result=await core.runTool("missing.tool",{});assert.equal(result.ok,false);assert.equal(result.error.code,"TOOL_NOT_FOUND");assert.equal(result.data,null);});
test("validates tool input before execution",async()=>{
 let called=false;
 core.registerTool({name:"test.validated",validateInput:value=>typeof value==="string"?true:{ok:false,error:"Text only."},run:async value=>{called=true;return value;}});
 const invalid=await core.runTool("test.validated",42);assert.equal(invalid.ok,false);assert.equal(invalid.error.code,"INVALID_TOOL_INPUT");assert.equal(called,false);
 const valid=await core.runTool("test.validated","yes");assert.equal(valid.ok,true);assert.equal(valid.data,"yes");assert.equal(called,true);
});
test("normalizes thrown tool errors without leaking stack traces",async()=>{
 core.registerTool({name:"test.failure",run:async()=>{const error=new Error("Provider unavailable");error.code="UPSTREAM_OFFLINE";throw error;}});
 const result=await core.runTool("test.failure",{});
 assert.equal(result.ok,false);assert.equal(result.error.code,"UPSTREAM_OFFLINE");assert.equal(result.error.message,"Provider unavailable");assert.equal(Object.hasOwn(result.error,"stack"),false);
});
test("uses assistant intent to build matching explain and memory plans",()=>{
 const previous=global.IntelligentBrain;global.IntelligentBrain={understand:()=>({intent:"explain",confidence:0.9,language:"en"})};
 try{const request=core.prepareRequest("What is a neural network?");assert.equal(request.analysis.intent,"explain");assert.equal(request.plan.intent,"explain");assert.match(request.plan.steps[0],/concept/i);}
 finally{if(previous===undefined)delete global.IntelligentBrain;else global.IntelligentBrain=previous;}
});
test("creates a memory plan when the assistant classifies a recall request",()=>{
 const previous=global.IntelligentBrain;global.IntelligentBrain={understand:()=>({intent:"memory",confidence:0.9,language:"en"})};
 try{const request=core.prepareRequest("Recall the earlier instruction");assert.equal(request.plan.intent,"memory");assert.match(request.plan.steps[0],/Search available/i);}
 finally{if(previous===undefined)delete global.IntelligentBrain;else global.IntelligentBrain=previous;}
});
