"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshIcon, TrashIcon } from "@/components/icons";

type Strategy = "network-first" | "cache-first" | "stale-while-revalidate" | "network-only";
type LogEntry = { id: number; time: string; tag: string; message: string };
type CacheGroup = { name: string; urls: string[] };
type DemoResponse = {
  status: number;
  source: string;
  elapsed: number;
  body: unknown;
};

const SW_PATH = "/service-worker/sw.js";
const SW_SCOPE = "/service-worker/";
const DATA_PATH = "/service-worker/data/requests.json";
const CACHE_PREFIX = "knowledge-sw-lab-";

const strategyInfo: Record<Strategy, {
  name: string;
  summary: string;
  route: string;
  best: string;
  watch: string;
}> = {
  "network-first": {
    name: "Network First",
    summary: "최신 응답을 먼저 시도하고 연결이 실패할 때 저장된 응답으로 전환합니다.",
    route: "Browser → Worker → Network → Cache 저장",
    best: "뉴스 피드나 목록 API처럼 최신성과 오프라인 대비가 모두 필요할 때",
    watch: "첫 요청에 성공해 캐시가 생기기 전에는 오프라인 대체 데이터가 없습니다."
  },
  "cache-first": {
    name: "Cache First",
    summary: "저장된 응답이 있으면 네트워크 왕복 없이 즉시 반환합니다.",
    route: "Browser → Worker → Cache, miss일 때 Network",
    best: "폰트, 로고, 라이브러리처럼 자주 바뀌지 않는 정적 리소스",
    watch: "갱신 규칙이나 버전 키가 없으면 오래된 파일이 계속 보일 수 있습니다."
  },
  "stale-while-revalidate": {
    name: "Stale While Revalidate",
    summary: "캐시로 먼저 화면을 채우고 기다리지 않는 동안 뒤에서 새 응답으로 교체합니다.",
    route: "Cache → Browser 즉시 + Network → Cache 갱신",
    best: "속도가 우선이고 잠깐 오래된 값도 허용되는 아바타, 설정, 피드",
    watch: "이번 요청에는 이전 값이 보이고 갱신된 값은 다음 요청부터 사용됩니다."
  },
  "network-only": {
    name: "Network Only",
    summary: "캐시를 읽지도 쓰지도 않고 매번 원격 응답만 기다립니다.",
    route: "Browser → Worker → Network → Browser",
    best: "결제, 실시간 시세, 로그처럼 저장된 응답을 쓰면 안 되는 요청",
    watch: "연결이 끊기면 대체 경로 없이 요청이 그대로 실패합니다."
  }
};

function formatTime() {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    hour12: false
  }).format(new Date());
}

function RequestFlow({ source, run, strategy }: { source: string; run: number; strategy: Strategy }) {
  const animationGroupRef = useRef<SVGGElement>(null);
  const requestFailed = source === "network-error";
  const cacheBeforeNetwork = requestFailed && strategy === "cache-first";
  const goesNetwork = requestFailed || ["network", "network-only", "cache-fallback", "generated-offline", "stale-cache"].includes(source);
  const goesCache = cacheBeforeNetwork || ["network", "cache", "cache-fallback", "generated-offline", "stale-cache"].includes(source);
  const networkFailed = requestFailed || ["cache-fallback", "generated-offline"].includes(source);
  const cacheFailed = source === "generated-offline" || cacheBeforeNetwork;
  const requestMotionId = `flow-request-motion-${run}`;
  const networkMotionId = `flow-network-motion-${run}`;
  const cacheMotionId = `flow-cache-motion-${run}`;
  const networkFailDelay = cacheBeforeNetwork ? "2.54s" : "1.62s";
  const cacheFailDelay = cacheBeforeNetwork ? "1.62s" : "2.54s";

  useEffect(() => {
    if (run === 0) return;
    const group = animationGroupRef.current;
    if (!group) return;

    const motions = Array.from(group.querySelectorAll<SVGAnimationElement>("animateMotion"));
    const byId = (id: string) => motions.find((motion) => motion.id === id) ?? null;

    const revealPacket = (event: Event) => {
      (event.currentTarget as SVGAnimationElement).parentElement?.setAttribute("opacity", "1");
    };
    motions.forEach((motion) => motion.addEventListener("beginEvent", revealPacket));

    // 패킷이 지나갈 순서를 명시적으로 세운다. SMIL의 begin="A.end" 동기화 체인은
    // Blink에서 3단(요청→네트워크→캐시)처럼 syncbase가 다시 syncbase에 물리면
    // 마지막 단계가 발화되지 않는 경우가 있어, endEvent를 받아 JS로 직접 이어준다.
    const order = [requestMotionId];
    if (cacheBeforeNetwork) {
      if (goesCache) order.push(cacheMotionId);
      if (goesNetwork) order.push(networkMotionId);
    } else {
      if (goesNetwork) order.push(networkMotionId);
      if (goesCache) order.push(cacheMotionId);
    }
    const steps = order
      .map(byId)
      .filter((motion): motion is SVGAnimationElement => Boolean(motion));

    const timers: number[] = [];
    const chained: Array<{ el: SVGAnimationElement; handler: () => void }> = [];
    for (let index = 0; index < steps.length - 1; index += 1) {
      const current = steps[index];
      const next = steps[index + 1];
      const handler = () => {
        timers.push(window.setTimeout(() => next.beginElement(), 120));
      };
      current.addEventListener("endEvent", handler);
      chained.push({ el: current, handler });
    }

    const frame = window.requestAnimationFrame(() => steps[0]?.beginElement());

    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      motions.forEach((motion) => motion.removeEventListener("beginEvent", revealPacket));
      chained.forEach(({ el, handler }) => el.removeEventListener("endEvent", handler));
    };
  }, [run, source, cacheBeforeNetwork, goesCache, goesNetwork, requestMotionId, networkMotionId, cacheMotionId]);

  return (
    <div className="flow-map-wrap">
      <svg className="request-flow" viewBox="0 0 760 330" role="img" aria-label="브라우저 요청이 서비스 워커를 거쳐 네트워크 또는 캐시로 이동하는 다이어그램">
        <defs>
          <marker id="flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0 10 5 0 10Z" />
          </marker>
        </defs>
        <path id="flow-bw" className="flow-track active" d="M178 168H298" />
        <path id="flow-wn" className={`flow-track${goesNetwork ? " active network-path" : ""}`} d="M454 140C526 120 564 89 626 76" />
        <path id="flow-wc" className={`flow-track${goesCache ? " active cache-path" : ""}`} d="M454 196C526 214 564 240 626 254" />

        <g className="flow-node" transform="translate(58 118)">
          <rect width="120" height="100" rx="14" />
          <path d="M0 30h120M20 16h1M35 16h1M50 16h1" />
          <text x="60" y="128">Browser</text>
        </g>
        <g className="flow-node worker-node" transform="translate(298 108)">
          <rect width="158" height="120" rx="25" />
          <path d="m79 23 31 18v37L79 96 48 78V41l31-18Z" />
          <path d="m79 42 15 8v18l-15 9-15-9V50l15-8Z" />
          <text x="79" y="148">Service Worker</text>
        </g>
        <g className="flow-node" transform="translate(626 34)">
          <circle cx="50" cy="42" r="42" />
          <path d="M8 42h84M50 0c21 22 21 62 0 84M50 0C29 22 29 62 50 84" />
          <text x="50" y="112">Network</text>
        </g>
        <g className="flow-node" transform="translate(626 224)">
          <ellipse cx="50" cy="20" rx="43" ry="17" />
          <path d="M7 20v62c0 21 86 21 86 0V20M7 51c0 21 86 21 86 0" />
          <text x="50" y="113">Cache</text>
        </g>

        {run > 0 && (
          <g key={run} ref={animationGroupRef}>
            <circle className="flow-packet packet-request" r="7" opacity="0">
              <animateMotion id={requestMotionId} begin="indefinite" dur=".7s" fill="freeze"><mpath href="#flow-bw" /></animateMotion>
            </circle>
            {goesNetwork && (
              <circle className="flow-packet packet-network" r="7" opacity="0">
                <animateMotion id={networkMotionId} begin="indefinite" dur=".8s" fill="freeze"><mpath href="#flow-wn" /></animateMotion>
              </circle>
            )}
            {goesCache && (
              <circle className="flow-packet packet-cache" r="7" opacity="0">
                <animateMotion id={cacheMotionId} begin="indefinite" dur=".8s" fill="freeze"><mpath href="#flow-wc" /></animateMotion>
              </circle>
            )}
          </g>
        )}

        {networkFailed && (
          <g transform="translate(603 84)">
            <g className="fail-mark" style={{ animationDelay: networkFailDelay }}><circle r="14" /><path d="m-5-5 10 10M5-5-5 5" /></g>
          </g>
        )}
        {cacheFailed && (
          <g transform="translate(603 246)">
            <g className="fail-mark" style={{ animationDelay: cacheFailDelay }}><circle r="14" /><path d="m-5-5 10 10M5-5-5 5" /></g>
          </g>
        )}
      </svg>
      <p>{run === 0 ? "전략을 고르고 요청을 보내면 실제 응답 경로가 표시됩니다." : source === "cache-fallback" ? "네트워크 실패 후 저장된 캐시 응답으로 전환했습니다." : source === "stale-cache" ? "캐시로 즉시 응답하고 네트워크에서 백그라운드 갱신을 시작했습니다." : source === "generated-offline" ? "네트워크와 캐시가 모두 없어 서비스 워커가 응답을 직접 만들었습니다." : source === "network-error" ? "네트워크 요청이 실패해 응답을 가져오지 못했습니다." : `응답 출처: ${source}`}</p>
    </div>
  );
}

export function ServiceWorkerLab() {
  const [strategy, setStrategy] = useState<Strategy>("network-first");
  const [offline, setOffline] = useState(false);
  const [online, setOnline] = useState(true);
  const [requestUrl, setRequestUrl] = useState(DATA_PATH);
  const [registrationState, setRegistrationState] = useState("checking");
  const [scope, setScope] = useState("-");
  const [version, setVersion] = useState("-");
  const [controlled, setControlled] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cacheGroups, setCacheGroups] = useState<CacheGroup[]>([]);
  const [cacheRefreshedAt, setCacheRefreshedAt] = useState("-");
  const [swCode, setSwCode] = useState("Loading service-worker/sw.js...");
  const [response, setResponse] = useState<DemoResponse | null>(null);
  const [responseError, setResponseError] = useState("");
  const [sending, setSending] = useState(false);
  const [flowSource, setFlowSource] = useState("idle");
  const [flowRun, setFlowRun] = useState(0);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const waitingRef = useRef<ServiceWorker | null>(null);
  const logId = useRef(0);

  const addLog = useCallback((tag: string, message: string) => {
    const item = { id: ++logId.current, time: formatTime(), tag, message };
    setLogs((current) => [item, ...current].slice(0, 60));
  }, []);

  const refreshCaches = useCallback(async () => {
    if (!("caches" in window)) return;
    const names = (await caches.keys()).filter((name) => name.startsWith(CACHE_PREFIX));
    const groups = await Promise.all(names.map(async (name) => {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      return { name, urls: requests.map((request) => {
        const url = new URL(request.url);
        return `${url.pathname}${url.search}`;
      }) };
    }));
    setCacheGroups(groups);
    setCacheRefreshedAt(formatTime());
  }, []);

  useEffect(() => {
    let disposed = false;

    const syncConnection = () => setOnline(navigator.onLine);
    const syncController = () => {
      setControlled(Boolean(navigator.serviceWorker?.controller));
      addLog("Activate", "controllerchange — 새 서비스 워커가 이 탭을 제어합니다.");
    };
    const onMessage = (event: MessageEvent) => {
      const data = event.data || {};
      if (data.type === "SW_LOG") {
        addLog(data.tag || "SW", data.message || "message");
        if (["Install", "Activate", "Cache"].includes(data.tag)) void refreshCaches();
      }
      if (data.type === "SW_VERSION") setVersion(data.version);
      if (data.type === "NEW_VERSION") addLog("Update", `새 앱 버전 ${data.version}을 미리 캐시했습니다.`);
    };

    window.addEventListener("online", syncConnection);
    window.addEventListener("offline", syncConnection);

    async function boot() {
      try {
        const codeResponse = await fetch(SW_PATH, { cache: "no-store" });
        setSwCode(await codeResponse.text());
        setOnline(navigator.onLine);
      } catch (error) {
        setSwCode(`Failed to load ${SW_PATH}\n${error instanceof Error ? error.message : String(error)}`);
      }

      if (!("serviceWorker" in navigator)) {
        setRegistrationState("unsupported");
        addLog("Error", "이 브라우저는 서비스 워커를 지원하지 않습니다.");
        return;
      }

      navigator.serviceWorker.addEventListener("message", onMessage);
      navigator.serviceWorker.addEventListener("controllerchange", syncController);

      try {
        const registration = await navigator.serviceWorker.register(SW_PATH, { scope: SW_SCOPE });
        if (disposed) return;
        registrationRef.current = registration;
        setScope(registration.scope);
        setRegistrationState(registration.active?.state ?? registration.installing?.state ?? "registered");
        setControlled(Boolean(navigator.serviceWorker.controller));
        addLog("Install", `register('${SW_PATH}', { scope: '${SW_SCOPE}' }) 완료.`);

        const track = (worker: ServiceWorker | null) => {
          if (!worker) return;
          setRegistrationState(worker.state);
          worker.addEventListener("statechange", () => {
            setRegistrationState(worker.state);
            addLog("Lifecycle", `worker state: ${worker.state}`);
          });
        };

        track(registration.installing || registration.waiting || registration.active);
        if (registration.waiting) {
          waitingRef.current = registration.waiting;
          setWaiting(true);
        }
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          addLog("Install", "업데이트 발견 — 새 워커 설치를 시작합니다.");
          track(worker);
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && registration.waiting) {
              waitingRef.current = registration.waiting;
              setWaiting(true);
            }
          });
        });

        await navigator.serviceWorker.ready;
        navigator.serviceWorker.controller?.postMessage({ type: "GET_VERSION" });
        await refreshCaches();
      } catch (error) {
        setRegistrationState("failed");
        addLog("Error", error instanceof Error ? error.message : String(error));
      }
    }

    void boot();
    return () => {
      disposed = true;
      window.removeEventListener("online", syncConnection);
      window.removeEventListener("offline", syncConnection);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", onMessage);
        navigator.serviceWorker.removeEventListener("controllerchange", syncController);
      }
    };
  }, [addLog, refreshCaches]);

  async function sendRequest() {
    setSending(true);
    setResponseError("");
    const url = new URL(requestUrl, window.location.origin);
    url.searchParams.set("strategy", strategy);
    const headers = new Headers();
    if (offline) headers.set("x-sw-lab-offline", "1");
    const started = performance.now();
    addLog("Fetch", `GET ${url.pathname}?strategy=${strategy}`);

    try {
      const result = await fetch(url, { headers });
      const elapsed = Math.round(performance.now() - started);
      const source = result.headers.get("x-sw-lab-source") || "direct";
      const contentType = result.headers.get("content-type") || "";
      const body = contentType.includes("application/json") ? await result.json() : await result.text();
      setResponse({ status: result.status, source, elapsed, body });
      setFlowSource(source);
      setFlowRun((current) => current + 1);
      addLog("Fetch", `Response ${result.status} · source: ${source} · ${elapsed}ms`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setResponse(null);
      setResponseError(message);
      setFlowSource("network-error");
      setFlowRun((current) => current + 1);
      addLog("Error", message);
    } finally {
      setSending(false);
      await refreshCaches();
    }
  }

  async function clearCaches() {
    const names = (await caches.keys()).filter((name) => name.startsWith(CACHE_PREFIX));
    await Promise.all(names.map((name) => caches.delete(name)));
    addLog("Cache", `실험용 캐시 ${names.length}개를 삭제했습니다.`);
    await refreshCaches();
  }

  async function unregister() {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const labRegistrations = registrations.filter((item) => item.scope.includes(SW_SCOPE));
    await Promise.all(labRegistrations.map((item) => item.unregister()));
    await clearCaches();
    registrationRef.current = null;
    setRegistrationState("unregistered");
    setControlled(false);
    addLog("Lifecycle", "실험용 서비스 워커 등록을 해제했습니다. 새로고침하면 다시 등록됩니다.");
  }

  async function updateWorker() {
    if (!registrationRef.current) return;
    addLog("Update", "registration.update()로 sw.js 변경을 확인합니다.");
    await registrationRef.current.update();
    registrationRef.current.active?.postMessage({ type: "CHECK_VERSION" });
  }

  function activateWaiting() {
    waitingRef.current?.postMessage({ type: "SKIP_WAITING" });
    setWaiting(false);
    addLog("Update", "waiting 워커에게 SKIP_WAITING을 보냈습니다.");
  }

  const info = strategyInfo[strategy];
  const appEntries = cacheGroups.filter((group) => group.name.includes("app")).reduce((sum, group) => sum + group.urls.length, 0);
  const runtimeEntries = cacheGroups.filter((group) => !group.name.includes("app")).reduce((sum, group) => sum + group.urls.length, 0);
  const lifecycleStates = ["register", "installed", "activated", "controlled"];
  const currentLifecycle = registrationState === "installing" ? 1 : registrationState === "installed" ? 2 : registrationState === "activating" ? 2 : registrationState === "activated" ? (controlled ? 4 : 3) : registrationState === "checking" ? 0 : 1;

  return (
    <section className="worker-lab-shell" id="playground" aria-labelledby="worker-lab-title">
      <div className="worker-lab content-wrap">
        <header className="worker-lab-header">
          <div>
            <p className="eyebrow">LIVE SERVICE WORKER</p>
            <h2 id="worker-lab-title">요청 실험실</h2>
            <p>이 화면은 시뮬레이션이 아니라, 현재 브라우저에 등록된 서비스 워커와 Cache Storage를 직접 읽습니다.</p>
          </div>
          <div className="worker-actions">
            {waiting && <button className="button button-primary" type="button" onClick={activateWaiting}>새 버전 활성화</button>}
            <button className="button" type="button" onClick={updateWorker}><RefreshIcon />업데이트 확인</button>
            <button className="button button-danger" type="button" onClick={unregister}><TrashIcon />등록 해제</button>
          </div>
        </header>

        <section className="worker-status" aria-label="서비스 워커 현재 상태">
          <article>
            <p>REGISTRATION</p>
            <strong>{registrationState}</strong>
            <ol aria-label="서비스 워커 생명주기">
              {lifecycleStates.map((state, index) => <li className={currentLifecycle > index ? "done" : currentLifecycle === index ? "current" : ""} key={state}>{state}</li>)}
            </ol>
            <dl><div><dt>Scope</dt><dd title={scope}>{scope}</dd></div><div><dt>Version</dt><dd>{version}</dd></div></dl>
          </article>
          <article>
            <p>NETWORK</p>
            <strong className={online ? "status-good" : "status-bad"}>{online ? "online" : "offline"}</strong>
            <label className="offline-switch">
              <input checked={offline} type="checkbox" onChange={(event) => setOffline(event.target.checked)} />
              <span><i /> API 요청만 오프라인처럼 처리</span>
            </label>
            <small>실제 연결은 유지하고 x-sw-lab-offline 헤더로 실패를 재현합니다.</small>
          </article>
          <article>
            <p>CACHE STORAGE</p>
            <strong>{cacheGroups.length} buckets</strong>
            <dl><div><dt>App shell</dt><dd>{appEntries} entries</dd></div><div><dt>Runtime / API</dt><dd>{runtimeEntries} entries</dd></div><div><dt>Refreshed</dt><dd>{cacheRefreshedAt}</dd></div></dl>
            <button type="button" onClick={refreshCaches}>목록 새로고침</button>
          </article>
        </section>

        <div className="worker-workspace">
          <section className="request-playground">
            <p className="playground-label">STEP 1 · 캐시 전략 선택</p>
            <div className="strategy-tabs" role="radiogroup" aria-label="캐시 전략">
              {(Object.keys(strategyInfo) as Strategy[]).map((key) => (
                <label className={strategy === key ? "selected" : ""} key={key}>
                  <input checked={strategy === key} name="strategy" type="radio" value={key} onChange={() => {
                    setStrategy(key);
                    setFlowSource("idle");
                    setFlowRun(0);
                    setResponse(null);
                    setResponseError("");
                  }} />
                  <span>{strategyInfo[key].name}</span>
                </label>
              ))}
            </div>

            <aside className="strategy-summary" aria-live="polite">
              <div><p className="eyebrow">선택 해설</p><h3>{info.name}</h3><p>{info.summary}</p></div>
              <dl><div><dt>요청 경로</dt><dd>{info.route}</dd></div><div><dt>잘 맞는 상황</dt><dd>{info.best}</dd></div><div><dt>확인할 점</dt><dd>{offline ? `현재 오프라인 실험 중. ${info.watch}` : info.watch}</dd></div></dl>
            </aside>

            <p className="playground-label playground-label-step">STEP 2 · 요청 보내고 경로 확인</p>
            <div className="request-bar">
              <label>TEST URL<input value={requestUrl} onChange={(event) => setRequestUrl(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void sendRequest(); }} /></label>
              <button className="button button-primary" disabled={sending} type="button" onClick={sendRequest}>{sending ? "요청 중…" : "Send Request"}</button>
            </div>

            <RequestFlow source={flowSource} run={flowRun} strategy={strategy} />

            <div className="response-view" aria-live="polite">
              {response ? (
                <>
                  <div><strong className={`source-${response.source}`}>{response.source}</strong><span>HTTP {response.status}</span><span>{response.elapsed}ms</span></div>
                  <pre><code>{JSON.stringify(response.body, null, 2)}</code></pre>
                </>
              ) : (
                <pre><code>{responseError ? `Request failed\n\n${responseError}` : "응답의 원본 JSON이 여기에 표시됩니다. source가 핵심입니다."}</code></pre>
              )}
            </div>
          </section>

          <aside className="worker-inspector">
            <section>
              <header><div><p className="eyebrow">EVENT STREAM</p><h3>Event Log</h3></div><button type="button" onClick={() => setLogs([])}>Clear</button></header>
              <ol className="event-log">
                {logs.length ? logs.map((log) => <li key={log.id}><time>{log.time}</time><strong className={`log-${log.tag.toLowerCase()}`}>{log.tag}</strong><span>{log.message}</span></li>) : <li className="empty-log">서비스 워커 이벤트가 여기에 쌓입니다.</li>}
              </ol>
            </section>
            <section>
              <header><div><p className="eyebrow">CACHE API</p><h3>Cache Snapshot</h3></div><button type="button" onClick={clearCaches}>Clear</button></header>
              <div className="cache-snapshot">
                {cacheGroups.length ? cacheGroups.map((group) => <article key={group.name}><h4><span>{group.name}</span><b>{group.urls.length}</b></h4><ul>{group.urls.map((url) => <li key={url} title={url}>{url}</li>)}</ul></article>) : <p>Cache Storage가 비어 있습니다.</p>}
              </div>
            </section>
            <details className="sw-code-panel">
              <summary><span><small>RUNNING SOURCE</small>service-worker/sw.js</span><b>코드 열기</b></summary>
              <pre><code>{swCode}</code></pre>
            </details>
          </aside>
        </div>
      </div>
    </section>
  );
}
