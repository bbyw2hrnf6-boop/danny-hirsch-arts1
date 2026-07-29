import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const port = process.env.CDP_PORT || '9223';
const base = process.env.AUDIT_URL || 'http://127.0.0.1:8123/';
const outputDirectory = process.env.AUDIT_OUTPUT_DIR || '/tmp';
await mkdir(outputDirectory, { recursive: true });
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
  const sidebar = document.querySelector('[data-gallery-demo-nav]');
  const artCard = document.querySelector('[data-gallery-art-card]');
  const artCardRect = artCard?.getBoundingClientRect();
  const artCardStyle = artCard ? getComputedStyle(artCard) : null;
  const ambientButton = document.querySelector('[data-gallery-ambient]');
  const sidebarRect = sidebar?.getBoundingClientRect();
  const sidebarScroll = sidebar?.querySelector('.room-experience__sidebar-scroll');
  const sitePanel = document.querySelector('[data-gallery-site-panel]');
  const fullscreenButton = document.querySelector('[data-room-fullscreen]');
  const sidebarVisible = Boolean(sidebar && !sidebar.hidden && sidebarRect?.width && sidebarRect?.height);
  const sidebarButtonRects = [...(sidebar?.querySelectorAll('button') || [])].map((button) => button.getBoundingClientRect());
  return {
    open: dialog?.open,
    ready: dialog?.classList.contains('is-webgl-ready'),
    spatial: dialog?.classList.contains('is-demo-mode'),
    theme: document.body.dataset.theme,
    controller: controller?.getState?.(),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    panelHidden: document.querySelector('[data-gallery-site-panel]')?.hidden,
    panel: {
      id: sitePanel?.dataset.panelId || null,
      title: sitePanel?.querySelector('[data-gallery-site-title]')?.textContent || null,
      link: sitePanel?.querySelector('[data-gallery-site-link]')?.getAttribute('href') || null
    },
    fullscreen: {
      supported: Boolean(document.querySelector('[data-room-experience-stage]')?.requestFullscreen),
      active: document.fullscreenElement === document.querySelector('[data-room-experience-stage]'),
      pressed: fullscreenButton?.getAttribute('aria-pressed') || null
    },
    ambientPressed: ambientButton?.getAttribute('aria-pressed'),
    artCard: {
      proximity: artCard?.dataset.proximity || null,
      visible: Boolean(artCardRect?.width && artCardRect?.height
        && artCardStyle?.visibility !== 'hidden'
        && Number(artCardStyle?.opacity || 0) > 0.01),
      inViewport: Boolean(artCardRect
        && artCardRect.left >= -1
        && artCardRect.top >= -1
        && artCardRect.right <= innerWidth + 1
        && artCardRect.bottom <= innerHeight + 1),
      rect: artCardRect ? [artCardRect.left, artCardRect.top, artCardRect.width, artCardRect.height] : null
    },
    sidebar: {
      hidden: sidebar?.hidden,
      visible: sidebarVisible,
      vertical: Boolean(sidebarVisible && sidebarRect.height > sidebarRect.width),
      inViewport: Boolean(sidebarVisible
        && sidebarRect.top >= -1
        && sidebarRect.left >= -1
        && sidebarRect.right <= innerWidth + 1
        && sidebarRect.bottom <= innerHeight + 1),
      buttonsStacked: Boolean(sidebarVisible && sidebarButtonRects.every((rect, index) => index === 0 || rect.top >= sidebarButtonRects[index - 1].bottom - 1)),
      buttonCount: sidebarButtonRects.length,
      rect: sidebarRect ? [sidebarRect.left, sidebarRect.top, sidebarRect.width, sidebarRect.height] : null,
      scroll: sidebarScroll ? [sidebarScroll.clientHeight, sidebarScroll.scrollHeight] : null
    }
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
await send('Page.navigate', { url: new URL(`?view=3d&audit=demo-rooms-${Date.now()}`, base).href });
await pause(950);
await evaluate("Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); true");
if (await evaluate("document.body.classList.contains('opening-active')")) {
  await evaluate("document.querySelector('.opening-skip').click(); true");
}
await evaluate("if (document.body.dataset.theme === 'light') document.querySelector('.theme-toggle').click(); true");
report.directSpatialEntry = await waitFor("document.querySelector('[data-room-experience]').open && document.querySelector('[data-room-experience]').classList.contains('is-demo-mode')");
report.loaded = await waitFor("document.querySelector('[data-room-experience]').classList.contains('is-webgl-ready')");
await pause(700);

report.desktopBeforeZoom = await state();
await evaluate(`(() => {
  const mount = document.querySelector('[data-gallery-webgl]');
  mount.dispatchEvent(new WheelEvent('wheel', { deltaY: -320, bubbles: true, cancelable: true }));
  return true;
})()`);
await pause(420);
report.desktopAfterZoom = await state();

await evaluate("document.querySelector('[data-gallery-ambient]')?.click(); true");
await pause(180);
report.roomSoundOn = await state();
await evaluate("document.querySelector('[data-gallery-ambient]')?.click(); true");
await pause(180);
report.roomSoundOff = await state();

for (const room of ['gallery-hall', 'private-room', 'contact-room']) {
  await evaluate(`document.querySelector('[data-gallery-webgl]').__galleryController.goToDemoRoom('${room}'); true`);
  await pause(1500);
  report[`desktop-${room}`] = await state();
  await capture(join(outputDirectory, `dha-demo-${room}.png`));
}

await evaluate("document.querySelector('[data-gallery-webgl]').__galleryController.goToSitePanel('privacy'); true");
await waitFor("document.querySelector('[data-gallery-site-panel]')?.dataset.panelId === 'privacy'", 6000);
report.desktopPrivacyPanel = await state();
await capture(join(outputDirectory, 'dha-demo-privacy-panel.png'));

await evaluate("document.querySelector('[data-gallery-webgl]').__galleryController.goToSitePanel('inquiry'); true");
await waitFor("document.querySelector('[data-gallery-site-panel]')?.dataset.panelId === 'inquiry'", 6000);
report.desktopContactPanel = await state();
await capture(join(outputDirectory, 'dha-demo-contact-panel.png'));

report.fullscreenRequested = await evaluate(`(async () => {
  const button = document.querySelector('[data-room-fullscreen]');
  if (!button || button.hidden) return false;
  button.click();
  await new Promise((resolve) => setTimeout(resolve, 350));
  return document.fullscreenElement === document.querySelector('[data-room-experience-stage]');
})()`);
report.desktopFullscreen = await state();
if (report.fullscreenRequested) await evaluate("document.exitFullscreen(); true");

await evaluate("document.querySelector('[data-room-classic]').click(); true");
await pause(300);
report.classicSwitchClosedRoom = await evaluate("!document.querySelector('[data-room-experience]').open");
await evaluate("document.querySelector('[data-open-spatial]').click(); true");
report.headerSpatialSwitchReopened = await waitFor("document.querySelector('[data-room-experience]').open && document.querySelector('[data-room-experience]').classList.contains('is-demo-mode')", 5000);

await evaluate("document.querySelector('[data-gallery-webgl]').__galleryController.goToNextView(); true");
await pause(1550);
await waitFor("document.querySelector('[data-gallery-art-image]')?.complete && document.querySelector('[data-gallery-art-image]').naturalWidth > 0", 3000);
report.desktopArtworkFocus = await state();
await capture(join(outputDirectory, 'dha-demo-artwork-focus.png'));

await evaluate("document.querySelector('[data-room-theme]').click(); true");
await pause(700);
await evaluate("document.querySelector('[data-gallery-webgl]').__galleryController.goToDemoRoom('private-room'); true");
await pause(1500);
report.desktopLightPrivate = await state();
await capture(join(outputDirectory, 'dha-demo-private-room-light.png'));

await viewport(390, 844, true);
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await send('Page.navigate', { url: new URL(`?view=3d&audit=demo-mobile-${Date.now()}`, base).href });
await pause(950);
await evaluate("Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); true");
if (await evaluate("document.body.classList.contains('opening-active')")) {
  await evaluate("document.querySelector('.opening-skip').click(); true");
}
await waitFor("document.querySelector('[data-room-experience]').open && document.querySelector('[data-room-experience]').classList.contains('is-demo-mode')");
await waitFor("document.querySelector('[data-room-experience]').classList.contains('is-webgl-ready')");
await pause(850);
await evaluate("document.querySelector('[data-gallery-webgl]').__galleryController.goToDemoRoom('contact-room'); true");
await waitFor("document.querySelector('[data-gallery-webgl]').__galleryController.getState().activeNavigationId === 'contact-room'", 7000);
await pause(1550);
report.mobileContact = await state();
await capture(join(outputDirectory, 'dha-demo-contact-room-mobile.png'));

report.browserIssues = browserIssues;
console.log(JSON.stringify(report, null, 2));
socket.close();
