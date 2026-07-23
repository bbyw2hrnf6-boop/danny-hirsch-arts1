import { writeFile } from 'node:fs/promises';

const port = process.env.CDP_PORT || '9223';
const base = process.env.AUDIT_URL || 'http://127.0.0.1:8123/';
const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
const target = targets.find((entry) => entry.type === 'page');
if (!target) throw new Error('No browser page target');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let id = 0;
const pending = new Map();
const browserIssues = [];
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const task = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) task.reject(new Error(message.error.message));
    else task.resolve(message.result || {});
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') {
    browserIssues.push(message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text);
  }
  if (message.method === 'Log.entryAdded' && ['warning', 'error'].includes(message.params.entry?.level)) {
    browserIssues.push(`${message.params.entry.level}: ${message.params.entry.text}`);
  }
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const callId = ++id;
  pending.set(callId, { resolve, reject });
  socket.send(JSON.stringify({ id: callId, method, params }));
});
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (expression) => {
  const response = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);
  return response.result?.value;
};
const viewport = (width, height, mobile = false) => send('Emulation.setDeviceMetricsOverride', {
  width, height, deviceScaleFactor: 1, mobile, screenWidth: width, screenHeight: height
});
const waitFor = async (expression, timeout = 25000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return true;
    await pause(200);
  }
  return false;
};
const capture = async (path) => {
  const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  await writeFile(path, Buffer.from(result.data, 'base64'));
};
const state = () => evaluate(`(() => {
  const dialog = document.querySelector('[data-room-experience]');
  const controller = document.querySelector('[data-gallery-webgl]')?.__galleryController;
  return {
    ready: dialog?.classList.contains('is-webgl-ready'),
    demo: dialog?.classList.contains('is-demo-mode'),
    theme: document.body.dataset.theme,
    controller: controller?.getState?.(),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    panelHidden: document.querySelector('[data-gallery-site-panel]')?.hidden
  };
})()`);

await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Page.bringToFront');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });

const report = {};
await viewport(1440, 1000);
await send('Page.navigate', { url: new URL(`?audit=demo-rooms-${Date.now()}#installation`, base).href });
await pause(950);
await evaluate("Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); true");
await evaluate("if (document.body.dataset.theme === 'light') document.querySelector('.theme-toggle').click(); true");
await evaluate("document.querySelector('[data-room-enter]').click(); true");
report.loaded = await waitFor("document.querySelector('[data-room-experience]').classList.contains('is-webgl-ready')");
await pause(700);
await evaluate("document.querySelector('[data-room-demo]').click(); true");
await pause(500);

for (const room of ['gallery-hall', 'private-room', 'contact-room']) {
  await evaluate(`document.querySelector('[data-gallery-webgl]').__galleryController.goToDemoRoom('${room}'); true`);
  await pause(650);
  report[`desktop-${room}`] = await state();
  await capture(`/tmp/dha-demo-${room}.png`);
}

await evaluate("document.querySelector('[data-room-theme]').click(); true");
await pause(700);
await evaluate("document.querySelector('[data-gallery-webgl]').__galleryController.goToDemoRoom('private-room'); true");
await pause(450);
report.desktopLightPrivate = await state();
await capture('/tmp/dha-demo-private-room-light.png');

await viewport(390, 844, true);
await evaluate("document.querySelector('[data-room-theme]').click(); true");
await pause(500);
await evaluate("document.querySelector('[data-gallery-webgl]').__galleryController.goToDemoRoom('contact-room'); true");
await pause(500);
report.mobileContact = await state();
await capture('/tmp/dha-demo-contact-room-mobile.png');

report.browserIssues = browserIssues;
console.log(JSON.stringify(report, null, 2));
socket.close();
