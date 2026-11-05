(function(root){
"use strict";
const CATALOG=Object.freeze([
 {id:"github",name:"GitHub",purpose:"Repository source, version history, CI tests and reviewed update proposals.",status:"available",auth:"GitHub App or short-lived OAuth session",permissions:["Contents: read/write for the selected repository","Pull requests: read/write to propose changes","Actions: read workflow results","Workflows: write only if changing workflow files"],credentialPolicy:"Server-side short-lived tokens only; never browser localStorage, sessionStorage or source files.",cost:"No separate fee for basic GitHub repository and Actions usage within account limits.",next:"Register a GitHub App restricted to BahuBali1111/intelligent-AI."},
 {id:"model-runtime",name:"AI model runtime",purpose:"Language reasoning and code generation.",status:"user-configured",auth:"Provider-specific API key or local runtime",permissions:["Chat completion only"],credentialPolicy:"User-entered key stays in memory unless the user explicitly opts into tab session storage.",cost:"Free models or local runtimes first; paid usage requires explicit approval.",next:"Evaluate free/open model runtime and hardware before choosing."},
 {id:"web-research",name:"Public research sources",purpose:"Find documentation, release notes, security advisories and code references.",status:"available",auth:"Public APIs where supported",permissions:["Public read only"],credentialPolicy:"No account secret required for currently implemented public indexes.",cost:"Prefer free public endpoints; respect rate limits and terms.",next:"Add source verification and update discovery."},
 {id:"local-workbench",name:"Local code workbench",purpose:"Prepare and compare proposed code changes.",status:"prototype",auth:"No external account",permissions:["Local browser storage only"],credentialPolicy:"Drafts stay on this device; no repository write.",cost:"No external service fee.",next:"Connect isolated test runner and reviewed pull-request workflow."}
]);
const ALLOWED=new Set(["available","user-configured","prototype","planned","connected","paused","error"]);
function createRegistry(storage){
 const store=storage||null,key="ia-integration-status-v1";
 function read(){try{const x=store&&JSON.parse(store.getItem(key)||"{}");return x&&typeof x==="object"?x:{}}catch{return {}}}
 function list(){const state=read();return CATALOG.map(item=>({...item,status:state[item.id]?.status||item.status,lastChecked:state[item.id]?.lastChecked||null,note:state[item.id]?.note||""}));}
 function updateStatus(id,status,note){
  if(!CATALOG.some(x=>x.id===id))throw new Error("Unknown integration: "+id);
  if(!ALLOWED.has(status))throw new Error("Unsupported integration status.");
  if(!store)throw new Error("Integration status storage is unavailable.");
  const state=read();state[id]={status,lastChecked:new Date().toISOString(),note:String(note||"").slice(0,240)};
  store.setItem(key,JSON.stringify(state));return list().find(x=>x.id===id);
 }
 return Object.freeze({list,updateStatus});
}
const api={version:"1.0.0",createRegistry,catalog:()=>CATALOG.map(x=>({...x}))};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.IntelligentIntegrations=api;
})(typeof globalThis!=="undefined"?globalThis:this);
