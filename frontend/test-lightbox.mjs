import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      const res = await fetch('http://127.0.0.1:9224/json');
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
  console.log('🔍 Testing Profile Photo Lightbox Interaction...\n');

  const PORT = 5199;
  const distDir = fs.existsSync(path.resolve('dist'))
    ? path.resolve('dist')
    : path.resolve('frontend/dist');
  const staticServer = await startStaticServer(distDir, PORT);

  const testUrl = `http://127.0.0.1:${PORT}`;
  const chrome = spawn(
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    [
      '--headless=new',
      '--remote-debugging-port=9224',
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
    await wait(300);

    // Setup active game view with a mock profile
    const setupResult = await send('Runtime.evaluate', {
      expression: `(() => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
        document.getElementById('landing-view').classList.add('hidden');
        document.getElementById('lobby-view').classList.add('hidden');
        document.getElementById('game-view').classList.remove('hidden');

        // Populate sample profile
        const wrapper = document.getElementById('profile-card-wrapper');
        wrapper.innerHTML = \`
          <div class="dating-profile-card" id="active-profile-card">
            <div class="profile-hero" id="test-hero">
              <img src="/profiles/chad-thunderclout.jpg" alt="Chad Thunderclout" class="profile-hero-photo" />
              <div class="profile-hero-gradient"></div>
              <div class="profile-header-overlay">
                <span class="profile-name">Chad Thunderclout</span>
                <span class="profile-age">24</span>
              </div>
            </div>
            <div class="profile-content">
              <div class="profile-bio">Gym, crypto, protein shakes.</div>
            </div>
          </div>
        \`;

        // Check modal element exists
        const modal = document.getElementById('photo-lightbox-modal');
        const img = document.getElementById('lightbox-img');
        const closeBtn = document.getElementById('btn-close-lightbox');
        return {
          hasModal: !!modal,
          hasImg: !!img,
          hasCloseBtn: !!closeBtn,
          isModalHidden: modal.classList.contains('hidden')
        };
      })()`,
      returnByValue: true
    });

    const setupVal = setupResult.result.value;
    console.log('1. Checking DOM structure for lightbox:', setupVal);
    if (!setupVal.hasModal || !setupVal.isModalHidden) {
      throw new Error('Lightbox modal not configured properly in initial state');
    }

    // Simulate clicking .profile-hero via dispatching click event
    const clickHeroRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const hero = document.getElementById('test-hero');
        hero.click();
        const modal = document.getElementById('photo-lightbox-modal');
        const img = document.getElementById('lightbox-img');
        return {
          isModalHidden: modal.classList.contains('hidden'),
          imgSrc: img.src,
          imgDisplay: window.getComputedStyle(img).display
        };
      })()`,
      returnByValue: true
    });
    const clickHeroVal = clickHeroRes.result.value;
    console.log('2. Click on profile hero opens lightbox:', clickHeroVal);
    if (clickHeroVal.isModalHidden) {
      throw new Error('Modal did not open on hero click');
    }

    // Simulate clicking close button
    const clickCloseRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const closeBtn = document.getElementById('btn-close-lightbox');
        closeBtn.click();
        const modal = document.getElementById('photo-lightbox-modal');
        return {
          isModalHidden: modal.classList.contains('hidden')
        };
      })()`,
      returnByValue: true
    });
    const clickCloseVal = clickCloseRes.result.value;
    console.log('3. Click close button dismisses lightbox:', clickCloseVal);
    if (!clickCloseVal.isModalHidden) {
      throw new Error('Modal did not close on close button click');
    }

    // Reopen and test tap-anywhere-to-dismiss (clicking overlay background)
    const tapAnywhereRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const hero = document.getElementById('test-hero');
        hero.click();
        const modal = document.getElementById('photo-lightbox-modal');
        const opened = !modal.classList.contains('hidden');
        modal.click();
        const closed = modal.classList.contains('hidden');
        return { opened, closed };
      })()`,
      returnByValue: true
    });
    const tapAnywhereVal = tapAnywhereRes.result.value;
    console.log('4. Tap anywhere to dismiss modal:', tapAnywhereVal);
    if (!tapAnywhereVal.opened || !tapAnywhereVal.closed) {
      throw new Error('Tap anywhere to dismiss did not work');
    }

    // Reopen and test Escape key to dismiss
    const escRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const hero = document.getElementById('test-hero');
        hero.click();
        const modal = document.getElementById('photo-lightbox-modal');
        const opened = !modal.classList.contains('hidden');
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        const closed = modal.classList.contains('hidden');
        return { opened, closed };
      })()`,
      returnByValue: true
    });
    const escVal = escRes.result.value;
    console.log('5. Escape key dismisses modal:', escVal);
    if (!escVal.opened || !escVal.closed) {
      throw new Error('Escape key did not dismiss modal');
    }

    // Test swipe gesture does NOT trigger photo lightbox
    const swipeRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const wrapper = document.getElementById('profile-card-wrapper');
        const hero = document.getElementById('test-hero');
        const modal = document.getElementById('photo-lightbox-modal');

        // Simulate swipe/drag
        wrapper.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100, button: 0 }));
        window.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 160, clientY: 100 }));
        window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 160, clientY: 100 }));
        hero.click();

        return {
          isModalStillHidden: modal.classList.contains('hidden')
        };
      })()`,
      returnByValue: true
    });
    const swipeVal = swipeRes.result.value;
    console.log('6. Swiping does not open lightbox:', swipeVal);
    if (!swipeVal.isModalStillHidden) {
      throw new Error('Swipe gesture incorrectly triggered photo lightbox');
    }

    // Test multi-photo lightbox swiping, buttons, dots, and keyboard navigation
    const multiPhotoRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const wrapper = document.getElementById('profile-card-wrapper');
        wrapper.innerHTML = \`
          <div class="dating-profile-card" id="active-profile-card">
            <div class="profile-hero" id="test-hero-multi" data-photos='["/profiles/luna-starweaver.jpg","/profiles/luna-starweaver-2.jpg","/profiles/luna-starweaver-3.jpg"]'>
              <img src="/profiles/luna-starweaver.jpg" alt="Luna Starweaver" class="profile-hero-photo" />
              <div class="profile-hero-gradient"></div>
              <div class="profile-header-overlay">
                <span class="profile-name">Luna Starweaver</span>
                <span class="profile-age">22</span>
              </div>
            </div>
          </div>
        \`;

        // Clear any leftover drag flag cleanly by tapping down/up without moving first
        wrapper.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100, button: 0 }));
        window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 100, clientY: 100 }));

        const hero = document.getElementById('test-hero-multi');
        hero.click();

        const modal = document.getElementById('photo-lightbox-modal');
        const img = document.getElementById('lightbox-img');
        const getActiveDotIdx = () =>
          Array.from(document.querySelectorAll('#lightbox-dots .lightbox-dot')).findIndex((d) =>
            d.classList.contains('active')
          );

        const prevDotArrow = document.querySelector('#lightbox-dots .lightbox-dot-arrow[data-lightbox-step="-1"]');
        const nextDotArrow = document.querySelector('#lightbox-dots .lightbox-dot-arrow[data-lightbox-step="1"]');

        const initial = {
          open: !modal.classList.contains('hidden'),
          hasCounter: !!document.getElementById('lightbox-counter'),
          activeDot: getActiveDotIdx(),
          src: img.getAttribute('src'),
          hasPrevArrow: !!document.getElementById('btn-lightbox-prev'),
          hasNextArrow: !!document.getElementById('btn-lightbox-next'),
          hasDotPrevArrow: !!prevDotArrow,
          hasDotNextArrow: !!nextDotArrow,
          prevDisabledAtStart: !!prevDotArrow?.disabled,
          nextDisabledAtStart: !!nextDotArrow?.disabled,
          dotsCount: document.querySelectorAll('#lightbox-dots .lightbox-dot').length
        };

        // Click small next arrow beside dots -> photo 2
        nextDotArrow.click();
        const afterNextArrowClick = {
          stillOpen: !modal.classList.contains('hidden'),
          activeDot: getActiveDotIdx(),
          src: img.getAttribute('src')
        };

        // Click small prev arrow beside dots -> back to photo 1
        document.querySelector('#lightbox-dots .lightbox-dot-arrow[data-lightbox-step="-1"]').click();
        const afterPrevArrowClick = {
          stillOpen: !modal.classList.contains('hidden'),
          activeDot: getActiveDotIdx(),
          src: img.getAttribute('src')
        };

        // Swipe left inside lightbox -> should go to photo 2 and NOT close modal even if click fires
        modal.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 250, clientY: 300, button: 0 }));
        modal.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 140, clientY: 300 }));
        modal.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 140, clientY: 300 }));
        modal.click();

        const afterSwipeLeft1 = {
          stillOpen: !modal.classList.contains('hidden'),
          activeDot: getActiveDotIdx(),
          src: img.getAttribute('src')
        };

        // Swipe left again -> photo 3
        modal.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 250, clientY: 300, button: 0 }));
        modal.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 140, clientY: 300 }));
        modal.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 140, clientY: 300 }));
        const afterSwipeLeft2 = {
          activeDot: getActiveDotIdx(),
          src: img.getAttribute('src')
        };

        // Keyboard ArrowLeft -> back to photo 2
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
        const afterArrowLeft = {
          activeDot: getActiveDotIdx(),
          src: img.getAttribute('src')
        };

        // Dot 0 click -> back to photo 1
        document.querySelectorAll('#lightbox-dots .lightbox-dot')[0].click();
        const afterDotClick = {
          activeDot: getActiveDotIdx(),
          src: img.getAttribute('src')
        };

        return { initial, afterNextArrowClick, afterPrevArrowClick, afterSwipeLeft1, afterSwipeLeft2, afterArrowLeft, afterDotClick };
      })()`,
      returnByValue: true
    });
    const multiVal = multiPhotoRes.result.value;
    console.log('7. Multi-photo lightbox swipe/controls:', JSON.stringify(multiVal));
    if (
      !multiVal.initial.open ||
      multiVal.initial.hasCounter ||
      multiVal.initial.activeDot !== 0 ||
      multiVal.initial.dotsCount !== 3 ||
      multiVal.initial.hasPrevArrow ||
      multiVal.initial.hasNextArrow ||
      !multiVal.initial.hasDotPrevArrow ||
      !multiVal.initial.hasDotNextArrow ||
      !multiVal.initial.prevDisabledAtStart ||
      multiVal.initial.nextDisabledAtStart ||
      !multiVal.afterNextArrowClick.stillOpen ||
      multiVal.afterNextArrowClick.activeDot !== 1 ||
      !multiVal.afterPrevArrowClick.stillOpen ||
      multiVal.afterPrevArrowClick.activeDot !== 0 ||
      !multiVal.afterSwipeLeft1.stillOpen ||
      multiVal.afterSwipeLeft1.activeDot !== 1 ||
      !multiVal.afterSwipeLeft1.src.includes('luna-starweaver-2.jpg') ||
      multiVal.afterSwipeLeft2.activeDot !== 2 ||
      !multiVal.afterSwipeLeft2.src.includes('luna-starweaver-3.jpg') ||
      multiVal.afterArrowLeft.activeDot !== 1 ||
      multiVal.afterDotClick.activeDot !== 0 ||
      !multiVal.afterDotClick.src.includes('luna-starweaver.jpg')
    ) {
      throw new Error('Multi-photo lightbox test failed: ' + JSON.stringify(multiVal));
    }

    console.log('\n✨ ALL LIGHTBOX INTERACTION TESTS PASSED!');
    ws.close();
  } finally {
    chrome.kill();
    staticServer.close();
  }
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
