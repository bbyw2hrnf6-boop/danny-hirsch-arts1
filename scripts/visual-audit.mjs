import { mkdir, writeFile } from 'node:fs/promises';

const cdpPort = process.env.CDP_PORT || '9223';
const baseUrl = process.env.AUDIT_URL || 'http://127.0.0.1:8123/';
const outputDir = new URL('../artifacts/previews/', import.meta.url);
const targets = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((response) => response.json());
const target = targets.find((entry) => entry.type === 'page');

if (!target) throw new Error('No Chrome page target is available.');

await mkdir(outputDir, { recursive: true });

const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
const browserIssues = [];
const layoutReports = [];
let nextId = 0;

const ready = new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result || {});
    return;
  }

  if (message.method === 'Runtime.exceptionThrown') {
    browserIssues.push(`exception: ${message.params.exceptionDetails?.text || 'unknown'}`);
  }

  if (message.method === 'Log.entryAdded' && ['error', 'warning'].includes(message.params.entry?.level)) {
    browserIssues.push(`${message.params.entry.level}: ${message.params.entry.text}`);
  }
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const evaluate = async (expression, awaitPromise = true) => {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true
  });
  return result.result?.value;
};

const navigate = async (path, delay = 1400) => {
  await send('Page.navigate', { url: new URL(path, baseUrl).href });
  await pause(delay);
  await evaluate('document.fonts.ready.then(() => true)');
};

const viewport = async (width, height, mobile = false) => {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
    screenWidth: width,
    screenHeight: height
  });
};

const capture = async (name) => {
  const result = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    fromSurface: true
  });
  await writeFile(new URL(name, outputDir), Buffer.from(result.data, 'base64'));
};

const scrollTo = async (selector, delay = 1600) => {
  await evaluate(`(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    const target = document.querySelector(${JSON.stringify(selector)});
    if (!target) return false;
    const rect = target.getBoundingClientRect();
    const top = window.scrollY + rect.top - Math.max(0, (innerHeight - Math.min(rect.height, innerHeight)) / 2);
    window.scrollTo(0, top);
    return true;
  })()`);
  await pause(delay);
};

const waitFor = async (expression, timeout = 10000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return true;
    await pause(250);
  }
  return false;
};

const decodeImagesWithin = async (selector) => evaluate(`(() => {
  const images = [...document.querySelectorAll(${JSON.stringify(selector)} + ' img')];
  images.forEach((img) => { img.loading = 'eager'; });
  return Promise.race([
    Promise.all(images.map((img) => img.decode?.().catch(() => undefined))),
    new Promise((resolve) => setTimeout(resolve, 1800))
  ]).then(() => true);
})()`);

const recordLayout = async (label) => {
  layoutReports.push(await evaluate(`(() => ({
    label: ${JSON.stringify(label)},
    size: [innerWidth, innerHeight],
    scrollY: Math.round(scrollY),
    pageHeight: document.documentElement.scrollHeight,
    fontLoaded: document.fonts.check('24px "Instrument Serif"') && document.fonts.check('14px "Manrope"'),
    theme: document.body.dataset.theme,
    privateRoomState: document.querySelector('#installation')?.dataset.privateRoom3d,
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    outsideHeadings: [...document.querySelectorAll('h1,h2,h3')].filter((heading) => {
      const rect = heading.getBoundingClientRect();
      return rect.left < -1 || rect.right > innerWidth + 1;
    }).map((heading) => heading.textContent.trim().replace(/\\s+/g, ' ')),
    lightboxInert: document.querySelector('.lightbox')?.inert
  }))()`));
};

await ready;
await send('Page.enable');
await send('Runtime.enable');
await send('Log.enable');
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Page.bringToFront');
await send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }]
});
await viewport(1440, 1000);

await navigate('?intro=1', 700);
await capture('audit-desktop-intro-surface.png');
await pause(1800);
await capture('audit-desktop-intro-object.png');
await pause(1900);
await capture('audit-desktop-intro-room.png');
await pause(3300);
await capture('audit-desktop-hero-final.png');
await recordLayout('desktop-hero');

await navigate('#installation', 1700);
await evaluate("document.body.dataset.theme='dark'; localStorage.setItem('dha-theme','dark'); true");
await scrollTo('#installation', 1800);
await waitFor("['ready','skipped','error'].includes(document.querySelector('#installation')?.dataset.privateRoom3d)", 12000);
await pause(700);
await evaluate("document.body.dataset.theme='light'; localStorage.setItem('dha-theme','light'); true");
await waitFor("document.querySelector('#installation')?.dataset.privateRoom3d === 'ready'", 6000);
await pause(700);
await capture('audit-desktop-room-light.png');
await recordLayout('desktop-room-light');
await evaluate("document.body.dataset.theme='dark'; localStorage.setItem('dha-theme','dark'); true");
await pause(700);
await capture('audit-desktop-room-dark.png');
await recordLayout('desktop-room-dark');
await evaluate("document.querySelector('[data-room-enter]').click(); true");
await pause(850);
await capture('audit-desktop-room-immersive.png');
await evaluate("document.querySelector('[data-room-close]').click(); true");
await pause(320);

await evaluate("document.querySelector('[data-cookie-reject]')?.click(); true");
for (const [selector, name] of [
  ['#collection .art-chapter:nth-child(2)', 'audit-desktop-collection.png'],
  ['#gallery .gallery-item:first-child', 'audit-desktop-gallery.png'],
  ['#wartrobe .wartrobe-stage', 'audit-desktop-wartrobe.png'],
  ['#about .about-copy', 'audit-desktop-about.png'],
  ['#inquiry .inquiry-copy', 'audit-desktop-inquiry.png']
]) {
  await scrollTo(selector);
  await decodeImagesWithin(selector);
  await capture(name);
}
await recordLayout('desktop-content');

await viewport(390, 844, true);
await navigate('?intro=1&audit=mobile-opening', 650);
await capture('audit-mobile-intro-surface.png');
await pause(1650);
await capture('audit-mobile-intro-work.png');
await pause(2000);
await capture('audit-mobile-intro-room.png');
await pause(3100);
await capture('audit-mobile-hero-final.png');
await recordLayout('mobile-hero');

await navigate('?mobile=1#installation', 1500);
await scrollTo('#installation', 2800);
await decodeImagesWithin('#installation');
await capture('audit-mobile-room.png');
await recordLayout('mobile-room');
await evaluate("document.querySelector('[data-room-enter]').click(); true");
await pause(700);
await capture('audit-mobile-room-immersive.png');
await evaluate("document.querySelector('[data-room-close]').click(); true");
await pause(280);
await scrollTo('#collection .art-chapter:nth-child(2)');
await decodeImagesWithin('#collection .art-chapter:nth-child(2)');
await capture('audit-mobile-collection.png');
await scrollTo('#gallery .gallery-item:first-child');
await decodeImagesWithin('#gallery .gallery-item:first-child');
await capture('audit-mobile-gallery.png');
await scrollTo('#about .about-copy');
await decodeImagesWithin('#about');
await capture('audit-mobile-about.png');
await recordLayout('mobile-content');

await send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
});
await navigate('?intro=1', 1200);
await capture('audit-mobile-reduced-motion.png');

const finalState = await evaluate(`(() => {
  const headings = [...document.querySelectorAll('h1,h2,h3')].map((heading) => {
    const rect = heading.getBoundingClientRect();
    const style = getComputedStyle(heading);
    return {
      text: heading.textContent.trim().replace(/\\s+/g, ' '),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      scrollWidth: heading.scrollWidth,
      lineHeight: style.lineHeight,
      fontFamily: style.fontFamily,
      outsideViewport: rect.left < -1 || rect.right > innerWidth + 1
    };
  });
  const visibleFocusables = [...document.querySelectorAll('a[href],button,input,textarea')]
    .filter((item) => item.getClientRects().length && getComputedStyle(item).visibility !== 'hidden');
  return {
    size: [innerWidth, innerHeight],
    fontLoaded: document.fonts.check('24px "Instrument Serif"') && document.fonts.check('14px "Manrope"'),
    theme: document.body.dataset.theme,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    privateRoomState: document.querySelector('#installation')?.dataset.privateRoom3d,
    horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    headings,
    visibleFocusableCount: visibleFocusables.length,
    lightboxInert: document.querySelector('.lightbox')?.inert
  };
})()`);

const report = { layoutReports, finalState, browserIssues: [...new Set(browserIssues)] };
await writeFile(new URL('audit-report.json', outputDir), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
socket.close();
