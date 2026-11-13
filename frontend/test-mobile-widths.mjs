import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startStaticServer(dir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let filePath = path.join(dir, req.url === '/' ? 'index.html' : req.url);
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
      const res = await fetch('http://127.0.0.1:9222/json');
      const data = await res.json();
      if (data && data[0] && data[0].webSocketDebuggerUrl) {
        return data[0].webSocketDebuggerUrl;
      }
    } catch (e) {
      // wait and retry
    }
    await wait(200);
  }
  throw new Error('Chrome remote debugger not responding');
}

async function run() {
  console.log('📱 Starting Mobile Responsiveness & Viewport Tests...\n');

  const PORT = 5198;
  const distDir = fs.existsSync(path.resolve('dist'))
    ? path.resolve('dist')
    : path.resolve('frontend/dist');
  const staticServer = await startStaticServer(distDir, PORT);
  console.log(`✓ Local static test server listening on http://127.0.0.1:${PORT}`);

  const testUrl = `http://127.0.0.1:${PORT}`;
  console.log('🚀 Launching Chrome Headless for Mobile Viewport Inspection...');
  const chrome = spawn(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--window-size=375,812',
      '--disable-gpu',
      '--no-sandbox',
      testUrl
    ],
    { stdio: 'ignore' }
  );

  try {
    const wsUrl = await getDebuggerUrl();
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve) => ws.onopen = resolve);

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const handler = (evt) => {
          const msg = JSON.parse(evt.data);
          if (msg.id === id) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Page.navigate', { url: testUrl });
    await wait(1000);

    const viewports = [
      { name: 'iPhone 13 / SE (375px)', width: 375, height: 812 },
      { name: 'Ultra Compact Phone (320px)', width: 320, height: 568 }
    ];

    let allPassed = true;

    for (const vp of viewports) {
      console.log(`\n========================================`);
      console.log(`Testing Viewport: ${vp.name}`);
      console.log(`========================================`);

      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: true,
        fitWindow: false
      });
      await wait(300);

      const testCases = [
        {
          name: 'Landing Home View',
          setupJs: `
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
            document.getElementById('landing-view').classList.remove('hidden');
            document.getElementById('host-card').classList.remove('hidden');
            document.getElementById('join-card').classList.add('hidden');
            document.getElementById('lobby-view').classList.add('hidden');
            document.getElementById('game-view').classList.add('hidden');
          `
        },
        {
          name: 'Landing Join View',
          setupJs: `
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
            document.getElementById('landing-view').classList.remove('hidden');
            document.getElementById('host-card').classList.add('hidden');
            document.getElementById('join-card').classList.remove('hidden');
          `
        },
        {
          name: 'Host Name Modal',
          setupJs: `
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
            document.getElementById('host-modal').classList.remove('hidden');
          `
        },
        {
          name: 'QR Code Modal',
          setupJs: `
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
            document.getElementById('qr-modal').classList.remove('hidden');
          `
        },
        {
          name: 'End Game Modal',
          setupJs: `
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
            document.getElementById('end-game-modal').classList.remove('hidden');
          `
        },
        {
          name: 'Lobby View (2x2 Grid + 3-Button Row)',
          setupJs: `
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
            document.getElementById('landing-view').classList.add('hidden');
            document.getElementById('lobby-view').classList.remove('hidden');
            document.getElementById('host-invite-controls').classList.remove('hidden');
            document.getElementById('btn-start-game').classList.remove('hidden');
            
            // Populate seats grid for measurement
            const grid = document.getElementById('seats-grid');
            grid.innerHTML = \`
              <div class="seat-card seat-occupied">
                <div class="status-host-badge">Host</div>
                <div class="seat-header"><span>Player 1</span></div>
                <div class="seat-avatar">A</div>
                <div class="seat-name">Alice</div>
                <div class="status-badge status-connected">● Connected</div>
              </div>
              <div class="seat-card seat-occupied">
                <div class="seat-header"><span>Player 2</span></div>
                <div class="seat-avatar">B</div>
                <div class="seat-name">Bob</div>
                <div class="status-badge status-connected">● Connected</div>
              </div>
              <div class="seat-card seat-empty">
                <div class="seat-header"><span>Player 3</span></div>
                <div class="seat-avatar-empty">+</div>
                <div class="seat-name" style="font-size: 0.95rem; color: var(--text-muted);">Empty Slot</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Waiting...</div>
              </div>
              <div class="seat-card seat-empty">
                <div class="seat-header"><span>Player 4</span></div>
                <div class="seat-avatar-empty">+</div>
                <div class="seat-name" style="font-size: 0.95rem; color: var(--text-muted);">Empty Slot</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Waiting...</div>
              </div>
            \`;
          `
        },
        {
          name: 'Active Match View',
          setupJs: `
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
            document.getElementById('landing-view').classList.add('hidden');
            document.getElementById('lobby-view').classList.add('hidden');
            document.getElementById('game-view').classList.remove('hidden');
            document.getElementById('btn-end-active-game').style.display = 'inline-flex';
          `
        },
        {
          name: 'Photo Lightbox Modal',
          setupJs: `
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
            const modal = document.getElementById('photo-lightbox-modal');
            modal.classList.remove('hidden');
            const img = document.getElementById('lightbox-img');
            img.src = '/profiles/chad-thunderclout.jpg';
            img.style.display = 'block';
          `
        },
        {
          name: 'Round Start Modal',
          setupJs: `
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
            const modal = document.getElementById('round-start-modal');
            modal.classList.remove('hidden');
          `
        },
        {
          name: 'Dating Phase - Match Picker View',
          setupJs: `
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
            document.getElementById('landing-view').classList.add('hidden');
            document.getElementById('lobby-view').classList.add('hidden');
            document.getElementById('game-view').classList.remove('hidden');
            document.getElementById('profile-swipe-section').classList.add('hidden');
            document.getElementById('waiting-round-overlay').classList.add('hidden');
            const datingSec = document.getElementById('dating-phase-section');
            datingSec.classList.remove('hidden');
            document.getElementById('date-story-card').classList.add('hidden');
            document.getElementById('date-zero-matches-card').classList.add('hidden');
            document.getElementById('date-spectator-card').classList.add('hidden');
            const picker = document.getElementById('date-picker-card');
            picker.classList.remove('hidden');
            document.getElementById('date-picker-grid').innerHTML = \`
              <button class="date-picker-item">
                <div class="date-picker-avatar"><img src="/profiles/chad-thunderclout.jpg" alt="Chad" /></div>
                <div class="date-picker-info">
                  <div class="date-picker-name">Chad Thunderclout, 24</div>
                  <div class="date-picker-sub">Fitness Influencer & Day Trader • Miami, FL</div>
                  <span class="date-picker-btn">Go on Date</span>
                </div>
              </button>
              <button class="date-picker-item">
                <div class="date-picker-avatar"><img src="/profiles/chloe-matcha.jpg" alt="Chloe" /></div>
                <div class="date-picker-info">
                  <div class="date-picker-name">Chloe Sterling, 29</div>
                  <div class="date-picker-sub">Art Director • Brooklyn, NY</div>
                  <span class="date-picker-btn">Go on Date</span>
                </div>
              </button>
            \`;
          `
        },
        {
          name: 'Dating Phase - Date Recap Story View',
          setupJs: `
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
            document.getElementById('landing-view').classList.add('hidden');
            document.getElementById('lobby-view').classList.add('hidden');
            document.getElementById('game-view').classList.remove('hidden');
            document.getElementById('profile-swipe-section').classList.add('hidden');
            document.getElementById('waiting-round-overlay').classList.add('hidden');
            document.getElementById('dating-phase-section').classList.remove('hidden');
            document.getElementById('date-picker-card').classList.add('hidden');
            document.getElementById('date-zero-matches-card').classList.add('hidden');
            document.getElementById('date-spectator-card').classList.add('hidden');
            const storyCard = document.getElementById('date-story-card');
            storyCard.classList.remove('hidden');
            document.getElementById('date-outcome-badge').className = 'date-outcome-badge date-badge-great';
            document.getElementById('date-outcome-badge').textContent = '🌟 INCREDIBLE DATE (+1000 PTS)';
            document.getElementById('date-partner-avatar').innerHTML = '<img src="/profiles/chad-thunderclout.jpg" alt="Chad" />';
            document.getElementById('date-partner-name').textContent = 'Chad Thunderclout';
            document.getElementById('date-partner-sub').textContent = '24 • Fitness Influencer & Day Trader • Miami, FL';
            document.getElementById('date-story-content').innerHTML = '<p>You met up near South Beach. The banter clicked immediately and you spent 3 hours trading funny workout and crypto horror stories.</p><p>They paid the entire tab and walked you to your car.</p>';
            document.getElementById('date-score-delta-val').textContent = '+1,000 pts';
          `
        },
        {
          name: 'Dating Phase - Zero Matches Conciliatory View',
          setupJs: `
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
            document.getElementById('landing-view').classList.add('hidden');
            document.getElementById('lobby-view').classList.add('hidden');
            document.getElementById('game-view').classList.remove('hidden');
            document.getElementById('profile-swipe-section').classList.add('hidden');
            document.getElementById('waiting-round-overlay').classList.add('hidden');
            document.getElementById('dating-phase-section').classList.remove('hidden');
            document.getElementById('date-picker-card').classList.add('hidden');
            document.getElementById('date-story-card').classList.add('hidden');
            document.getElementById('date-spectator-card').classList.add('hidden');
            const zeroCard = document.getElementById('date-zero-matches-card');
            zeroCard.classList.remove('hidden');
          `
        },
        {
          name: 'Dating Phase - Ghost Spectator View',
          setupJs: `
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
            document.getElementById('landing-view').classList.add('hidden');
            document.getElementById('lobby-view').classList.add('hidden');
            document.getElementById('game-view').classList.remove('hidden');
            document.getElementById('profile-swipe-section').classList.add('hidden');
            document.getElementById('waiting-round-overlay').classList.add('hidden');
            document.getElementById('dating-phase-section').classList.remove('hidden');
            document.getElementById('date-picker-card').classList.add('hidden');
            document.getElementById('date-story-card').classList.add('hidden');
            document.getElementById('date-zero-matches-card').classList.add('hidden');
            const specCard = document.getElementById('date-spectator-card');
            specCard.classList.remove('hidden');
          `
        }
      ];

      for (const tc of testCases) {
        await send('Runtime.evaluate', { expression: tc.setupJs });
        await wait(100);

        const evalRes = await send('Runtime.evaluate', {
          expression: `(() => {
            const docEl = document.documentElement;
            const body = document.body;
            const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
            const clientWidth = docEl.clientWidth;
            const overflows = [];
            for (const el of document.querySelectorAll('*')) {
              if (el.offsetParent !== null) {
                const r = el.getBoundingClientRect();
                if (r.right > clientWidth + 1.5) {
                  overflows.push(el.tagName + '.' + (el.className || '') + ' (right=' + Math.round(r.right) + ')');
                }
              }
            }

            // Verify side-by-side action rows stay on one horizontal line
            const actionRows = [];
            for (const row of document.querySelectorAll('.modal-actions-row, .lobby-buttons-grid')) {
              const btns = Array.from(row.querySelectorAll('button')).filter(b => b.offsetParent !== null && !b.classList.contains('hidden'));
              if (btns.length >= 2) {
                const r0 = btns[0].getBoundingClientRect();
                const r1 = btns[1].getBoundingClientRect();
                const isSideBySide = Math.abs(r0.top - r1.top) < 8;
                actionRows.push({ selector: row.className, count: btns.length, isSideBySide });
              }
            }

            return {
              scrollWidth,
              clientWidth,
              hasHorizontalScroll: scrollWidth > clientWidth,
              overflowCount: overflows.length,
              overflowSample: overflows.slice(0, 3),
              actionRows
            };
          })()`,
          returnByValue: true
        });

        const metrics = evalRes.result.value;
        const pass = !metrics.hasHorizontalScroll && metrics.overflowCount === 0;
        if (!pass) allPassed = false;

        console.log(`\nView: [${tc.name}]`);
        console.log(`  clientWidth: ${metrics.clientWidth}px, scrollWidth: ${metrics.scrollWidth}px`);
        console.log(`  horizontal scroll: ${metrics.hasHorizontalScroll ? '⚠️ YES (FAIL)' : '✓ None (PASS)'}`);
        if (metrics.overflowCount > 0) {
          console.log(`  overflow elements:`, metrics.overflowSample);
        }
        for (const ar of metrics.actionRows) {
          console.log(`  button row (.${ar.selector}) [${ar.count} btns] side-by-side: ${ar.isSideBySide ? '✓ YES (Single line)' : '⚠️ NO (Stacked)'}`);
          if (!ar.isSideBySide) allPassed = false;
        }
      }
    }

    ws.close();
    if (allPassed) {
      console.log('\n🎉 ALL MOBILE VIEWPORT & RESPONSIVENESS TESTS PASSED!\n');
    } else {
      console.log('\n❌ SOME MOBILE CHECKS FAILED');
      process.exit(1);
    }
  } finally {
    chrome.kill('SIGKILL');
    staticServer.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
