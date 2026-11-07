"use strict";
(() => {
 const BACKEND="https://intelligent-ai-backend.vercel.app",KEY="ia_github_encrypted_session";
 const status=document.getElementById("githubOAuthStatus"),connect=document.getElementById("githubOAuthConnect"),disconnect=document.getElementById("githubOAuthDisconnect"),input=document.getElementById("githubPatInput"),button=document.getElementById("githubPatConnect");
 if(!status||!connect||!disconnect)return;
 const params=new URLSearchParams(location.hash.slice(1)),returned=params.get("github_session");
 if(returned){try{localStorage.setItem(KEY,returned);}catch(_){}history.replaceState({},"",location.pathname+location.search);}
 const ticket=()=>{try{return localStorage.getItem(KEY)||"";}catch(_){return"";}};
 async function api(path,opts={}){const headers=new Headers(opts.headers||{}),t=ticket();if(t)headers.set("Authorization","Bearer "+t);return fetch(BACKEND+path,{...opts,headers,credentials:"omit",cache:"no-store"});}
 async function refresh(){if(!ticket()){status.textContent="Not connected · Enter a GitHub token below or use secure OAuth.";return;}status.textContent="Checking GitHub connection…";try{const r=await api("/api/github/status"),d=await r.json();if(!r.ok)throw Error(d.error||"status_check_failed");status.textContent=d.connected?"Connected ✓ GitHub account: "+d.account+" · "+d.repository:"Not connected";}catch(e){status.textContent="Connection check failed: "+e.message;}}
 if(button&&input)button.addEventListener("click",async()=>{const token=input.value.trim();if(!token){status.textContent="Paste your GitHub token first.";return;}button.disabled=true;status.textContent="Validating token securely with GitHub…";try{const r=await fetch(BACKEND+"/api/github/token",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token}),credentials:"omit",cache:"no-store"}),d=await r.json().catch(()=>({}));if(!r.ok||!d.ticket)throw Error(d.error||"github_token_validation_failed");localStorage.setItem(KEY,d.ticket);input.value="";status.textContent="Connected ✓ GitHub account: "+d.account+" · "+d.repository+" (7-day session)";}catch(e){status.textContent="GitHub connection failed: "+e.message;}finally{button.disabled=false;}});
 connect.addEventListener("click",()=>{status.textContent="Opening GitHub authorization…";});
 disconnect.addEventListener("click",async()=>{disconnect.disabled=true;try{await api("/api/github/disconnect",{method:"POST"});}catch(_){}try{localStorage.removeItem(KEY);}catch(_){}status.textContent="Disconnected from GitHub.";disconnect.disabled=false;});
 window.addEventListener("storage",e=>{if(e.key===KEY)refresh();});refresh();
})();