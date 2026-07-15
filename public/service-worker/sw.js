/* 쓸모지도 Service Worker Lab
 * 이 워커는 /service-worker/ 범위만 제어합니다.
 * 통합 사이트 전체 캐시와 실험용 캐시가 섞이지 않도록 범위를 의도적으로 제한했습니다.
 */
const VERSION = "2026.07.15-next-v1";
const CACHE_PREFIX = "knowledge-sw-lab-";
const APP_CACHE = `${CACHE_PREFIX}app-${VERSION}`;
const API_CACHE = `${CACHE_PREFIX}api-${VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-${VERSION}`;

const APP_SHELL = [
  "/service-worker/",
  "/service-worker/use-cases/",
  "/service-worker/offline.html",
  "/service-worker/version.json",
  "/service-worker/data/requests.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_CACHE);
      await cache.addAll(APP_SHELL);
      await broadcast("Install", `Cached app shell (${APP_SHELL.length} entries).`);
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX))
          .filter((name) => ![APP_CACHE, API_CACHE, RUNTIME_CACHE].includes(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
      await broadcast("Activate", "Claimed open Service Worker Lab tabs.");
      await broadcastRaw({ type: "SW_VERSION", version: VERSION });
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "GET_VERSION") {
    event.source?.postMessage({ type: "SW_VERSION", version: VERSION });
  }
  if (event.data?.type === "CHECK_VERSION") event.waitUntil(checkVersionFile());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (url.pathname.startsWith("/service-worker/data/")) {
    event.respondWith(handleDataRequest(request));
    return;
  }

  if (url.pathname.startsWith("/service-worker/") && isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, APP_CACHE));
  }
});

function handleDataRequest(request) {
  const strategy = new URL(request.url).searchParams.get("strategy") || "network-first";
  if (strategy === "cache-first") return cacheFirst(request, API_CACHE);
  if (strategy === "stale-while-revalidate") return staleWhileRevalidate(request, API_CACHE);
  if (strategy === "network-only") return networkOnly(request);
  return networkFirstData(request, API_CACHE);
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    await broadcast("Fetch", `Navigation from network: ${new URL(request.url).pathname}`);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      await broadcast("Cache", `Navigation fallback from cache: ${new URL(request.url).pathname}`);
      return cached;
    }
    await broadcast("Cache", "Navigation fallback: offline.html");
    return caches.match("/service-worker/offline.html");
  }
}

async function networkFirstData(request, cacheName) {
  const cacheKey = stableCacheKey(request);
  try {
    const response = await simulatedFetch(request);
    const cache = await caches.open(cacheName);
    cache.put(cacheKey, withSourceHeader(response.clone(), "network"));
    await broadcast("Fetch", "Network First: response from network, copy saved to cache.");
    return withSourceHeader(response, "network");
  } catch {
    const cached = await caches.match(cacheKey);
    if (cached) {
      await broadcast("Cache", "Network First: network failed, using cached response.");
      return withSourceHeader(cached, "cache-fallback");
    }
    await broadcast("Cache", "Network and cache unavailable; generated an offline response.");
    return jsonResponse({
      title: "Offline fallback",
      message: "네트워크와 캐시가 모두 없어 서비스 워커가 직접 만든 JSON입니다.",
      generatedAt: new Date().toISOString()
    }, "generated-offline");
  }
}

async function cacheFirst(request, cacheName) {
  const cacheKey = stableCacheKey(request);
  const cached = await caches.match(cacheKey);
  if (cached) {
    await broadcast("Cache", `Cache First hit: ${new URL(request.url).pathname}`);
    return withSourceHeader(cached, "cache");
  }
  const response = await simulatedFetch(request);
  const cache = await caches.open(cacheName);
  cache.put(cacheKey, withSourceHeader(response.clone(), "network"));
  await broadcast("Fetch", `Cache First miss: ${new URL(request.url).pathname}`);
  return withSourceHeader(response, "network");
}

async function staleWhileRevalidate(request, cacheName) {
  const cacheKey = stableCacheKey(request);
  const cache = await caches.open(cacheName);
  const cached = await cache.match(cacheKey);
  const refresh = simulatedFetch(request)
    .then((response) => {
      cache.put(cacheKey, withSourceHeader(response.clone(), "network-refresh"));
      broadcast("Cache", "Stale While Revalidate: cache refreshed in background.");
      return response;
    })
    .catch(() => null);

  if (cached) return withSourceHeader(cached, "stale-cache");
  const response = await refresh;
  if (response) return withSourceHeader(response, "network");
  return jsonResponse({
    title: "Offline fallback",
    message: "캐시가 없고 네트워크도 실패했습니다.",
    generatedAt: new Date().toISOString()
  }, "generated-offline");
}

async function networkOnly(request) {
  const response = await simulatedFetch(request);
  await broadcast("Fetch", "Network Only: cache was bypassed.");
  return withSourceHeader(response, "network-only");
}

async function simulatedFetch(request) {
  if (request.headers.get("x-sw-lab-offline") === "1") {
    throw new TypeError("Simulated offline mode");
  }
  return fetch(request);
}

function stableCacheKey(request) {
  const url = new URL(request.url);
  return new Request(`${url.origin}${url.pathname}`, {
    headers: { accept: request.headers.get("accept") || "*/*" }
  });
}

function isStaticAsset(request) {
  return ["script", "style", "image", "font"].includes(request.destination);
}

function withSourceHeader(response, source) {
  const headers = new Headers(response.headers);
  headers.set("x-sw-lab-source", source);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function jsonResponse(body, source) {
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-sw-lab-source": source
    }
  });
}

async function checkVersionFile() {
  try {
    const response = await fetch("/service-worker/version.json", { cache: "no-store" });
    const data = await response.json();
    if (data.version && data.version !== VERSION) {
      const cache = await caches.open(`${CACHE_PREFIX}app-${data.version}`);
      await cache.addAll(data.assets || []);
      await broadcastRaw({ type: "NEW_VERSION", version: data.version });
      return;
    }
    await broadcast("Update", "version.json matches this service worker.");
  } catch (error) {
    await broadcast("Error", `Version check failed: ${error.message}`);
  }
}

async function broadcast(tag, message) {
  await broadcastRaw({ type: "SW_LOG", tag, message });
}

async function broadcastRaw(payload) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  await Promise.all(clients.map((client) => client.postMessage(payload)));
}
