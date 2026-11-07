(function(root){
"use strict";
let config={baseUrl:"",apiKey:"",connected:false,provider:"",model:""};
let providers=[];
const disconnectChannel=typeof BroadcastChannel!=="undefined"?new BroadcastChannel("intelligent-ai-model-session"):null;
if(disconnectChannel)disconnectChannel.onmessage=event=>{
 if(event.data&&event.data.type==="DISCONNECT"){
  config={baseUrl:"",apiKey:"",connected:false,provider:"",model:""};providers=[];
  root.dispatchEvent(new Event("ia-model-disconnected"));
 }
};
function cleanBase(value){let s=String(value||"").trim();while(s.endsWith("/"))s=s.slice(0,-1);return s}
function label(provider){return provider==="gemini"?"Google Gemini":provider==="groq"?"Groq":provider==="openrouter"?"OpenRouter":"Private Qwen"}
function priority(provider){return ({openrouter:0,groq:1,gemini:2,qwen:3})[provider]??9}
function setActive(){providers.sort((a,b)=>priority(a.provider)-priority(b.provider));config=providers[0]||{baseUrl:"",apiKey:"",connected:false,provider:"",model:""}}
async function connect(baseUrl,apiKey){
 let base=cleanBase(baseUrl),key=String(apiKey||"").trim();
 if(!(base.startsWith("https://")||base.startsWith("http://")))throw new Error("URL must begin with https://.");
 if(!key)throw new Error("Enter your API key.");
 let host="";try{host=new URL(base).hostname.toLowerCase()}catch{}
 let provider="",model="",endpoint=base,freeModels=[];
 if(host==="openrouter.ai"){
  const parsed=new URL(base);
  if(!parsed.pathname||parsed.pathname==="/"||parsed.pathname==="/api"||parsed.pathname==="/api/")base="https://openrouter.ai/api/v1";
  const check=await fetch(base+"/models",{method:"GET",headers:{Accept:"application/json",Authorization:"Bearer "+key},cache:"no-store"});
  if(!check.ok)throw new Error(check.status===401?"OpenRouter API key rejected (HTTP 401).":"OpenRouter key check failed: HTTP "+check.status);
  const data=await check.json();if(!Array.isArray(data.data))throw new Error("OpenRouter did not return its model list.");
  freeModels=data.data.filter(item=>{
   if(!item||typeof item.id!=="string")return false;
   const p=item.pricing||{};
   const zero=(Number(p.prompt)===0&&Number(p.completion)===0);
   return item.id.endsWith(":free")||zero;
  }).map(item=>item.id).filter(id=>id!=="openrouter/free");
  provider="openrouter";model="openrouter/free";endpoint=base;
 }else if(host==="api.groq.com"){
  endpoint="https://api.groq.com/openai/v1";
  const check=await fetch(endpoint+"/models",{headers:{Authorization:"Bearer "+key,Accept:"application/json"},cache:"no-store"});
  if(!check.ok)throw new Error(check.status===401?"Groq API key rejected (HTTP 401).":"Groq connection check failed: HTTP "+check.status);
  const data=await check.json();if(!Array.isArray(data.data))throw new Error("Groq did not return its model list.");
  provider="groq";model=(data.data.find(item=>item&&typeof item.id==="string")||{}).id||"openai/gpt-oss-120b";
 }else if(host==="generativelanguage.googleapis.com"){
  endpoint="https://generativelanguage.googleapis.com/v1beta/openai";
  const check=await fetch(endpoint+"/models",{headers:{Authorization:"Bearer "+key,Accept:"application/json"},cache:"no-store"});
  if(!check.ok)throw new Error(check.status===401||check.status===403?"Gemini API key rejected or API not enabled (HTTP "+check.status+").":"Gemini connection check failed: HTTP "+check.status);
  const data=await check.json();const first=Array.isArray(data.data)?data.data.find(item=>item&&typeof item.id==="string"):null;
  provider="gemini";model=first?String(first.id).replace(/^models\\//,""):"gemini-2.5-flash";
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
 const entry={baseUrl:endpoint,apiKey:key,connected:true,provider,model,freeModels};
 providers=providers.filter(item=>item.provider!==provider);
 providers.push(entry);setActive();
 return {model:config.model,provider:label(config.provider),connectedProviders:providers.map(item=>label(item.provider))};
}
function forget(provider){
 providers=providers.filter(item=>item.provider!==provider);
 setActive();
}
function disconnect(){
 config={baseUrl:"",apiKey:"",connected:false,provider:"",model:""};providers=[];
 if(disconnectChannel)disconnectChannel.postMessage({type:"DISCONNECT"});
 root.dispatchEvent(new Event("ia-model-disconnected"));
}
function isConnected(){return providers.length>0&&config.connected}
function getModel(){return config.model||"openrouter/free"}
function getProviders(){return providers.map(item=>({provider:label(item.provider),model:item.model}))}
async function chat(messages,options){
 if(!isConnected())throw new Error("Connect an AI provider in Settings first.");
 function extractText(data){
  const message=data&&data.choices&&data.choices[0]&&data.choices[0].message,content=message&&message.content;
  if(typeof content==="string")return content.trim();
  if(Array.isArray(content))return content.map(part=>typeof part==="string"?part:(part&&typeof part.text==="string"?part.text:"")).join("").trim();
  if(data&&typeof data.output_text==="string")return data.output_text.trim();
  return "";
 }
 const diagnostics=[];
 for(const providerConfig of providers){
  const endpoint=providerConfig.provider==="qwen"?providerConfig.baseUrl+"/v1/chat/completions":providerConfig.baseUrl+"/chat/completions";
  const headers={"Content-Type":"application/json","Authorization":"Bearer "+providerConfig.apiKey};
  if(providerConfig.provider==="openrouter"){headers["HTTP-Referer"]=location.origin;headers["X-OpenRouter-Title"]="Intelligent AI";}
  const candidates=providerConfig.provider==="openrouter"?["openrouter/free",...providerConfig.freeModels.slice(0,6)]:[providerConfig.model];
  for(let index=0;index<candidates.length;index++){
   const selected=candidates[index];
   for(let retry=0;retry<2;retry++){
    try{
     const body={model:selected,messages,max_tokens:Math.min(8192,Math.max(512,(options&&options.maxTokens)||4096)),temperature:index||retry?0.1:0.2};
     if(providerConfig.provider==="openrouter"&&selected==="openrouter/free"&&providerConfig.freeModels.length)body.models=providerConfig.freeModels.slice(0,6);
     const response=await fetch(endpoint,{method:"POST",headers,body:JSON.stringify(body),cache:"no-store"});
     const raw=await response.text();let data={};
     try{data=raw?JSON.parse(raw):{}}catch{throw new Error("AI provider returned invalid JSON (HTTP "+response.status+").")}
     if(!response.ok){
      const detail=(data.error&&data.error.message)||data.detail||data.message||(raw?raw.slice(0,300):"HTTP "+response.status);
      diagnostics.push(label(providerConfig.provider)+": "+detail+" (HTTP "+response.status+")");
      break;
     }
     const answer=extractText(data),choice=data.choices&&data.choices[0]||{},finish=choice.finish_reason||null;
     if(answer)return {text:answer,usage:data.usage||null,model:data.model||selected,provider:label(providerConfig.provider),runtimeSeconds:data.runtime_seconds||null,finishReason:finish,fallback:providerConfig.provider!==config.provider};
     diagnostics.push(label(providerConfig.provider)+": empty response"+(finish?"; finish_reason="+finish:"")+"; model="+(data.model||selected));
    }catch(error){diagnostics.push(label(providerConfig.provider)+": "+String(error&&error.message||error));}
   }
  }
 }
 throw new Error("सभी सेव किए गए AI प्रदाताओं को आज़माया गया, लेकिन जवाब नहीं मिला। "+diagnostics.join(" | "));
}
root.IntelligentModelClient={connect,forget,disconnect,isConnected,getModel,getProviders,chat};
})(typeof globalThis!=="undefined"?globalThis:this);
