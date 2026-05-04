// NauLPong service worker — minimal install + offline shell.
// We use a "stale-while-revalidate" strategy for static assets and bypass
// network calls to the game backend (Cloudflare Worker / Durable Object) so
// they never touch the cache. WebSocket traffic is unaffected.

const VERSION = "v2";
const CACHE_STATIC = `naulpong-static-${VERSION}`;
const STATIC_ASSETS = [
  "/",
  "/about",
  "/perfil",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_STATIC)
      .then((cache) =>
        Promise.all(
          STATIC_ASSETS.map((url) =>
            cache.add(url).catch(() => {
              /* asset may 404 in dev; ignore */
            }),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("naulpong-") && k !== CACHE_STATIC)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never cache cross-origin (game server / fonts CDN may live elsewhere).
  if (url.origin !== self.location.origin) return;

  // Skip the play route — must always use fresh JS to talk to the worker.
  if (url.pathname.startsWith("/play/")) return;

  // Skip Next dev/HMR endpoints.
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;

  event.respondWith(staleWhileRevalidate(req));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_STATIC);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((res) => {
      if (res && res.status === 200 && res.type === "basic") {
        cache.put(request, res.clone());
      }
      return res;
    })
    .catch(() => null);
  return cached || (await networkPromise) || new Response("", { status: 504 });
}
