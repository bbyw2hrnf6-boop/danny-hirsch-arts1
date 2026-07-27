import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const port = process.env.CDP_PORT || "9223";
const base = process.env.AUDIT_URL || "http://127.0.0.1:8000/";
const outputDirectory = process.env.AUDIT_OUTPUT_DIR || "/tmp";
await mkdir(outputDirectory, { recursive: true });

const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
const target = targets.find((entry) => entry.type === "page");
if (!target) throw new Error("No Chrome page target is available.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 0;
const pending = new Map();
const browserIssues = [];
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const task = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) task.reject(new Error(message.error.message));
    else task.resolve(message.result || {});
    return;
  }
  if (message.method === "Runtime.exceptionThrown") {
    browserIssues.push(message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text);
  }
  if (message.method === "Log.entryAdded" && ["warning", "error"].includes(message.params.entry?.level)) {
    browserIssues.push(`${message.params.entry.level}: ${message.params.entry.text}`);
  }
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (expression) => {
  const response = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  return response.result?.value;
};
const waitFor = async (expression, timeout = 30000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return true;
    await pause(160);
  }
  return false;
};
const viewport = (width, height, mobile = false) => send("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: 1,
  mobile,
  screenWidth: width,
  screenHeight: height,
});
const capture = async (filename) => {
  const result = await send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(join(outputDirectory, filename), Buffer.from(result.data, "base64"));
};
const loadingState = () => evaluate(`(() => {
  const dialog = document.querySelector('[data-room-experience]');
  const loader = document.querySelector('[data-gallery-loading]');
  const bar = document.querySelector('[data-gallery-progress]');
  const percent = document.querySelector('[data-gallery-loading-percent]');
  const lounge = document.querySelector('[data-gallery-ambient]');
  const rect = loader?.getBoundingClientRect();
  return {
    dialogOpen: Boolean(dialog?.open),
    busy: dialog?.getAttribute('aria-busy'),
    ready: dialog?.classList.contains('is-webgl-ready'),
    loading: dialog?.classList.contains('is-gallery-loading'),
    loaderHidden: loader?.hidden,
    loaderState: loader?.dataset.state,
    percentText: percent?.textContent,
    percentValue: Number.parseInt(percent?.textContent || '', 10),
    ariaValue: bar?.getAttribute('aria-valuenow'),
    ariaText: bar?.getAttribute('aria-valuetext'),
    detail: document.querySelector('[data-gallery-loading-detail]')?.textContent,
    inViewport: Boolean(rect && rect.left >= -1 && rect.top >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1),
    loungePressed: lounge?.getAttribute('aria-pressed'),
    loungeLabel: document.querySelector('[data-gallery-ambient-label]')?.textContent,
    loungeApi: window.DHAGalleryLounge ? {
      version: window.DHAGalleryLounge.version,
      provenance: window.DHAGalleryLounge.provenance,
    } : null,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };
})()`);

await send("Page.enable");
await send("Runtime.enable");
await send("Log.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Network.clearBrowserCache");
await send("Page.bringToFront");
await send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
});

const throttle = () => send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 90,
  downloadThroughput: 950000,
  uploadThroughput: 500000,
  connectionType: "wifi",
});
const unthrottle = () => send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 0,
  downloadThroughput: -1,
  uploadThroughput: -1,
  connectionType: "wifi",
});

const report = {};
await viewport(1365, 900);
await throttle();
await send("Page.navigate", { url: new URL(`?view=3d&intro=0&audit=loading-desktop-${Date.now()}`, base).href });
report.desktopProgressSeen = await waitFor(`(() => {
  const value = Number.parseInt(document.querySelector('[data-gallery-loading-percent]')?.textContent || '', 10);
  return document.querySelector('[data-room-experience]')?.open && value >= 8 && value <= 92;
})()`);
report.desktopLoading = await loadingState();
await capture("dha-gallery-loader-desktop.png");
await unthrottle();
report.desktopReady = await waitFor("document.querySelector('[data-room-experience]')?.classList.contains('is-webgl-ready')", 30000);
await pause(800);
report.beforeAudio = await loadingState();
await evaluate("document.querySelector('[data-gallery-ambient]')?.click(); true");
await pause(300);
report.audioOn = await loadingState();
await evaluate("document.querySelector('[data-gallery-ambient]')?.click(); true");
await pause(620);
report.audioOff = await loadingState();

await viewport(390, 844, true);
await send("Network.clearBrowserCache");
await throttle();
await send("Page.navigate", { url: new URL(`?view=3d&intro=0&audit=loading-mobile-${Date.now()}`, base).href });
report.mobileProgressSeen = await waitFor(`(() => {
  const value = Number.parseInt(document.querySelector('[data-gallery-loading-percent]')?.textContent || '', 10);
  return document.querySelector('[data-room-experience]')?.open && value >= 8 && value <= 92;
})()`);
report.mobileLoading = await loadingState();
await capture("dha-gallery-loader-mobile.png");
await unthrottle();
report.mobileReady = await waitFor("document.querySelector('[data-room-experience]')?.classList.contains('is-webgl-ready')", 30000);
report.mobileFinal = await loadingState();
report.browserIssues = browserIssues;

console.log(JSON.stringify(report, null, 2));
socket.close();
