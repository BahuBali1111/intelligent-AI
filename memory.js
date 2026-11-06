(function(root){
  "use strict";
  const KEY="ia-approved-memory-v1",MAX_ITEMS=200,MAX_TEXT=2000;
  function createMemoryStore(storage,key){
    if(!storage||typeof storage.getItem!=="function"||typeof storage.setItem!=="function")throw new TypeError("A compatible storage object is required.");
    const storeKey=key||KEY;
    function read(){try{const data=JSON.parse(storage.getItem(storeKey)||"[]");return Array.isArray(data)?data.filter(x=>x&&typeof x.id==="string"&&typeof x.text==="string").slice(-MAX_ITEMS):[]}catch{return []}}
    function write(items){storage.setItem(storeKey,JSON.stringify(items.slice(-MAX_ITEMS)));return items}
    function add(text,category){
      if(typeof text!=="string"||!text.trim())throw new Error("Memory note cannot be empty.");
      const clean=text.trim();if(clean.length>MAX_TEXT)throw new Error("Memory note is too long (maximum 2,000 characters).");
      const items=read(),item={id:"mem-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8),text:clean,category:String(category||"general").slice(0,40),createdAt:new Date().toISOString()};
      items.push(item);write(items);return item;
    }
    function list(){return read().sort((a,b)=>b.createdAt.localeCompare(a.createdAt))}
    function search(query){const q=String(query||"").trim().toLocaleLowerCase();return list().filter(x=>!q||(x.text+" "+x.category).toLocaleLowerCase().includes(q))}
    function remove(id){const items=read(),next=items.filter(x=>x.id!==id);write(next);return next.length!==items.length}
    function clear(){storage.removeItem(storeKey)}
    function exportData(){return JSON.stringify({version:1,exportedAt:new Date().toISOString(),items:list()},null,2)}
    function importData(json){
      const data=typeof json==="string"?JSON.parse(json):json;
      if(!data||data.version!==1||!Array.isArray(data.items))throw new Error("Unsupported memory backup format.");
      const clean=data.items.filter(x=>x&&typeof x.text==="string"&&x.text.trim()).slice(-MAX_ITEMS).map(x=>({id:String(x.id||"import-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8)),text:x.text.trim().slice(0,MAX_TEXT),category:String(x.category||"general").slice(0,40),createdAt:x.createdAt||new Date().toISOString()}));
      write(clean);return clean.length;
    }
    return {add,list,search,remove,clear,exportData,importData};
  }
  const api={KEY,MAX_ITEMS,MAX_TEXT,createMemoryStore};
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  root.IntelligentMemory=api;
})(typeof globalThis!=="undefined"?globalThis:this);
