(function(root){"use strict";
const VERSION="0.1.0";
const FEATURES=[
{id:"live-model",name:"Live language model",status:"provider-dependent",detail:"Uses a connected Gemini, Groq, OpenRouter or private Qwen-compatible model; the project is not a separately trained foundation model."},
{id:"web-research",name:"Multi-source web research",status:"partial",detail:"Queries public indexes and Jina search/page reader. Providers may rate-limit, block requests or return authentication errors; results are not the whole web."},
{id:"github-bridge",name:"GitHub repository bridge",status:"permission-dependent",detail:"Can inspect the connected repository and propose allowlisted changes through a branch and pull request when a valid session and permissions are available."},
{id:"local-memory",name:"Local conversation memory",status:"available-local",detail:"Chat, notes and knowledge can be stored in this browser profile; this is not cross-device cloud memory."},
{id:"knowledge-library",name:"Knowledge library",status:"available-local",detail:"Stores user-added searchable notes locally in the browser."},
{id:"code-workbench",name:"Code workbench",status:"draft-only",detail:"Prepares and exports code drafts. Repository changes require the GitHub bridge and a reviewed pull request."},
{id:"self-update",name:"Self-improvement and release",status:"guarded-prototype",detail:"Can propose source patches through the GitHub bridge. CI, human review and controlled merge/deploy remain separate release steps."},
{id:"languages",name:"Hindi and English interface",status:"available",detail:"The interface has an English/Hindi toggle; response language also depends on the connected model."},
{id:"voice-vision",name:"Voice and image understanding",status:"planned",detail:"Not implemented as a complete built-in capability in this repository version."},
{id:"external-actions",name:"Real-world external actions",status:"not-connected",detail:"Phone calls, bookings, email sending and arbitrary device control are not built-in unless a separately authorized integration is added."}
];
function clean(value,max){return String(value||"").replace(/\r/g,"").trim().slice(0,max||12000)}
function splitInput(input,options){
 const text=clean(input,12000),opts=options||{},maxChars=Math.max(180,Math.min(1200,Number(opts.maxChars)||520)),maxTasks=Math.max(2,Math.min(12,Number(opts.maxTasks)||8));
 if(!text)return {original:"",tasks:[],isMultiPart:false,characterCount:0};
 let pieces=text.split(/\n\s*(?=(?:\d+[.)、]|[-*•]|#{1,4}\s))/g).flatMap(x=>x.split(/\n{2,}/)).map(x=>x.trim()).filter(Boolean);
 if(pieces.length===1){
  pieces=pieces[0].split(/(?<=[.!?।؟])\s+|\s*[;；]\s*|\s+(?:इसके अलावा|साथ ही|उसके बाद|फिर|in addition|also|after that|next)\s+/i).map(x=>x.trim()).filter(Boolean);
 }
 const chunks=[];
 for(const piece of pieces){
  if(piece.length<=maxChars){chunks.push(piece);continue}
  const sentences=piece.split(/(?<=[.!?।؟])\s+/).filter(Boolean);
  let current="";
  for(const sentence of sentences.length?sentences:[piece]){
   if(sentence.length>maxChars){
    const words=sentence.split(/\s+/);let part="";
    for(const word of words){if(part&&(part+" "+word).length>maxChars){if(part)chunks.push(part);part=word}else part+=(part?" ":"")+word}
    if(part)chunks.push(part);
   }else if(current&&(current+" "+sentence).length>maxChars){chunks.push(current);current=sentence}
   else current+=(current?" ":"")+sentence;
  }
  if(current)chunks.push(current);
 }
 const final=chunks.slice(0,maxTasks).map((value,index)=>({id:"task-"+(index+1),index:index+1,text:value,source:"user-message"}));
 if(chunks.length>maxTasks){final[final.length-1].text+=" [अतिरिक्त सामग्री भी इसी कार्य के संदर्भ में शामिल है]"}
 return {original:text,tasks:final,isMultiPart:final.length>1,characterCount:text.length,truncated:chunks.length>maxTasks};
}
function snapshot(options){
 const o=options||{},files=Array.isArray(o.files)?o.files:[],names=files.map(f=>typeof f==="string"?f:f.path).filter(Boolean);
 return {name:"Intelligent AI",version:VERSION,repository:o.repository||"BahuBali1111/intelligent-AI",branch:o.branch||"main",inspection:o.inspectedAt?"live-repository-inspection":"local-capability-catalog",fileCount:names.length,files:names,modelConnected:!!o.modelConnected,githubConnected:!!o.githubConnected,features:FEATURES.map(x=>({...x})),limitations:["A connected model provider supplies language generation; this repository is not a newly trained standalone model.","Web research depends on public providers and may be partial or unavailable.","Local browser memory does not automatically sync across devices.","A proposed pull request is not the same as a merged and deployed release.","Feature status describes this codebase's declared architecture; live service health must be checked separately."]};
}
function systemGuidance(plan,language){
 const tasks=plan&&Array.isArray(plan.tasks)?plan.tasks:[];
 const taskList=tasks.map(t=>t.index+". "+t.text).join("\n");
 return (language==="hi"?"अनुरोध-विभाजन:\n":"Request breakdown:\n")+
 (tasks.length>1?(language==="hi"?"उपयोगकर्ता के संदेश में कई उप-कार्य हैं। हर उप-कार्य को क्रम से समझो और किसी को छोड़े बिना उत्तर दो:\n":"The user message contains multiple sub-tasks. Address each in order and do not silently omit any:\n")+taskList:(language==="hi"?"यह एक मुख्य कार्य है; अनावश्यक रूप से छोटे टुकड़े मत बनाओ.":"This is one main task; do not split it unnecessarily."))+
 "\nKeep all original constraints. If one part depends on another, state the dependency. If the request exceeds available tools or context, complete the feasible parts and clearly identify the remainder. Never claim a tool action, test, merge or deployment that did not actually happen.";
}
function describe(options){return snapshot(options)}
const api={VERSION,FEATURES,splitInput,snapshot,systemGuidance,describe};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.IntelligentSelfAwareness=api;
})(typeof globalThis!=="undefined"?globalThis:this);
