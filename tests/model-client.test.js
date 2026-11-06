"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
function harness(fetchImpl){const events={};const context={URL,fetch:fetchImpl,location:{origin:"https://example.test"},Event:class Event{constructor(type){this.type=type}},setTimeout,clearTimeout,console};context.globalThis=context;vm.runInNewContext(fs.readFileSync(require.resolve("../model-client.js"),"utf8"),context);return context.IntelligentModelClient}
test("connects to Groq OpenAI-compatible API and selects a default model",async()=>{const calls=[];const c=harness(async(url,opts)=>{calls.push(url);return {ok:true,json:async()=>({data:[{id:"llama-3.3-70b-versatile"}]})}});const r=await c.connect("https://api.groq.com/openai/v1","test-key");assert.equal(r.provider,"Groq");assert.equal(r.model,"llama-3.3-70b-versatile");assert.ok(calls[0].endsWith("/models"))});
test("connects to Google Gemini OpenAI-compatible API",async()=>{const c=harness(async()=>({ok:true,json:async()=>({data:[{id:"gemini-2.5-flash"}]})}));const r=await c.connect("https://generativelanguage.googleapis.com/v1beta/openai","test-key");assert.equal(r.provider,"Google Gemini");assert.equal(r.model,"gemini-2.5-flash")});
test("retries an empty length-truncated OpenRouter response with fallback models",async()=>{let calls=0;const c=harness(async(url,opts)=>{if(url.endsWith("/models"))return {ok:true,json:async()=>({data:[]})};calls++;const body=JSON.parse(opts.body);if(calls===1)return {ok:true,text:async()=>JSON.stringify({model:"broken",choices:[{message:{content:""},finish_reason:"length"}]})};return {ok:true,text:async()=>JSON.stringify({model:"fallback",choices:[{message:{content:"Recovered answer"},finish_reason:"stop"}]})}});await c.connect("https://openrouter.ai/api/v1","test-key");const r=await c.chat([{role:"user",content:"hello"}]);assert.equal(r.text,"Recovered answer");assert.equal(calls,2)});
test("returns a readable error after network failures instead of a controller reference error",async()=>{const c=harness(async(url)=>{if(url.endsWith("/models"))return {ok:true,json:async()=>({data:[]})};throw new Error("network offline")});await c.connect("https://openrouter.ai/api/v1","test-key");await assert.rejects(()=>c.chat([{role:"user",content:"hello"}]),/network offline/)});

test("keeps multiple connected providers and automatically fails over OpenRouter to Groq",async()=>{
 const calls=[];
 const c=harness(async(url,opts)=>{
  if(url.endsWith("/models")){
   if(url.includes("openrouter.ai"))return {ok:true,json:async()=>({data:[{id:"paid/model",pricing:{prompt:"0.01",completion:"0.02"}},{id:"free/model:free",pricing:{prompt:"0",completion:"0"}}]})};
   if(url.includes("groq.com"))return {ok:true,json:async()=>({data:[{id:"llama-3.3-70b-versatile"}]})};
  }
  calls.push({url,body:JSON.parse(opts.body)});
  if(url.includes("openrouter.ai"))return {ok:false,status:404,text:async()=>JSON.stringify({error:{message:"This model is unavailable for free. Paid version available."}})};
  return {ok:true,status:200,text:async()=>JSON.stringify({model:"llama-3.3-70b-versatile",choices:[{message:{content:"Recovered with Groq"},finish_reason:"stop"}]})};
 });
 await c.connect("https://openrouter.ai/api/v1","openrouter-key");
 await c.connect("https://api.groq.com/openai/v1","groq-key");
 assert.equal(c.getProviders().length,2);
 const r=await c.chat([{role:"user",content:"hello"}]);
 assert.equal(r.text,"Recovered with Groq");
 assert.equal(r.provider,"Groq");
 assert.equal(r.fallback,true);
 assert.ok(calls.filter(x=>x.url.includes("openrouter.ai")).every(x=>!JSON.stringify(x.body).includes("paid/model")));
 assert.equal(calls.at(-1).url,"https://api.groq.com/openai/v1/chat/completions");
});
test("OpenRouter free fallback list excludes paid model IDs",async()=>{
 let request;
 const c=harness(async(url,opts)=>{
  if(url.endsWith("/models"))return {ok:true,json:async()=>({data:[
   {id:"paid/model",pricing:{prompt:"0.0001",completion:"0.0002"}},
   {id:"free/one:free",pricing:{prompt:"0",completion:"0"}},
   {id:"free/two",pricing:{prompt:"0",completion:"0"}}
  ]})};
  request=JSON.parse(opts.body);
  return {ok:true,text:async()=>JSON.stringify({choices:[{message:{content:"ok"},finish_reason:"stop"}]})};
 });
 await c.connect("https://openrouter.ai/api/v1","test-key");
 await c.chat([{role:"user",content:"hello"}]);
 assert.deepEqual(Array.from(request.models),["free/one:free","free/two"]);
});
test("forgetting one provider leaves the other connected",async()=>{
 const c=harness(async(url)=>({ok:true,json:async()=>({data:[{id:"model-a"}]})}));
 await c.connect("https://api.groq.com/openai/v1","groq-key");
 await c.connect("https://generativelanguage.googleapis.com/v1beta/openai","gemini-key");
 c.forget("gemini");
 assert.equal(c.isConnected(),true);
 assert.deepEqual(Array.from(c.getProviders(),x=>x.provider),["Groq"]);
});
