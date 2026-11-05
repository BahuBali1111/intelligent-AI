"use strict";
const CACHE="intelligent-ai-v1.7.4";
const FILES=["./","./index.html","./style.css","./app.js","./core.js","./memory.js","./knowledge.js","./update-engine.js","./research-desk.js","./research-analyzer.js","./code-workbench.js","./research-engine.js","./context-engine.js","./assistant-brain.js","./model-client.js","./manifest.json","./service-worker.js","./icon.svg"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET"||new URL(event.request.url).origin!==location.origin)return;const request=event.request;event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response}).catch(()=>caches.match(request).then(cached=>cached||caches.match("./index.html"))) )});
