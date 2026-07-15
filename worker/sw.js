/* Service Worker Lab — 서비스 워커 본체
 * VERSION을 바꿔 저장하면 브라우저가 "다른 파일"로 인식해서
 * 새 워커 설치(install) → waiting → activate 업데이트 흐름이 시작됩니다.
 */
const VERSION = "2026.07.13-visual-v16";
const APP_CACHE = `sw-lab-app-${VERSION}`;
const API_CACHE = `sw-lab-api-${VERSION}`;
const RUNTIME_CACHE = `sw-lab-runtime-${VERSION}`;
const CACHE_PREFIX = "sw-lab-";

// install 때 미리 캐싱해 두는 앱 셸: 오프라인에서도 화면 뼈대를 띄우기 위한 최소 파일
const APP_SHELL = [
  "/",
  "/index.html",
  "/app.v6.css",
  "/main.v6.js",
  "/offline.html",
  "/use-cases.html",
  "/version.json",
  "/data/requests.json"
];

/* install: 워커 생애 최초 1회. 앱 셸을 통째로 캐싱한다. */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_CACHE);
      await cache.addAll(APP_SHELL);
      await broadcast("Install", `Cached app shell (${APP_SHELL.length} files).`);
    })()
  );
});

/* activate: 이전 버전의 캐시를 정리하고, 열려 있는 탭의 제어권을 가져온다. */
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
      // clients.claim(): 새로고침 없이도 이 워커가 바로 controller가 된다
      await self.clients.claim();
      await broadcast("Activate", "Claimed open tabs for this origin.");
      await broadcastVersion();
    })()
  );
});

/* message: 페이지와의 대화 창구 (페이지 → 워커) */
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting(); // waiting 중인 새 워커를 즉시 활성화
  }

  if (event.data?.type === "GET_VERSION") {
    event.source?.postMessage({ type: "SW_VERSION", version: VERSION });
  }

  if (event.data?.type === "CHECK_VERSION") {
    event.waitUntil(checkVersionFile());
  }
});

/* fetch: 모든 요청이 여기를 지나간다. 요청 종류별로 전략을 배분한다. */
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // GET + 같은 출처만 다룬다 (POST, 외부 CDN 등은 브라우저 기본 동작에 맡김)
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // 주소창 이동/새로고침 같은 문서 탐색: 네트워크 우선, 실패 시 offline.html
  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  // 실험용 API(/data/*): URL의 strategy 쿼리 값으로 전략을 고른다
  if (url.pathname.startsWith("/data/")) {
    event.respondWith(handleDataRequest(request));
    return;
  }

  // 정적 자원(JS/CSS/이미지/폰트): 캐시 우선
  if (isStaticAsset(request, url)) {
    event.respondWith(cacheFirst(request, APP_CACHE));
    return;
  }

  event.respondWith(fetch(request));
});

function handleDataRequest(request) {
  const url = new URL(request.url);
  const strategy = url.searchParams.get("strategy") || "network-first";

  if (strategy === "cache-first") return cacheFirst(request, API_CACHE);
  if (strategy === "stale-while-revalidate") return staleWhileRevalidate(request, API_CACHE);
  if (strategy === "network-only") return networkOnly(request);
  return networkFirstData(request, API_CACHE);
}

/* 문서 탐색: 네트워크 → 캐시 → /offline.html 순서로 시도 */
async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    await broadcast("Fetch", `Navigation from network: ${new URL(request.url).pathname}`);
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      await broadcast("Fetch", `Navigation fallback from cache: ${new URL(request.url).pathname}`);
      return cached;
    }
    await broadcast("Fetch", "Navigation fallback: /offline.html");
    return caches.match("/offline.html");
  }
}

/* Network First: 네트워크 먼저, 실패하면 캐시, 그것도 없으면 즉석 JSON */
async function networkFirstData(request, cacheName) {
  const cacheKey = stableCacheKey(request);
  try {
    const response = await simulatedFetch(request);
    const cache = await caches.open(cacheName);
    cache.put(cacheKey, withSourceHeader(response.clone(), "network"));
    await broadcast("Fetch", `Network first: ${new URL(request.url).pathname} from network.`);
    return withSourceHeader(response, "network");
  } catch (error) {
    const cached = await caches.match(cacheKey);
    if (cached) {
      await broadcast("Cache", `Network first fallback: ${new URL(request.url).pathname} from cache.`);
      return withSourceHeader(cached, "cache-fallback");
    }
    // 서비스 워커는 응답을 '만들' 수도 있다
    await broadcast("Cache", `Network first fallback: generated offline JSON.`);
    return jsonResponse(
      {
        title: "Offline fallback",
        message: "네트워크와 캐시가 모두 없어서 서비스 워커가 직접 만든 JSON 응답입니다.",
        generatedAt: new Date().toISOString()
      },
      "generated-offline"
    );
  }
}

/* Cache First: 캐시에 있으면 네트워크를 아예 건드리지 않는다 */
async function cacheFirst(request, cacheName) {
  const cacheKey = stableCacheKey(request);
  const cached = await caches.match(cacheKey);

  if (cached) {
    await broadcast("Cache", `Cache first hit: ${new URL(request.url).pathname}`);
    return withSourceHeader(cached, "cache");
  }

  const response = await simulatedFetch(request);
  const cache = await caches.open(cacheName);
  cache.put(cacheKey, withSourceHeader(response.clone(), "network"));
  await broadcast("Fetch", `Cache first miss: ${new URL(request.url).pathname} from network.`);
  return withSourceHeader(response, "network");
}

/* Stale While Revalidate: 캐시로 즉답 + 백그라운드에서 몰래 갱신 */
async function staleWhileRevalidate(request, cacheName) {
  const cacheKey = stableCacheKey(request);
  const cache = await caches.open(cacheName);
  const cached = await cache.match(cacheKey);

  const refresh = simulatedFetch(request)
    .then((response) => {
      cache.put(cacheKey, withSourceHeader(response.clone(), "network-refresh"));
      broadcast("Cache", `Revalidated in background: ${new URL(request.url).pathname}`);
      return response;
    })
    .catch(() => null);

  if (cached) {
    await broadcast("Cache", `Stale while revalidate hit: ${new URL(request.url).pathname}`);
    return withSourceHeader(cached, "stale-cache");
  }

  const response = await refresh;
  if (response) {
    await broadcast("Fetch", `Stale while revalidate miss: network response.`);
    return withSourceHeader(response, "network");
  }

  return jsonResponse(
    {
      title: "Offline fallback",
      message: "캐시가 없고 네트워크도 실패했습니다.",
      generatedAt: new Date().toISOString()
    },
    "generated-offline"
  );
}

/* Network Only: 캐시를 읽지도 쓰지도 않는다 */
async function networkOnly(request) {
  const response = await simulatedFetch(request);
  await broadcast("Fetch", `Network only: ${new URL(request.url).pathname}`);
  return withSourceHeader(response, "network-only");
}

/* 페이지가 x-sw-lab-offline 헤더를 붙이면 네트워크 실패를 흉내 낸다 */
async function simulatedFetch(request) {
  if (request.headers.get("x-sw-lab-offline") === "1") {
    throw new TypeError("Simulated offline mode");
  }
  return fetch(request);
}

/* ?strategy=... 같은 실험용 쿼리를 캐시 키에서 제거 — 같은 데이터는 같은 키로 */
function stableCacheKey(request) {
  const url = new URL(request.url);
  return new Request(`${url.origin}${url.pathname}`, {
    headers: { accept: request.headers.get("accept") || "*/*" }
  });
}

function isStaticAsset(request, url) {
  return (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font" ||
    url.pathname.startsWith("/assets/")
  );
}

/* 응답 헤더에 x-sw-lab-source를 심어 화면에서 출처를 표시할 수 있게 한다 */
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

/* version.json 폴링: 앱 버전이 바뀌면 새 캐시를 미리 만들어 두는 패턴의 축약판 */
async function checkVersionFile() {
  try {
    const response = await fetch("/version.json", { cache: "no-store" });
    const data = await response.json();

    if (data.version && data.version !== VERSION) {
      const cache = await caches.open(`sw-lab-app-${data.version}`);
      await cache.addAll(data.assets || []);
      await broadcastRaw({ type: "NEW_VERSION", version: data.version });
      return;
    }

    await broadcast("Update", "version.json matches this service worker.");
  } catch (error) {
    await broadcast("Error", `Version check failed: ${error.message}`);
  }
}

async function broadcastVersion() {
  await broadcastRaw({ type: "SW_VERSION", version: VERSION });
}

/* 워커 → 페이지 로그 전송. 화면의 Event Log가 이걸 받아서 그린다 */
async function broadcast(tag, message) {
  await broadcastRaw({ type: "SW_LOG", tag, message });
}

async function broadcastRaw(payload) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  await Promise.all(clients.map((client) => client.postMessage(payload)));
}
