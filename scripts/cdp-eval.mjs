const cdpPort = process.env.CDP_PORT || '9223';
const expression = process.argv.slice(2).join(' ') || 'document.title';
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

await send('Page.bringToFront');
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });

if (process.env.CDP_REDUCED) {
  await send('Emulation.setEmulatedMedia', {
    features: [{
      name: 'prefers-reduced-motion',
      value: process.env.CDP_REDUCED === '1' ? 'reduce' : 'no-preference'
    }]
  });
}

if (process.env.CDP_WIDTH) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: Number(process.env.CDP_WIDTH),
    height: Number(process.env.CDP_HEIGHT || 900),
    deviceScaleFactor: 1,
    mobile: process.env.CDP_MOBILE === '1'
  });
}

if (process.env.CDP_NAVIGATE) {
  await send('Page.navigate', { url: process.env.CDP_NAVIGATE });
  await new Promise((resolve) => setTimeout(resolve, Number(process.env.CDP_WAIT || 1200)));
}

const evaluation = await send('Runtime.evaluate', {
  expression,
  awaitPromise: true,
  returnByValue: true,
  userGesture: true
});
const result = evaluation.result;

console.log(JSON.stringify(result?.value ?? result?.description ?? result, null, 2));
socket.close();
