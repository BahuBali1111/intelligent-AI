(function(root){"use strict";
const KEY="ia-research-notebook-v1",MAX=200;
const SOURCES=[
{id:"google",name:"Google",url:q=>"https://www.google.com/search?q="+encodeURIComponent(q)},
{id:"bing",name:"Bing",url:q=>"https://www.bing.com/search?q="+encodeURIComponent(q)},
{id:"duckduckgo",name:"DuckDuckGo",url:q=>"https://duckduckgo.com/?q="+encodeURIComponent(q)},
{id:"brave",name:"Brave Search",url:q=>"https://search.brave.com/search?q="+encodeURIComponent(q)},
{id:"github",name:"GitHub Code",url:q=>"https://github.com/search?q="+encodeURIComponent(q)+"&type=code"},
{id:"mdn",name:"MDN",url:q=>"https://developer.mozilla.org/en-US/search?q="+encodeURIComponent(q)},
{id:"stackoverflow",name:"Stack Overflow",url:q=>"https://stackoverflow.com/search?q="+encodeURIComponent(q)},
{id:"reddit",name:"Reddit",url:q=>"https://www.reddit.com/search/?q="+encodeURIComponent(q)}];
function createResearchDesk(storage,key){if(!storage||typeof storage.getItem!=="function"||typeof storage.setItem!=="function")throw new TypeError("Compatible storage is required.");const storeKey=key||KEY;
function read(){try{const x=JSON.parse(storage.getItem(storeKey)||"[]");return Array.isArray(x)?x.filter(x=>x&&typeof x.id==="string"&&typeof x.query==="string").slice(-MAX):[]}catch{return []}}
function write(x){storage.setItem(storeKey,JSON.stringify(x.slice(-MAX)));return x}
function searchLinks(query){const q=String(query||"").trim();if(!q)throw new Error("Enter a research topic first.");if(q.length>500)throw new Error("Research topic is too long.");return SOURCES.map(s=>({id:s.id,name:s.name,url:s.url(q),query:q}))}
function saveSource(input){if(!input||typeof input.url!=="string"||!/^https?:\/\//i.test(input.url))throw new Error("A valid HTTP or HTTPS source URL is required.");const u=new URL(input.url);if(!["http:","https:"].includes(u.protocol))throw new Error("Unsupported URL protocol.");const items=read(),item={id:"source-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7),query:String(input.query||"").slice(0,500),title:String(input.title||u.hostname).slice(0,250),url:u.href,notes:String(input.notes||"").slice(0,4000),addedAt:new Date().toISOString()};items.push(item);write(items);return item}
function list(query){const q=String(query||"").toLocaleLowerCase().trim();return read().filter(x=>!q||(x.query+" "+x.title+" "+x.url+" "+x.notes).toLocaleLowerCase().includes(q)).sort((a,b)=>b.addedAt.localeCompare(a.addedAt))}
function remove(id){const before=read(),after=before.filter(x=>x.id!==id);write(after);return before.length!==after.length}
function exportData(){return JSON.stringify({version:1,exportedAt:new Date().toISOString(),sources:list()},null,2)}
return {sources:SOURCES.map(s=>({id:s.id,name:s.name})),searchLinks,saveSource,list,remove,exportData}}
const api={KEY,SOURCES,createResearchDesk};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.IntelligentResearch=api})(typeof globalThis!=="undefined"?globalThis:this);
