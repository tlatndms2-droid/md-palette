import { writeFile } from 'node:fs/promises';

export async function connect(port = 19273, surface = 'main') {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find(t => t.type === 'page' && t.title.includes('MDPalette-Stage0-Sandbox') && (surface === 'main' ? t.url === 'app://obsidian.md/index.html' : t.title.startsWith('설정')));
  if (!target) throw new Error('Expected isolated MD Palette Sandbox not found');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let next = 0;
  const pending = new Map();
  const errors = [];
  socket.addEventListener('message', event => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.exceptionThrown') errors.push(data.params);
    const request = pending.get(data.id);
    if (request) {
      clearTimeout(request.timer);
      pending.delete(data.id);
      data.error ? request.reject(new Error(JSON.stringify(data.error))) : request.resolve(data.result);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++next;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
  await send('Runtime.discardConsoleEntries');
  await send('Runtime.enable');
  return {
    target, errors, send,
    async evaluate(expression) {
      const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    },
    async screenshot(path) {
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      await writeFile(path, Buffer.from(data, 'base64'));
    },
    close() { socket.close(); }
  };
}

if (process.argv[1]?.endsWith('cdp.mjs')) {
  const cdp = await connect(Number(process.env.MD_PALETTE_CDP_PORT || 19273));
  try {
    if (process.argv[2] === 'screenshot') await cdp.screenshot(process.argv[3]);
    else console.log(JSON.stringify(await cdp.evaluate(process.argv[2]), null, 2));
  } finally { cdp.close(); }
}
