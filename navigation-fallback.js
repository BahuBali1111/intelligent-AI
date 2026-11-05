(function(){
"use strict";
function showTab(id){
 const target=document.getElementById(id);
 if(!target||!target.classList.contains("tab"))return false;
 document.querySelectorAll(".tab").forEach(el=>el.classList.toggle("show",el.id===id));
 document.querySelectorAll("nav button[data-tab]").forEach(btn=>btn.classList.toggle("active",btn.dataset.tab===id));
 const active=document.querySelector("nav button[data-tab='"+id+"']");
 const crumb=document.getElementById("crumb");if(crumb&&active)crumb.textContent=active.textContent.replace(/^[^A-Za-z\u0900-\u097F]+/,"").trim();
 document.querySelector(".layout")?.classList.remove("menu-open");
 return true;
}
document.addEventListener("click",function(event){
 if(window.__INTELLIGENT_APP_READY__)return;
 const menu=event.target.closest("#menu");
 if(menu){document.querySelector(".layout")?.classList.toggle("menu-open");return;}
 const nav=event.target.closest("nav button[data-tab]");
 if(nav){showTab(nav.dataset.tab);return;}
 const prompt=event.target.closest("[data-prompt]");
 if(prompt){const chat=document.getElementById("chat");showTab("chat");const input=document.getElementById("input");if(input){input.value=prompt.dataset.prompt;input.focus();}}
});
document.addEventListener("submit",function(event){
 if(window.__INTELLIGENT_APP_READY__)return;
 if(event.target.id!=="form"||event.defaultPrevented)return;
 event.preventDefault();
 const input=document.getElementById("input"),messages=document.getElementById("messages");
 const value=(input?.value||"").trim();if(!value||!messages)return;
 const add=(role,text)=>{const article=document.createElement("article"),name=document.createElement("b"),body=document.createElement("p");article.className=role==="user"?"message user-message":"message assistant-message";name.textContent=role==="user"?"You":"✦ Intelligent AI";body.textContent=text;article.append(name,body);messages.append(article);};
 add("user",value);add("assistant","The main app script did not start correctly. Your message is visible, but live AI is not connected in this fallback mode. Please refresh after the app repair.");
 input.value="";
});
})();
