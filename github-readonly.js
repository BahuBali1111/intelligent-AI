(function(){
"use strict";
const OWNER="BahuBali1111",REPO="intelligent-AI",API="https://api.github.com";
let token="",files=[];
const $=id=>document.getElementById(id);
const status=$("githubReadStatus"),list=$("githubReadFiles"),preview=$("githubReadPreview");
function say(message){status.textContent=message;}
function headers(){return {"Accept":"application/vnd.github+json","Authorization":"Bearer "+token,"X-GitHub-Api-Version":"2022-11-28"};}
async function request(url){
 const response=await fetch(url,{headers:headers()});
 let data={};try{data=await response.json()}catch{}
 if(!response.ok){const messages={401:"Token गलत या expire हो गया है (401).",403:"GitHub ने अनुमति या rate limit रोक दी (403).",404:"Repository या token permission नहीं मिली (404)."};throw new Error(messages[response.status]||("GitHub API error: "+response.status)+(data.message?" · "+data.message:""));}
 return data;
}
function clearView(){list.replaceChildren();preview.textContent="";files=[];}
function disconnect(){token="";$("githubReadToken").value="";clearView();say("कनेक्शन डिस्कनेक्ट हुआ। Token इस पेज की memory से साफ कर दिया गया।");$("githubReadConnect").disabled=false;}
async function connect(event){
 event.preventDefault();const supplied=$("githubReadToken").value.trim();
 if(!supplied){say("पहले Fine-grained token डालें।");return;}
 token=supplied;$("githubReadToken").value="";$("githubReadConnect").disabled=true;clearView();say("GitHub repository की read-only अनुमति जाँच रहे हैं…");
 try{
  const repo=await request(API+"/repos/"+OWNER+"/"+REPO);
  if(repo.full_name.toLowerCase()!==(OWNER+"/"+REPO).toLowerCase())throw new Error("गलत repository मिली।");
  const tree=await request(API+"/repos/"+OWNER+"/"+REPO+"/git/trees/"+encodeURIComponent(repo.default_branch)+"?recursive=1");
  if(tree.truncated)throw new Error("Repository tree बहुत बड़ा है; पूरी सूची नहीं मिली।");
  files=(tree.tree||[]).filter(x=>x.type==="blob").map(x=>({path:x.path,sha:x.sha})).sort((a,b)=>a.path.localeCompare(b.path));
  say("जुड़ गया · "+repo.full_name+" · "+files.length+" फाइलें मिलीं · केवल Read-only");
  const filter=document.createElement("input");filter.type="search";filter.placeholder="फाइल खोजें…";filter.setAttribute("aria-label","फाइल खोजें");
  filter.style.cssText="width:100%;padding:12px;margin:10px 0;background:#0e1728;color:#fff;border:1px solid #34435f;border-radius:10px";
  const results=document.createElement("div");results.id="githubReadFileButtons";list.append(filter,results);
  function render(query){results.replaceChildren();const matches=files.filter(f=>f.path.toLowerCase().includes(query.toLowerCase())).slice(0,100);for(const file of matches){const b=document.createElement("button");b.type="button";b.textContent=file.path;b.style.cssText="display:block;width:100%;text-align:left;margin:5px 0;overflow-wrap:anywhere";b.onclick=()=>openFile(file);results.append(b);}if(!matches.length){const p=document.createElement("p");p.textContent="कोई matching file नहीं मिली।";results.append(p);}}
  filter.addEventListener("input",()=>render(filter.value));render("");
 }catch(error){token="";say("कनेक्शन नहीं हुआ: "+error.message+" · Token memory से साफ कर दिया गया।");}
 finally{$("githubReadConnect").disabled=false;}
}
async function openFile(file){
 say("फाइल पढ़ रहे हैं: "+file.path);preview.textContent="";
 try{
  const data=await request(API+"/repos/"+OWNER+"/"+REPO+"/contents/"+file.path.split("/").map(encodeURIComponent).join("/")+"?ref=main");
  if(data.encoding!=="base64"||!data.content)throw new Error("इस फाइल का text preview उपलब्ध नहीं है।");
  const binary=atob(data.content.replace(/\n/g,""));const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  const text=new TextDecoder("utf-8",{fatal:false}).decode(bytes);
  preview.textContent=text;say("फाइल पढ़ ली: "+file.path+" · "+text.length+" characters · कोई बदलाव नहीं किया।");
 }catch(error){say("फाइल नहीं खुली: "+error.message);}
}
$("githubReadConnect").addEventListener("submit",connect);
$("githubReadDisconnect").addEventListener("click",disconnect);
window.addEventListener("pagehide",()=>{token="";});
})();