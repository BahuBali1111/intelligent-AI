(function(root){
  "use strict";
  const MAX_MESSAGE_CHARS=8000;
  const INTENTS={
    research:{label:"research",keywords:["research","search","find","look up","latest","source","internet","रिसर्च","खोज","खोजो","ढूंढ","ढूँढ","जानकारी","स्रोत"]},
    coding:{label:"coding",keywords:["code","coding","program","bug","debug","website","app","कोड","प्रोग्राम","ऐप","वेबसाइट","गलती"]},
    files:{label:"files",keywords:["file","pdf","document","excel","sheet","upload","फाइल","दस्तावेज","पीडीएफ","एक्सेल"]},
    planning:{label:"planning",keywords:["plan","steps","roadmap","improve","build","योजना","कदम","आगे","बनाओ","सुधार"]},
    general:{label:"general",keywords:[]}
  };
  const tools=new Map();
  function validateMessage(input){
    if(typeof input!=="string")return {ok:false,error:"Message must be text."};
    const text=input.trim();
    if(!text)return {ok:false,error:"Message is empty."};
    if(text.length>MAX_MESSAGE_CHARS)return {ok:false,error:"Message is too long. Maximum is "+MAX_MESSAGE_CHARS+" characters."};
    return {ok:true,value:text};
  }
  function classifyIntent(input){
    const text=String(input||"").toLocaleLowerCase();let best="general",score=0;
    for(const [name,config] of Object.entries(INTENTS)){const hits=config.keywords.reduce((n,word)=>n+(text.includes(word)?1:0),0);if(hits>score){best=name;score=hits;}}
    return {name:best,confidence:score?Math.min(0.95,0.55+score*0.1):0.2,matched:score};
  }
  function createPlan(input,preferredIntent){
    const classified=classifyIntent(input);
    const intent={name:["research","coding","files","planning","explain","memory","general"].includes(preferredIntent)?preferredIntent:classified.name,confidence:classified.confidence};
    const steps={
      research:["Clarify the research question","Identify reliable sources","Compare evidence","Summarise findings and cite sources"],
      coding:["Understand the requested behaviour","Inspect the relevant files","Prepare a small change","Run checks and report results"],
      files:["Identify the file type and task","Extract relevant content","Analyse the requested information","Summarise findings and limitations"],
      planning:["Define the desired outcome","Break the work into ordered steps","Identify dependencies and risks","Review progress and next action"],
      explain:["Identify the concept","Build a clear explanation","Give a relevant example","State uncertainty or limitations"],
      memory:["Search available conversation and saved context","Check matching instructions","Report what was found and any gaps"],
      general:["Understand the request","Check whether a connected capability can handle it","Ask for clarification if needed"]
    };
    return {intent:intent.name,confidence:intent.confidence,steps:steps[intent.name].slice()};
  }
  function registerTool(tool){
    if(!tool||typeof tool.name!=="string"||!/^[a-z][a-z0-9._-]{1,79}$/i.test(tool.name)||typeof tool.run!=="function")throw new TypeError("A tool needs a valid name and run function.");
    if(tools.has(tool.name))throw new Error("Tool already registered: "+tool.name);
    if(tool.validateInput!==undefined&&typeof tool.validateInput!=="function")throw new TypeError("validateInput must be a function.");
    const risk=["low","medium","high","critical"].includes(tool.risk)?tool.risk:"low";
    tools.set(tool.name,{name:tool.name,description:String(tool.description||"").slice(0,240),risk,requiresApproval:tool.requiresApproval===true||risk==="high"||risk==="critical",validateInput:tool.validateInput||null,run:tool.run});
    return true;
  }
  function listTools(){return Array.from(tools.values(),t=>({name:t.name,description:t.description,risk:t.risk,requiresApproval:t.requiresApproval,hasInputValidator:!!t.validateInput}));}
  function makeRequestId(){return "tool-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,9);}
  function resultEnvelope(fields){return {ok:fields.ok,tool:fields.tool,requestId:fields.requestId,createdAt:new Date().toISOString(),durationMs:fields.durationMs,data:fields.ok?fields.data:null,error:fields.ok?null:fields.error};}
  async function runTool(name,input,context){
    const requestId=makeRequestId(),started=Date.now(),tool=tools.get(name),ctx=context||{};
    if(!tool)return resultEnvelope({ok:false,tool:String(name||""),requestId,durationMs:0,error:{code:"TOOL_NOT_FOUND",message:"Tool is not registered."}});
    if(tool.requiresApproval&&ctx.approved!==true)return resultEnvelope({ok:false,tool:tool.name,requestId,durationMs:0,error:{code:"OWNER_APPROVAL_REQUIRED",message:"Owner approval required before running this "+tool.risk+"-risk tool.",risk:tool.risk}});
    try{
      if(tool.validateInput){const validation=await tool.validateInput(input);if(validation!==true&&(!validation||validation.ok!==true))return resultEnvelope({ok:false,tool:tool.name,requestId,durationMs:Date.now()-started,error:{code:"INVALID_TOOL_INPUT",message:String(validation&&validation.error||"Tool input validation failed.")}});}
      const data=await tool.run(input,ctx);
      return resultEnvelope({ok:true,tool:tool.name,requestId,durationMs:Date.now()-started,data});
    }catch(error){
      return resultEnvelope({ok:false,tool:tool.name,requestId,durationMs:Date.now()-started,error:{code:String(error&&error.code||"TOOL_EXECUTION_FAILED"),message:String(error&&error.message||"Tool execution failed.").slice(0,500)}});
    }
  }
  function prepareRequest(input,options){
    const checked=validateMessage(input);if(!checked.ok)return {ok:false,error:checked.error};
    const brain=root.IntelligentBrain;
    const analysis=brain&&typeof brain.understand==="function"?brain.understand(checked.value):classifyIntent(checked.value);
    const plan=createPlan(checked.value,analysis.intent||analysis.name);
    return {ok:true,text:checked.value,analysis,plan,createdAt:new Date().toISOString(),requestId:"req-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8)};
  }
  const api={version:"0.3.0-core",MAX_MESSAGE_CHARS,validateMessage,classifyIntent,createPlan,prepareRequest,registerTool,listTools,runTool};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.IntelligentCore=api;
})(typeof globalThis!=="undefined"?globalThis:this);
