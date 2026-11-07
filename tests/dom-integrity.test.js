"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const html=fs.readFileSync("index.html","utf8"),app=fs.readFileSync("app.js","utf8");
test("all app.js static #id references exist in index.html",()=>{
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 const referenced=new Set([...app.matchAll(/\$\(["']#([^"']+)["']\)/g)].map(m=>m[1]));
 const missing=[...referenced].filter(id=>!ids.has(id));
 assert.deepEqual(missing,[],"Missing DOM nodes stop app.js initialization before provider and voice button handlers are installed");
});
test("all HTML ids are unique",()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
});
test("provider and voice controls are present",()=>{
 for(const id of ["connectGemini","connectGroq","modelConnectButton","modelConnectionMessage","geminiStatus","groqStatus","voiceMic","voiceRead","voiceStop","voiceAuto","voiceStatus","state","codingNotice"]){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
});
