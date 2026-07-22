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
    browserIssues.push(`exception: ${message.params.exceptionDetails?.exception?.description || message.params.exceptionDetails?.text}`);
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
  width,
  height,
  deviceScaleFactor: 1,
  mobile,
  screenWidth: width,
  screenHeight: height
});
const navigate = async (path, delay = 900) => {
  await send('Page.navigate', { url: new URL(path, base).href });
  await pause(delay);
  await evaluate('document.fonts.ready.then(() => true)');
};
const waitFor = async (expression, timeout = 20000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(expression)) return true;
    await pause(200);
  }
  return false;
};
const capture = async (path) => {
  const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  await writeFile(path, Buffer.from(result.data, 'base64'));
};
const roomState = () => evaluate(`(() => {
  const dialog = document.querySelector('[data-room-experience]');
  const canvas = dialog?.querySelector('canvas');
  const title = document.querySelector('[data-gallery-art-title]');
  return {
    open: dialog?.open,
    ready: dialog?.classList.contains('is-webgl-ready'),
    fallback: dialog?.classList.contains('is-gallery-fallback'),
    theme: document.body.dataset.theme,
    canvas: canvas ? [canvas.width, canvas.height, canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height] : null,
    controller: document.querySelector('[data-gallery-webgl]')?.__galleryController?.getState?.() || null,
    controlsHidden: document.querySelector('[data-gallery-controls]')?.hidden,
    fallbackControlsHidden: document.querySelector('[data-room-fallback-controls]')?.hidden,
    artworkLabel: title?.textContent,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    outsideText: [...dialog.querySelectorAll('h2,p,strong,button')].filter((element) => {
      if (element.offsetParent === null) return false;
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1 || rect.bottom > innerHeight + 1;
    }).map((element) => element.textContent.trim().replace(/\s+/g, ' '))
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
await navigate(`?audit=gallery-desktop-${Date.now()}#installation`);
// Headless Chrome marks background inspection targets as hidden; force the
// foreground state so the same requestAnimationFrame movement loop is tested.
await evaluate("Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); true");
await evaluate("if (document.body.dataset.theme === 'light') document.querySelector('.theme-toggle').click(); true");
await evaluate("document.querySelector('[data-room-enter]').click(); true");
report.desktopLoaded = await waitFor("document.querySelector('[data-room-experience]').classList.contains('is-webgl-ready')");
await pause(700);
report.desktopDark = await roomState();
await capture('/tmp/dha-gallery-desktop-dark.png');
if (process.env.AUDIT_FAST === '1') {
  console.log(JSON.stringify({ desktopLoaded: report.desktopLoaded, desktopDark: report.desktopDark, browserIssues }, null, 2));
  socket.close();
  process.exit(0);
}

await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 760, y: 470, button: 'left', clickCount: 1 });
for (const x of [700, 630, 560, 500]) {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y: 455, button: 'left', buttons: 1 });
}
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 500, y: 455, button: 'left', clickCount: 1 });
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'w', code: 'KeyW' });
await pause(650);
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'w', code: 'KeyW' });
await pause(300);
await evaluate("document.querySelector('[data-gallery-webgl]').__galleryController.setActive(true); true");
await capture('/tmp/dha-gallery-desktop-moved.png');

await evaluate("document.querySelector('[data-room-theme]').click(); true");
await pause(900);
report.desktopLight = await roomState();
await capture('/tmp/dha-gallery-desktop-light.png');
await evaluate("document.querySelector('[data-gallery-view-next]').click(); true");
await pause(500);
await evaluate("document.querySelector('[data-gallery-webgl]').__galleryController.setActive(true); true");
report.desktopCurated = await roomState();
await capture('/tmp/dha-gallery-desktop-curated.png');
await evaluate("document.querySelector('[data-room-close]').click(); true");

await viewport(390, 844, true);
await navigate(`?audit=gallery-mobile-${Date.now()}#installation`);
await evaluate("Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); true");
await evaluate("if (document.body.dataset.theme === 'light') document.querySelector('.theme-toggle').click(); true");
await evaluate("document.querySelector('[data-room-enter]').click(); true");
report.mobileLoaded = await waitFor("document.querySelector('[data-room-experience]').classList.contains('is-webgl-ready')");
await pause(700);
report.mobileDark = await roomState();
await capture('/tmp/dha-gallery-mobile-dark.png');

await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 300, y: 360, button: 'left', clickCount: 1 });
for (const x of [270, 230, 190, 145]) {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y: 350, button: 'left', buttons: 1 });
}
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 145, y: 350, button: 'left', clickCount: 1 });
await pause(350);
await evaluate("document.querySelector('[data-gallery-webgl]').__galleryController.setActive(true); true");
await capture('/tmp/dha-gallery-mobile-turned.png');
await evaluate("document.querySelector('[data-room-theme]').click(); true");
await pause(750);
report.mobileLight = await roomState();
await capture('/tmp/dha-gallery-mobile-light.png');
await evaluate("document.querySelector('[data-room-close]').click(); true");

for (const page of ['privacy.html', 'imprint.html', '404.html']) {
  await navigate(page, 450);
  report[page] = await evaluate(`(() => ({
    title: document.title,
    heading: document.querySelector('h1')?.textContent.trim().replace(/\\s+/g, ' '),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    fontLoaded: document.fonts.check('24px "Instrument Serif"') && document.fonts.check('14px "Manrope"'),
    brokenImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src)
  }))()`);
}

await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await navigate(`?audit=gallery-reduced-${Date.now()}#installation`);
await evaluate("document.querySelector('[data-room-enter]').click(); true");
await pause(350);
report.reducedMotion = await roomState();
await evaluate("document.querySelector('[data-room-close]').click(); true");

const localLinks = await evaluate(`Promise.all([...document.querySelectorAll('a[href]')]
  .map((link) => link.href)
  .filter((href) => href.startsWith(location.origin))
  .filter((href, index, all) => all.indexOf(href) === index)
  .map(async (href) => ({ href, status: (await fetch(href, { method: 'HEAD' })).status })))`);
report.localLinks = localLinks;
report.browserIssues = browserIssues;

console.log(JSON.stringify(report, null, 2));
socket.close();
