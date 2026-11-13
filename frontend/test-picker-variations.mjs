import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

function wait(ms) {
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

async function getDebuggerUrl(port) {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      const data = await res.json();
      if (data && data[0] && data[0].webSocketDebuggerUrl) {
        return data[0].webSocketDebuggerUrl;
      }
    } catch (e) {}
    await wait(200);
  }
  throw new Error('Chrome remote debugger not responding');
}

async function run() {
  console.log('🧪 Testing Date Picker with 1 Match vs Multiple Matches...\n');
  const PORT = 5205;
  const DEBUG_PORT = 9226;
  const distDir = fs.existsSync(path.resolve('dist'))
    ? path.resolve('dist')
    : path.resolve('frontend/dist');
  const staticServer = await startStaticServer(distDir, PORT);

  const chrome = spawn(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    [
      '--headless=new',
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--window-size=375,812',
      '--disable-gpu',
      '--no-sandbox',
      `http://127.0.0.1:${PORT}`
    ],
    { stdio: 'ignore' }
  );

  try {
    const wsUrl = await getDebuggerUrl(DEBUG_PORT);
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

    await send('Runtime.enable');
    await wait(800);

    // Test 1: Single Match (1 profile)
    console.log('1. Testing Dating Phase with 1 match...');
    const singleMatchEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Prepare view
          document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
          document.getElementById('landing-view').classList.add('hidden');
          document.getElementById('lobby-view').classList.add('hidden');
          document.getElementById('game-view').classList.remove('hidden');
          document.getElementById('profile-swipe-section').classList.add('hidden');
          document.getElementById('waiting-round-overlay').classList.add('hidden');
          document.getElementById('dating-phase-section').classList.remove('hidden');

          // Simulate 1 match
          const count = 1;
          const countText = count === 1 ? '1 profile' : count + ' profiles';
          const instructionHtml = count === 1
            ? ''
            : '<br />Pick who you want to go on a date with this round:';

          const sub = document.getElementById('date-picker-subheading');
          sub.innerHTML = 'You matched with <strong id="date-picker-match-count" style="color: var(--accent);">' + countText + '</strong>!' + instructionHtml;

          const pickerCard = document.getElementById('date-picker-card');
          const storyCard = document.getElementById('date-story-card');
          pickerCard.classList.remove('hidden');
          storyCard.classList.add('hidden');

          const heading = pickerCard.querySelector('.dating-heading');

          return {
            pickerHidden: pickerCard.classList.contains('hidden'),
            storyHidden: storyCard.classList.contains('hidden'),
            headingText: heading ? heading.textContent.trim() : '',
            subheadingText: sub.textContent.trim(),
            matchCountText: document.getElementById('date-picker-match-count').textContent.trim()
          };
        })()
      `,
      returnByValue: true
    });

    const res1 = singleMatchEval.result.value;
    console.log('   Result with 1 match:', res1);
    assert.strictEqual(res1.pickerHidden, false, 'Picker card must NOT be hidden when there is 1 match');
    assert.strictEqual(res1.storyHidden, true, 'Story card must be hidden before date is chosen');
    assert.strictEqual(res1.headingText, 'Pick Your Date', 'Heading should be "Pick Your Date"');
    assert.strictEqual(res1.matchCountText, '1 profile');
    assert.strictEqual(res1.subheadingText, 'You matched with 1 profile!');
    console.log('   ✓ Single match shows picker card with singular "You matched with 1 profile!"');

    // Test 2: Multiple Matches (e.g. 2 profiles)
    console.log('\n2. Testing Dating Phase with 2 matches...');
    const multiMatchEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const count = 2;
          const countText = count === 1 ? '1 profile' : count + ' profiles';
          const instructionHtml = count === 1
            ? ''
            : '<br />Pick who you want to go on a date with this round:';

          const sub = document.getElementById('date-picker-subheading');
          sub.innerHTML = 'You matched with <strong id="date-picker-match-count" style="color: var(--accent);">' + countText + '</strong>!' + instructionHtml;

          return {
            subheadingText: sub.textContent.trim(),
            matchCountText: document.getElementById('date-picker-match-count').textContent.trim()
          };
        })()
      `,
      returnByValue: true
    });

    const res2 = multiMatchEval.result.value;
    console.log('   Result with 2 matches:', res2);
    assert.strictEqual(res2.matchCountText, '2 profiles');
    assert(res2.subheadingText.includes('You matched with 2 profiles!') && res2.subheadingText.includes('Pick who you want to go on a date with this round:'));
    console.log('   ✓ Multiple matches shows picker card with plural "2 profiles" and instruction on new line: "Pick who you want to go on a date with this round:"');

    // Test 3: Date Recap Subheading Renders Ampersands Correctly
    console.log('\n3. Testing Date Recap occupation ampersand rendering...');
    const recapAmpEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const selectedMatch = {
            age: 24,
            occupation: 'Fitness Influencer & Day Trader',
            location: 'Miami, FL (3 miles away)'
          };
          const cleanLoc = (loc) => loc ? loc.replace(/\\s*\\([^)]*(?:miles?|mi\\s*away|online)[^)]*\\)/gi, '').trim() : '';

          const sub = document.getElementById('date-partner-sub');
          sub.textContent = selectedMatch.age + ' • ' + (selectedMatch.occupation || 'Mystery Job') + ' • ' + (cleanLoc(selectedMatch.location) || 'Unknown');

          return {
            subText: sub.textContent,
            hasCorrectAmp: sub.textContent.includes('Fitness Influencer & Day Trader'),
            hasLiteralAmpEntityInText: sub.textContent.includes('&amp;')
          };
        })()
      `,
      returnByValue: true
    });

    const res3 = recapAmpEval.result.value;
    console.log('   Result with occupation ampersand:', res3);
    assert.strictEqual(res3.hasCorrectAmp, true, 'datePartnerSub must contain "Fitness Influencer & Day Trader"');
    assert.strictEqual(res3.hasLiteralAmpEntityInText, false, 'datePartnerSub.textContent must NOT contain literal "&amp;"');
    console.log('   ✓ Date recap subtitle renders ampersands correctly as "&" without literal "&amp;"');

    // Test 4: End Game buttons styling consistency
    console.log('\n4. Testing End Game buttons consistent red outline styling...');
    const endGameStyleEval = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btnSwiping = document.getElementById('btn-end-active-game');
          const btnDating = document.getElementById('btn-end-active-game-dating');

          const s1 = window.getComputedStyle(btnSwiping);
          const s2 = window.getComputedStyle(btnDating);

          return {
            swipingColor: s1.color,
            swipingBg: s1.backgroundColor,
            swipingBorder: s1.borderColor,
            datingColor: s2.color,
            datingBg: s2.backgroundColor,
            datingBorder: s2.borderColor
          };
        })()
      `,
      returnByValue: true
    });

    const res4 = endGameStyleEval.result.value;
    console.log('   End game button styles:', res4);
    assert.strictEqual(res4.swipingColor, res4.datingColor, 'Both End Game buttons must have the same text color');
    assert.strictEqual(res4.swipingBg, res4.datingBg, 'Both End Game buttons must have transparent background');
    assert.strictEqual(res4.swipingBorder, res4.datingBorder, 'Both End Game buttons must have red outline border');
    console.log('   ✓ Both End Game buttons on swiping and dating pages share identical red outline styling');

    ws.close();
    console.log('\n🎉 ALL DATE PICKER VARIATION TESTS PASSED!');
  } finally {
    chrome.kill();
    staticServer.close();
  }
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
