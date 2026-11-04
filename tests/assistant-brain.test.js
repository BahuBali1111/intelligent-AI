"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),brain=require("../assistant-brain.js");
test("understands Hindi and English intent separately",()=>{assert.equal(brain.understand("मेरे ऐप का कोड ठीक करो").intent,"coding");assert.equal(brain.understand("Please search latest solar panel research").intent,"research")});
test("recognises greetings and questions",()=>{assert.equal(brain.understand("नमस्ते").kind,"greeting");assert.equal(brain.understand("यह कैसे काम करता है?").kind,"question")});
test("extracts constraints and requested formats",()=>{const x=brain.understand("मुफ्त में हिंदी में coding के steps बताओ");assert.ok(x.constraints.includes("free-only"));assert.ok(x.requestedOutputs.includes("code"));assert.ok(x.requestedOutputs.includes("steps"))});
test("marks uncertain general requests for clarification",()=>{const x=brain.understand("वह कर दो");assert.equal(x.ambiguity,true);assert.ok(x.confidence<0.4)});
test("builds a reply with the right task and language",()=>{const x=brain.understand("इस विषय पर रिसर्च करो");const y=brain.buildReply(x);assert.match(y,/कई स्वतंत्र स्रोत/);assert.match(y,/काम के चरण/)});
test("retrieves related knowledge as response context",()=>{const x=brain.understand("Explain solar energy");const y=brain.buildReply(x,{knowledge:[{title:"Solar notes"}]});assert.match(y,/Solar notes/)});
