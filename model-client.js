(function(root){
"use strict";
let config={baseUrl:"",apiKey:"",connected:false};
const disconnectChannel=typeof BroadcastChannel!=="undefined"?new BroadcastChannel("intelligent-ai-model-session"):null;
if(disconnectChannel)disconnectChannel.onmessage=event=>{
 if(event.data&&event.data.type==="DISCONNECT"){
  config={baseUrl:"",apiKey:"",connected:false};
  root.dispatchEvent(new Event("ia-model-disconnected"));
 }
};
function cleanBase(value){return String(value||"").trim().replace(/\/+$/,"")}
async function connect(baseUrl,apiKey){
 // Keep exactly one active credential set. A new attempt replaces and clears the previous one.
 config={baseUrl:"",apiKey:"",connected:false};
 const base=cleanBase(baseUrl);
 if(!/^https?:\/\//i.test(base))throw new Error("Server URL must begin with https:// (or http:// for local testing).");
 if(!apiKey.trim())throw new Error("Enter the private runtime access key.");
 const health=await fetch(base+"/health",{method:"GET",headers:{Accept:"application/json"},cache:"no-store"});
 if(!health.ok)throw new Error("Runtime health check failed: HTTP "+health.status);
 const data=await health.json();
 if(data.status!=="ok")throw new Error("Model runtime is not ready yet.");
 // Do not send a test chat during connection. The supplied key is used on the first real chat request.
 config={baseUrl:base,apiKey:apiKey.trim(),connected:true,model:data.model||"Qwen3.5-9B"};
 return {model:config.model};
}
function disconnect(){
 config={baseUrl:"",apiKey:"",connected:false};
 if(disconnectChannel)disconnectChannel.postMessage({type:"DISCONNECT"});
 root.dispatchEvent(new Event("ia-model-disconnected"));
}
function isConnected(){return config.connected}
function getModel(){return config.model||"Qwen3.5-9B"}
async function chat(messages,options){
 if(!config.connected)throw new Error("Connect the private model runtime in Settings first.");
 const response=await fetch(config.baseUrl+"/v1/chat/completions",{
  method:"POST",
  headers:{"Content-Type":"application/json","Authorization":"Bearer "+config.apiKey},
  body:JSON.stringify({model:"intelligent-ai-qwen",messages,max_tokens:(options&&options.maxTokens)||512,temperature:0.2}),
  cache:"no-store"
 });
 if(!response.ok){let detail="HTTP "+response.status;try{const body=await response.json();detail=body.detail||detail}catch{}throw new Error(detail)}
 const data=await response.json();
 const answer=data&&data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content;
 if(typeof answer!=="string"||!answer.trim())throw new Error("The model returned an empty response.");
 return {text:answer.trim(),usage:data.usage||null,model:data.model||getModel(),runtimeSeconds:data.runtime_seconds||null};
}
root.IntelligentModelClient={connect,disconnect,isConnected,getModel,chat};
})(typeof globalThis!=="undefined"?globalThis:this);
