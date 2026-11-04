(function(root){"use strict";
const KEY="ia-update-ledger-v1",MAX=100;
const TRANSITIONS={draft:["tested","rejected"],tested:["approved","rejected"],approved:["deployed","rejected"],deployed:[],rejected:[]};
const DEFAULT_CAPABILITIES=[
{name:"conversation",label:"Conversation engine",status:"prototype",detail:"Local rule-based routing; no trained model."},
{name:"memory",label:"User-controlled memory",status:"available",detail:"Local notes with export and deletion."},
{name:"knowledge",label:"Knowledge retrieval",status:"available",detail:"Local searchable knowledge library."},
{name:"web-research",label:"Web research",status:"planned",detail:"No in-app research connector yet."},
{name:"coding",label:"Coding workspace",status:"planned",detail:"No isolated code execution environment yet."},
{name:"self-update",label:"Controlled self-update",status:"prototype",detail:"Proposal and approval ledger; no autonomous code execution."}
];
function createUpdateEngine(storage,key){if(!storage||typeof storage.getItem!=="function"||typeof storage.setItem!=="function")throw new TypeError("Compatible storage is required.");const storeKey=key||KEY;
function read(){try{const x=JSON.parse(storage.getItem(storeKey)||"[]");return Array.isArray(x)?x.filter(p=>p&&typeof p.id==="string"&&typeof p.title==="string"&&typeof p.status==="string").slice(-MAX):[]}catch{return []}}
function write(items){storage.setItem(storeKey,JSON.stringify(items.slice(-MAX)));return items}
function event(p,type,detail){p.audit=Array.isArray(p.audit)?p.audit:[];p.audit.push({type,detail:String(detail||""),at:new Date().toISOString()})}
function capabilities(){return DEFAULT_CAPABILITIES.map(x=>({...x}))}
function gaps(){return capabilities().filter(x=>x.status!=="available")}
function list(){return read().sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))}
function create(input){if(!input||typeof input.title!=="string"||!input.title.trim())throw new Error("Proposal title is required.");if(typeof input.reason!=="string"||!input.reason.trim())throw new Error("A reason is required.");if(typeof input.change!=="string"||!input.change.trim())throw new Error("Describe the proposed change.");const p={id:"proposal-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7),title:input.title.trim().slice(0,160),reason:input.reason.trim().slice(0,2000),change:input.change.trim().slice(0,4000),risk:["low","medium","high"].includes(input.risk)?input.risk:"medium",status:"draft",testResult:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),audit:[]};event(p,"created","Proposal created locally; no code was executed.");const items=read();items.push(p);write(items);return p}
function transition(id,next,detail){const items=read(),p=items.find(x=>x.id===id);if(!p)throw new Error("Proposal not found.");if(!TRANSITIONS[p.status]||!TRANSITIONS[p.status].includes(next))throw new Error("Invalid proposal transition: "+p.status+" → "+next);if(next==="tested"&&detail!=="passed")throw new Error("Only a passing test result can mark a proposal tested.");if(next==="approved"&&p.risk==="high")throw new Error("High-risk proposals require external owner review and cannot be approved in this local prototype.");if(next==="deployed")throw new Error("Deployment is not available from the browser prototype.");p.status=next;p.updatedAt=new Date().toISOString();if(next==="tested")p.testResult={status:"passed",note:"Manually recorded test result; this does not run code.",at:p.updatedAt};event(p,next,detail||"");write(items);return p}
function remove(id){const items=read(),next=items.filter(x=>x.id!==id);write(next);return next.length!==items.length}
function clear(){storage.removeItem(storeKey)}
function exportData(){return JSON.stringify({version:1,exportedAt:new Date().toISOString(),proposals:list()},null,2)}
return {capabilities,gaps,list,create,transition,remove,clear,exportData}}
const api={KEY,DEFAULT_CAPABILITIES,createUpdateEngine};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.IntelligentUpdates=api})(typeof globalThis!=="undefined"?globalThis:this);
