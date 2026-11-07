(function(){
"use strict";
const $=id=>document.getElementById(id);
const STORAGE={gemini:"ia-provider-gemini",groq:"ia-provider-groq",other:"ia-provider-other"};
const urls={gemini:"https://generativelanguage.googleapis.com/v1beta/openai",groq:"https://api.groq.com/openai/v1",other:"https://openrouter.ai/api/v1"};
function status(id,message){const el=$(id);if(el)el.textContent=message;}
function client(){const c=window.IntelligentModelClient;if(!c||typeof c.connect!=="function")throw new Error("AI connection module did not load. Reload the page and try again.");return c;}
function summary(){const c=window.IntelligentModelClient;if(c&&c.isConnected())status("modelConnectionStatus","Connected providers: "+c.getProviders().map(x=>x.provider).join(" → "));else status("modelConnectionStatus","Not connected · Connect an AI provider below.");}
function persist(kind,key,url){
 const remember=$(kind==="other"?"rememberOther":kind==="gemini"?"rememberGemini":"rememberGroq");
 if(remember&&remember.checked){localStorage.setItem(STORAGE[kind],kind==="other"?JSON.stringify({url,key}):key);}
 else localStorage.removeItem(STORAGE[kind]);
}
async function connect(kind){
 const key=$(kind==="gemini"?"geminiKey":kind==="groq"?"groqKey":"modelAccessKey");
 const urlField=kind==="other"?$("modelServerUrl"):null;
 const button=$(kind==="gemini"?"connectGemini":kind==="groq"?"connectGroq":"modelConnectButton");
 const statusId=kind==="gemini"?"geminiStatus":kind==="groq"?"groqStatus":"modelConnectionMessage";
 const value=key&&key.value.trim(),url=urlField?(urlField.value.trim()||urls.other):urls[kind];
 if(!value){status(statusId,kind==="other"?"Enter the API URL and key first.":"Enter the API key first.");if(key)key.focus();return;}
 if(urlField&&!urlField.value.trim())urlField.value=urls.other;
 if(button)button.disabled=true;
 status(statusId,"Checking connection…");
 try{
  const result=await client().connect(url,value);
  persist(kind,value,url);
  status(statusId,"Connected successfully · "+result.provider+" · "+result.model);
  if(kind==="other")status("primaryProviderStatus","Connected successfully · "+result.provider);
  summary();
 }catch(error){
  const message=String(error&&error.message||error);
  status(statusId,"Connection failed: "+message);
  if(kind==="other")status("primaryProviderStatus","Connection failed: "+message);
 }finally{if(button)button.disabled=false;}
}
function forget(kind){
 const keyId=kind==="gemini"?"geminiKey":kind==="groq"?"groqKey":"modelAccessKey";
 const rememberId=kind==="gemini"?"rememberGemini":kind==="groq"?"rememberGroq":"rememberOther";
 const saved=localStorage.getItem(STORAGE[kind]);
 let provider=kind;
 if(kind==="other"){
  try{const data=JSON.parse(saved||"{}");const host=new URL(data.url||($("modelServerUrl")&&$("modelServerUrl").value)||urls.other).hostname;
   provider=host==="openrouter.ai"?"openrouter":host==="api.groq.com"?"groq":host==="generativelanguage.googleapis.com"?"gemini":"qwen";
  }catch{provider="openrouter";}
 }
 const c=window.IntelligentModelClient;if(c&&typeof c.forget==="function")c.forget(provider);
 localStorage.removeItem(STORAGE[kind]);
 if($(keyId))$(keyId).value="";
 if($(rememberId))$(rememberId).checked=false;
 status(kind==="gemini"?"geminiStatus":kind==="groq"?"groqStatus":"modelConnectionMessage","Saved key removed.");
 summary();
}
function bind(id,handler){const el=$(id);if(el){el.onclick=handler;el.type="button";}}
function start(){
 bind("connectGemini",()=>connect("gemini"));
 bind("connectGroq",()=>connect("groq"));
 bind("modelConnectButton",()=>connect("other"));
 bind("primaryOpenRouterConnect",()=>{if($("modelServerUrl"))$("modelServerUrl").value=$("modelServerUrl").value.trim()||urls.other;connect("other");});
 bind("clearGemini",()=>forget("gemini"));
 bind("clearGroq",()=>forget("groq"));
 bind("clearOther",()=>forget("other"));
 bind("modelDisconnectButton",()=>{
  const c=window.IntelligentModelClient;if(c&&typeof c.disconnect==="function")c.disconnect();
  status("modelConnectionMessage","Disconnected. Provider keys saved on this device are unchanged.");
  status("primaryProviderStatus","Not connected.");summary();
 });
 for(const [id,kind] of [["geminiKey","gemini"],["groqKey","groq"],["modelAccessKey","other"]]){
  const field=$(id);if(field)field.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();connect(kind);}});
 }
 summary();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();