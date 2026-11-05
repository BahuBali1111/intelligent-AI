"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const adapters=require("../model-adapter.js");
test("creates a provider-neutral adapter and normalizes replies",async()=>{
 let connected=true;
 const adapter=adapters.createAdapter({name:"test-provider",capabilities:["chat","streaming"],connect:async()=>({ok:true}),disconnect:()=>{connected=false},isConnected:()=>connected,chat:async messages=>({text:"  Hello  ",model:"demo-1",usage:{total_tokens:3},metadata:{trace:"x"}})});
 assert.equal(adapter.name,"test-provider");
 assert.deepEqual(await adapter.chat([{role:"user",content:"Hi"}]),{text:"Hello",provider:"test-provider",model:"demo-1",usage:{total_tokens:3},finishReason:null,metadata:{trace:"x"}});
 adapter.disconnect();
 assert.equal(adapter.isConnected(),false);
 await assert.rejects(()=>adapter.chat([{role:"user",content:"Hi"}]),/Connect a model provider/);
});
test("validates messages before calling a provider",async()=>{
 const adapter=adapters.createAdapter({name:"validation",connect:async()=>{},disconnect:()=>{},isConnected:()=>true,chat:async()=>({text:"ok"})});
 await assert.rejects(()=>adapter.chat([]),/non-empty array/);
 await assert.rejects(()=>adapter.chat([{role:"visitor",content:"Hi"}]),/Invalid message/);
});
test("registers providers once and exposes safe metadata only",()=>{
 const adapter=adapters.register({name:"registry-test",capabilities:["chat"],connect:async()=>{},disconnect:()=>{},isConnected:()=>false,chat:async()=>"ok"});
 assert.equal(adapters.get("registry-test"),adapter);
 assert.deepEqual(adapters.list().find(item=>item.name==="registry-test"),{name:"registry-test",capabilities:["chat"],connected:false});
 assert.throws(()=>adapters.register({name:"registry-test",connect:async()=>{},disconnect:()=>{},isConnected:()=>false,chat:async()=>"ok"}),/already registered/);
 assert.equal(adapters.remove("registry-test"),true);
});
test("rejects incomplete adapter contracts",()=>{
 assert.throws(()=>adapters.createAdapter({name:"broken"}),/connect/);
});
