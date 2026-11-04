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
  const plan=core.createPlan("Help me build an app");
  assert.equal(plan.intent,"coding");
  assert.ok(plan.steps.length>=3);
});
test("registers and runs tools without exposing internal function objects",async()=>{
  core.registerTool({name:"test.echo",description:"Echo test",run:async value=>({value})});
  assert.deepEqual(await core.runTool("test.echo","hello"),{value:"hello"});
  assert.deepEqual(core.listTools(),[{name:"test.echo",description:"Echo test"}]);
});
