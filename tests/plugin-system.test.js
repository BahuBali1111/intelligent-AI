"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {createPluginHost}=require("../plugin-system.js");
const echo=require("../plugins/example-echo/index.js");

function fakeCore(){
 const tools=new Map();
 return {
  registerTool(tool){if(tools.has(tool.name))throw new Error("duplicate tool");tools.set(tool.name,tool.run);},
  async runTool(name,input,context){if(!tools.has(name))throw new Error("missing tool");return tools.get(name)(input,context||{});},
  listTools(){return [...tools.keys()];}
 };
}

test("registers a plugin and exposes its metadata",()=>{
 const host=createPluginHost(fakeCore());
 const info=host.register(echo);
 assert.equal(info.id,"example-echo");
 assert.equal(info.version,"1.0.0");
 assert.deepEqual(info.tools,["plugin.example-echo.echo"]);
});
test("runs plugin and its namespaced core tool",async()=>{
 const core=fakeCore(),host=createPluginHost(core);
 host.register(echo);
 assert.deepEqual(await host.run("example-echo","hello"),{plugin:"example-echo",text:"hello"});
 assert.deepEqual(await core.runTool("plugin.example-echo.echo","world"),{plugin:"example-echo",text:"world"});
});
test("requires all three lifecycle methods and valid ids",()=>{
 const host=createPluginHost(fakeCore());
 assert.throws(()=>host.register({id:"bad id",register(){},run(){},test(){}}),/Plugin id/);
 assert.throws(()=>host.register({id:"valid-id",register(){},run(){}}),/test/);
});
test("rejects duplicate plugin and duplicate tool registrations",()=>{
 const host=createPluginHost(fakeCore());
 host.register(echo);
 assert.throws(()=>host.register(echo),/already registered/);
});
test("runs plugin tests and reports failures without hiding them",async()=>{
 const host=createPluginHost(fakeCore());
 host.register(echo);
 host.register({id:"broken-test",register(){},run(){},async test(){throw new Error("expected test failure")}});
 const result=await host.testAll();
 assert.equal(result.total,2);
 assert.equal(result.passed,1);
 assert.equal(result.failed,1);
 assert.equal(result.results.find(x=>x.id==="broken-test").passed,false);
});
test("unregisters a plugin and refuses future runs",async()=>{
 const host=createPluginHost(fakeCore());
 host.register(echo);
 assert.equal(host.unregister("example-echo"),true);
 assert.equal(host.unregister("example-echo"),false);
 await assert.rejects(()=>host.run("example-echo","hello"),/not registered/);
});
