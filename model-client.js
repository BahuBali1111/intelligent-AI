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
 if(isOpenRouter(base)){
  const url=new URL(base);
  if(url.pathname==="/"||url.pathname==="")base="https://openrouter.ai/api/v1";
  else if(url.pathname==="/api")base="https://openrouter.ai/api/v1";
  const check=await fetch(base+"/models",{method:"GET",headers:{Accept:"application/json",Authorization:"Bearer "+key},cache:"no-store"});
  if(!check.ok)throw new Error(check.status===401?"OpenRouter API key rejected (HTTP 401).":"OpenRouter key check failed: HTTP "+check.status);
  const data=await check.json();
  if(!Array.isArray(data.data))throw new Error("OpenRouter did not return its model list.");
  config={baseUrl:base,apiKey:key,connected:true,provider:"openrouter",model:"openrouter/free"};
  return {model:config.model,provider:"OpenRouter"};
 }
 const health=await fetch(base+"/health",{method:"GET",headers:{Accept:"application/json"},cache:"no-store"});
 if(!health.ok)throw new Error("Runtime health check failed: HTTP "+health.status);
 const data=await health.json();
 if(data.status!=="ok")throw new Error("Model runtime is not ready yet.");
 const auth=await fetch(base+"/auth/check",{method:"GET",headers:{Accept:"application/json",Authorization:"Bearer "+key},cache:"no-store"});
 if(auth.status===401)throw new Error("API key rejected by the Qwen server (HTTP 401).");
 if(!auth.ok)throw new Error("Authentication check failed: HTTP "+auth.status+". Ensure the Kaggle server has the /auth/check endpoint.");
 const authData=await auth.json();
 if(authData.status!=="ok"||authData.authenticated!==true)throw new Error("The server did not confirm this API key.");
 config={baseUrl:base,apiKey:key,connected:true,provider:"qwen",model:data.model||"Qwen3.5-9B"};
 return {model:config.model,provider:"Qwen"};
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
 const endpoint=config.provider==="openrouter"?config.baseUrl+"/chat/completions":config.baseUrl+"/v1/chat/completions";
 const model=config.provider==="openrouter"?"openrouter/free":"intelligent-ai-qwen";
 const headers={"Content-Type":"application/json","Authorization":"Bearer "+config.apiKey};
 if(config.provider==="openrouter"){headers["HTTP-Referer"]=location.origin;headers["X-OpenRouter-Title"]="Intelligent AI";}
 function extractText(data){
  const message=data&&data.choices&&data.choices[0]&&data.choices[0].message;
  const content=message&&message.content;
  if(typeof content==="string")return content.trim();
  if(Array.isArray(content))return content.map(part=>typeof part==="string"?part:(part&&typeof part.text==="string"?part.text:"")).join("").trim();
  if(data&&typeof data.output_text==="string")return data.output_text.trim();
  return "";
 }
 let lastDiagnostic="";
 for(let attempt=0;attempt<2;attempt++){

  try{
   const response=await fetch(endpoint,{method:"POST",headers,body:JSON.stringify({model,messages,max_tokens:(options&&options.maxTokens)||4096,temperature:attempt===0?0.2:0.1}),cache:"no-store"});
   const raw=await response.text();
   let data={};
   try{data=raw?JSON.parse(raw):{}}catch{throw new Error("AI provider returned invalid JSON (HTTP "+response.status+").")}
   if(!response.ok){
    const detail=(data.error&&data.error.message)||data.detail||data.message||("HTTP "+response.status);
    if(attempt===0&&(response.status===429||response.status>=500)){lastDiagnostic=detail;await new Promise(resolve=>setTimeout(resolve,900));continue;}
    throw new Error(detail+" (HTTP "+response.status+")");
   }
   const answer=extractText(data);
   if(answer)return {text:answer,usage:data.usage||null,model:data.model||getModel(),runtimeSeconds:data.runtime_seconds||null,finishReason:data.choices&&data.choices[0]&&data.choices[0].finish_reason||null};
   const choice=data.choices&&data.choices[0]||{};
   lastDiagnostic="HTTP 200 but empty message content"+(choice.finish_reason?"; finish_reason="+choice.finish_reason:"")+(data.model?"; model="+data.model:"");
   if(attempt===0){await new Promise(resolve=>setTimeout(resolve,700));continue;}
  }catch(error){
   lastDiagnostic=String(error&&error.message||error);
   if(attempt===0&&!(controller&&controller.signal.aborted)){await new Promise(resolve=>setTimeout(resolve,700));continue;}
  }
 }
 throw new Error("AI जवाब नहीं मिला। कारण: "+lastDiagnostic+". Settings में OpenRouter/Qwen कनेक्शन जाँचें; API key दोबारा चैट में न भेजें।");
}
root.IntelligentModelClient={connect,disconnect,isConnected,getModel,chat};
})(typeof globalThis!=="undefined"?globalThis:this);
