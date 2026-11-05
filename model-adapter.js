(function(root){
"use strict";
const providers=new Map();
function normalizeMessages(messages){
 if(!Array.isArray(messages)||!messages.length)throw new TypeError("Messages must be a non-empty array.");
 return messages.map((message,index)=>{
  if(!message||!["system","user","assistant","tool"].includes(message.role)||typeof message.content!=="string")throw new TypeError("Invalid message at index "+index+".");
  return {role:message.role,content:message.content};
 });
}
function normalizeResult(result,provider){
 if(typeof result==="string")return {text:result.trim(),provider,model:"",usage:null,finishReason:null};
 if(!result||typeof result.text!=="string"||!result.text.trim())throw new Error("Model adapter returned an empty or invalid response.");
 return {text:result.text.trim(),provider:result.provider||provider,model:result.model||"",usage:result.usage||null,finishReason:result.finishReason||null,metadata:result.metadata||null,runtimeSeconds:result.runtimeSeconds||null};
}
function createAdapter(definition){
 if(!definition||typeof definition.name!=="string"||!definition.name.trim())throw new TypeError("Adapter needs a provider name.");
 for(const method of ["connect","disconnect","isConnected","chat"])if(typeof definition[method]!=="function")throw new TypeError("Adapter is missing "+method+"().");
 const name=definition.name.trim();
 return Object.freeze({
  name,
  capabilities:Object.freeze(Array.isArray(definition.capabilities)?definition.capabilities.slice():["chat"]),
  connect:config=>definition.connect(config||{}),
  disconnect:()=>definition.disconnect(),
  isConnected:()=>definition.isConnected()===true,
  async chat(messages,options){
   if(!definition.isConnected())throw new Error("Connect a model provider before sending messages.");
   const safeMessages=normalizeMessages(messages);
   const result=await definition.chat(safeMessages,options||{});
   return normalizeResult(result,name);
  }
 });
}
function register(definition){
 const adapter=createAdapter(definition);
 if(providers.has(adapter.name))throw new Error("Model provider already registered: "+adapter.name);
 providers.set(adapter.name,adapter);
 return adapter;
}
function get(name){return providers.get(String(name||""))||null}
function list(){return Array.from(providers.values(),provider=>({name:provider.name,capabilities:provider.capabilities.slice(),connected:provider.isConnected()}))}
function remove(name){return providers.delete(String(name||""))}
const api={version:"1.0.0",createAdapter,register,get,list,remove,normalizeMessages,normalizeResult};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.IntelligentModelAdapters=api;
})(typeof globalThis!=="undefined"?globalThis:this);
