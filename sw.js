/* D62 service worker: pages are network-first (so updates arrive automatically), images are cache-first. Drawings (SVG) are not cached. */
const PREFIX = "d62-";
const CACHE = PREFIX + "v1";   /* raise the number (v2, v3...) when you change icons/images */
const SHELL = ["./", "index.html", "viewer.html", "manifest.json", "D62.css", "index.css", "jscookmenu.min.js",
  "images/icon-192.png", "images/icon-512.png", "images/apple-touch-icon.png"];
const SCOPE = new URL("./", self.location).pathname;
function mine(url) {
  const p = decodeURIComponent(url.pathname.slice(SCOPE.length));
  return p === "" || /^(index|viewer)\.html$/.test(p) || p === "manifest.json" || p === "D62.css" || p === "index.css" || p === "jscookmenu.min.js" || p.startsWith("images/");
}
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || !mine(url)) return;
  const save = res => { if (res && res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return res; };
  if (req.mode === "navigate" || /\.(html|json|css|js)$/.test(url.pathname) || url.pathname.endsWith("/")) {
    e.respondWith(fetch(req, { cache: "no-cache" }).then(save).catch(() => caches.match(req).then(h => h || caches.match("index.html"))));
  } else {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(save)));
  }
});
