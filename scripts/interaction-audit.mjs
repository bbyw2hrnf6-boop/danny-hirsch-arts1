const cdpPort = process.env.CDP_PORT || '9224';
const baseUrl = process.env.AUDIT_URL || 'http://127.0.0.1:8124/';
const targets = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((response) => response.json());
const target = targets.find((entry) => entry.type === 'page');
if (!target) throw new Error('No Chrome page target is available.');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let nextId = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result || {});
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Evaluation failed');
  return result.result?.value;
};
const viewport = (width, height, mobile = false) => send('Emulation.setDeviceMetricsOverride', {
  width,
  height,
  deviceScaleFactor: 1,
  mobile,
  screenWidth: width,
  screenHeight: height
});
const navigate = async (path, delay = 1000) => {
  await send('Page.navigate', { url: new URL(path, baseUrl).href });
  await pause(delay);
};
const key = async (value) => {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: value, code: value });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: value, code: value });
  await pause(120);
};

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Page.bringToFront');
await send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }]
});
await viewport(1440, 1000);

await navigate('?intro=1&audit=interaction', 700);
const intro = await evaluate(`(() => ({
  active: document.body.classList.contains('opening-active'),
  headerInert: document.querySelector('.site-header').inert,
  heroContentInert: document.querySelector('.hero-content').inert,
  skipInert: document.querySelector('.opening-skip').inert
}))()`);
await evaluate("document.querySelector('.opening-skip').click(); true");
const introClosed = await evaluate(`(() => ({
  complete: document.body.classList.contains('opening-complete'),
  headerInert: document.querySelector('.site-header').inert,
  heroContentInert: document.querySelector('.hero-content').inert
}))()`);

await navigate('#collection', 1300);
await evaluate("document.querySelector('#collection .js-lightbox-trigger').click(); true");
await pause(180);
const lightboxOpen = await evaluate(`(() => ({
  open: document.querySelector('.lightbox').classList.contains('is-open'),
  ariaHidden: document.querySelector('.lightbox').getAttribute('aria-hidden'),
  dialogInert: document.querySelector('.lightbox').inert,
  mainInert: document.querySelector('main').inert,
  focus: document.activeElement?.className
}))()`);
await key('Escape');
const lightboxClosed = await evaluate(`(() => ({
  open: document.querySelector('.lightbox').classList.contains('is-open'),
  ariaHidden: document.querySelector('.lightbox').getAttribute('aria-hidden'),
  dialogInert: document.querySelector('.lightbox').inert,
  mainInert: document.querySelector('main').inert,
  focusReturned: document.activeElement?.classList.contains('js-lightbox-trigger')
}))()`);

await viewport(390, 844, true);
await navigate('#collection', 1100);
await evaluate("document.querySelector('.menu-toggle').click(); true");
await pause(160);
const menuOpen = await evaluate(`(() => ({
  expanded: document.querySelector('.menu-toggle').getAttribute('aria-expanded'),
  navInert: document.querySelector('.site-nav').inert,
  focusInside: document.querySelector('.site-nav').contains(document.activeElement)
}))()`);
await key('Escape');
const menuClosed = await evaluate(`(() => ({
  expanded: document.querySelector('.menu-toggle').getAttribute('aria-expanded'),
  navInert: document.querySelector('.site-nav').inert,
  focusReturned: document.activeElement === document.querySelector('.menu-toggle')
}))()`);

const initialTheme = await evaluate("document.body.dataset.theme");
await evaluate("document.querySelector('.theme-toggle').click(); true");
const theme = await evaluate(`(() => ({
  before: ${JSON.stringify('THEME_PLACEHOLDER')},
  after: document.body.dataset.theme,
  pressed: document.querySelector('.theme-toggle').getAttribute('aria-pressed'),
  label: document.querySelector('.theme-toggle').getAttribute('aria-label')
}))()`);
theme.before = initialTheme;

await send('Emulation.setEmulatedMedia', {
  features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
});
await navigate('?intro=1&audit=reduced', 1000);
const reduced = await evaluate(`(() => ({
  preference: matchMedia('(prefers-reduced-motion: reduce)').matches,
  openingSkipped: document.body.classList.contains('opening-complete'),
  videoRequested: performance.getEntriesByType('resource').some((entry) => /threshold-intro\\.(mp4|webm)/.test(entry.name)),
  lightboxInert: document.querySelector('.lightbox').inert
}))()`);

const form = await evaluate(`(() => ({
  action: document.querySelector('.inquiry-form').getAttribute('action'),
  method: document.querySelector('.inquiry-form').getAttribute('method'),
  required: [...document.querySelectorAll('.inquiry-form [required]')].map((field) => field.name),
  labels: [...document.querySelectorAll('.inquiry-form label')].every((label) => Boolean(label.querySelector('input,textarea')))
}))()`);

const report = { intro, introClosed, lightboxOpen, lightboxClosed, menuOpen, menuClosed, theme, reduced, form };
console.log(JSON.stringify(report, null, 2));
socket.close();
