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
 const authCheck=await fetch(base+"/v1/chat/completions",{
  method:"POST",
  headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey.trim()},
  body:JSON.stringify({model:"intelligent-ai-qwen",messages:[{role:"user",content:"Reply only OK."}],max_tokens:1,temperature:0}),
  cache:"no-store"
 });
 if(authCheck.status===401||authCheck.status===403)throw new Error("API key rejected by the Qwen server. Copy IA_API_KEY again from the Kaggle notebook output and paste it exactly.");
 if(!authCheck.ok)throw new Error("Authenticated model test failed: HTTP "+authCheck.status);
 const testData=await authCheck.json();
 if(!testData||!Array.isArray(testData.choices))throw new Error("The server accepted the key but returned an unexpected test response.");
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
