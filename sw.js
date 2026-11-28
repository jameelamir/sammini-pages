// Build-time values are replaced by Vite's closeBundle hook.
const VERSION='057fc70d17dda5e3';
const PRECACHE=["index.html","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","assets/index-BSD2jI5z.css","assets/index-o7eX5tde.js"];
const CACHE=`sammini-shell-${VERSION}`;
const BASE=new URL('./',self.location.href);
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE)));
  // Do not take over a study session; a new version activates on the next visit.
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const name of await caches.keys()) if(name.startsWith('sammini-shell-') && name!==CACHE) await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET' || url.origin!==BASE.origin || !url.pathname.startsWith(BASE.pathname) || url.pathname.includes('/api/')) return;
  if(event.request.mode==='navigate') {
    event.respondWith(fetch(event.request).then(response=>{
      if(response.ok) {const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(new URL('index.html',BASE),copy)));}
      return response;
    }).catch(()=>caches.match(new URL('index.html',BASE))));
  } else if(PRECACHE.some(path=>new URL(path,BASE).href===url.href)) {
    event.respondWith(caches.match(event.request).then(cached=>cached || fetch(event.request)));
  }
});
self.addEventListener('push',event=>event.waitUntil((async()=>{
  let payload={};try{payload=event.data?.json() || {};}catch{}
  await self.registration.showNotification(payload.title || 'حان وقت المراجعة',{
    body:payload.body || 'مراجعتك اليومية جاهزة في سمعني.',
    icon:new URL('icons/icon-192.png',BASE).href,
    badge:new URL('icons/badge-96.png',BASE).href,
    tag:payload.tag || 'sammini-study',
    data:{url:payload.url || new URL('?today=1',BASE).href},
  });
})()));
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    let target=new URL(event.notification.data?.url || '?today=1',BASE);
    if(target.origin!==BASE.origin || !target.pathname.startsWith(BASE.pathname)) target=new URL('?today=1',BASE);
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows) if(client.url.startsWith(BASE.href) && 'focus' in client) {
      // Focus without navigating so an in-progress answer is preserved.
      return client.focus();
    }
    return self.clients.openWindow(target.href);
  })());
});
