(function(root){"use strict";
const INTENTS=[
{name:"research",hi:"रिसर्च",en:"research",terms:["research","search","find","look up","browse","internet","website","source","latest","compare","खोज","खोजो","ढूंढ","ढूँढ","रिसर्च","इंटरनेट","वेबसाइट","जानकारी","ताज़ा","ताजा","तुलना"]},
{name:"coding",hi:"कोडिंग",en:"coding",terms:["code","coding","program","debug","bug","fix","error","build","develop","website","app","script","कोड","कोडिंग","प्रोग्राम","गलती","ठीक","बनाओ","ऐप","वेबसाइट","एरर","समस्या"]},
{name:"files",hi:"फाइल विश्लेषण",en:"file analysis",terms:["file","pdf","document","excel","spreadsheet","csv","upload","attachment","फाइल","पीडीएफ","दस्तावेज","एक्सेल","शीट","अपलोड"]},
{name:"explain",hi:"समझाना",en:"explanation",terms:["explain","meaning","what is","how does","why","समझाओ","मतलब","क्या है","कैसे","क्यों","बताओ"]},
{name:"planning",hi:"योजना",en:"planning",terms:["plan","steps","roadmap","next","improve","continue","start"," आगे","अगला","आगे","योजना","कदम","सुधार","जारी","शुरू","बनाना"]},
{name:"memory",hi:"याददाश्त",en:"memory",terms:["remember","recall","previous","earlier","last time","हमने","पहले","याद","पिछली","पुरानी बात"]},
{name:"general",hi:"सामान्य",en:"general",terms:[]}
];
const STOP=new Set(["the","and","for","with","that","this","what","when","where","your","you","please","from","have","will","would","could","should","करना","करो","करें","मुझे","हमको","हमने","उसको","यह","वह","और","है","हैं","को","की","के","का","में","से","एक","भी","तो","अब","क्या","किस","लिए"]);
function normalize(s){return String(s||"").normalize("NFKC").toLocaleLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g," ").trim()}
function detectLanguage(s){const t=String(s||"");const hi=(t.match(/[\u0900-\u097F]/g)||[]).length,en=(t.match(/[A-Za-z]/g)||[]).length;return hi>en?"hi":en>hi?"en":"mixed"}
function tokens(s){return normalize(s).match(/[\p{L}\p{M}\p{N}]+/gu)||[]}
function overlap(a,b){return a.some(x=>b.includes(x))}
function understand(input,options){
 const text=String(input||"").trim(),n=normalize(text),lang=detectLanguage(text),found=[];
 for(const intent of INTENTS){let score=0;for(const term of intent.terms){const q=normalize(term);if(q.includes(" ")) {if(n.includes(q))score+=2}else if(tokens(n).includes(q))score+=1}if(score)found.push({name:intent.name,score,label:lang==="hi"?intent.hi:intent.en})}
 found.sort((a,b)=>b.score-a.score);const primary=found[0]||{name:"general",score:0,label:lang==="hi"?"सामान्य":"general"};
 const greeting=/^(hi|hello|hey|namaste|नमस्ते|हेलो|हाय|कैसे हो|कैसी हो|kem cho|કેમ છો)[!.? ]*$/i.test(n);
 const thanks=/^(thanks|thank you|धन्यवाद|शुक्रिया|आभार)[!.? ]*$/i.test(n);
 const asksQuestion=/\?|\b(what|why|how|when|where|who|which|can|is|are|does|क्या|क्यों|कैसे|कब|कहाँ|कौन|है)\b/i.test(n);
 const imperative=/\b(please|do|make|build|create|fix|check|search|find|start|continue|update|add|remove|करो|करें|बनाओ|बना|जोड़ो|हटाओ|देखो|जाँचो|शुरू|चालू|खोजो|ढूंढो|बताओ)\b/i.test(n);
 const kind=greeting?"greeting":thanks?"thanks":asksQuestion?"question":imperative?"command":primary.name==="general"?"conversation":"request";
 const requestedOutputs=[];if(/(list|सूची|लिस्ट)/i.test(n))requestedOutputs.push("list");if(/(table|तालिका)/i.test(n))requestedOutputs.push("table");if(/(step|कदम|तरीका)/i.test(n))requestedOutputs.push("steps");if(/(code|coding|कोड)/i.test(n))requestedOutputs.push("code");
 const constraints=[],allTokens=tokens(n),q=allTokens.filter(t=>t.length>2&&!STOP.has(t));
 if(["free","मुफ्त","फ्री"].some(x=>allTokens.includes(x))||n.includes("no cost")||n.includes("without payment")||n.includes("बिना खर्च"))constraints.push("free-only");
 if(["hindi","हिंदी"].some(x=>allTokens.includes(x)))constraints.push("Hindi");
 if(["english","अंग्रेज़ी","अंग्रेजी"].some(x=>allTokens.includes(x)))constraints.push("English");
 if(["dont","mat","मत"].some(x=>allTokens.includes(x))||n.includes("do not")||n.includes("नहीं करना"))constraints.push("negative instruction");
 const confidence=primary.score===0?0.25:Math.min(0.96,0.45+primary.score*0.12);
 const ambiguity=primary.name==="general"&&kind!=="greeting"&&kind!=="thanks";
 const next=({research:["सवाल स्पष्ट करना","अलग-अलग भरोसेमंद स्रोतों में खोजना","जानकारी और तारीखों की तुलना करना","स्रोतों सहित निष्कर्ष देना"],coding:["मौजूदा फाइलें और समस्या जाँचना","छोटा बदलाव तैयार करना","वास्तविक टेस्ट चलाना","नतीजा और बदली फाइलें बताना"],files:["फाइल और मांगा गया काम पहचानना","संबंधित सामग्री पढ़ना","जरूरी डेटा निकालना और जाँचना","सीमाओं सहित उत्तर देना"],explain:["मुख्य विषय पहचानना","सरल भाषा में अर्थ समझाना","उदाहरण देना","जरूरत हो तो अगला कदम बताना"],planning:["लक्ष्य और शर्तें निकालना","काम को चरणों में बाँटना","निर्भरता और जोखिम देखना","पहला व्यावहारिक कदम करना"],memory:["पिछले निर्देशों का उपलब्ध रिकॉर्ड खोजना","मिलान की पुष्टि करना","याद रिकॉर्ड की सीमा बताना"],general:["आपकी बात का आशय समझना","उपलब्ध क्षमता जाँचना","जरूरत हो तो एक स्पष्ट सवाल पूछना"]})[primary.name]||[];
 return {text,normalized:n,language:lang,kind,intent:primary.name,confidence,matched:found,ambiguity,question:asksQuestion,command:imperative,requestedOutputs,constraints,keywords:[...new Set(q)].slice(0,16),steps:next,summary:{en:"I understood this as a "+kind+" about "+primary.name+".",hi:"मैंने आपकी बात को "+(kind==="command"?"निर्देश":kind==="question"?"सवाल":"अनुरोध")+" और विषय को "+primary.label+" के रूप में समझा है।"}};
}
function buildReply(analysis,options){
 const o=options||{},hi=analysis.language==="hi",t=analysis.text,steps=analysis.steps;
 if(analysis.kind==="greeting")return hi?"नमस्ते! मैं आपकी बात सुन रहा हूँ। बताइए, क्या करना है?":"Hello! I’m listening. What would you like me to do?";
 if(analysis.kind==="thanks")return hi?"आपका स्वागत है! अगला काम बताइए।":"You're welcome. Tell me what you'd like to do next.";
 const context=o.context||{},knowledge=Array.isArray(o.knowledge)?o.knowledge:[];
 const related=knowledge.slice(0,3);
 const intro=hi?"मैंने आपकी बात इस तरह समझी: ":"I understood your request as: ";
 const lines=[intro+(hi?analysis.summary.hi:analysis.summary.en)];
 if(analysis.confidence<0.38)lines.push(hi?"आपका संदेश थोड़ा अस्पष्ट है। गलत काम करने के बजाय मैं एक बात स्पष्ट करना चाहूँगा।":"Your message is a little ambiguous. I should clarify one point rather than take the wrong action.");
 if(analysis.intent==="research")lines.push(hi?"काम: कई स्वतंत्र स्रोतों में खोज, नतीजों की तुलना और मूल लिंक देना।":"Action: search independent sources, compare findings and provide original links.");
 else if(analysis.intent==="coding")lines.push(hi?"काम: पहले मौजूदा कोड और टेस्ट देखना, फिर बदलाव करके वास्तविक टेस्ट चलाना।":"Action: inspect existing code and tests first, then make a change and run real tests.");
 else if(analysis.intent==="files")lines.push(hi?"काम: उपलब्ध फाइल पढ़कर मांगी गई जानकारी निकालना और जाँचना।":"Action: read the available file, extract the requested information and verify it.");
 else if(analysis.intent==="explain")lines.push(hi?"काम: सीधे जवाब, सरल व्याख्या और जरूरत के अनुसार उदाहरण देना।":"Action: answer directly, explain simply and give an example where useful.");
 else if(analysis.intent==="planning")lines.push(hi?"काम: लक्ष्य, जरूरी शर्तें और अगला व्यावहारिक कदम तय करना।":"Action: define the goal, constraints and next practical step.");
 else if(analysis.intent==="memory")lines.push(hi?"काम: उपलब्ध पिछली बातचीत और सेव संदर्भ में संबंधित निर्देश खोजना।":"Action: search available previous conversation context and saved project notes.");
 if(related.length)lines.push(hi?"आपकी स्थानीय Knowledge Library में संबंधित सामग्री मिली है: "+related.map(x=>x.title).join("، "):"Related items in your local knowledge library: "+related.map(x=>x.title).join(", "));
 if(analysis.constraints.length)lines.push((hi?"ध्यान में रखी शर्तें: ":"Constraints noted: ")+analysis.constraints.join(", "));
 if(analysis.confidence<0.38)lines.push(hi?"कृपया बताइए: आप किस खास चीज़ पर काम करवाना चाहते हैं?":"Please clarify the specific thing you want me to work on.");
 else if(o.capabilityNote)lines.push(o.capabilityNote);
 else if(analysis.intent!=="research")lines.push(hi?"यह शुरुआती नियम-आधारित समझ है; जटिल भाषा और गहरे तर्क के लिए असली भाषा मॉडल जोड़ना बाकी है।":"This is early rule-based understanding; a real language model is still needed for nuanced language and deeper reasoning.");
 if(steps.length)lines.push((hi?"काम के चरण:\n":"Work steps:\n")+steps.map((x,i)=>(i+1)+". "+x).join("\n"));
 return lines.join("\\n\\n");
}
const api={understand,buildReply,detectLanguage,tokens};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.IntelligentBrain=api})(typeof globalThis!=="undefined"?globalThis:this);
