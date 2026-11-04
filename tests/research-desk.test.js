"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),{createResearchDesk}=require("../research-desk.js");
function storage(){const d=new Map();return {getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,v),removeItem:k=>d.delete(k)}}
test("creates search links across multiple independent sources",()=>{const r=createResearchDesk(storage()),links=r.searchLinks("JavaScript service worker");assert.ok(links.length>=7);assert.ok(links.some(x=>x.id==="github"));assert.ok(links.every(x=>x.url.startsWith("https://")))});
test("rejects empty or overlong queries",()=>{const r=createResearchDesk(storage());assert.throws(()=>r.searchLinks(" "));assert.throws(()=>r.searchLinks("x".repeat(501)))});
test("saves, searches, exports and deletes sources",()=>{const r=createResearchDesk(storage()),item=r.saveSource({query:"PWA offline",url:"https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps",title:"MDN PWA",notes:"Check service worker cache"});assert.equal(r.list("service worker").length,1);assert.match(r.exportData(),/"sources"/);assert.equal(r.remove(item.id),true);assert.equal(r.list().length,0)});
test("rejects unsafe source protocols",()=>{const r=createResearchDesk(storage());assert.throws(()=>r.saveSource({url:"javascript:alert(1)"}));assert.throws(()=>r.saveSource({url:"not a url"}))});
