(function(root){
"use strict";
let config={baseUrl:"",apiKey:"",connected:false};
function cleanBase(value){return String(value||"").trim().replace(/\\/+$/,"")}
async function connect(baseUrl,apiKey){
 const base=cleanBase(baseUrl);
 if(!/^https?:\\/\\//i.test(base))throw new Error("Server URL must begin with https:// (or http:// for local testing).");
 if(!apiKey.trim())throw new Error("Enter the private runtime access key.");
 const response=await fetch(base+"/health",{method:"GET",headers:{Accept:"application/json"},cache:"no-store"});
 if(!response.ok)throw new Error("Runtime health check failed: HTTP "+response.status);
 const data=await response.json();
 if(data.status!=="ok")throw new Error("Model runtime is not ready yet.");
 config={baseUrl:base,apiKey:apiKey.trim(),connected:true,model:data.model||"Qwen3.5-9B"};
 return {model:config.model};
}
function disconnect(){config={baseUrl:"",apiKey:"",connected:false}}
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
 const text=data&&data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content;
 if(typeof text!=="string"||!text.trim())throw new Error("The model returned an empty response.");
 return {text:text.trim(),usage:data.usage||null,model:data.model||getModel(),runtimeSeconds:data.runtime_seconds||null};
}
root.IntelligentModelClient={connect,disconnect,isConnected,getModel,chat};
})(typeof globalThis!=="undefined"?globalThis:this);
