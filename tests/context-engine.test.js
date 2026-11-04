"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),{createContextStore,PROFILE,NEXT}=require("../context-engine.js");
function storage(){const d=new Map();return {getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,v),removeItem:k=>d.delete(k)}}
test("loads confirmed owner project rules and roadmap",()=>{const c=createContextStore(storage());assert.ok(c.profile().some(x=>x.id==="free-first"));assert.ok(c.profile().some(x=>x.id==="chat-layout"));assert.ok(c.roadmap().length>=4)});
test("captures and retrieves recent user instructions",()=>{const c=createContextStore(storage());c.capture("Keep the chat layout with my messages on the right");assert.match(c.search("chat right")[0].text,/right/)});
test("redacts common API keys and passwords",()=>{const c=createContextStore(storage());const x=c.capture("api_key=sk-abcdefghijklmnopqrstuvwxyz123456 password=hunter2");assert.doesNotMatch(x.text,/sk-abcdefghijklmnopqrstuvwxyz|hunter2/)});
test("bounds saved turns and clears local index",()=>{const c=createContextStore(storage());for(let i=0;i<190;i++)c.capture("turn "+i);assert.equal(c.turns().length,180);c.clear();assert.equal(c.turns().length,0)});
test("exports a versioned continuity backup",()=>{const c=createContextStore(storage());c.capture("continue the research engine");const d=JSON.parse(c.exportData());assert.equal(d.version,1);assert.equal(d.turns.length,1);assert.ok(d.profile.length===PROFILE.length);assert.ok(d.roadmap===undefined||NEXT.length>0)});
