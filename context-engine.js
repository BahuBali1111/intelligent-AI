(function(root){"use strict";
const KEY="ia-project-continuity-v1",MAX_TURNS=180,MAX_CHARS=1400;
const PROFILE=[
{ id:"free-first",title:"Free and self-built development",detail:"Build the application, search, orchestration, memory and tools with our own code. Do not add paid APIs, paid model subscriptions, payment gateways or surprise charges. Ask first before any cost-bearing service.",tags:["free","cost","paid","coding","खर्च","मुफ्त","पैसा"]},
{ id:"separate-projects",title:"Keep projects separate",detail:"Intelligent AI is separate from Savarkundla Ride and Worker Network India. Never mix their accounts, repositories, databases or project data.",tags:["project","savarkundla","worker","separate","अलग"]},
{ id:"bilingual",title:"Hindi and English",detail:"Support Hindi and English and keep language switching functional across the entire interface.",tags:["hindi","english","language","हिंदी","अंग्रेज़ी","भाषा"]},
{ id:"chat-layout",title:"Two-sided chat layout",detail:"User messages stay on the right; Intelligent AI replies stay on the left. Preserve this layout.",tags:["chat","right","left","message","चैट","दायाँ","बायाँ"]},
{ id:"owner-control",title:"One automatic-update switch",detail:"Keep one clear owner-controlled Auto Update ON/OFF switch. Never silently apply code changes or deploy without the configured owner approval and tested release process.",tags:["auto update","switch","approval","update","ऑटो अपडेट"]},
{ id:"research",title:"Broad multi-source research",detail:"Search multiple independent public sources, compare findings, show original links, report source failures and state coverage limits honestly.",tags:["research","search","browser","source","internet","रिसर्च","खोज"]},
{ id:"self-audit",title:"Self-audit and steady improvement",detail:"Inspect its own files and capability gaps, propose improvements, run real automated tests, retain an audit trail and support rollback. Never claim an unrun test passed.",tags:["self","improve","test","error","bug","audit","सुधार","गलती","जाँच"]},
{ id:"chat-truth",title:"Be honest about capabilities",detail:"Do not pretend a live language model, cloud memory, browser automation or coding tools are connected unless they actually are. Label prototype capabilities clearly.",tags:["model","real ai","truth","demo","क्षमता","मॉडल"]},
{ id:"workflow",title:"Verify every release",detail:"After changes, verify the exact commit's quality checks and Pages deployment. Batch edits to avoid unnecessary cancelled workflows and report failures honestly.",tags:["commit","build","deploy","workflow","github","ईमेल","कमिट","डिप्लॉय"]}
];
const NEXT=[
{id:"context",title:"Conversation continuity and project context",status:"in-progress",detail:"Remember confirmed project rules, index recent user instructions, and use them to keep follow-up work consistent."},
{id:"research-depth",title:"Broader research and source inspection",status:"next",detail:"Add more independent search sources, safe page-content extraction, publication dates, relevance scoring and source comparison."},
{id:"self-audit",title:"Self-audit and improvement proposals",status:"planned",detail:"Inspect project files and tests, detect real gaps, prepare reviewable code patches and run automated checks."},
{id:"tool-orchestration",title:"Permissioned tool orchestration",status:"planned",detail:"Route research, coding, file and planning tasks to registered tools with clear progress and honest capability reporting."},
{id:"local-model",title:"Free local model evaluation",status:"planned",detail:"Evaluate open-weight models, licences, device/server requirements and a genuinely free local runtime before connecting any model."}
];
function cleanText(value){return String(value||"").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g," ").replace(/\s+/g," ").trim().slice(0,MAX_CHARS)}
function redact(value){return cleanText(value).replace(/(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9_]{20,}|password\s*[:=]\s*\S+|api[_ -]?key\s*[:=]\s*\S+)/gi,"[redacted secret]")}
function createContextStore(storage,key){if(!storage||typeof storage.getItem!=="function"||typeof storage.setItem!=="function")throw new TypeError("Compatible storage is required.");const storeKey=key||KEY;
function read(){try{const x=JSON.parse(storage.getItem(storeKey)||"[]");return Array.isArray(x)?x.filter(t=>t&&typeof t.id==="string"&&typeof t.text==="string").slice(-MAX_TURNS):[]}catch{return []}}
function write(x){storage.setItem(storeKey,JSON.stringify(x.slice(-MAX_TURNS)));return x}
function capture(text){const value=redact(text);if(!value)return null;const rows=read(),item={id:"turn-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7),text:value,createdAt:new Date().toISOString()};rows.push(item);write(rows);return item}
function turns(){return read().slice().reverse()}
function search(query,limit){const q=String(query||"").toLocaleLowerCase().split(/\s+/).filter(x=>x.length>1),rows=read().map(item=>{const text=item.text.toLocaleLowerCase(),score=q.reduce((n,t)=>n+(text.includes(t)?1:0),0);return { ...item,score }}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.createdAt.localeCompare(a.createdAt));return rows.slice(0,Math.max(1,Math.min(20,Number(limit)||6)))}
function clear(){storage.removeItem(storeKey)}
function exportData(){return JSON.stringify({version:1,exportedAt:new Date().toISOString(),profile:PROFILE,turns:turns()},null,2)}
function contextFor(query){const q=String(query||"").toLocaleLowerCase(),matched=PROFILE.filter(p=>p.tags.some(t=>q.includes(t))||q.includes("next")||q.includes("आगे")||q.includes("continue")||q.includes("याद"));return {profile:matched.length?matched:PROFILE.slice(0,4),recent:search(query,4),next:NEXT}}
return {capture,turns,search,clear,exportData,contextFor,profile:()=>PROFILE.map(x=>({...x})),roadmap:()=>NEXT.map(x=>({...x}))}}
const api={KEY,MAX_TURNS,PROFILE,NEXT,createContextStore};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.IntelligentContext=api})(typeof globalThis!=="undefined"?globalThis:this);
