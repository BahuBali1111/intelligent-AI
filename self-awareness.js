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

async function executePlan(options){
 const o=options||{},plan=o.plan||{tasks:[]},tasks=Array.isArray(plan.tasks)?plan.tasks:[],chat=o.chat,history=Array.isArray(o.history)?o.history:[],language=o.language||"en",baseSystem=String(o.system||"");
 if(typeof chat!=="function")throw new Error("A connected chat function is required.");
 if(tasks.length<=1)return chat([{role:"system",content:baseSystem},...history],{maxTokens:1600});
 const completed=[];let lastResult=null,failed=null;
 const total=tasks.length;
 for(let index=0;index<total;index++){
  const task=tasks[index];
  if(typeof o.onProgress==="function")o.onProgress(language==="hi"?"चरण "+(index+1)+"/"+total+" समझकर हल किया जा रहा है…":"Working through step "+(index+1)+"/"+total+"…");
  const prior=completed.map(item=>"STEP "+item.index+": "+item.task+"\nRESULT: "+item.result.slice(0,2200)).join("\n\n");
  const taskSystem=baseSystem+"\n\n"+(language==="hi"?"कार्य निष्पादन निर्देश: नीचे दिए गए मूल संदेश के संदर्भ में केवल वर्तमान उप-कार्य पर ध्यान दो। पहले के चरणों के परिणाम उपयोग करो। यदि कोई जानकारी उपलब्ध नहीं है तो अनुमान मत लगाओ। इस चरण का स्पष्ट और उपयोगी परिणाम दो।":"Task execution instructions: Focus on the current subtask in the context of the complete original message. Use earlier step results where relevant. Do not invent unavailable information. Return a clear, useful result for this step.")+"\n\nORIGINAL USER REQUEST:\n"+plan.original+"\n\nCURRENT SUBTASK ("+(index+1)+"/"+total+"):\n"+task.text+"\n\nPREVIOUS STEP RESULTS:\n"+(prior||"(none)");
  try{
   lastResult=await chat([{role:"system",content:taskSystem},...history],{maxTokens:1100});
   completed.push({index:index+1,task:task.text,result:String(lastResult.text||"")});
  }catch(error){failed={index:index+1,task:task.text,error:String(error&&error.message||error)};break}
 }
 if(typeof o.onProgress==="function")o.onProgress(language==="hi"?"पूरे किए गए चरणों को जोड़कर अंतिम उत्तर तैयार हो रहा है…":"Combining completed steps into a final answer…");
 if(!completed.length)return {text:(language==="hi"?"कोई चरण पूरा नहीं हो सका। ":"No step could be completed. ")+(failed?failed.error:""),model:lastResult&&lastResult.model||null,partial:true,steps:[]};
 const results=completed.map(x=>"STEP "+x.index+" — "+x.task+"\n"+x.result).join("\n\n");
 const synthesisSystem=(language==="hi"?"तुम Intelligent AI के समेकन विशेषज्ञ हो। नीचे दिए गए चरणों के परिणामों को एक स्पष्ट, क्रमबद्ध और पूर्ण उत्तर में जोड़ो। दोहराव हटाओ, विरोधाभास बताओ, कोई नतीजा मत गढ़ो। यदि कोई चरण विफल हुआ है तो साफ बताओ कि कौन-सा हिस्सा अधूरा है।":"You are Intelligent AI's synthesis specialist. Combine the step results into one clear, ordered and complete answer. Remove repetition, flag contradictions, and do not invent conclusions. If a step failed, clearly state which part remains incomplete.")+"\n\nORIGINAL USER REQUEST:\n"+plan.original+"\n\nCOMPLETED STEP RESULTS:\n"+results+"\n\n"+(failed?"FAILED STEP "+failed.index+": "+failed.task+"\nERROR: "+failed.error:"All planned steps returned results.");
 try{
  const final=await chat([{role:"system",content:synthesisSystem},{role:"user",content:"Prepare the final answer in "+(language==="hi"?"Hindi/Hinglish":"the user's language")+". Preserve all requirements and explicitly identify any uncertainty.\n\n"+plan.original}],{maxTokens:2200});
  return {text:String(final.text||"")+(failed?"\n\n"+(language==="hi"?"ध्यान दें: चरण "+failed.index+" अधूरा रहा — "+failed.error:"Note: step "+failed.index+" remains incomplete — "+failed.error):""),model:final.model,runtimeSeconds:final.runtimeSeconds,fallback:final.fallback,partial:!!failed,steps:completed.map(x=>x.index)};
 }catch(error){
  return {text:results+(failed?"\n\nINCOMPLETE STEP "+failed.index+": "+failed.error:"")+"\n\n"+(language==="hi"?"अंतिम समेकन कॉल विफल हुआ; ऊपर चरणवार परिणाम दिए गए हैं।":"The final synthesis call failed; the step-by-step results are shown above."),model:lastResult&&lastResult.model||null,partial:true,steps:completed.map(x=>x.index)};
 }
}
function describe(options){return snapshot(options)}
const api={VERSION,FEATURES,splitInput,snapshot,systemGuidance,executePlan,describe};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.IntelligentSelfAwareness=api;
})(typeof globalThis!=="undefined"?globalThis:this);
