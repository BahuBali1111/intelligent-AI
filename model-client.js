(function(root){
"use strict";
let config={baseUrl:"",apiKey:"",connected:false,provider:"",model:""};
const disconnectChannel=typeof BroadcastChannel!=="undefined"?new BroadcastChannel("intelligent-ai-model-session"):null;
if(disconnectChannel)disconnectChannel.onmessage=event=>{
 if(event.data&&event.data.type==="DISCONNECT"){
  config={baseUrl:"",apiKey:"",connected:false,provider:"",model:""};
  root.dispatchEvent(new Event("ia-model-disconnected"));
 }
};
function cleanBase(value){let s=String(value||"").trim();while(s.endsWith("/"))s=s.slice(0,-1);return s}
function isOpenRouter(base){try{return new URL(base).hostname==="openrouter.ai"}catch{return false}}
async function connect(baseUrl,apiKey){
 config={baseUrl:"",apiKey:"",connected:false,provider:"",model:""};
 let base=cleanBase(baseUrl),key=String(apiKey||"").trim();
 if(!(base.startsWith("https://")||base.startsWith("http://")))throw new Error("URL must begin with https://.");
 if(!key)throw new Error("Enter your API key.");
 let host="";try{host=new URL(base).hostname.toLowerCase()}catch{}
 let provider="",model="",endpoint=base;
 if(host==="openrouter.ai"){
  if(!new URL(base).pathname||new URL(base).pathname==="/"||new URL(base).pathname==="/api"||new URL(base).pathname==="/api/")base="https://openrouter.ai/api/v1";
  const check=await fetch(base+"/models",{method:"GET",headers:{Accept:"application/json",Authorization:"Bearer "+key},cache:"no-store"});
  if(!check.ok)throw new Error(check.status===401?"OpenRouter API key rejected (HTTP 401).":"OpenRouter key check failed: HTTP "+check.status);
  const data=await check.json();if(!Array.isArray(data.data))throw new Error("OpenRouter did not return its model list.");
  provider="openrouter";model="openrouter/free";endpoint=base;
 }else if(host==="api.groq.com"){
  endpoint="https://api.groq.com/openai/v1";
  const check=await fetch(endpoint+"/models",{headers:{Authorization:"Bearer "+key,Accept:"application/json"},cache:"no-store"});
  if(!check.ok)throw new Error(check.status===401?"Groq API key rejected (HTTP 401).":"Groq connection check failed: HTTP "+check.status);
  provider="groq";model="llama-3.3-70b-versatile";
 }else if(host==="generativelanguage.googleapis.com"){
  endpoint="https://generativelanguage.googleapis.com/v1beta/openai";
  const check=await fetch(endpoint+"/models",{headers:{Authorization:"Bearer "+key,Accept:"application/json"},cache:"no-store"});
  if(!check.ok)throw new Error(check.status===401||check.status===403?"Gemini API key rejected or API not enabled (HTTP "+check.status+").":"Gemini connection check failed: HTTP "+check.status);
  provider="gemini";model="gemini-2.5-flash";
 }else{
  const health=await fetch(base+"/health",{method:"GET",headers:{Accept:"application/json"},cache:"no-store"});
  if(!health.ok)throw new Error("Runtime health check failed: HTTP "+health.status);
  const data=await health.json();if(data.status!=="ok")throw new Error("Model runtime is not ready yet.");
  const auth=await fetch(base+"/auth/check",{method:"GET",headers:{Accept:"application/json",Authorization:"Bearer "+key},cache:"no-store"});
  if(auth.status===401)throw new Error("API key rejected by the Qwen server (HTTP 401).");
  if(!auth.ok)throw new Error("Authentication check failed: HTTP "+auth.status+". Ensure the Qwen server has the /auth/check endpoint.");
  const authData=await auth.json();if(authData.status!=="ok"||authData.authenticated!==true)throw new Error("The server did not confirm this API key.");
  provider="qwen";model=data.model||"Qwen3.5-9B";
 }
 config={baseUrl:endpoint,apiKey:key,connected:true,provider,model};
 return {model,provider:provider==="gemini"?"Google Gemini":provider==="groq"?"Groq":provider==="openrouter"?"OpenRouter":"Qwen"};
}
function disconnect(){
 config={baseUrl:"",apiKey:"",connected:false,provider:"",model:""};
 if(disconnectChannel)disconnectChannel.postMessage({type:"DISCONNECT"});
 root.dispatchEvent(new Event("ia-model-disconnected"));
}
function isConnected(){return config.connected}
function getModel(){return config.model||"openrouter/free"}
async function chat(messages,options){
 if(!config.connected)throw new Error("Connect an AI provider in Settings first.");
 const endpoint=config.provider==="qwen"?config.baseUrl+"/v1/chat/completions":config.baseUrl+"/chat/completions";
 const model=config.model;
 const headers={"Content-Type":"application/json","Authorization":"Bearer "+config.apiKey};
 if(config.provider==="openrouter"){headers["HTTP-Referer"]=location.origin;headers["X-OpenRouter-Title"]="Intelligent AI";}
 function extractText(data){
  const message=data&&data.choices&&data.choices[0]&&data.choices[0].message,content=message&&message.content;
  if(typeof content==="string")return content.trim();
  if(Array.isArray(content))return content.map(part=>typeof part==="string"?part:(part&&typeof part.text==="string"?part.text:"")).join("").trim();
  if(data&&typeof data.output_text==="string")return data.output_text.trim();
  return "";
 }
 let lastDiagnostic="",lastModel=model;
 const candidates=config.provider==="openrouter"?["openrouter/free","nvidia/nemotron-3-ultra:free","google/gemma-4-26b-a4b-it:free","openai/gpt-oss-120b:free"]: [model];
 for(let attempt=0;attempt<Math.min(4,candidates.length+1);attempt++){
  const selected=candidates[Math.min(attempt,candidates.length-1)];
  try{
   const body={model:selected,messages,max_tokens:Math.min(8192,Math.max(512,(options&&options.maxTokens)||4096)),temperature:attempt?0.1:0.2};
   if(config.provider==="openrouter"&&selected==="openrouter/free")body.models=candidates.slice(1);
   const response=await fetch(endpoint,{method:"POST",headers,body:JSON.stringify(body),cache:"no-store"});
   const raw=await response.text();let data={};
   try{data=raw?JSON.parse(raw):{}}catch{throw new Error("AI provider returned invalid JSON (HTTP "+response.status+").")}
   if(!response.ok){
    const detail=(data.error&&data.error.message)||data.detail||data.message||("HTTP "+response.status);
    lastDiagnostic=detail+" (HTTP "+response.status+")";
    if(attempt<3&&(response.status===429||response.status>=500||response.status===404)){await new Promise(resolve=>setTimeout(resolve,Math.min(5000,700*(attempt+1))));continue}
    throw new Error(lastDiagnostic);
   }
   const answer=extractText(data),choice=data.choices&&data.choices[0]||{},finish=choice.finish_reason||null;
   if(answer)return {text:answer,usage:data.usage||null,model:data.model||selected,runtimeSeconds:data.runtime_seconds||null,finishReason:finish};
   lastModel=data.model||selected;
   lastDiagnostic="HTTP 200 but empty message content"+(finish?"; finish_reason="+finish:"")+"; model="+lastModel;
   if(attempt<3){await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));continue}
  }catch(error){
   lastDiagnostic=String(error&&error.message||error);
   if(attempt<3){await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));continue}
  }
 }
 throw new Error("AI जवाब पूरा नहीं कर पाया। अंतिम कारण: "+lastDiagnostic+". छोटा सवाल/कम संदर्भ आज़माएँ या दूसरे प्रदाता से कनेक्ट करें।");
}
root.IntelligentModelClient={connect,disconnect,isConnected,getModel,chat};
})(typeof globalThis!=="undefined"?globalThis:this);
