// Service worker : l'app s'ouvre sans internet
const CACHE='elite-ventes-v4';
const TILES='elite-tiles-v1';
const CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','favicon.ico','favicon-32.png','apple-touch-icon.png','lib/leaflet/leaflet.js','lib/leaflet/leaflet.css','lib/leaflet/images/marker-icon.png','lib/leaflet/images/marker-shadow.png','lib/leaflet/images/layers.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!==TILES).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET'||req.url.includes('/rest/v1/'))return; // la synchro passe toujours par le réseau
  // Fond de carte OpenStreetMap : gardé en cache après la première visite pour marcher hors ligne (3 000 tuiles max)
  if(req.url.startsWith('https://tile.openstreetmap.org/')){e.respondWith(caches.open(TILES).then(c=>c.match(req).then(hit=>hit||fetch(req).then(res=>{if(res&&(res.ok||res.type==='opaque')){c.put(req,res.clone());if(Math.random()<0.02)c.keys().then(k=>{if(k.length>3000)k.slice(0,k.length-3000).forEach(x=>c.delete(x))})}return res}).catch(()=>hit||new Response('',{status:504})))));return}
  // Page de l'app : réseau d'abord (mises à jour visibles tout de suite), cache si hors ligne
  if(req.mode==='navigate'){e.respondWith(fetch(req).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put('index.html',cp));return res}).catch(()=>caches.match('index.html')));return}
  e.respondWith(caches.match(req).then(hit=>{
    const net=fetch(req).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp))}return res}).catch(()=>hit);
    return hit||net;
  }));
});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window'}).then(ws=>ws.length?ws[0].focus():self.clients.openWindow('./')))});
