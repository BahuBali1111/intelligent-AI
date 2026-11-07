const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const CHAT_KEY="ia-chat-v1",LANG_KEY="ia-lang",AUTO_KEY="ia-auto";
const memoryStore=window.IntelligentMemory.createMemoryStore(localStorage);
const knowledgeStore=window.IntelligentKnowledge.createKnowledgeStore(localStorage);
const updateStore=window.IntelligentUpdates.createUpdateEngine(localStorage);
const researchDesk=window.IntelligentResearch.createResearchDesk(localStorage);
const researchAnalyzer=window.IntelligentResearchAnalyzer;
const researchEngine=window.IntelligentResearchEngine.createResearchEngine();
const contextStore=window.IntelligentContext.createContextStore(localStorage);
const assistantBrain=window.IntelligentBrain;
const selfAwareness=window.IntelligentSelfAwareness;
const pluginHost=window.IntelligentPlugins.createPluginHost(window.IntelligentCore);
window.IntelligentPluginHost=pluginHost;
if(window.IntelligentExampleEcho)pluginHost.register(window.IntelligentExampleEcho);
let modelClient=window.IntelligentModelClient||null;
async function ensureModelClient(){
 if(modelClient&&typeof modelClient.connect==="function")return modelClient;
 await new Promise((resolve,reject)=>{
  const script=document.createElement("script");
  script.src=new URL("model-client.js?v=0.2.0",document.baseURI).href;
  script.onload=resolve;
  script.onerror=()=>reject(new Error("Model client file could not load. Check GitHub Pages deployment and refresh."));
  document.head.appendChild(script);
 });
 modelClient=window.IntelligentModelClient||null;
 if(!modelClient||typeof modelClient.connect!=="function")throw new Error("Model client loaded without its connection functions. Please refresh once.");
 return modelClient;
}
let latestResearch=[];let researchBusy=false;
const codeWorkbench=window.IntelligentCodeWorkbench.createCodeWorkbench(localStorage);
let lang=localStorage.getItem(LANG_KEY)||"en";
let messages=loadMessages();
const words={
 en:{nav:["AI Assistant","Capabilities","Self-update centre","Memory & privacy","Knowledge library","Browser research","Coding workshop","Settings"],placeholder:"Message Intelligent AI…",reply:"Thanks for your message. This is the foundation demo; a real AI model and tools are not connected yet. I can save this conversation on this device, but I cannot answer with live AI intelligence until a secure model connection is added.",you:"You",assistant:"✦ Intelligent AI",saved:"Saved on this device only",empty:"No messages yet. Start a conversation.",confirm:"Clear this conversation from this device?",exportName:"intelligent-ai-chat",memTitle:"Saved notes",memIntro:"Only save notes when you choose. Notes stay on this device; do not store passwords or secrets.",memPlaceholder:"Write a note to remember…",memCategory:"Category",memSave:"Save note",memSearch:"Search saved notes…",memExport:"Export memory",memClear:"Delete all notes",memEmpty:"No saved notes yet.",memDelete:"Delete",memSaved:"Note saved on this device.",knowTitle:"Knowledge library",knowIntro:"Build a private, searchable library from notes you choose to add.",knowName:"Title",knowBody:"Knowledge content",knowCategory:"Category",knowTags:"Tags (comma separated)",knowAdd:"Add to library",knowSearch:"Search your knowledge…",knowExport:"Export library",knowClear:"Delete all knowledge",knowEmpty:"No matching knowledge yet.",knowDelete:"Delete",knowAdded:"Knowledge saved locally.",upTitle:"Improvement proposals",upIntro:"Review capability gaps and record possible improvements. Nothing runs or deploys automatically.",upCreate:"Create proposal",upName:"Proposal title",upReason:"Why is this needed?",upChange:"What should change?",upRisk:"Risk level",upLow:"Low",upMedium:"Medium",upHigh:"High",upAdd:"Save proposal",upCaps:"Capability status",upGaps:"Open capability gaps",upEmpty:"No proposals yet.",upTest:"Record passing test",upApprove:"Approve proposal",upReject:"Reject",upDelete:"Delete",upExport:"Export ledger",upSaved:"Proposal saved locally.",upDraft:"Draft",upTested:"Tested (recorded)",upApproved:"Approved",upRejected:"Rejected",upAvailable:"Available",upPrototype:"Prototype",upPlanned:"Planned",autoLabel:"Automatic updates",autoHelp:"When ON, the future update engine may prepare and apply updates according to your instructions. OFF pauses automatic updates.",researchTitle:"Live multi-source browser research",researchIntro:"Search relevant results across eight public indexes directly from this page. Search engines also remain available for broader web coverage.",researchQuery:"What should I research or improve?",researchRun:"Search eight live sources",researchSave:"Save source",researchSourceTitle:"Source title",researchUrl:"Paste source URL",researchNotes:"Notes and useful findings",researchNotebook:"Saved research notebook",researchExport:"Export research notes",researchHint:"Live search queries public APIs from Wikipedia, Crossref, OpenAlex, GitHub and Stack Overflow. Some sources may fail or rate-limit; partial results are kept.",researchEmpty:"No saved research yet.",researchRemove:"Remove",researchWorking:"Searching public sources…",researchNoResults:"No matching results returned. Try a different phrase or use the search links below.",researchProviders:"Source status",researchPartial:"Partial results — some sources did not respond.",researchComplete:"Search finished.",researchResultCount:"results",researchOpen:"Open source",researchSaveResult:"Save notes",researchCoverageNote:"This searches eight public indexes, not every page on the internet.",continuityTitle:"Project continuity",continuityIntro:"Confirmed project rules and recent instructions help keep work consistent. This index is stored only in this browser.",continuityRecentTitle:"Recent instructions",continuityExport:"Export project context",continuityClear:"Clear recent instruction index",continuityCleared:"Recent instruction index cleared; confirmed project rules remain.",continuitySaved:"Project context backup exported.",researchAnalyze:"Analyze saved research",researchReport:"Research analysis",researchNoReport:"Save source notes, then analyze them.",researchCreateProposal:"Create improvement proposal from this research",researchTerms:"Recurring terms",researchCoverage:"source coverage",researchNoNotes:"No source notes saved yet.",researchLimit:"Local analysis only — no AI fact-checking."},
 hi:{nav:["AI सहायक","क्षमताएँ","खुद में सुधार","याददाश्त और गोपनीयता","ज्ञान लाइब्रेरी","ब्राउज़र रिसर्च","कोडिंग वर्कशॉप","सेटिंग"],placeholder:"Intelligent AI को संदेश लिखें…",reply:"आपके संदेश के लिए धन्यवाद। यह शुरुआती डेमो है; अभी असली AI मॉडल और टूल जुड़े नहीं हैं। यह बातचीत इसी डिवाइस पर सेव हो सकती है, लेकिन असली AI जवाब देने के लिए सुरक्षित मॉडल कनेक्शन जोड़ना बाकी है।",you:"आप",assistant:"✦ Intelligent AI",saved:"केवल इसी डिवाइस पर सेव",empty:"अभी कोई संदेश नहीं है। बातचीत शुरू करें।",confirm:"क्या इस डिवाइस से यह बातचीत मिटानी है?",exportName:"intelligent-ai-chat",memTitle:"सेव की गई यादें",memIntro:"नोट तभी सेव करें जब आप चाहें। नोट इसी डिवाइस पर रहेंगे; पासवर्ड या गुप्त जानकारी सेव न करें।",memPlaceholder:"याद रखने के लिए नोट लिखें…",memCategory:"श्रेणी",memSave:"नोट सेव करें",memSearch:"सेव नोट खोजें…",memExport:"Memory Export करें",memClear:"सभी नोट हटाएँ",memEmpty:"अभी कोई नोट सेव नहीं है।",memDelete:"हटाएँ",memSaved:"नोट इसी डिवाइस पर सेव हुआ।",knowTitle:"ज्ञान लाइब्रेरी",knowIntro:"अपनी चुनी हुई जानकारी की निजी और खोजने योग्य लाइब्रेरी बनाएँ।",knowName:"शीर्षक",knowBody:"जानकारी",knowCategory:"श्रेणी",knowTags:"टैग (कॉमा से अलग करें)",knowAdd:"लाइब्रेरी में जोड़ें",knowSearch:"अपनी जानकारी खोजें…",knowExport:"लाइब्रेरी Export",knowClear:"सारी जानकारी हटाएँ",knowEmpty:"अभी कोई मेल खाती जानकारी नहीं मिली।",knowDelete:"हटाएँ",knowAdded:"जानकारी डिवाइस पर सेव हुई।",upTitle:"सुधार प्रस्ताव",upIntro:"क्षमताओं की कमी देखें और सुधार दर्ज करें। कोई कोड अपने आप नहीं चलेगा या Deploy होगा।",upCreate:"सुधार प्रस्ताव बनाएँ",upName:"प्रस्ताव का शीर्षक",upReason:"यह क्यों जरूरी है?",upChange:"क्या बदलाव होना चाहिए?",upRisk:"जोखिम स्तर",upLow:"कम",upMedium:"मध्यम",upHigh:"ज्यादा",upAdd:"प्रस्ताव सेव करें",upCaps:"क्षमता की स्थिति",upGaps:"अधूरी क्षमताएँ",upEmpty:"अभी कोई प्रस्ताव नहीं है।",upTest:"सफल टेस्ट दर्ज करें",upApprove:"प्रस्ताव मंजूर करें",upReject:"अस्वीकार",upDelete:"हटाएँ",upExport:"Ledger Export",upSaved:"प्रस्ताव डिवाइस पर सेव हुआ।",upDraft:"मसौदा",upTested:"टेस्टेड (दर्ज)",upApproved:"मंजूर",upRejected:"अस्वीकृत",upAvailable:"उपलब्ध",upPrototype:"प्रोटोटाइप",upPlanned:"योजनाबद्ध",autoLabel:"ऑटो अपडेट",autoHelp:"चालू होने पर भविष्य का Update Engine आपके निर्देश के अनुसार अपडेट तैयार और लागू कर सकेगा। बंद करने पर ऑटो अपडेट रुकेंगे।",researchTitle:"लाइव मल्टी-सोर्स ब्राउज़र रिसर्च",researchIntro:"इस पेज से आठ सार्वजनिक स्रोतों में सीधे खोजें। ज्यादा वेब कवरेज के लिए दूसरे सर्च लिंक भी उपलब्ध हैं।",researchQuery:"क्या खोजना या सुधारना है?",researchRun:"आठ स्रोतों में खोजें",researchSave:"स्रोत सेव करें",researchSourceTitle:"स्रोत का शीर्षक",researchUrl:"स्रोत का URL डालें",researchNotes:"नोट और उपयोगी जानकारी",researchNotebook:"सेव की गई रिसर्च",researchExport:"रिसर्च नोट Export करें",researchHint:"यह Wikipedia, Crossref, OpenAlex, GitHub और Stack Overflow के सार्वजनिक API में खोजता है। कुछ स्रोत धीमे या असफल हो सकते हैं; बाकी स्रोतों के परिणाम फिर भी मिलेंगे।",researchEmpty:"अभी कोई रिसर्च सेव नहीं है।",researchRemove:"हटाएँ",researchWorking:"सार्वजनिक स्रोतों में खोज हो रही है…",researchNoResults:"कोई परिणाम नहीं मिला। दूसरा शब्द आज़माएँ या नीचे दिए सर्च लिंक खोलें।",researchProviders:"स्रोतों की स्थिति",researchPartial:"कुछ स्रोतों से जवाब नहीं मिला; बाकी परिणाम दिखाए गए हैं।",researchComplete:"खोज पूरी हुई।",researchResultCount:"परिणाम",researchOpen:"स्रोत खोलें",researchSaveResult:"नोट सेव करें",researchCoverageNote:"यह पाँच सार्वजनिक इंडेक्स खोजता है, इंटरनेट के हर पेज को नहीं।",continuityTitle:"परियोजना की याददाश्त",continuityIntro:"पुष्ट परियोजना नियम और हाल के निर्देश काम को सही दिशा में रखते हैं। यह इंडेक्स इसी ब्राउज़र में सेव रहता है।",continuityRecentTitle:"हाल के निर्देश",continuityExport:"प्रोजेक्ट संदर्भ Export करें",continuityClear:"हाल के निर्देशों का इंडेक्स साफ़ करें",continuityCleared:"हाल के निर्देश हटाए; पुष्ट परियोजना नियम सुरक्षित हैं।",continuitySaved:"प्रोजेक्ट संदर्भ का बैकअप Export हुआ।",researchAnalyze:"सेव रिसर्च का विश्लेषण करें",researchReport:"रिसर्च विश्लेषण",researchNoReport:"पहले स्रोतों के नोट सेव करें, फिर विश्लेषण करें।",researchCreateProposal:"इस रिसर्च से सुधार प्रस्ताव बनाएँ",researchTerms:"बार-बार मिले शब्द",researchCoverage:"स्रोत कवरेज",researchNoNotes:"अभी किसी स्रोत के नोट सेव नहीं हैं।",researchLimit:"यह स्थानीय विश्लेषण है — AI Fact-check नहीं।"}
};
const skills=[["Reasoning & planning","तर्क और योजना"],["Web research","इंटरनेट रिसर्च"],["Coding studio","कोडिंग स्टूडियो"],["Files & data","फाइल और डेटा"],["Voice & vision","आवाज़ और चित्र"],["Self-improvement","खुद में सुधार"],["User-controlled memory","उपयोगकर्ता नियंत्रित याददाश्त"],["Specialist agents","विशेषज्ञ एजेंट"],["Task automation","काम का ऑटोमेशन"]];
function loadMessages(){try{const x=JSON.parse(localStorage.getItem(CHAT_KEY)||"[]");return Array.isArray(x)?x.slice(-300):[]}catch{return []}}
function saveMessages(){try{localStorage.setItem(CHAT_KEY,JSON.stringify(messages.slice(-300)))}catch{if($("#storageNote"))$("#storageNote").textContent="Device storage is full; export your chat."}}
function renderMessages(){const root=$("#messages");root.replaceChildren();if(!messages.length){const p=document.createElement("p");p.className="empty-state";p.textContent=words[lang].empty;root.append(p)}for(const m of messages){const a=document.createElement("article"),b=document.createElement("b"),p=document.createElement("p");a.className=m.role==="user"?"message user-message":"message assistant-message";b.textContent=m.role==="user"?words[lang].you:words[lang].assistant;p.textContent=m.text;a.append(b,p);if(Array.isArray(m.sources)&&m.sources.length){const list=document.createElement("div");list.className="chat-source-list";for(const s of m.sources){const link=document.createElement("a");link.href=s.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent="↗ "+s.title+" · "+s.source;list.append(link)}a.append(list)}root.append(a)}root.scrollTop=root.scrollHeight}
function language(){const w=words[lang];document.documentElement.lang=lang==="hi"?"hi":"en";$("#lang").textContent=$("#lang2").textContent="हिं / EN";$("#input").placeholder=w.placeholder;$("#storageNote").textContent=w.saved;$$("nav button").forEach((b,i)=>b.textContent=["◈ ","✧ ","⟳ ","▤ ","⌕ ","◎ ","⌘ ","⚙ "][i]+w.nav[i]);$("#crumb").textContent=w.nav[$$("nav button").findIndex(b=>b.classList.contains("active"))]||w.nav[0];$("#skillGrid").innerHTML=skills.map(x=>"<article><b>"+(lang==="hi"?x[1]:x[0])+"</b><p>"+(lang==="hi"?"भविष्य में मॉडल और टूल जुड़ने पर सक्रिय होगा।":"Planned capability; activates when its model and tools are connected.")+"</p></article>").join("");$("#state").textContent=lang==="hi"?"ऑटो अपडेट: "+($("#auto").checked?"चालू":"बंद"):"Automatic updates: "+($("#auto").checked?"ON":"OFF");$("#autoLabel").textContent=w.autoLabel;$("#autoHelp").textContent=w.autoHelp;$("#memoryTitle").textContent=w.memTitle;$("#memoryIntro").textContent=w.memIntro;$("#continuityTitle").textContent=w.continuityTitle;$("#continuityIntro").textContent=w.continuityIntro;$("#continuityRecentTitle").textContent=w.continuityRecentTitle;$("#continuityExport").textContent=w.continuityExport;$("#continuityClear").textContent=w.continuityClear;renderContinuity();$("#memoryText").placeholder=w.memPlaceholder;$("#memoryCategoryLabel").textContent=w.memCategory;$("#memorySave").textContent=w.memSave;$("#memorySearch").placeholder=w.memSearch;$("#memoryExport").textContent=w.memExport;$("#memoryClear").textContent=w.memClear;$("#knowledgeTitle").textContent=w.knowTitle;$("#knowledgeIntro").textContent=w.knowIntro;$("#knowledgeName").placeholder=w.knowName;$("#knowledgeBody").placeholder=w.knowBody;$("#knowledgeCategoryLabel").textContent=w.knowCategory;$("#knowledgeTags").placeholder=w.knowTags;$("#knowledgeAdd").textContent=w.knowAdd;$("#knowledgeSearch").placeholder=w.knowSearch;$("#knowledgeExport").textContent=w.knowExport;$("#knowledgeClear").textContent=w.knowClear;$("#updateTitle").textContent=w.upTitle;$("#updateIntro").textContent=w.upIntro;$("#updateCreateTitle").placeholder=w.upName;$("#updateReason").placeholder=w.upReason;$("#updateChange").placeholder=w.upChange;$("#updateRiskLabel").textContent=w.upRisk;$("#updateAdd").textContent=w.upAdd;$("#updateExport").textContent=w.upExport;$("#researchTitle").textContent=w.researchTitle;$("#researchIntro").textContent=w.researchIntro;$("#researchQuery").placeholder=w.researchQuery;$("#researchRun").textContent=w.researchRun;$("#researchSave").textContent=w.researchSave;$("#researchSourceTitle").placeholder=w.researchSourceTitle;$("#researchUrl").placeholder=w.researchUrl;$("#researchNotes").placeholder=w.researchNotes;$("#researchNotebookTitle").textContent=w.researchNotebook;$("#researchExport").textContent=w.researchExport;$("#researchHint").textContent=w.researchHint;$("#researchSourcesHeading").textContent=w.researchProviders;$("#codingTitle").textContent=w.codeTitle;$("#codingIntro").textContent=w.codeIntro;$("#codingNotice").textContent=w.codeNotice;$("#codePath").placeholder=w.codePath;$("#codeReason").placeholder=w.codeReason;$("#codeBeforeLabel").textContent=w.codeBefore;$("#codeAfterLabel").textContent=w.codeAfter;$("#codeAfter").placeholder=w.codeAfter;$("#codeSave").textContent=w.codeSave;$("#codeDraftsTitle").textContent=w.codeDrafts;$("#codeExportAll").textContent=w.codeExport;renderCodeDrafts();$("#researchAnalyze").textContent=w.researchAnalyze;$("#researchReportTitle").textContent=w.researchReport;$("#researchProposal").textContent=w.researchCreateProposal;renderResearchAnalysis();renderResearchLinks();renderResearchNotebook();renderUpdates();renderMemory();renderKnowledge();renderMessages()}
function changeLang(){lang=lang==="en"?"hi":"en";localStorage.setItem(LANG_KEY,lang);language()}
function tab(id){$$(".tab").forEach(x=>x.classList.toggle("show",x.id===id));$$("nav button").forEach(x=>x.classList.toggle("active",x.dataset.tab===id));$("#crumb").textContent=words[lang].nav[["chat","skills","updates","memory","knowledge","research","coding","settings"].indexOf(id)];$(".layout").classList.remove("menu-open")}
async function send(t){
 const checked=window.IntelligentCore.validateMessage(t);
 if(!checked.ok){alert(checked.error);return}
 const clean=checked.value,analysis=assistantBrain.understand(clean);analysis.language=lang;const taskPlan=(selfAwareness&&typeof selfAwareness.splitInput==="function")?selfAwareness.splitInput(clean):{original:clean,tasks:[{id:"task-1",index:1,text:clean,source:"user-message"}],isMultiPart:false,characterCount:clean.length};const plan={intent:analysis.intent};
 messages.push({role:"user",text:clean,at:new Date().toISOString()});contextStore.capture(clean);renderContinuity();
 const pending={role:"assistant",text:lang==="hi"?"सोच रहा हूँ…":"Thinking…",at:new Date().toISOString(),pending:true};
 messages.push(pending);messages=messages.slice(-300);saveMessages();renderMessages();$("#input").value="";
 const buildIntent=/(\b(build|create|make|generate|develop|banao|banaiye|banana|bana do|bana ke do|bana kar do|taiyar karo|taiyar kar|app banao|project banao)\b|बनाओ|बनाइए|बनाना|बना दो|बना दीजिए|तैयार करो|तैयार करें|बनाकर दो)/i.test(clean);
 const buildSubject=/(\b(app|application|project|website|software|tool|dashboard|game|api)\b|ऐप|एप|प्रोजेक्ट|वेबसाइट|सॉफ्टवेयर|टूल|डैशबोर्ड|गेम)/i.test(clean);
 if(buildIntent&&buildSubject&&window.IntelligentCodingAgent){
  try{
   const client=await ensureModelClient();
   const generated=await window.IntelligentCodingAgent.generateProject({
    client,workbench:codeWorkbench,brief:clean,stack:"Choose a reliable simple stack and explain it in README",maxFiles:8,
    onProgress:event=>{pending.text=(lang==="hi"?"प्रोजेक्ट तैयार हो रहा है: ":"Building project: ")+(event.message||event.stage);renderMessages();}
   });
   const workspace=window.IntelligentLocalWorkspace&&window.IntelligentLocalWorkspace.status();
   if(workspace&&workspace.connected){
    const saved=await window.IntelligentLocalWorkspace.writeProject(generated.manifest,generated.drafts.map(item=>({path:item.path,content:item.content})));
    pending.text=(lang==="hi"?"पूरा हुआ! ":"Completed! ")+generated.drafts.length+(lang==="hi"?" फाइलें आपके फोन में सेव हुईं। फोल्डर: ":" files saved to your phone. Folder: ")+saved.folder+"\\n"+generated.drafts.map(x=>"• "+x.path).join("\\n");
   }else{
    pending.text=(lang==="hi"?"प्रोजेक्ट की ":"Project ")+generated.drafts.length+(lang==="hi"?" फाइलें Draft में तैयार हैं। फोन में सेव करने के लिए Coding Workshop में Workspace Folder Connect करें।":" files were generated as drafts. Connect a local workspace folder in Coding Workshop to save them to your phone.")+"\\n"+generated.drafts.map(x=>"• "+x.path).join("\\n");
   }
   renderCodeDrafts();
  }catch(error){pending.text=(lang==="hi"?"प्रोजेक्ट बनाते समय समस्या: ":"Project build failed: ")+String(error&&error.message||error);}
  delete pending.pending;pending.at=new Date().toISOString();saveMessages();renderMessages();return;
 }

 const isRepositoryTask=/(github|git\\s*hub|repository|repo|गिटहब|रिपॉजिटरी)/i.test(clean);
 if(plan.intent==="research"&&!isRepositoryTask){
  try{
   const result=await researchEngine.search(clean);
   const providerLines=result.providers.map(p=>p.name+": "+(p.status==="success"?(p.count+" results"):(p.error||"unavailable"))).join("\n");
   const sourceList=result.items.slice(0,10).map((x,i)=>(i+1)+". "+x.title+" | "+x.source+" | "+(x.date||"date not supplied")+" | "+x.snippet+" | "+x.url+(x.fullText?"\nFULL PAGE TEXT (reader extract): "+x.fullText.slice(0,9000):"\nPage reading: "+(x.pageRead||"not attempted"))).join("\n");
   if(modelClient&&modelClient.isConnected()&&result.items.length){
    const researchPrompt=lang==="hi"
     ?"तुम Intelligent AI के रिसर्च विश्लेषक हो। नीचे दिए गए सार्वजनिक इंडेक्स के खोज-परिणामों के आधार पर सरल हिंदी में संक्षिप्त रिपोर्ट बनाओ। केवल उपलब्ध शीर्षक/snippet/तारीख से समर्थित बातें कहो; पूरे लेख पढ़ लेने का दावा मत करो। कम-से-कम 2 अलग-अलग स्रोत प्रदाता न हों तो साफ बताओ कि स्वतंत्र स्रोतों की पुष्टि अपर्याप्त है। पूरे पेज का टेक्स्ट उपलब्ध हो तो उसका भी विश्लेषण करो; केवल snippets पर निर्भर मत रहो। विरोधाभास, तारीख और सीमाएँ बताओ। हर तथ्य के साथ [S1], [S2] जैसे स्रोत संकेत लगाओ और अंत में उन्हीं संकेतों के साथ URL सूची दो। कोई लिंक या तथ्य मत गढ़ो।"
     :"You are the research analyst for Intelligent AI. Produce a concise evidence-based report from the supplied public-index search records. Use only supplied titles/snippets/dates; never claim to have read full pages. If fewer than two independent providers returned relevant results, clearly say independent-source confirmation is insufficient. Analyze supplied full-page extracts when available, not just snippets. Note dates, uncertainty and limitations. Cite claims as [S1], [S2] and list only supplied URLs. Never invent sources or facts.";
    const synthesis=await modelClient.chat([{role:"system",content:researchPrompt},{role:"user",content:"Research question: "+clean+"\nProvider status:\n"+providerLines+"\nSearch records:\n"+sourceList+"\n\nExplain what is supported, what is not established, and what additional source access is needed."}],{maxTokens:3000});
    pending.text=synthesis.text+"\n\n"+(lang==="hi"?"स्रोत प्रदाता स्थिति:\n":"Provider status:\n")+providerLines+"\n\n"+(lang==="hi"?"सीमा: अभी केवल सार्वजनिक API/index से मिले शीर्षक और छोटे विवरण पढ़े गए हैं; पूरी वेबसाइट/लेख स्वतः नहीं पढ़े गए।":"Limit: only titles and short snippets from public APIs/indexes were read; full web pages were not fetched.");
   }else{
    pending.text=(lang==="hi"?"मुझे "+result.items.length+" संबंधित खोज परिणाम मिले। नीचे मूल स्रोत खोलें।":"Found "+result.items.length+" relevant search results. Open the original sources below.")+"\n\n"+(lang==="hi"?"स्रोतों की स्थिति:\n":"Provider status:\n")+providerLines+"\n\n"+(result.successCount<2?(lang==="hi"?"दो स्वतंत्र स्रोत प्रदाताओं से परिणाम नहीं मिले; पुष्टि अधूरी है।":"Fewer than two independent providers returned results; confirmation is incomplete."):"")+(lang==="hi"?"\nसीमा: केवल सार्वजनिक API/index के शीर्षक और snippets मिले हैं, पूरी वेबसाइटें नहीं पढ़ी गईं।":"\nLimit: only titles and snippets from public APIs/indexes were retrieved, not full web pages.");
   }
   pending.sources=result.items.slice(0,8).map(x=>({title:x.title,source:x.source,url:x.url}));
  }catch(err){pending.text=(lang==="hi"?"रिसर्च खोज पूरी नहीं हो सकी: ":"Research search could not complete: ")+err.message}
  delete pending.pending;saveMessages();renderMessages();return;
 }
 const ghBridge=window.IntelligentGitHubBridge;
 const ghStatusAsk=/(github|git hub|repository|repo).*(status|connected|connection|जुड़ा|कनेक्शन|स्थिति)|(status|connected|connection|जुड़ा|कनेक्शन|स्थिति).*(github|repository|repo)/i.test(clean);
 const ghSelfAsk=/(what can you do|your capabilities|your features|your limitations|self.?audit.*(status|report|review)|tumhare andar|tumhare features|tumhari kshamta|apni kshamta|apni kami|तुम्हारे अंदर|तुम्हारी क्षमता|तुम्हारे फीचर|अपनी क्षमता|अपनी कमी|तुम क्या कर सकते हो|तुममें क्या कमी)/i.test(clean);
 const ghListAsk=/(github|git hub|repository|repo|गिटहब|रिपॉजिटरी).*(file|files|list|सूची|फाइल|फ़ाइल|मौजूद|readme|index)|(file|files|list|सूची|फाइल|फ़ाइल|मौजूद|readme|index).*(github|git hub|repository|repo|गिटहब|रिपॉजिटरी)/i.test(clean);
 const ghInspectAsk=/(inspect|review|check|जाँच|जांच|देखो|विश्लेषण).*(github|repository|repo|कोड)|(github|repository|repo|कोड).*(inspect|review|check|जाँच|जांच|देखो|विश्लेषण)/i.test(clean);
 const ghUpdateAsk=/(self.?update|self.?improv|update.*(yourself|your code|repo|github|खुद|कोड)|improve.*(yourself|your code|repo|github|code)|fix.*(your code|repo|github)|खुद.*(अपडेट|सुधार)|कोड.*(सुधार|अपडेट)|github.*(बदलाव|सुधार|अपडेट)|khud.*(update|sudhar)|apne aap.*(update|improve)|repo.*(update|improve|sudhar)|सुधार.*(प्रस्ताव|तैयार|बनाओ)|कमियां.*(सुधार|बताओ)|क्षमताओं.*(सुधार|बढ़ाओ))/i.test(clean);
 const ghActionsAsk=/(github\s*actions|workflow|workflows|build status|deployment status|actions status|एक्शन(्स)?|वर्कफ़्लो|वर्कफ्लो|डिप्लॉयमेंट)/i.test(clean);
 const ghRunMatch=clean.match(/(?:run|workflow|रन)\s*#?\s*(\d{6,})/i);
 const ghFileAsk=/(?:file|फाइल|फ़ाइल).*(?:read|show|open|inspect|पढ़|दिखा|खोल)|(?:read|show|open|inspect|पढ़ो|दिखाओ|खोलो).*(?:file|फाइल|फ़ाइल)/i.test(clean);
 const ghFileMatch=clean.match(/(?:^|[\s"\x27`])((?:[\w.-]+\/)*[\w.-]+\.(?:js|json|html|css|md|txt|yml|yaml))(?=$|[\s"\x27`,.;:])/i);
 const ghIntent=ghSelfAsk||ghListAsk||ghStatusAsk||ghInspectAsk||ghUpdateAsk||ghActionsAsk||!!ghRunMatch||(ghFileAsk&&!!ghFileMatch);
 if(ghIntent&&!ghBridge){
  pending.text=lang==="hi"?"GitHub चैट ब्रिज इस पेज में लोड नहीं हुआ। यह अनुमति की समस्या नहीं है। पेज को पूरी तरह Refresh करें; यदि फिर भी यही संदेश आए तो ऐप की नई तैनाती जाँचनी होगी।":"The GitHub chat bridge did not load on this page. This is not a GitHub permission denial. Fully refresh the app; if it persists, the app deployment needs checking.";
  delete pending.pending;saveMessages();renderMessages();return;
 }
 if(ghIntent&&ghBridge){
  try{
   if(!ghBridge.isConnected()){
    pending.text=lang==="hi"?"GitHub इस खुले पेज में अभी कनेक्ट नहीं है। Settings में जाकर GitHub Token से Connect करें; फिर चैट में दोबारा कहें।":"GitHub is not connected in this page session. Connect it in Settings, then retry here.";
   }else if(ghSelfAsk){
    const snapshot=await ghBridge.inspect();
    const inventory=selfAwareness.snapshot({repository:ghBridge.repository,branch:"main",files:snapshot.files,modelConnected:!!(modelClient&&modelClient.isConnected()),githubConnected:true,inspectedAt:new Date().toISOString()});
    if(modelClient&&modelClient.isConnected()){
     const report=await modelClient.chat([{role:"system",content:"You are Intelligent AI's self-audit analyst. Use only the supplied live repository snapshot and capability manifest. Explain what this project actually contains, distinguish available, partial, planned and external-provider-dependent features, identify real gaps, and never claim an integration works merely because a file exists. Reply in simple Hindi/Hinglish. Do not propose code changes in this response."},{role:"user",content:"Live repository snapshot:\n"+JSON.stringify(snapshot.files.map(x=>({path:x.path,size:x.size,content:x.content})))+"\n\nCapability manifest:\n"+JSON.stringify(inventory)+"\n\nUser question: "+clean}],{maxTokens:1800});
     pending.text=report.text+"\n\nLive GitHub inspection: "+snapshot.files.length+" files supplied from "+ghBridge.repository+".";
    }else{
     pending.text="GitHub se live file snapshot padha gaya.\nRepository: "+ghBridge.repository+"\nFiles: "+snapshot.files.map(x=>x.path).join(", ")+"\n\n"+inventory.features.map(x=>x.name+" — "+x.status+": "+x.detail).join("\n")+"\n\nAI model connected nahi hai, isliye code ka deeper analysis abhi nahi hua.";
    }
   }else if(ghListAsk){
    const listing=await ghBridge.listRepositoryFiles();
    const names=listing.files.map(file=>(file.type==="dir"?"📁 ":"📄 ")+file.path+(file.size!=null?" ("+file.size+" bytes)":""));
    const hasReadme=listing.files.some(file=>file.path==="README.md");
    const hasIndex=listing.files.some(file=>file.path==="index.html");
    pending.text=(lang==="hi"?"GitHub से वास्तविक Repository सूची पढ़ी गई।\\nRepository: ":"Live repository listing read from GitHub.\\nRepository: ")+listing.repository+"\\nBranch: "+listing.branch+"\\n\\n"+names.join("\\n")+"\\n\\nREADME.md: "+(hasReadme?"मौजूद / present":"नहीं मिला / not found")+"\\nindex.html: "+(hasIndex?"मौजूद / present":"नहीं मिला / not found")+"\\n\\n"+(lang==="hi"?"केवल पढ़ा है; कोई बदलाव नहीं किया।":"Read-only check; no changes made.");
   }else if(ghRunMatch){
    const detail=await ghBridge.inspectWorkflowRun(ghRunMatch[1]);
    const jobs=detail.jobs.map(job=>job.name+": "+job.status+(job.conclusion?" / "+job.conclusion:"")).join("\n");
    pending.text="Workflow Run #"+detail.run.id+" · "+detail.run.name+"\nस्थिति: "+detail.run.status+" / "+(detail.run.conclusion||"अभी जारी")+"\nBranch: "+detail.run.branch+"\nJobs:\n"+(jobs||"कोई job विवरण नहीं")+"\n"+detail.run.url+"\n"+detail.note;
   }else if(ghFileAsk&&ghFileMatch){
    const file=await ghBridge.inspectRepositoryFile(ghFileMatch[1],"main");
    if(modelClient&&modelClient.isConnected()){
     const explanation=await modelClient.chat([{role:"system",content:"Explain this repository source file to a non-technical user in simple Hindi/Hinglish. Describe its purpose and main flow. Only state what is supported by the supplied code. Do not suggest or make changes."},{role:"user",content:"File: "+file.path+"\nLines: "+file.totalLines+"\n\n"+file.content}],{maxTokens:850});
     pending.text="GitHub file: "+file.path+" ("+file.totalLines+" lines)\n\n"+explanation.text+"\n\nअभी कोई बदलाव नहीं किया।";
    }else{
     pending.text="Repository file: "+file.path+" · "+file.totalLines+" lines\n"+file.excerpt.slice(0,100).map(line=>line.number+": "+line.text).join("\n")+"\nAI model connected नहीं है, इसलिए अभी सरल व्याख्या नहीं बन सकी।";
    }
   }else if(ghActionsAsk){
    const runs=await ghBridge.listWorkflowRuns({perPage:8});
    pending.text=(lang==="hi"?"हाल के GitHub Actions रन:\n":"Recent GitHub Actions runs:\n")+runs.map(run=>"#"+run.id+" · "+run.name+" · "+run.status+(run.conclusion?" / "+run.conclusion:"")+" · "+run.branch+"\n"+run.url).join("\n\n")+(runs.length?"":"कोई रन नहीं मिला।");
   }else if(ghStatusAsk&&!ghInspectAsk&&!ghUpdateAsk){
    const access=await ghBridge.permissions();
    pending.text=(lang==="hi"?"GitHub खाता: ":"GitHub account: ")+access.account+"\\n"+(lang==="hi"?"Repository: ":"Repository: ")+access.repository+"\\n"+(lang==="hi"?"पढ़ने की अनुमति: ":"Read access: ")+(access.canRead?"हाँ / Yes":"नहीं / No")+"\\n"+(lang==="hi"?"लिखने की अनुमति: ":"Write access: ")+(access.canWrite?"हाँ / Yes":"नहीं / No")+(access.canWrite?(lang==="hi"?"\\nAI प्रस्तावित बदलाव को नई Branch और PR में भेज सकता है।":"\\nThe assistant can submit a proposed change in a new branch and PR."):(lang==="hi"?"\\nकनेक्शन मौजूद है, लेकिन GitHub खाते को इस Repository में Write access नहीं मिला।":"\\nThe connection exists, but this GitHub account lacks write access to this repository."));
   }else{
    const snapshot=await ghBridge.inspect();
    if(ghUpdateAsk&&!snapshot.canWrite){
     pending.text=lang==="hi"?"GitHub कनेक्ट है, लेकिन इस खाते को Repository में Write permission नहीं मिली। GitHub Settings → Applications में Intelligent AI की अनुमति जाँचें; सही अनुमति मिलने तक कोई बदलाव नहीं किया गया।":"GitHub is connected, but this account does not have write permission for the repository. Check Intelligent AI under GitHub Settings → Applications; no changes were made.";
    }else if(!ghUpdateAsk){
     pending.text=lang==="hi"?"GitHub Repository जाँच पूरी। पढ़ी गई फाइलें: "+snapshot.files.map(x=>x.path+" ("+x.size+" अक्षर)").join(", ")+". अभी कोई बदलाव नहीं किया।":"Repository inspection complete. Read files: "+snapshot.files.map(x=>x.path+" ("+x.size+" chars)").join(", ")+". No changes were made.";
    }else if(!modelClient||!modelClient.isConnected()){
     pending.text=lang==="hi"?"GitHub जुड़ा है, लेकिन AI मॉडल कनेक्ट नहीं है। Settings में OpenRouter/Qwen कनेक्शन फिर से करें।":"GitHub is connected, but the AI model is not connected. Reconnect OpenRouter/Qwen in Settings.";
    }else{
     const spec="You are the code-improvement agent for this repository. Inspect the supplied source snapshot and propose ONE small, safe, clearly useful self-improvement. Return only a valid JSON object with keys title (string), body (string), and patches (array of objects with path, find, replace strings). Each find string must be an exact unique substring from the supplied file. Use only these paths: "+snapshot.files.map(x=>x.path).join(", ")+". Make 1-3 minimal exact-match patches. Do not touch authentication, API keys, token handling, GitHub connection/security, workflow files, permissions, deployment, or safety rules. Do not invent code context. If no safe worthwhile change exists, return an object with an empty patches array."
     const modelResult=await modelClient.chat([{role:"system",content:spec},{role:"user",content:"User request: "+clean+"\\n\\nRepository snapshot (main):\\n"+JSON.stringify(snapshot.files.map(x=>({path:x.path,content:x.content}))) }],{maxTokens:2200});
     let proposal;
     try{const raw=modelResult.text.trim().replace(/^`{3}(?:json)?/i,"").replace(/`{3}$/,"").trim();proposal=JSON.parse(raw)}catch(e){throw new Error("AI ने valid structured patch नहीं दिया। कोई GitHub बदलाव नहीं किया गया।")}
     if(!proposal.patches||!proposal.patches.length){
      pending.text=lang==="hi"?"Repository जाँच ली। अभी सुरक्षित और जरूरी बदलाव का भरोसेमंद प्रस्ताव नहीं मिला, इसलिए कोई फाइल नहीं बदली।":"Repository reviewed. No sufficiently safe improvement was identified, so no files were changed.";
     }else{
      const summary=proposal.patches.map(x=>x.path).join(", ");
      const approved=confirm((lang==="hi"?"AI ने यह सुधार तैयार किया है:\\n":"AI prepared this improvement:\\n")+proposal.title+"\\nFiles: "+summary+"\\n\\n"+(lang==="hi"?"क्या इसे नई Branch और Pull Request में भेजें? main अपने आप नहीं बदलेगा।":"Create a new branch and Pull Request? main will not be changed automatically."));
      if(!approved){pending.text=lang==="hi"?"प्रस्ताव रद्द किया। GitHub में कोई बदलाव नहीं किया।":"Proposal cancelled. No GitHub changes were made.";}
      else{
       const created=await ghBridge.proposePatches(proposal.patches,proposal.title,proposal.body);
       pending.text=(lang==="hi"?"सुधार का Pull Request बन गया।\\nफाइलें: ":"Self-improvement Pull Request created.\\nFiles: ")+created.files.join(", ")+"\\n"+created.url+"\\n"+(lang==="hi"?"अब CI टेस्ट और आपका Review बाकी है। Merge अपने आप नहीं होगा।":"CI checks and your review are next. Nothing is merged automatically.");
      }
     }
    }
   }
  }catch(err){pending.text=(lang==="hi"?"GitHub काम पूरा नहीं हुआ: ":"GitHub operation failed: ")+err.message}
  delete pending.pending;pending.at=new Date().toISOString();saveMessages();renderMessages();return;
 }
 if(modelClient&&modelClient.isConnected()){
  try{
   const history=messages.filter(m=>!m.pending).slice(-14).map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}));
   const system=(lang==="hi"
    ?"तुम Intelligent AI हो। उपयोगकर्ता से सरल, स्वाभाविक हिंदी या Hinglish में बात करो और उसके सवाल का सीधा, उपयोगी तथा तर्कपूर्ण उत्तर दो। यदि जानकारी निश्चित नहीं है तो साफ बताओ। कोई काल्पनिक टूल-एक्शन या तथ्य मत गढ़ो। कोड बदलने या बाहरी कार्रवाई का दावा तभी करो जब वह वास्तव में किया गया हो।"
    :"You are Intelligent AI. Answer clearly, naturally and thoughtfully in the user's language. Be accurate, admit uncertainty, and never claim to have used a tool or changed files unless that actually happened.")+"\n\n"+(selfAwareness&&typeof selfAwareness.systemGuidance==="function"?selfAwareness.systemGuidance(taskPlan,lang):"Handle the complete user message as one task. Preserve all constraints.")+"\n\n"+(lang==="hi"?"परियोजना की वास्तविक सीमाएँ: लाइव मॉडल बाहरी प्रदाता पर निर्भर है; वेब रिसर्च आंशिक हो सकती है; लोकल मेमोरी इसी ब्राउज़र तक सीमित है; GitHub बदलाव PR और अनुमति से होते हैं।":"Project capability boundaries: live language generation depends on an external provider; web research may be partial; local memory is browser-local; GitHub changes require permission and a pull request.");
   const result=(selfAwareness&&typeof selfAwareness.executePlan==="function")?await selfAwareness.executePlan({plan:taskPlan,history,system,language:lang,chat:(turns,options)=>modelClient.chat(turns,options),onProgress:progress=>{pending.text=progress;renderMessages();}}):await modelClient.chat(history,{maxTokens:1600});
   pending.text=result.text;pending.model=result.model;pending.runtimeSeconds=result.runtimeSeconds;if(result.fallback)$("#modelConnectionStatus").textContent=(lang==="hi"?"स्वचालित बैकअप प्रदाता सक्रिय: ":"Automatic fallback active: ")+result.provider+" · "+result.model;
  }catch(err){
   pending.text=(lang==="hi"?"AI सेवा से जवाब नहीं मिल पाया: ":"Could not get a reply from the AI provider: ")+err.message+(lang==="hi"?" कृपया Settings में सर्वर कनेक्शन जाँचें।":" Please check the server connection in Settings.");
  }
 }else{
  pending.text=lang==="hi"?"अभी कोई Live AI मॉडल कनेक्ट नहीं है, इसलिए मैं वास्तविक AI जवाब नहीं दे सकता। Settings खोलें, OpenRouter / Groq / Gemini में से किसी एक की API Key डालें और “Test & connect” दबाएँ। कनेक्शन सफल होने के बाद फिर संदेश भेजें।":"No live AI model is connected, so I cannot provide a real AI answer yet. Open Settings, enter an API key for OpenRouter, Groq or Gemini, and press “Test & connect”. Send your message again after the connection succeeds.";
  pending.demo=true;
 }
 delete pending.pending;pending.at=new Date().toISOString();saveMessages();renderMessages();
}



let activeResearchQuery="";

function downloadText(name,content,type){const blob=new Blob([content],{type:type||"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function renderCodeDrafts(){const root=$("#codeDraftList");if(!root)return;root.replaceChildren();const items=codeWorkbench.list();if(!items.length){const p=document.createElement("p");p.className="empty-state";p.textContent=words[lang].codeEmpty;root.append(p);return}for(const d of items){const card=document.createElement("article"),title=document.createElement("b"),reason=document.createElement("p"),meta=document.createElement("small"),preview=document.createElement("pre"),actions=document.createElement("div");card.className="memory-item";title.textContent=d.path;reason.textContent=d.reason;meta.textContent=words[lang].codeRisk+" · "+d.createdAt;preview.className="code-diff";preview.hidden=true;preview.textContent=codeWorkbench.diff(d.id);actions.className="proposal-actions";const button=(label,fn)=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.onclick=fn;actions.append(b)};button(words[lang].codePatch,()=>{preview.hidden=!preview.hidden});button(words[lang].codeExportOne,()=>downloadText("intelligent-ai-"+d.id+".json",codeWorkbench.exportDraft(d.id)));button(words[lang].codeDelete,()=>{codeWorkbench.remove(d.id);renderCodeDrafts()});card.append(title,reason,meta,actions,preview);root.append(card)}}
async function generateCodingProject(e){
 e.preventDefault();const button=$("#codeProjectGenerate"),status=$("#codeProjectStatus"),summary=$("#codeProjectSummary");if(button.disabled)return;
 button.disabled=true;summary.hidden=true;status.textContent=lang==="hi"?"AI प्रोजेक्ट की योजना बना रहा है…":"AI is planning the project…";
 try{
  const client=await ensureModelClient();
  const result=await window.IntelligentCodingAgent.generateProject({client,workbench:codeWorkbench,brief:$("#codeProjectBrief").value,stack:$("#codeProjectStack").value,maxFiles:Number($("#codeProjectFiles").value),onProgress:event=>{status.textContent=event.message||event.stage;}});
  summary.hidden=false;summary.replaceChildren();const title=document.createElement("b"),description=document.createElement("p"),architecture=document.createElement("p"),files=document.createElement("p");
  title.textContent=result.manifest.projectName;description.textContent=result.manifest.summary;architecture.textContent=result.manifest.architecture;files.textContent=(lang==="hi"?"तैयार फाइलें: ":"Generated files: ")+result.drafts.map(x=>x.path).join(", ");summary.append(title,description,architecture,files);
  const workspace=window.IntelligentLocalWorkspace&&window.IntelligentLocalWorkspace.status();
  if(workspace&&workspace.connected){const saved=await window.IntelligentLocalWorkspace.writeProject(result.manifest,result.drafts.map(item=>({path:item.path,content:item.content})));status.textContent=(lang==="hi"?"पूरा हुआ: ":"Complete: ")+saved.files.length+(lang==="hi"?" फाइलें फोन के Workspace में सेव हुईं: ":" files saved to phone workspace: ")+saved.folder;}
  else status.textContent=lang==="hi"?"Code Drafts बन गए। फोन में सेव करने के लिए पहले Workspace Folder Connect करें।":"Code drafts generated. Connect a local workspace folder to write project files to your phone.";
  renderCodeDrafts();
 }catch(error){status.textContent=(lang==="hi"?"प्रोजेक्ट बनाते समय त्रुटि: ":"Project generation error: ")+String(error&&error.message||error);renderCodeDrafts();}
 finally{button.disabled=false;}
}
function saveCodeDraft(e){e.preventDefault();try{codeWorkbench.create({path:$("#codePath").value,reason:$("#codeReason").value,before:$("#codeBefore").value,after:$("#codeAfter").value});$("#codeDraftForm").reset();$("#codeStatus").textContent=words[lang].codeSaved;renderCodeDrafts()}catch(err){$("#codeStatus").textContent=err.message}}
function exportCodeDrafts(){downloadText("intelligent-ai-code-drafts.json",codeWorkbench.exportAll())}


function renderWorkspaceStatus(){
 const el=$("#workspaceStatus");if(!el||!window.IntelligentLocalWorkspace)return;
 const state=window.IntelligentLocalWorkspace.status();
 el.textContent=state.connected?(lang==="hi"?"Workspace जुड़ा है: ":"Workspace connected: ")+state.folderName:(state.supported?(lang==="hi"?"Workspace folder अभी नहीं जुड़ा।":"No workspace folder connected."):(lang==="hi"?"इस Browser में Folder Access उपलब्ध नहीं है।":"Folder access is not supported in this browser."));
 $("#workspaceConnect").disabled=!state.supported;
}
async function connectLocalWorkspace(){
 const button=$("#workspaceConnect"),status=$("#workspaceStatus");button.disabled=true;
 try{await window.IntelligentLocalWorkspace.connect();renderWorkspaceStatus();}
 catch(error){status.textContent=String(error&&error.message||error);}
 finally{button.disabled=false;}
}
async function disconnectLocalWorkspace(){
 try{await window.IntelligentLocalWorkspace.disconnect();renderWorkspaceStatus();}
 catch(error){$("#workspaceStatus").textContent=String(error&&error.message||error);}
}
async function restoreLocalWorkspace(){if(window.IntelligentLocalWorkspace){await window.IntelligentLocalWorkspace.restore();renderWorkspaceStatus();}}

function renderResearchLinks(){const root=$("#researchLinks");if(!root)return;root.replaceChildren();if(!activeResearchQuery)return;for(const item of researchDesk.searchLinks(activeResearchQuery)){const a=document.createElement("a");a.className="research-link";a.href=item.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent="↗ "+item.name;root.append(a)}}
function renderLiveResearch(result){const root=$("#researchResults"),status=$("#researchProviderStatus");root.replaceChildren();status.replaceChildren();for(const p of result.providers){const badge=document.createElement("span");badge.className="provider-badge "+p.status;badge.textContent=p.name+": "+(p.status==="success"?p.count+" "+words[lang].researchResultCount:p.error);status.append(badge)}if(!result.items.length){const p=document.createElement("p");p.className="empty-state";p.textContent=words[lang].researchNoResults;root.append(p);return}for(const item of result.items){const card=document.createElement("article"),title=document.createElement("b"),snippet=document.createElement("p"),meta=document.createElement("small"),actions=document.createElement("div"),open=document.createElement("a"),save=document.createElement("button");card.className="research-result";title.textContent=item.title;snippet.textContent=item.snippet||item.source;meta.textContent=item.source+" · "+item.kind;open.href=item.url;open.target="_blank";open.rel="noopener noreferrer";open.textContent="↗ "+words[lang].researchOpen;save.type="button";save.textContent=words[lang].researchSaveResult;save.onclick=()=>{try{researchDesk.saveSource({query:activeResearchQuery,title:item.title,url:item.url,notes:item.snippet+"\nSource: "+item.source});$("#researchStatus").textContent=words[lang].researchSaved;renderResearchNotebook();save.disabled=true;save.textContent=lang==="hi"?"सेव हो गया":"Saved"}catch(e){$("#researchStatus").textContent=e.message}};actions.className="research-actions";actions.append(open,save);card.append(title,snippet,meta,actions);root.append(card)}}
async function prepareResearch(){try{activeResearchQuery=$("#researchQuery").value.trim();researchDesk.searchLinks(activeResearchQuery);renderResearchLinks();if(researchBusy)return;researchBusy=true;$("#researchRun").disabled=true;$("#researchStatus").textContent=words[lang].researchWorking;$("#researchResults").replaceChildren();$("#researchProviderStatus").replaceChildren();const result=await researchEngine.search(activeResearchQuery);latestResearch=result.items;renderLiveResearch(result);$("#researchStatus").textContent=result.failedCount?words[lang].researchPartial:words[lang].researchComplete+" "+result.items.length+" "+words[lang].researchResultCount+" · "+words[lang].researchCoverageNote}catch(e){$("#researchStatus").textContent=e.message}finally{researchBusy=false;$("#researchRun").disabled=false}}
function renderResearchAnalysis(){const root=$("#researchAnalysis");if(!root)return;root.replaceChildren();const p=document.createElement("p");p.className="empty-state";p.textContent=words[lang].researchNoReport;root.append(p)}
function runResearchAnalysis(){const root=$("#researchAnalysis");root.replaceChildren();try{const result=researchAnalyzer.analyze($("#researchQuery").value,researchDesk.list()),summary=document.createElement("article"),heading=document.createElement("b"),meta=document.createElement("p"),terms=document.createElement("p"),sources=document.createElement("div"),limit=document.createElement("small");summary.className="memory-item";heading.textContent=result.topic;meta.textContent="Sources: "+result.sourceCount+" · With notes: "+result.notesCount+" · Topic matches: "+result.matchedCount;terms.textContent=words[lang].researchTerms+": "+result.keyTerms.slice(0,12).map(x=>x.term+" ("+x.sources+"/"+result.sourceCount+")").join(", ");sources.className="memory-list";for(const s of result.sourceReview){const item=document.createElement("p");item.textContent=s.title+" — "+(s.hasNotes?"notes saved":"no notes");sources.append(item)}limit.textContent=result.limitations.join(" ");summary.append(heading,meta,terms,sources,limit);root.append(summary);root.dataset.topic=result.topic;root.dataset.terms=result.keyTerms.slice(0,12).map(x=>x.term).join(", ")}catch(e){const p=document.createElement("p");p.textContent=e.message;root.append(p)}}
function createProposalFromResearch(){const root=$("#researchAnalysis"),topic=root.dataset.topic;if(!topic){runResearchAnalysis();return}try{updateStore.create({title:"Research: "+topic.slice(0,140),reason:"Generated from locally saved research source notes. Review the original sources before acting.",change:"Investigate these recurring terms: "+(root.dataset.terms||"No recurring terms found.")+". Compare source evidence, verify claims and design tests before changing code.",risk:"medium"});$("#researchStatus").textContent=words[lang].upSaved;renderUpdates()}catch(e){$("#researchStatus").textContent=e.message}}
function renderResearchNotebook(){const root=$("#researchNotebook");if(!root)return;root.replaceChildren();const items=researchDesk.list();if(!items.length){const p=document.createElement("p");p.className="empty-state";p.textContent=words[lang].researchEmpty;root.append(p);return}for(const item of items){const card=document.createElement("article"),b=document.createElement("b"),p=document.createElement("p"),a=document.createElement("a"),small=document.createElement("small"),del=document.createElement("button");card.className="memory-item";b.textContent=item.title;p.textContent=item.query+"\n"+item.notes;a.href=item.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=item.url;small.textContent=item.addedAt;del.textContent=words[lang].researchRemove;del.onclick=()=>{researchDesk.remove(item.id);renderResearchNotebook()};card.append(b,p,a,small,del);root.append(card)}}

function saveResearchSource(e){e.preventDefault();try{researchDesk.saveSource({query:activeResearchQuery,title:$("#researchSourceTitle").value,url:$("#researchUrl").value,notes:$("#researchNotes").value});$("#researchSourceForm").reset();$("#researchStatus").textContent=words[lang].researchSaved;renderResearchNotebook()}catch(err){$("#researchStatus").textContent=err.message}}
function exportResearch(){const blob=new Blob([researchDesk.exportData()],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="intelligent-ai-research-notebook.json";a.click();URL.revokeObjectURL(url)}

function renderUpdates(){
 const caps=$("#capabilityStatus"),gaps=$("#capabilityGaps"),root=$("#proposalList");if(!caps||!root)return;
 caps.replaceChildren();gaps.replaceChildren();root.replaceChildren();
 const labels=words[lang],status=x=>labels["up"+x.charAt(0).toUpperCase()+x.slice(1)]||x;
 for(const c of updateStore.capabilities()){const card=document.createElement("article"),b=document.createElement("b"),p=document.createElement("p"),small=document.createElement("small");card.className="memory-item";b.textContent=c.label+" · "+status(c.status);p.textContent=c.detail;small.textContent=c.name;card.append(b,p,small);caps.append(card)}
 const missing=updateStore.gaps();if(!missing.length){gaps.textContent="—"}else for(const c of missing){const item=document.createElement("span");item.className="gap-chip";item.textContent=c.label;gaps.append(item)}
 const proposals=updateStore.list();if(!proposals.length){const p=document.createElement("p");p.className="empty-state";p.textContent=labels.upEmpty;root.append(p)}
 for(const item of proposals){const card=document.createElement("article"),b=document.createElement("b"),p=document.createElement("p"),meta=document.createElement("small"),audit=document.createElement("small"),actions=document.createElement("div");card.className="memory-item";b.textContent=item.title+" · "+status(item.status);p.textContent=item.reason+"\n"+item.change;meta.textContent="Risk: "+item.risk+" · "+item.createdAt; audit.textContent="Audit events: "+item.audit.length;actions.className="proposal-actions";
 const button=(label,fn)=>{const x=document.createElement("button");x.type="button";x.textContent=label;x.onclick=fn;actions.append(x)};
 if(item.status==="draft")button(labels.upTest,()=>{try{updateStore.transition(item.id,"tested","passed");renderUpdates()}catch(e){alert(e.message)}});
 if(item.status==="tested"&&item.risk!=="high")button(labels.upApprove,()=>{try{updateStore.transition(item.id,"approved","Owner approved in this device UI");renderUpdates()}catch(e){alert(e.message)}});
 if(["draft","tested","approved"].includes(item.status))button(labels.upReject,()=>{updateStore.transition(item.id,"rejected","Rejected by owner");renderUpdates()});
 button(labels.upDelete,()=>{updateStore.remove(item.id);renderUpdates()});card.append(b,p,meta,audit,actions);root.append(card)}
}
function createUpdateProposal(e){e.preventDefault();try{updateStore.create({title:$("#updateCreateTitle").value,reason:$("#updateReason").value,change:$("#updateChange").value,risk:$("#updateRisk").value});$("#updateProposalForm").reset();$("#updateStatus").textContent=words[lang].upSaved;renderUpdates()}catch(err){$("#updateStatus").textContent=err.message}}
function exportUpdateLedger(){const blob=new Blob([updateStore.exportData()],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="intelligent-ai-improvement-ledger.json";a.click();URL.revokeObjectURL(url)}

function renderContinuity(){const rules=$("#continuityRules"),recent=$("#continuityRecent");if(!rules||!recent)return;rules.replaceChildren();recent.replaceChildren();for(const item of contextStore.profile()){const card=document.createElement("article"),title=document.createElement("b"),detail=document.createElement("p");card.className="memory-item";title.textContent=item.title;detail.textContent=item.detail;card.append(title,detail);rules.append(card)}const turns=contextStore.turns().slice(0,10);if(!turns.length){const p=document.createElement("p");p.className="empty-state";p.textContent=lang==="hi"?"अभी कोई हाल का निर्देश इंडेक्स नहीं हुआ।":"No recent instructions indexed yet.";recent.append(p)}for(const item of turns){const card=document.createElement("article"),body=document.createElement("p"),meta=document.createElement("small");card.className="memory-item";body.textContent=item.text;meta.textContent=new Date(item.createdAt).toLocaleString();card.append(body,meta);recent.append(card)}}
function exportContinuity(){downloadText("intelligent-ai-project-context.json",contextStore.exportData())}
function renderMemory(){const root=$("#memoryList");if(!root)return;root.replaceChildren();const items=memoryStore.search($("#memorySearch").value);if(!items.length){const p=document.createElement("p");p.className="empty-state";p.textContent=words[lang].memEmpty;root.append(p);return}for(const item of items){const card=document.createElement("article"),title=document.createElement("b"),body=document.createElement("p"),meta=document.createElement("small"),del=document.createElement("button");card.className="memory-item";title.textContent=item.category;body.textContent=item.text;meta.textContent=new Date(item.createdAt).toLocaleString();del.textContent=words[lang].memDelete;del.onclick=()=>{memoryStore.remove(item.id);renderMemory()};card.append(title,body,meta,del);root.append(card)}}
function saveMemory(e){e.preventDefault();try{memoryStore.add($("#memoryText").value,$("#memoryCategory").value);$("#memoryText").value="";$("#memoryStatus").textContent=words[lang].memSaved;renderMemory()}catch(err){$("#memoryStatus").textContent=err.message}}
function exportMemory(){const blob=new Blob([memoryStore.exportData()],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="intelligent-ai-memory-backup.json";a.click();URL.revokeObjectURL(url)}

function renderKnowledge(){const root=$("#knowledgeResults");if(!root)return;root.replaceChildren();const query=$("#knowledgeSearch").value,items=query?knowledgeStore.search(query):knowledgeStore.list().map(d=>({...d,score:0}));if(!items.length){const p=document.createElement("p");p.className="empty-state";p.textContent=words[lang].knowEmpty;root.append(p);return}for(const item of items){const card=document.createElement("article"),title=document.createElement("b"),body=document.createElement("p"),meta=document.createElement("small"),del=document.createElement("button");card.className="memory-item";title.textContent=item.title+" · "+item.category;body.textContent=item.content;meta.textContent=(item.tags||[]).join(", ")+" · "+item.source;del.textContent=words[lang].knowDelete;del.onclick=()=>{knowledgeStore.remove(item.id);renderKnowledge()};card.append(title,body,meta,del);root.append(card)}}
function addKnowledge(e){e.preventDefault();try{knowledgeStore.add({title:$("#knowledgeName").value,content:$("#knowledgeBody").value,category:$("#knowledgeCategory").value,tags:$("#knowledgeTags").value.split(",").map(x=>x.trim()).filter(Boolean)});$("#knowledgeForm").reset();$("#knowledgeStatus").textContent=words[lang].knowAdded;renderKnowledge()}catch(err){$("#knowledgeStatus").textContent=err.message}}
function exportKnowledge(){const blob=new Blob([knowledgeStore.exportData()],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="intelligent-ai-knowledge-backup.json";a.click();URL.revokeObjectURL(url)}
function exportChat(){const lines=messages.map(m=>(m.role==="user"?words[lang].you:words[lang].assistant)+"\\n"+m.text).join("\\n\\n");const blob=new Blob([lines||words[lang].empty],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=words[lang].exportName+".txt";a.click();URL.revokeObjectURL(url)}
$$("nav button").forEach(b=>b.onclick=()=>tab(b.dataset.tab));$("#lang").onclick=$("#lang2").onclick=changeLang;$("#menu").onclick=()=>$(".layout").classList.toggle("menu-open");$("#newChat").onclick=()=>{messages=[];saveMessages();renderMessages();tab("chat")};const chatForm=$("#form"),chatInput=$("#input"),chatSendButton=chatForm.querySelector('button');

let voiceRecognition=null,voiceAuto=localStorage.getItem("ia-voice-auto")==="true";
function voiceStatus(message){const el=$("#voiceStatus");if(el)el.textContent=message;}
function speakText(text){
 if(!("speechSynthesis"in window)||typeof SpeechSynthesisUtterance==="undefined"){voiceStatus(lang==="hi"?"इस ब्राउज़र में Text-to-Speech उपलब्ध नहीं है।":"Text-to-speech is not supported in this browser.");return false;}
 const clean=String(text||"").replace(/\\\\n/g,"\n").replace(/\\n/g,"\n").trim();
 if(!clean){voiceStatus(lang==="hi"?"सुनाने के लिए जवाब खाली है।":"There is no reply to read aloud.");return false;}
 const synth=window.speechSynthesis;synth.cancel();const utterance=new SpeechSynthesisUtterance(clean);utterance.lang=lang==="hi"?"hi-IN":"en-IN";
 const chooseVoice=()=>{const voices=synth.getVoices();const preferred=voices.find(v=>v.lang.toLowerCase().startsWith(lang==="hi"?"hi":"en-in"))||voices.find(v=>v.lang.toLowerCase().startsWith(lang==="hi"?"hi":"en"));if(preferred)utterance.voice=preferred;};
 chooseVoice();utterance.onstart=()=>voiceStatus(lang==="hi"?"🔊 जवाब सुनाया जा रहा है…":"🔊 Speaking…");utterance.onend=()=>voiceStatus(lang==="hi"?"जवाब पूरा सुनाया गया।":"Finished speaking.");utterance.onerror=event=>voiceStatus((lang==="hi"?"आवाज़ की त्रुटि: ":"Speech error: ")+event.error);
 synth.speak(utterance);setTimeout(()=>{if(synth.paused)synth.resume();},250);return true;
}
function speakLatestAssistant(){const last=[...messages].reverse().find(m=>m.role==="assistant"&&!m.pending);if(last)speakText(last.text);else voiceStatus(lang==="hi"?"अभी सुनाने के लिए AI जवाब नहीं है।":"There is no assistant reply to read yet.");}
function stopSpeech(){if("speechSynthesis"in window){window.speechSynthesis.cancel();voiceStatus(lang==="hi"?"आवाज़ रोक दी गई।":"Speech stopped.");}}
function startVoiceInput(){
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition,button=$("#voiceMic");
 if(!Speech){voiceStatus(lang==="hi"?"इस ब्राउज़र में बोलकर लिखने की सुविधा नहीं मिली। Chrome में खोलें और माइक्रोफोन अनुमति दें।":"Speech recognition is unavailable here. Open in Chrome and allow microphone access.");return;}
 if(voiceRecognition){try{voiceRecognition.stop();}catch{}voiceRecognition=null;button.disabled=false;button.textContent=lang==="hi"?"🎙 बोलकर पूछें":"🎙 Speak";voiceStatus(lang==="hi"?"सुनना बंद किया।":"Listening stopped.");return;}
 const recognition=new Speech();voiceRecognition=recognition;recognition.lang=lang==="hi"?"hi-IN":"en-IN";recognition.interimResults=true;recognition.continuous=false;recognition.maxAlternatives=1;
 button.disabled=true;button.textContent=lang==="hi"?"🎙 सुन रहा हूँ…":"🎙 Listening…";voiceStatus(lang==="hi"?"अब बोलिए…":"Listening… speak now.");
 recognition.onresult=event=>{let transcript="";for(let i=event.resultIndex;i<event.results.length;i++)transcript+=event.results[i][0].transcript;if(transcript.trim())$("#input").value=transcript;};
 recognition.onerror=event=>{voiceStatus((lang==="hi"?"माइक्रोफोन त्रुटि: ":"Microphone error: ")+event.error+(event.error==="not-allowed"?(lang==="hi"?" — Chrome Site settings में Microphone Allow करें।":" — allow microphone in Chrome site settings."):""));};
 recognition.onend=()=>{const finalText=$("#input").value.trim();voiceRecognition=null;button.disabled=false;button.textContent=lang==="hi"?"🎙 बोलकर पूछें":"🎙 Speak";if(finalText){voiceStatus(lang==="hi"?"आपकी बात लिख दी गई है, भेज रहा हूँ…":"Speech transcribed; sending…");$("#form").requestSubmit();}else if(!$("#voiceStatus").textContent.includes("त्रुटि")&&!$("#voiceStatus").textContent.includes("error"))voiceStatus(lang==="hi"?"कुछ सुनाई नहीं दिया। फिर कोशिश करें।":"No speech detected. Try again.");};
 try{recognition.start();}catch(error){voiceRecognition=null;button.disabled=false;button.textContent="🎙 बोलकर पूछें";voiceStatus(String(error&&error.message||error));}
}
function updateVoiceControls(){
 const b=$("#voiceAuto");if(!b)return;b.setAttribute("aria-pressed",String(voiceAuto));b.textContent=voiceAuto?(lang==="hi"?"🔈 Auto आवाज़ चालू":"🔈 Auto ON"):(lang==="hi"?"🔈 Auto बंद":"🔈 Auto OFF");
}

chatSendButton.type="submit";chatSendButton.id="sendButton";chatSendButton.setAttribute("aria-label","Send message");
chatForm.addEventListener("submit",async e=>{
 e.preventDefault();e.stopPropagation();
 const submitted=chatInput.value;
 if(!submitted.trim())return;
 if(chatSendButton.disabled)return;
 chatSendButton.disabled=true;
 chatSendButton.setAttribute("aria-busy","true");
 try{
  await send(submitted);if(voiceAuto){const latest=[...messages].reverse().find(m=>m.role==="assistant"&&!m.pending);if(latest)speakText(latest.text);}
 }catch(error){
  const message=String(error&&error.message||error||"Unknown chat error");
  const last=messages[messages.length-1];
  if(last&&last.pending){last.text=(lang==="hi"?"संदेश भेजने में त्रुटि: ":"Could not send message: ")+message;delete last.pending;}
  else{
   if(messages.length===0||messages[messages.length-1].role!=="user"||messages[messages.length-1].text!==submitted.trim())messages.push({role:"user",text:submitted.trim(),at:new Date().toISOString()});
   messages.push({role:"assistant",text:(lang==="hi"?"संदेश भेजने में त्रुटि: ":"Could not send message: ")+message,at:new Date().toISOString()});
  }
  chatInput.value="";saveMessages();renderMessages();
 }finally{
  chatSendButton.disabled=false;chatSendButton.removeAttribute("aria-busy");
  chatInput.focus({preventScroll:true});
 }
});$("#voiceMic").onclick=startVoiceInput;$("#voiceRead").onclick=speakLatestAssistant;$("#voiceStop").onclick=stopSpeech;$("#voiceAuto").onclick=()=>{voiceAuto=!voiceAuto;localStorage.setItem("ia-voice-auto",String(voiceAuto));if(!voiceAuto)stopSpeech();updateVoiceControls();voiceStatus(voiceAuto?(lang==="hi"?"हर AI जवाब अपने आप सुनाया जाएगा।":"AI replies will be spoken automatically."):(lang==="hi"?"Auto आवाज़ बंद है।":"Automatic speech is off."));};updateVoiceControls();$("#input").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#form").requestSubmit()}});$("#exportChat").onclick=exportChat;$("#continuityExport").onclick=()=>{exportContinuity();$("#continuityStatus").textContent=words[lang].continuitySaved};$("#continuityClear").onclick=()=>{if(confirm(lang==="hi"?"हाल के निर्देशों का स्थानीय इंडेक्स साफ़ करें? पुष्ट परियोजना नियम सुरक्षित रहेंगे।":"Clear the local recent-instruction index? Confirmed project rules will remain.")){contextStore.clear();renderContinuity();$("#continuityStatus").textContent=words[lang].continuityCleared}};$("#memoryForm").onsubmit=saveMemory;$("#knowledgeForm").onsubmit=addKnowledge;$("#updateProposalForm").onsubmit=createUpdateProposal;$("#updateExport").onclick=exportUpdateLedger;$("#codeDraftForm").onsubmit=saveCodeDraft;$("#workspaceConnect").onclick=connectLocalWorkspace;$("#workspaceDisconnect").onclick=disconnectLocalWorkspace;$("#codeProjectForm").onsubmit=generateCodingProject;$("#codeExportAll").onclick=exportCodeDrafts;$("#researchRun").onclick=prepareResearch;$("#researchAnalyze").onclick=runResearchAnalysis;$("#researchProposal").onclick=createProposalFromResearch;$("#researchSourceForm").onsubmit=saveResearchSource;$("#researchExport").onclick=exportResearch;$("#knowledgeSearch").oninput=renderKnowledge;$("#knowledgeExport").onclick=exportKnowledge;$("#knowledgeClear").onclick=()=>{if(confirm(lang==="hi"?"क्या पूरी ज्ञान लाइब्रेरी हटानी है?":"Delete the entire knowledge library from this device?")){knowledgeStore.clear();renderKnowledge()}};$("#memorySearch").oninput=renderMemory;$("#memoryExport").onclick=exportMemory;$("#memoryClear").onclick=()=>{if(confirm(lang==="hi"?"क्या सभी सेव नोट हटाने हैं?":"Delete all saved notes from this device?")){memoryStore.clear();renderMemory()}};$("#clearChat").onclick=()=>{if(confirm(words[lang].confirm)){messages=[];saveMessages();renderMessages()}};$$("[data-prompt]").forEach(b=>b.onclick=()=>{tab("chat");send(b.dataset.prompt)});$("#auto").checked=localStorage.getItem(AUTO_KEY)==="true";$("#auto").onchange=()=>{localStorage.setItem(AUTO_KEY,$("#auto").checked);language()};const PROVIDER_KEYS={gemini:"ia-provider-gemini",groq:"ia-provider-groq",other:"ia-provider-other"};
async function restoreProviderKeys(){
 const savedKeys={};
 for(const [id,key] of [["gemini","geminiKey"],["groq","groqKey"]]){
  const saved=localStorage.getItem(PROVIDER_KEYS[id]);if(saved){savedKeys[id]=saved;$("#"+key).value=saved;$("#remember"+(id==="gemini"?"Gemini":"Groq")).checked=true;$("#"+id+"Status").textContent="Saved on this device · reconnecting…";}
 }
 const other=localStorage.getItem(PROVIDER_KEYS.other);
 if(other){try{const saved=JSON.parse(other);savedKeys.other=saved;$("#modelServerUrl").value=saved.url||"";$("#modelAccessKey").value=saved.key||"";$("#rememberOther").checked=true;$("#modelConnectionMessage").textContent="Saved on this device · reconnecting…";}catch{}}
 const sequence=[];
 if(savedKeys.other&&savedKeys.other.url&&savedKeys.other.key)sequence.push({kind:"other",url:savedKeys.other.url,key:savedKeys.other.key,status:$("#modelConnectionMessage"),button:$("#modelConnectButton")});
 if(savedKeys.groq)sequence.push({kind:"groq",url:"https://api.groq.com/openai/v1",key:savedKeys.groq,status:$("#groqStatus"),button:$("#connectGroq")});
 if(savedKeys.gemini)sequence.push({kind:"gemini",url:"https://generativelanguage.googleapis.com/v1beta/openai",key:savedKeys.gemini,status:$("#geminiStatus"),button:$("#connectGemini")});
 for(const item of sequence)await connectProvider(item.kind,item.url,item.key,item.status,item.button);
 if(modelClient&&modelClient.isConnected())$("#modelConnectionStatus").textContent=(lang==="hi"?"स्वचालित प्रदाता तैयार: ":"Automatic provider chain ready: ")+modelClient.getProviders().map(x=>x.provider).join(" → ");
}
async function connectProvider(kind,url,key,status,button){
 button.disabled=true;status.textContent="Checking provider connection…";
 try{const client=await ensureModelClient(),result=await client.connect(url,key);$("#modelConnectionStatus").textContent=(lang==="hi"?"स्वचालित प्रदाता क्रम: ":"Automatic provider order: ")+result.connectedProviders.join(" → ");status.textContent="Connected successfully · "+result.model+" · "+result.provider;return true;}
 catch(err){status.textContent="Connection failed: "+err.message;return false;}
 finally{button.disabled=false;}
}
$("#connectGemini").onclick=()=>{const key=$("#geminiKey").value.trim();if(!key){$("#geminiStatus").textContent="पहले Gemini API key डालें।";return;}if($("#rememberGemini").checked)localStorage.setItem(PROVIDER_KEYS.gemini,key);else localStorage.removeItem(PROVIDER_KEYS.gemini);connectProvider("gemini","https://generativelanguage.googleapis.com/v1beta/openai",key,$("#geminiStatus"),$("#connectGemini"));};
$("#connectGroq").onclick=()=>{const key=$("#groqKey").value.trim();if(!key){$("#groqStatus").textContent="पहले Groq API key डालें।";return;}if($("#rememberGroq").checked)localStorage.setItem(PROVIDER_KEYS.groq,key);else localStorage.removeItem(PROVIDER_KEYS.groq);connectProvider("groq","https://api.groq.com/openai/v1",key,$("#groqStatus"),$("#connectGroq"));};
$("#clearGemini").onclick=()=>{localStorage.removeItem(PROVIDER_KEYS.gemini);if(modelClient&&modelClient.forget)modelClient.forget("gemini");$("#modelConnectionStatus").textContent=modelClient&&modelClient.isConnected()?"Fallback provider ready: "+modelClient.getProviders().map(x=>x.provider).join(" → "):"Not connected";$("#geminiKey").value="";$("#rememberGemini").checked=false;$("#geminiStatus").textContent="Saved Gemini key removed.";};
$("#clearGroq").onclick=()=>{localStorage.removeItem(PROVIDER_KEYS.groq);if(modelClient&&modelClient.forget)modelClient.forget("groq");$("#modelConnectionStatus").textContent=modelClient&&modelClient.isConnected()?"Fallback provider ready: "+modelClient.getProviders().map(x=>x.provider).join(" → "):"Not connected";$("#groqKey").value="";$("#rememberGroq").checked=false;$("#groqStatus").textContent="Saved Groq key removed.";};
$("#clearOther").onclick=()=>{const otherUrl=$("#modelServerUrl").value.trim();try{const host=new URL(otherUrl).hostname;if(modelClient&&modelClient.forget)modelClient.forget(host==="openrouter.ai"?"openrouter":host==="api.groq.com"?"groq":host==="generativelanguage.googleapis.com"?"gemini":"qwen");}catch{}localStorage.removeItem(PROVIDER_KEYS.other);$("#modelServerUrl").value="";$("#modelAccessKey").value="";$("#rememberOther").checked=false;$("#modelConnectionMessage").textContent="Saved provider key removed.";};
async function connectOtherProvider(){
 const button=$("#modelConnectButton"),url=$("#modelServerUrl").value.trim(),key=$("#modelAccessKey").value.trim(),status=$("#modelConnectionMessage");
 if(!url||!key){status.textContent=lang==="hi"?"पहले API URL और Key डालें।":"Enter the API URL and key first.";return;}
 if($("#rememberOther").checked)localStorage.setItem(PROVIDER_KEYS.other,JSON.stringify({url,key}));else localStorage.removeItem(PROVIDER_KEYS.other);
 await connectProvider("other",url,key,status,button);
}
$("#modelConnectButton").onclick=connectOtherProvider;
$("#modelServerUrl").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();connectOtherProvider();}});
$("#modelAccessKey").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();connectOtherProvider();}});

restoreProviderKeys().catch(err=>{$("#modelConnectionStatus").textContent="Could not restore saved provider connections: "+err.message;});
function clearModelSessionUI(){
 $("#modelAccessKey").value="";
 $("#modelConnectionStatus").textContent=lang==="hi"?"कनेक्ट नहीं है":"Not connected";
 $("#modelConnectionMessage").textContent=lang==="hi"?"इस ब्राउज़र के खुले टैब से सर्वर कनेक्शन और Key साफ कर दी गई।":"Runtime connection and key cleared from all open Intelligent AI tabs.";
}
$("#modelDisconnectButton").onclick=()=>{
 if(modelClient&&typeof modelClient.disconnect==="function")modelClient.disconnect();
 clearModelSessionUI();
};
window.addEventListener("ia-model-disconnected",clearModelSessionUI);
language();restoreLocalWorkspace().catch(()=>{});if("serviceWorker"in navigator&&location.protocol.startsWith("http"))addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
