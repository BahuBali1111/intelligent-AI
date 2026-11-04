"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),{createCodeWorkbench,validPath}=require("../code-workbench.js");
function storage(){const d=new Map();return {getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,v),removeItem:k=>d.delete(k)}}
test("creates and retrieves a local code draft",()=>{const w=createCodeWorkbench(storage()),d=w.create({path:"src/app.js",reason:"Add a helper",before:"const a = 1;",after:"const a = 2;"});assert.equal(w.get(d.id).path,"src/app.js");assert.equal(w.list().length,1)});
test("generates a readable patch and export",()=>{const w=createCodeWorkbench(storage()),d=w.create({path:"app.js",reason:"Update",before:"one\ntwo",after:"one\nthree"});const patch=w.diff(d.id);assert.match(patch,/-two/);assert.match(patch,/\+three/);assert.match(w.exportDraft(d.id),/"patch"/)});
test("rejects unsafe paths and empty proposed code",()=>{for(const p of ["../secret",".hidden/../x","/root","a//b"])assert.throws(()=>validPath(p));const w=createCodeWorkbench(storage());assert.throws(()=>w.create({path:"a.js",reason:"x",after:""}))});
test("deletes drafts and exports the draft collection",()=>{const w=createCodeWorkbench(storage()),d=w.create({path:"a.js",reason:"x",after:"x"});assert.match(w.exportAll(),/"drafts"/);assert.equal(w.remove(d.id),true);assert.equal(w.list().length,0)});
