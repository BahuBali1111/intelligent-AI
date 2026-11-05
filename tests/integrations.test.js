"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const integrations=require("../integrations.js");
function memory(){const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v)};}
test("lists safe integration metadata without credentials or executable connectors",()=>{
 const list=integrations.createRegistry(memory()).list();
 assert.deepEqual(list.map(x=>x.id),["github","model-runtime","web-research","local-workbench"]);
 assert.ok(list.every(x=>!Object.hasOwn(x,"token")&&!Object.hasOwn(x,"apiKey")&&!Object.hasOwn(x,"run")));
 assert.match(list[0].credentialPolicy,/never browser/i);
});
test("records only an allowlisted status and bounded note",()=>{
 const registry=integrations.createRegistry(memory());
 const item=registry.updateStatus("github","paused","Owner paused connection");
 assert.equal(item.status,"paused");assert.equal(item.note,"Owner paused connection");assert.ok(item.lastChecked);
});
test("rejects unknown integrations and invalid states",()=>{
 const registry=integrations.createRegistry(memory());
 assert.throws(()=>registry.updateStatus("unknown","connected"),/Unknown integration/);
 assert.throws(()=>registry.updateStatus("github","secret-token"),/Unsupported/);
});
test("does not claim GitHub app is connected by default",()=>{
 const item=integrations.createRegistry(memory()).list().find(x=>x.id==="github");
 assert.equal(item.status,"available");assert.match(item.next,/Register a GitHub App/);
});
test("status changes require an available local storage adapter",()=>{
 assert.throws(()=>integrations.createRegistry(null).updateStatus("github","paused"),/storage is unavailable/);
});
