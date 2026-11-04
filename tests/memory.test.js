"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {createMemoryStore}=require("../memory.js");
function storage(){const data=new Map();return {getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}}
test("only explicit notes are stored and can be listed",()=>{const m=createMemoryStore(storage());m.add("Project is called Intelligent AI","project");assert.equal(m.list().length,1);assert.equal(m.list()[0].text,"Project is called Intelligent AI")});
test("search matches note text and category",()=>{const m=createMemoryStore(storage());m.add("Build local engine","development");assert.equal(m.search("local").length,1);assert.equal(m.search("development").length,1);assert.equal(m.search("missing").length,0)});
test("rejects empty and oversized notes",()=>{const m=createMemoryStore(storage());assert.throws(()=>m.add("  "));assert.throws(()=>m.add("x".repeat(2001)))});
test("removes one note and clears all notes",()=>{const m=createMemoryStore(storage());const a=m.add("one"),b=m.add("two");assert.equal(m.remove(a.id),true);assert.equal(m.list().length,1);m.clear();assert.equal(m.list().length,0);assert.equal(m.remove(b.id),false)});
test("exports and imports a versioned backup",()=>{const m=createMemoryStore(storage());m.add("Backup me","test");const backup=m.exportData();const n=createMemoryStore(storage(),"other-key");assert.equal(n.importData(backup),1);assert.equal(n.search("backup").length,1)});
