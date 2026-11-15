import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

function startStaticServer(dir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.jpg': 'image/jpeg'
  };

  const server = http.createServer((req, res) => {
    const cleanUrl = (req.url || '/').split('?')[0];
    let filePath = path.join(dir, cleanUrl === '/' ? 'index.html' : cleanUrl);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(dir, 'index.html');
    }
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    } catch (e) {
      res.writeHead(500);
      res.end('Error loading ' + req.url);
    }
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function getDebuggerUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9226/json');
      const pages = await res.json();
      const page = pages.find((p) => p.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch (_) {}
    await wait(200);
  }
  throw new Error('Timed out waiting for Chrome remote debugger');
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.msgId = 0;
    this.callbacks = new Map();
  }
  connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id && this.callbacks.has(data.id)) {
          const { resolve, reject } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.result);
        }
      };
    });
  }
  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', { expression, returnByValue: true });
    if (res.exceptionDetails) {
      throw new Error('Eval error: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }
  close() {
    this.ws.close();
  }
}

async function runTests() {
  console.log('🧪 Testing Sex Organs & Sought Sex Organs Form Mapping...\n');

  const distDir = path.resolve(process.cwd(), 'dist');
  const server = await startStaticServer(distDir, 5201);
  const userDataDir = `/tmp/chrome-test-organs-${Date.now()}`;

  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--remote-debugging-port=9226',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  let client;
  try {
    const wsUrl = await getDebuggerUrl();
    client = new CDPClient(wsUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: false,
      fitWindow: false
    });
    await client.send('Page.navigate', { url: 'http://127.0.0.1:5201/' });
    await wait(600);

    // 1. Open Host modal and test label text, disabled gating, and all 6 mappings
    await client.evaluate(`document.getElementById('btn-open-host-prompt').click()`);
    await wait(100);

    const hostLabels = await client.evaluate(`
      JSON.stringify(
        Array.from(document.querySelectorAll('#host-modal .label-looking-for')).map((el) => el.textContent.trim())
      )
    `);
    assert(
      hostLabels === JSON.stringify(['I reproduce myself with:', 'Sex organs I seek:']),
      'Unexpected host modal labels: ' + hostLabels
    );

    const hostMappingResult = await client.evaluate(`
      (function () {
        const nameEl = document.getElementById('host-player-name');
        const submitBtn = document.getElementById('btn-confirm-create-room');
        const sexInput = document.getElementById('host-sex-organs');
        const lookingInput = document.getElementById('host-looking-for');
        const clickSex = (v) => document.querySelector('#host-sex-organs-group [data-value="' + v + '"]').click();
        const clickSought = (v) => document.querySelector('#host-sought-organs-group [data-value="' + v + '"]').click();

        nameEl.value = 'HostChris';
        nameEl.dispatchEvent(new Event('input'));
        const onlyNameDisabled = submitBtn.disabled;

        clickSex('pole');
        const onlySexDisabled = submitBtn.disabled;

        clickSought('same');
        const poleSame = { sex: sexInput.value, looking: lookingInput.value, disabled: submitBtn.disabled };

        clickSex('hole');
        const holeSame = { sex: sexInput.value, looking: lookingInput.value, disabled: submitBtn.disabled };

        clickSought('different');
        const holeBoth = { sex: sexInput.value, looking: lookingInput.value, disabled: submitBtn.disabled };

        clickSought('same');
        const holeDifferent = { sex: sexInput.value, looking: lookingInput.value, disabled: submitBtn.disabled };

        clickSex('pole');
        const poleDifferent = { sex: sexInput.value, looking: lookingInput.value, disabled: submitBtn.disabled };

        clickSought('same');
        const poleBoth = { sex: sexInput.value, looking: lookingInput.value, disabled: submitBtn.disabled };

        return JSON.stringify({
          onlyNameDisabled,
          onlySexDisabled,
          poleSame,
          holeSame,
          holeBoth,
          holeDifferent,
          poleDifferent,
          poleBoth
        });
      })()
    `);

    const hostRes = JSON.parse(hostMappingResult);
    assert(hostRes.onlyNameDisabled === true, 'Submit should be disabled with only name');
    assert(hostRes.onlySexDisabled === true, 'Submit should be disabled until sought organs selected');
    assert(hostRes.poleSame.sex === 'pole' && hostRes.poleSame.looking === 'Man' && hostRes.poleSame.disabled === false, 'pole + same -> Man');
    assert(hostRes.holeSame.sex === 'hole' && hostRes.holeSame.looking === 'Woman' && hostRes.holeSame.disabled === false, 'hole + same -> Woman');
    assert(hostRes.holeBoth.sex === 'hole' && hostRes.holeBoth.looking === 'Both' && hostRes.holeBoth.disabled === false, 'hole + both -> Both');
    assert(hostRes.holeDifferent.sex === 'hole' && hostRes.holeDifferent.looking === 'Man' && hostRes.holeDifferent.disabled === false, 'hole + different -> Man');
    assert(hostRes.poleDifferent.sex === 'pole' && hostRes.poleDifferent.looking === 'Woman' && hostRes.poleDifferent.disabled === false, 'pole + different -> Woman');
    assert(hostRes.poleBoth.sex === 'pole' && hostRes.poleBoth.looking === 'Both' && hostRes.poleBoth.disabled === false, 'pole + both -> Both');
    console.log('✓ Host modal labels, validation gating, and all 6 pole/hole mappings verified.');

    // 2. Test Join Game card similarly
    const joinMappingResult = await client.evaluate(`
      (function () {
        document.getElementById('host-modal').classList.add('hidden');
        document.getElementById('host-card').classList.add('hidden');
        document.getElementById('join-card').classList.remove('hidden');

        const labels = Array.from(document.querySelectorAll('#join-card .label-looking-for')).map((el) => el.textContent.trim());
        const nameEl = document.getElementById('join-player-name');
        const submitBtn = document.getElementById('btn-join-game');
        const sexInput = document.getElementById('join-sex-organs');
        const lookingInput = document.getElementById('join-looking-for');
        const clickSex = (v) => document.querySelector('#join-sex-organs-group [data-value="' + v + '"]').click();
        const clickSought = (v) => document.querySelector('#join-sought-organs-group [data-value="' + v + '"]').click();

        nameEl.value = 'JoinPat';
        nameEl.dispatchEvent(new Event('input'));
        const initDisabled = submitBtn.disabled;

        clickSex('hole');
        clickSought('different');
        const holeDifferent = { sex: sexInput.value, looking: lookingInput.value, disabled: submitBtn.disabled };

        clickSought('same');
        const holeBoth = { sex: sexInput.value, looking: lookingInput.value, disabled: submitBtn.disabled };

        return JSON.stringify({ labels, initDisabled, holeDifferent, holeBoth });
      })()
    `);

    const joinRes = JSON.parse(joinMappingResult);
    assert(
      JSON.stringify(joinRes.labels) === JSON.stringify(['I reproduce myself with:', 'Sex organs I seek:']),
      'Unexpected join card labels: ' + JSON.stringify(joinRes.labels)
    );
    assert(joinRes.initDisabled === true, 'Join button should start disabled');
    assert(joinRes.holeDifferent.sex === 'hole' && joinRes.holeDifferent.looking === 'Man' && joinRes.holeDifferent.disabled === false, 'Join hole + different -> Man');
    assert(joinRes.holeBoth.sex === 'hole' && joinRes.holeBoth.looking === 'Both' && joinRes.holeBoth.disabled === false, 'Join hole + both -> Both');
    console.log('✓ Join Game card labels, validation gating, and mappings verified.');

    console.log('\n🎉 ALL SEX ORGANS & SOUGHT SEX ORGANS UI TESTS PASSED!\n');
  } finally {
    if (client) client.close();
    chrome.kill('SIGKILL');
    server.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
