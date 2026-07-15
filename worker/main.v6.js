/* Service Worker Lab — page script
 * 등록/업데이트, 요청 실험실, 라이브 흐름 애니메이션과 선택 해설을 담당합니다.
 * 서비스 워커 쪽 로직은 /sw.js 참고.
 */

const $ = (selector) => document.querySelector(selector);

const elements = {
  activateSW: $("#activate-sw"),
  appCacheCount: $("#app-cache-count"),
  cacheCount: $("#cache-count"),
  cacheList: $("#cache-list"),
  cacheRefreshTime: $("#cache-refresh-time"),
  clearCaches: $("#clear-caches"),
  clearLog: $("#clear-log"),
  controllerPill: $("#controller-pill"),
  demoMode: $("#demo-mode"),
  eventLog: $("#event-log"),
  failCache: $("#fail-cache"),
  failNetwork: $("#fail-network"),
  flowDots: $("#flow-dots"),
  flowHint: $("#flow-hint"),
  flowSteps: $("#flow-steps"),
  footerTip: $("#footer-tip"),
  footerUpdate: $("#footer-update"),
  lifecycleSteps: $("#lifecycle-steps"),
  navigatorOnline: $("#navigator-online"),
  netOfflineBadge: $("#net-offline-badge"),
  networkType: $("#network-type"),
  nodeCache: $("#node-cache"),
  nodeNetwork: $("#node-network"),
  nodeSW: $("#node-sw"),
  offlineToggle: $("#offline-toggle"),
  onlineSignal: $("#online-signal"),
  refreshCache: $("#refresh-cache"),
  registrationSignal: $("#registration-signal"),
  reloadCode: $("#reload-code"),
  requestUrl: $("#request-url"),
  responseBox: $("#response-box"),
  responseMeta: $("#response-meta"),
  responseNote: $("#response-note"),
  responseStatus: $("#response-status"),
  responseTime: $("#response-time"),
  runtimeCacheCount: $("#runtime-cache-count"),
  scopeValue: $("#scope-value"),
  sendRequest: $("#send-request"),
  sourceBadge: $("#source-badge"),
  stateValue: $("#state-value"),
  strategyCopy: $("#strategy-copy"),
  strategyGood: $("#strategy-good"),
  strategyOptions: document.querySelectorAll(".strategy-option"),
  strategyRoute: $("#strategy-route"),
  strategyTitle: $("#strategy-title"),
  strategyWatch: $("#strategy-watch"),
  swCode: $("#sw-code"),
  unregisterSW: $("#unregister-sw"),
  updateSW: $("#update-sw"),
  versionValue: $("#version-value"),
  waitingChip: $("#waiting-chip")
};

let registration = null;
let waitingWorker = null;

/* ---------------------------------------------------------------- utils */

const formatTime = () =>
  new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    hour12: false
  }).format(new Date());

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function addLog(tag, message) {
  const tagClassMap = {
    Cache: "cache",
    Error: "error",
    Install: "lifecycle",
    Activate: "lifecycle",
    Lifecycle: "lifecycle"
  };
  const item = document.createElement("li");
  item.innerHTML = `
    <span class="event-time">${formatTime()}</span>
    <span class="event-tag ${tagClassMap[tag] || ""}">${tag}</span>
    <span class="event-message"></span>
  `;
  item.querySelector(".event-message").textContent = message;
  elements.eventLog.prepend(item);
  while (elements.eventLog.children.length > 80) {
    elements.eventLog.lastElementChild.remove();
  }
}

function selectedStrategy() {
  return document.querySelector('input[name="strategy"]:checked')?.value ?? "network-first";
}

const STRATEGY_INFO = {
  "network-first": {
    title: "Network First",
    copy: "최신 응답을 먼저 시도하고, 연결이 실패할 때 저장된 응답으로 전환합니다.",
    route: "Browser → Worker → Network → Cache 저장 → Browser",
    good: "뉴스 피드, 목록 API처럼 최신성과 오프라인 대비가 모두 필요할 때",
    watch: "첫 요청이 성공해 캐시가 생기기 전에는 오프라인 대체 응답이 없습니다."
  },
  "cache-first": {
    title: "Cache First",
    copy: "저장된 응답이 있으면 네트워크 왕복 없이 즉시 반환하고, 없을 때만 네트워크를 사용합니다.",
    route: "Browser → Worker → Cache, miss일 때만 Network",
    good: "폰트, 로고, 라이브러리처럼 자주 바뀌지 않는 정적 리소스",
    watch: "캐시 갱신 규칙이 없으면 오래된 파일이 계속 보일 수 있습니다."
  },
  "stale-while-revalidate": {
    title: "Stale While Revalidate",
    copy: "캐시로 먼저 화면을 채우고, 사용자가 기다리지 않는 동안 뒤에서 새 응답으로 교체합니다.",
    route: "Cache → Browser 즉시 응답 + Network → Cache 백그라운드 갱신",
    good: "아바타, 설정, 피드처럼 속도가 우선이고 약간 오래된 값도 허용될 때",
    watch: "이번 요청에는 이전 값이 보이고, 갱신된 값은 다음 요청부터 사용됩니다."
  },
  "network-only": {
    title: "Network Only",
    copy: "캐시를 읽지도 쓰지도 않고 매번 원격 서버의 응답만 기다립니다.",
    route: "Browser → Worker → Network → Browser",
    good: "결제, 실시간 시세, 로그 전송처럼 저장된 응답을 쓰면 안 될 때",
    watch: "연결이 끊기면 대체 경로 없이 요청이 그대로 실패합니다."
  }
};

function syncStrategyExplanation() {
  const info = STRATEGY_INFO[selectedStrategy()];
  const offline = elements.offlineToggle.checked;
  elements.strategyTitle.textContent = info.title;
  elements.strategyCopy.textContent = info.copy;
  elements.strategyRoute.textContent = info.route;
  elements.strategyGood.textContent = info.good;
  elements.strategyWatch.textContent = offline
    ? `현재 오프라인 실험 모드입니다. ${info.watch}`
    : info.watch;
}

/* -------------------------------------------------- response presentation */

const SOURCE_INFO = {
  network: {
    label: "network",
    cls: "src-network",
    note: "네트워크에서 새로 받아왔고, 복사본을 캐시에 저장해 뒀습니다. 다음번 오프라인 대비 완료."
  },
  "network-only": {
    label: "network-only",
    cls: "src-network",
    note: "캐시를 완전히 무시하고 네트워크만 사용했습니다. 저장도 하지 않습니다."
  },
  cache: {
    label: "cache",
    cls: "src-cache",
    note: "네트워크를 건드리지 않고 캐시에서 바로 꺼냈습니다. elapsedMs가 얼마나 짧은지 비교해 보세요."
  },
  "stale-cache": {
    label: "stale-cache",
    cls: "src-cache",
    note: "캐시로 즉시 응답하고, 백그라운드에서 몰래 새 버전을 받아 캐시를 갱신했습니다. Event Log에서 'Revalidated'를 찾아보세요."
  },
  "cache-fallback": {
    label: "cache-fallback",
    cls: "src-fallback",
    note: "네트워크가 실패해서, 예전에 저장해 둔 캐시 응답으로 대신했습니다. 오프라인 지원의 핵심 장면입니다."
  },
  "generated-offline": {
    label: "generated-offline",
    cls: "src-generated",
    note: "네트워크도 캐시도 없어서 서비스 워커가 new Response()로 즉석에서 JSON을 만들었습니다."
  },
  direct: {
    label: "no service worker",
    cls: "src-direct",
    note: "서비스 워커가 아직 이 탭을 제어하지 않아, 브라우저가 직접 네트워크로 다녀왔습니다."
  }
};

function renderResponse({ ok, status, source, strategy, offline, elapsed, body }) {
  const info = SOURCE_INFO[source] || SOURCE_INFO.direct;
  elements.responseMeta.hidden = false;
  elements.responseNote.hidden = false;
  elements.sourceBadge.textContent = info.label;
  elements.sourceBadge.className = `source-badge ${info.cls}`;
  elements.responseStatus.textContent = `HTTP ${status}`;
  elements.responseTime.textContent = `${elapsed}ms`;
  elements.responseNote.textContent = info.note;
  elements.responseBox.textContent = JSON.stringify(
    { ok, status, source, strategy, simulatedOffline: offline, elapsedMs: elapsed, body },
    null,
    2
  );
}

/* ------------------------------------------------------- flow animation */

let flowRun = 0;

function svgEl(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function clearFlow() {
  elements.flowDots.replaceChildren();
  elements.flowSteps.replaceChildren();
  elements.failNetwork.classList.remove("show");
  elements.failCache.classList.remove("show");
}

function addFlowStep(text) {
  const li = document.createElement("li");
  li.textContent = text;
  elements.flowSteps.append(li);
}

function pulseNode(node) {
  node.classList.remove("pulse");
  // reflow로 애니메이션 재시작
  void node.getBoundingClientRect();
  node.classList.add("pulse");
}

function flashFail(mark) {
  mark.classList.remove("show");
  void mark.getBoundingClientRect();
  mark.classList.add("show");
}

function travel(pathId, { cls = "flow-dot", reverse = false, duration = 480, r = 7 } = {}) {
  const run = flowRun;
  const path = $(pathId);
  const length = path.getTotalLength();

  if (reducedMotion()) duration = 0;

  return new Promise((resolve) => {
    if (duration === 0) return resolve();
    const dot = svgEl("circle", { r, class: cls });
    elements.flowDots.append(dot);
    const startedAt = performance.now();

    const frame = (now) => {
      if (flowRun !== run) {
        dot.remove();
        return resolve();
      }
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const point = path.getPointAtLength((reverse ? 1 - eased : eased) * length);
      dot.setAttribute("cx", point.x);
      dot.setAttribute("cy", point.y);
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        dot.remove();
        resolve();
      }
    };
    requestAnimationFrame(frame);
  });
}

async function playFlow(source) {
  const run = ++flowRun;
  const alive = () => flowRun === run;
  clearFlow();
  elements.flowHint.hidden = true;

  const step = (text) => alive() && addFlowStep(text);

  if (source === "direct") {
    step("서비스 워커가 아직 제어하지 않음 — 브라우저가 직접 네트워크로");
    await travel("#path-direct", { cls: "flow-dot dot-direct" });
    if (!alive()) return;
    pulseNode(elements.nodeNetwork);
    await travel("#path-direct", { cls: "flow-dot dot-direct", reverse: true });
    step("응답 도착 (새로고침하면 서비스 워커가 제어를 시작합니다)");
    return;
  }

  step("페이지가 fetch() 요청 → 서비스 워커가 가로챔 (fetch 이벤트)");
  await travel("#path-bs", { cls: "flow-dot dot-request" });
  if (!alive()) return;
  pulseNode(elements.nodeSW);

  const goNetwork = async () => {
    await travel("#path-sn", { cls: "flow-dot dot-request" });
    if (!alive()) return false;
    pulseNode(elements.nodeNetwork);
    return true;
  };
  const backFromNetwork = () => travel("#path-sn", { cls: "flow-dot dot-network", reverse: true });
  const goCache = async () => {
    await travel("#path-sc", { cls: "flow-dot dot-request" });
    if (!alive()) return false;
    pulseNode(elements.nodeCache);
    return true;
  };
  const backFromCache = () => travel("#path-sc", { cls: "flow-dot dot-cache", reverse: true });

  switch (source) {
    case "network":
    case "network-only": {
      step("서비스 워커가 네트워크로 전달");
      if (!(await goNetwork())) return;
      step("네트워크 응답 도착");
      await backFromNetwork();
      if (!alive()) return;
      if (source === "network") {
        step("응답 복사본을 캐시에 저장 (cache.put)");
        travel("#path-sc", { cls: "flow-dot dot-cache", r: 5 }).then(() => {
          if (alive()) pulseNode(elements.nodeCache);
        });
      } else {
        step("network-only 전략이라 캐시에는 저장하지 않음");
      }
      await travel("#path-bs", { cls: "flow-dot dot-network", reverse: true });
      step("페이지에 응답 전달 완료");
      break;
    }

    case "cache": {
      step("네트워크 대신 캐시부터 확인");
      if (!(await goCache())) return;
      step("캐시 적중 — 저장해 둔 응답 발견");
      await backFromCache();
      if (!alive()) return;
      await travel("#path-bs", { cls: "flow-dot dot-cache", reverse: true });
      step("네트워크 왕복 없이 응답 전달 완료");
      break;
    }

    case "cache-fallback": {
      step("네트워크 먼저 시도");
      if (!(await goNetwork())) return;
      flashFail(elements.failNetwork);
      step("네트워크 실패! (오프라인)");
      await wait(reducedMotion() ? 0 : 350);
      if (!alive()) return;
      step("캐시에서 이전 응답 검색");
      if (!(await goCache())) return;
      step("캐시 발견 — 이걸로 대체");
      await backFromCache();
      if (!alive()) return;
      await travel("#path-bs", { cls: "flow-dot dot-cache", reverse: true });
      step("오프라인인데도 페이지는 데이터를 받음");
      break;
    }

    case "generated-offline": {
      step("네트워크 먼저 시도");
      if (!(await goNetwork())) return;
      flashFail(elements.failNetwork);
      step("네트워크 실패!");
      await wait(reducedMotion() ? 0 : 300);
      if (!alive()) return;
      step("캐시 검색");
      if (!(await goCache())) return;
      flashFail(elements.failCache);
      step("캐시도 비어 있음!");
      await wait(reducedMotion() ? 0 : 300);
      if (!alive()) return;
      pulseNode(elements.nodeSW);
      step("서비스 워커가 new Response()로 응답을 직접 생성");
      await travel("#path-bs", { cls: "flow-dot dot-generated", reverse: true });
      step("즉석 생성 JSON 전달 완료");
      break;
    }

    case "stale-cache": {
      step("캐시부터 즉시 확인");
      if (!(await goCache())) return;
      step("캐시 적중 — 일단 이걸로 즉답");
      await backFromCache();
      if (!alive()) return;
      await travel("#path-bs", { cls: "flow-dot dot-cache", reverse: true });
      step("페이지는 이미 응답을 받음. 이제 백그라운드 갱신 시작");
      // 백그라운드 재검증: 화면 응답과 무관하게 뒤에서 진행
      (async () => {
        await travel("#path-sn", { cls: "flow-dot dot-bg" });
        if (!alive()) return;
        pulseNode(elements.nodeNetwork);
        await travel("#path-sn", { cls: "flow-dot dot-bg", reverse: true });
        if (!alive()) return;
        await travel("#path-sc", { cls: "flow-dot dot-bg", r: 5 });
        if (!alive()) return;
        pulseNode(elements.nodeCache);
        step("백그라운드 재검증 완료 — 캐시가 새 버전으로 교체됨");
      })();
      break;
    }

    default: {
      step(`응답 도착 (source: ${source})`);
      await travel("#path-bs", { cls: "flow-dot dot-network", reverse: true });
    }
  }
}

/* ------------------------------------------------------- status widgets */

function setControllerStatus() {
  const controlled = Boolean(navigator.serviceWorker?.controller);
  const dotClass = controlled ? "ok" : "warn";
  const label = controlled ? "SW Active" : "Not controlled";
  elements.controllerPill.innerHTML = `<span class="dot ${dotClass}"></span><span>${label}</span>`;
  setLifecycle("control", controlled);
}

function setRegistrationStatus(status, state = "-") {
  elements.registrationSignal.textContent = status;
  elements.registrationSignal.className = `signal ${status === "Registered" ? "ok" : "warn"}`;
  elements.stateValue.textContent = state;
}

const LIFECYCLE_KEYS = ["register", "install", "activate", "control"];

function setLifecycle(key, done, active = false) {
  const item = elements.lifecycleSteps.querySelector(`[data-k="${key}"]`);
  if (!item) return;
  item.classList.toggle("done", Boolean(done));
  item.classList.toggle("active", Boolean(active));
  if (done) {
    // 앞 단계는 자동으로 완료 처리
    const index = LIFECYCLE_KEYS.indexOf(key);
    LIFECYCLE_KEYS.slice(0, index).forEach((prev) => {
      const prevItem = elements.lifecycleSteps.querySelector(`[data-k="${prev}"]`);
      prevItem?.classList.add("done");
      prevItem?.classList.remove("active");
    });
  }
}

function applyWorkerState(state) {
  elements.stateValue.textContent = state;
  if (state === "installing") setLifecycle("install", false, true);
  if (state === "installed") setLifecycle("install", true);
  if (state === "activating") setLifecycle("activate", false, true);
  if (state === "activated") setLifecycle("activate", true);
}

function updateNetworkStatus() {
  const online = navigator.onLine;
  elements.navigatorOnline.textContent = online ? "online" : "offline";
  elements.onlineSignal.textContent = online ? "Online" : "Offline";
  elements.onlineSignal.className = `signal ${online ? "ok" : "bad"}`;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  elements.networkType.textContent = connection?.effectiveType ?? "unknown";

  const simulated = elements.offlineToggle.checked;
  elements.demoMode.textContent = simulated ? "simulated offline" : "network";
  elements.nodeNetwork.classList.toggle("sim-offline", simulated);
  // SVG 요소에는 .hidden 프로퍼티가 없어 attribute로 직접 토글
  elements.netOfflineBadge.toggleAttribute("hidden", !simulated);
  syncStrategyExplanation();
}

function syncStrategyCards() {
  elements.strategyOptions.forEach((option) => {
    const input = option.querySelector("input");
    option.classList.toggle("selected", input.checked);
  });
  syncStrategyExplanation();
}

/* ------------------------------------------------ service worker plumbing */

function trackWorker(worker) {
  if (!worker) return;
  applyWorkerState(worker.state);
  worker.addEventListener("statechange", () => {
    applyWorkerState(worker.state);
    addLog("Lifecycle", `worker state: ${worker.state}`);
  });
}

function showWaitingWorker(worker) {
  waitingWorker = worker;
  elements.activateSW.hidden = false;
  elements.waitingChip.hidden = false;
  elements.footerUpdate.textContent = "Update Ready: yes";
  addLog("Update", "새 서비스 워커가 waiting 상태로 대기 중입니다.");
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    setRegistrationStatus("Unsupported");
    addLog("Error", "이 브라우저는 서비스 워커를 지원하지 않습니다.");
    return;
  }

  try {
    registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    setRegistrationStatus("Registered", registration.active?.state ?? registration.installing?.state ?? "registered");
    setLifecycle("register", true);
    elements.scopeValue.textContent = registration.scope;
    trackWorker(registration.installing || registration.waiting || registration.active);

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      addLog("Install", "업데이트 발견 — 새 서비스 워커 설치 시작.");
      trackWorker(newWorker);
      newWorker?.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && registration.active && registration.waiting === newWorker) {
          showWaitingWorker(newWorker);
        }
      });
    });

    if (registration.waiting && registration.active && registration.waiting !== registration.active) {
      showWaitingWorker(registration.waiting);
    }
    addLog("Install", "navigator.serviceWorker.register('/sw.js') 완료.");
  } catch (error) {
    setRegistrationStatus("Failed");
    addLog("Error", error.message);
  } finally {
    setControllerStatus();
    await refreshCacheSnapshot();
  }
}

async function refreshCacheSnapshot() {
  if (!("caches" in window)) return;

  const cacheNames = await caches.keys();
  const groups = await Promise.all(
    cacheNames.map(async (name) => {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      return {
        name,
        urls: requests.map((request) => new URL(request.url).pathname + new URL(request.url).search)
      };
    })
  );

  const appEntries = groups
    .filter((group) => group.name.includes("app"))
    .reduce((sum, group) => sum + group.urls.length, 0);
  const runtimeEntries = groups
    .filter((group) => !group.name.includes("app"))
    .reduce((sum, group) => sum + group.urls.length, 0);

  elements.cacheCount.textContent = `${cacheNames.length} cache${cacheNames.length === 1 ? "" : "s"}`;
  elements.appCacheCount.textContent = `${appEntries} item${appEntries === 1 ? "" : "s"}`;
  elements.runtimeCacheCount.textContent = `${runtimeEntries} item${runtimeEntries === 1 ? "" : "s"}`;
  elements.cacheRefreshTime.textContent = formatTime();

  elements.cacheList.innerHTML =
    groups.length === 0
      ? `<p class="empty">Cache Storage가 비어 있습니다. 요청을 보내면 여기에 쌓입니다.</p>`
      : groups
          .map(
            (group) => `
              <article class="cache-group">
                <h3><span>${group.name}</span><span>${group.urls.length}</span></h3>
                <ul>${group.urls.map((url) => `<li title="${url}">${url}</li>`).join("")}</ul>
              </article>
            `
          )
          .join("");
}

async function loadServiceWorkerCode() {
  try {
    const response = await fetch("/sw.js", { cache: "no-store" });
    elements.swCode.textContent = await response.text();
  } catch (error) {
    elements.swCode.textContent = `Failed to load /sw.js\n${error.message}`;
  }
}

async function sendDemoRequest() {
  const url = new URL(elements.requestUrl.value, window.location.origin);
  url.searchParams.set("strategy", selectedStrategy());

  const headers = new Headers();
  if (elements.offlineToggle.checked) headers.set("x-sw-lab-offline", "1");

  const started = performance.now();
  addLog("Fetch", `GET ${url.pathname}?strategy=${selectedStrategy()}`);

  try {
    const response = await fetch(url, { headers });
    const elapsed = Math.round(performance.now() - started);
    const contentType = response.headers.get("content-type") || "";
    const rawSource = response.headers.get("x-sw-lab-source");
    const source = rawSource || "direct";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();

    renderResponse({
      ok: response.ok,
      status: response.status,
      source,
      strategy: selectedStrategy(),
      offline: elements.offlineToggle.checked,
      elapsed,
      body
    });
    playFlow(source);
    addLog("Fetch", `Response ${response.status} · source: ${source} · ${elapsed}ms`);
  } catch (error) {
    elements.responseMeta.hidden = true;
    elements.responseNote.hidden = true;
    elements.responseBox.textContent = `Request failed\n\n${error.stack || error.message}`;
    addLog("Error", error.message);
  } finally {
    await refreshCacheSnapshot();
  }
}

async function updateServiceWorker() {
  if (!registration) return;
  addLog("Update", "registration.update() 호출 — /sw.js를 다시 내려받아 비교합니다.");
  try {
    await registration.update();
  } catch (error) {
    addLog("Error", `update 실패: ${error.message}`);
  }
  registration.active?.postMessage({ type: "CHECK_VERSION" });
}

async function activateWaitingWorker() {
  if (!waitingWorker) return;
  addLog("Update", "waiting 워커에게 SKIP_WAITING 전송.");
  waitingWorker.postMessage({ type: "SKIP_WAITING" });
}

async function unregisterAndClear() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((item) => item.unregister()));
  await clearCaches();
  addLog("Lifecycle", "등록 해제 완료. 새로고침하면 서비스 워커 없는 원래 페이지로 돌아갑니다.");
  setRegistrationStatus("Unregistered");
  setControllerStatus();
}

async function clearCaches() {
  if (!("caches" in window)) return;
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  addLog("Cache", `캐시 버킷 ${cacheNames.length}개 삭제.`);
  await refreshCacheSnapshot();
}

function listenForServiceWorkerMessages() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data || {};
    if (data.type === "SW_LOG") {
      addLog(data.tag || "SW", data.message || "message");
      if (["Install", "Activate", "Cache"].includes(data.tag)) {
        refreshCacheSnapshot();
      }
    }
    if (data.type === "SW_VERSION") {
      elements.versionValue.textContent = data.version;
    }
    if (data.type === "NEW_VERSION") {
      elements.footerUpdate.textContent = `Update Ready: ${data.version}`;
      addLog("Update", `version.json이 ${data.version}(으)로 바뀌었습니다.`);
    }
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    setControllerStatus();
    elements.waitingChip.hidden = true;
    elements.activateSW.hidden = true;
    elements.footerTip.textContent = "새 서비스 워커가 컨트롤러가 되었습니다. 새로고침하면 최신 앱 셸을 읽습니다.";
    addLog("Activate", "controllerchange 발생 — 컨트롤러 교체됨.");
  });
}

function waitForController(timeoutMs = 1500) {
  if (navigator.serviceWorker?.controller) return Promise.resolve();

  return Promise.race([
    new Promise((resolve) => {
      navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
    }),
    wait(timeoutMs)
  ]);
}

/* ------------------------------------------------------------------ boot */

function bindEvents() {
  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  document.querySelectorAll('input[name="strategy"]').forEach((input) => {
    input.addEventListener("change", syncStrategyCards);
  });
  elements.offlineToggle.addEventListener("change", updateNetworkStatus);
  elements.sendRequest.addEventListener("click", sendDemoRequest);
  elements.requestUrl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") sendDemoRequest();
  });
  elements.refreshCache.addEventListener("click", refreshCacheSnapshot);
  elements.clearCaches.addEventListener("click", clearCaches);
  elements.clearLog.addEventListener("click", () => {
    elements.eventLog.innerHTML = "";
  });
  elements.reloadCode.addEventListener("click", loadServiceWorkerCode);
  elements.updateSW.addEventListener("click", updateServiceWorker);
  elements.activateSW.addEventListener("click", activateWaitingWorker);
  elements.unregisterSW.addEventListener("click", unregisterAndClear);
}

async function boot() {
  bindEvents();
  listenForServiceWorkerMessages();
  updateNetworkStatus();
  syncStrategyCards();
  setControllerStatus();
  await loadServiceWorkerCode();
  await registerServiceWorker();
  if ("serviceWorker" in navigator) {
    await navigator.serviceWorker.ready;
    await waitForController();
    setControllerStatus();
    navigator.serviceWorker.controller?.postMessage({ type: "GET_VERSION" });
  }
}

boot();
