"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const core=require("../core.js");

test("validates and trims normal messages",()=>{
  assert.deepEqual(core.validateMessage("  hello  "),{ok:true,value:"hello"});
});
test("rejects empty and non-text messages",()=>{
  assert.equal(core.validateMessage("  ").ok,false);
  assert.equal(core.validateMessage(null).ok,false);
});
test("enforces the message size limit",()=>{
  assert.equal(core.validateMessage("x".repeat(core.MAX_MESSAGE_CHARS+1)).ok,false);
});
test("routes English and Hindi coding requests",()=>{
  assert.equal(core.classifyIntent("Please debug this JavaScript code").name,"coding");
  assert.equal(core.classifyIntent("मेरे ऐप का कोड ठीक करो").name,"coding");
});
test("routes file and research requests",()=>{
  assert.equal(core.classifyIntent("Please read this PDF file").name,"files");
  assert.equal(core.classifyIntent("इस विषय पर रिसर्च करो").name,"research");
});
test("creates a structured plan for a task",()=>{
  const plan=core.createPlan("Write code for an app");
  assert.equal(plan.intent,"coding");
  assert.ok(plan.steps.length>=3);
});
test("registers and runs tools without exposing internal function objects",async()=>{
  core.registerTool({name:"test.echo",description:"Echo test",run:async value=>({value})});
  assert.deepEqual(await core.runTool("test.echo","hello"),{value:"hello"});
  assert.deepEqual(core.listTools(),[{name:"test.echo",description:"Echo test",risk:"low",requiresApproval:false}]);
});

test("prepares a validated request with analysis and a task plan",()=>{
  const request=core.prepareRequest("Please debug this app");
  assert.equal(request.ok,true);
  assert.equal(request.analysis.name,"coding");
  assert.equal(request.plan.intent,"coding");
  assert.ok(request.requestId);
});
test("blocks high-risk tools until explicit owner approval",async()=>{
  core.registerTool({name:"test.sensitive",description:"Sensitive test action",risk:"high",run:async()=>({changed:true})});
  await assert.rejects(()=>core.runTool("test.sensitive",{},{}),error=>error.code==="OWNER_APPROVAL_REQUIRED");
  assert.deepEqual(await core.runTool("test.sensitive",{},{approved:true}),{changed:true});
});
test("requires explicit approval for critical tools even when requested",async()=>{
  core.registerTool({name:"test.critical",risk:"critical",run:async()=>true});
  await assert.rejects(()=>core.runTool("test.critical",{}, {approved:"yes"}),error=>error.code==="OWNER_APPROVAL_REQUIRED");
});

test("uses assistant intent to build matching explain and memory plans",()=>{
  const previous=global.IntelligentBrain;
  global.IntelligentBrain={understand:()=>({intent:"explain",confidence:0.9,language:"en"})};
  try{
    const request=core.prepareRequest("What is a neural network?");
    assert.equal(request.analysis.intent,"explain");
    assert.equal(request.plan.intent,"explain");
    assert.match(request.plan.steps[0],/concept/i);
  }finally{
    if(previous===undefined)delete global.IntelligentBrain;
    else global.IntelligentBrain=previous;
  }
});

test("creates a memory plan when the assistant classifies a recall request",()=>{
  const previous=global.IntelligentBrain;
  global.IntelligentBrain={understand:()=>({intent:"memory",confidence:0.9,language:"en"})};
  try{
    const request=core.prepareRequest("Recall the earlier instruction");
    assert.equal(request.plan.intent,"memory");
    assert.match(request.plan.steps[0],/Search available/i);
  }finally{
    if(previous===undefined)delete global.IntelligentBrain;
    else global.IntelligentBrain=previous;
  }
});
