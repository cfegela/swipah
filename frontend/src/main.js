import './style.css';
import QRCode from 'qrcode';
import {
  ensureAnonymousSession,
  createRoom,
  joinRoom,
  fetchRoom,
  leaveRoom,
  subscribeToRoom,
  startGame,
  fetchRoomTurnState,
} from './supabase.js';

// Application State
let currentUser = null;
let currentRoom = null;
let currentPlayers = [];
let unsubscribeRealtime = null;
let currentSubscribedRoomId = null;
let lobbyPollInterval = null;
let gamePollInterval = null;

// Audio Alert System (Web Audio API)
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch (_) {}
  }
}

if (typeof window !== 'undefined') {
  ['click', 'touchstart', 'pointerdown', 'keydown'].forEach((eventName) => {
    window.addEventListener(eventName, unlockAudio, { passive: true });
  });
}

async function playChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // Pleasant ascending chime: F5 (698Hz) -> A5 (880Hz) -> C6 (1046Hz)
    const notes = [
      { freq: 698.46, time: now, dur: 0.25, peak: 0.16 },
      { freq: 880.00, time: now + 0.08, dur: 0.25, peak: 0.18 },
      { freq: 1046.50, time: now + 0.16, dur: 0.45, peak: 0.22 },
    ];

    notes.forEach(({ freq, time, dur, peak }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(peak, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + dur);
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60, 40, 60]);
    }
  } catch (err) {
    console.warn('Could not play chime:', err);
  }
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Helpers: Local Storage
const STORAGE_KEY_NAME = 'swipah_player_name';

function getSavedName() {
  return localStorage.getItem(STORAGE_KEY_NAME) || '';
}

function saveName(name) {
  if (name) {
    localStorage.setItem(STORAGE_KEY_NAME, name.trim());
  }
}

// Helpers: URL Query Params
function getQueryParam(key) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key);
}

function setRoomUrl(roomId) {
  const url = new URL(window.location.href);
  if (roomId) {
    url.searchParams.set('room', roomId);
  } else {
    url.searchParams.delete('room');
  }
  window.history.pushState({}, '', url.toString());
}

// DOM Elements
const landingView = document.getElementById('landing-view');
const lobbyView = document.getElementById('lobby-view');
const gameView = document.getElementById('game-view');

const hostCard = document.getElementById('host-card');
const joinCard = document.getElementById('join-card');

const hostModal = document.getElementById('host-modal');
const hostPlayerName = document.getElementById('host-player-name');
const btnOpenHostPrompt = document.getElementById('btn-open-host-prompt');
const btnCancelHost = document.getElementById('btn-cancel-host');
const btnConfirmCreateRoom = document.getElementById('btn-confirm-create-room');

const joinPlayerName = document.getElementById('join-player-name');
const btnJoinGame = document.getElementById('btn-join-game');

const qrModal = document.getElementById('qr-modal');
const qrCanvas = document.getElementById('qr-canvas');
const btnCloseQr = document.getElementById('btn-close-qr');

const endGameModal = document.getElementById('end-game-modal');
const btnCancelEndGame = document.getElementById('btn-cancel-end-game');
const btnConfirmEndGame = document.getElementById('btn-confirm-end-game');

const alertBox = document.getElementById('alert-box');
const alertMsg = document.getElementById('alert-msg');
const alertClose = document.getElementById('alert-close');

const seatsGrid = document.getElementById('seats-grid');
const playerCount = document.getElementById('player-count');
const hostInviteControls = document.getElementById('host-invite-controls');
const lobbyWaitMsg = document.getElementById('lobby-wait-msg');
const btnCopyLink = document.getElementById('btn-copy-link');
const btnShowQr = document.getElementById('btn-show-qr');
const btnStartGame = document.getElementById('btn-start-game');
const btnLeaveLobby = document.getElementById('btn-leave-lobby');

const gamePlayersList = document.getElementById('game-players-list');
const btnEndActiveGame = document.getElementById('btn-end-active-game');
const btnLeaveActiveGame = document.getElementById('btn-leave-active-game');

// Alerts
function showAlert(message, type = 'error') {
  alertMsg.textContent = message;
  alertBox.className = `alert alert-${type}`;
  alertBox.classList.remove('hidden');
}

function hideAlert() {
  alertBox.classList.add('hidden');
}

alertClose.addEventListener('click', hideAlert);

// Modals
function openHostModal() {
  hostPlayerName.value = getSavedName();
  hostModal.classList.remove('hidden');
  hostPlayerName.focus();
}

function closeHostModal() {
  hostModal.classList.add('hidden');
}

function openQrModal() {
  if (!currentRoom) return;
  const joinUrl = `${window.location.origin}${window.location.pathname}?room=${currentRoom.id}`;
  QRCode.toCanvas(qrCanvas, joinUrl, { width: 220, margin: 1, color: { dark: '#000022', light: '#ffffff' } }, (err) => {
    if (err) {
      showAlert('Failed to generate QR code: ' + err.message);
      return;
    }
    qrModal.classList.remove('hidden');
  });
}

function closeQrModal() {
  qrModal.classList.add('hidden');
}

function openEndGameModal() {
  endGameModal.classList.remove('hidden');
}

function closeEndGameModal() {
  endGameModal.classList.add('hidden');
}

// Polling
function stopPolling() {
  if (lobbyPollInterval) {
    clearInterval(lobbyPollInterval);
    lobbyPollInterval = null;
  }
  if (gamePollInterval) {
    clearInterval(gamePollInterval);
    gamePollInterval = null;
  }
}

function startLobbyPolling(roomId) {
  stopPolling();
  if (!roomId) return;
  lobbyPollInterval = setInterval(async () => {
    if (!currentRoom || currentRoom.status !== 'waiting' || currentRoom.id !== roomId) return;
    try {
      const { room: latestRoom, players: latestPlayers } = await fetchRoom(roomId);
      if (!latestRoom) return;

      if (latestRoom.status === 'in_progress') {
        stopPolling();
        currentRoom = latestRoom;
        currentPlayers = latestPlayers || currentPlayers;
        loadAndShowGameView();
      } else if (latestRoom.status === 'abandoned') {
        stopPolling();
        showAlert('The host closed this room.', 'error');
        showLandingView();
      } else if (latestPlayers && latestPlayers.length !== currentPlayers.length) {
        currentPlayers = latestPlayers;
        renderSeats();
      }
    } catch (err) {
      // Ignore transient polling errors
    }
  }, 2500);
}

// Realtime Subscriptions
function setupRealtimeSubscription(roomId) {
  if (currentSubscribedRoomId === roomId && unsubscribeRealtime) return;

  if (unsubscribeRealtime) {
    unsubscribeRealtime();
    unsubscribeRealtime = null;
  }

  currentSubscribedRoomId = roomId;

  unsubscribeRealtime = subscribeToRoom(
    roomId,
    // On players change
    async () => {
      try {
        const { players: updatedPlayers } = await fetchRoom(roomId);
        if (updatedPlayers) {
          const hadFewer = updatedPlayers.length > currentPlayers.length;
          currentPlayers = updatedPlayers;
          renderSeats();
          if (hadFewer) {
            playChime();
          }
        }
      } catch (err) {
        console.warn('Realtime player update failed:', err);
      }
    },
    // On room change
    async (payload) => {
      const updatedRoom = payload.new;
      if (!updatedRoom) return;
      currentRoom = updatedRoom;

      if (updatedRoom.status === 'in_progress') {
        stopPolling();
        playChime();
        loadAndShowGameView();
      } else if (updatedRoom.status === 'abandoned') {
        stopPolling();
        showAlert('The host closed this room.', 'error');
        showLandingView();
      }
    }
  );
}

// Render Seats in Lobby
function renderSeats() {
  if (!currentRoom) return;

  const myPlayer = currentPlayers.find((p) => p.user_id === currentUser?.id);
  playerCount.textContent = currentPlayers.length;

  seatsGrid.innerHTML = '';

  for (let seatNum = 1; seatNum <= (currentRoom.max_players || 4); seatNum++) {
    const player = currentPlayers.find((p) => p.seat_number === seatNum);
    const seatEl = document.createElement('div');
    const isMe = myPlayer && player && player.user_id === myPlayer.user_id;

    if (player) {
      seatEl.className = `seat-card seat-occupied ${isMe ? 'seat-me' : ''}`;
      const initial = (player.display_name || '?').charAt(0).toUpperCase();

      seatEl.innerHTML = `
        ${player.is_host ? '<div class="status-host-badge">👑 Host</div>' : ''}
        <div class="seat-header">
          <span>Seat ${seatNum}</span>
          ${isMe ? '<span style="color: var(--tinder-pink); font-weight: 800;">(You)</span>' : ''}
        </div>
        <div class="seat-avatar">${escapeHtml(initial)}</div>
        <div class="seat-name">${escapeHtml(player.display_name)}</div>
        <div class="status-badge status-connected">
          ● Connected
        </div>
      `;
    } else {
      seatEl.className = 'seat-card seat-empty';
      seatEl.innerHTML = `
        <div class="seat-header">
          <span>Seat ${seatNum}</span>
        </div>
        <div class="seat-avatar-empty">+</div>
        <div class="seat-name" style="font-size: 0.95rem; color: var(--text-muted);">Empty Slot</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">Waiting for player...</div>
      `;
    }

    seatsGrid.appendChild(seatEl);
  }

  // Update button states and host-only elements
  if (myPlayer) {
    if (myPlayer.is_host) {
      if (hostInviteControls) hostInviteControls.classList.remove('hidden');
      btnStartGame.classList.remove('hidden');
      if (lobbyWaitMsg) lobbyWaitMsg.classList.add('hidden');
      const canStart = currentPlayers.length >= 1;
      btnStartGame.disabled = !canStart;
      btnStartGame.title = canStart ? 'Start Game' : 'Need at least 1 player';
    } else {
      if (hostInviteControls) hostInviteControls.classList.add('hidden');
      btnStartGame.classList.add('hidden');
      if (lobbyWaitMsg) lobbyWaitMsg.classList.remove('hidden');
    }
  }
}

// Switch to Lobby View
function showLobbyView(room, players) {
  currentRoom = room;
  currentPlayers = players;

  landingView.classList.add('hidden');
  gameView.classList.add('hidden');
  lobbyView.classList.remove('hidden');

  setRoomUrl(room.id);
  renderSeats();
  setupRealtimeSubscription(room.id);
  startLobbyPolling(room.id);
}

// Switch to Landing View
function showLandingView() {
  stopPolling();
  if (unsubscribeRealtime) {
    unsubscribeRealtime();
    unsubscribeRealtime = null;
  }
  currentSubscribedRoomId = null;
  currentRoom = null;
  currentPlayers = [];

  setRoomUrl(null);
  closeHostModal();
  closeQrModal();
  closeEndGameModal();

  lobbyView.classList.add('hidden');
  gameView.classList.add('hidden');
  landingView.classList.remove('hidden');

  hostCard.classList.remove('hidden');
  joinCard.classList.add('hidden');
}

// Switch to Active Game Placeholder View
function loadAndShowGameView() {
  landingView.classList.add('hidden');
  lobbyView.classList.add('hidden');
  gameView.classList.remove('hidden');

  const myPlayer = currentPlayers.find((p) => p.user_id === currentUser?.id);
  const isHost = myPlayer?.is_host;

  if (isHost) {
    btnEndActiveGame.style.display = 'inline-flex';
  } else {
    btnEndActiveGame.style.display = 'none';
  }

  // Render players list in active game
  if (gamePlayersList) {
    gamePlayersList.innerHTML = `
      <h4 style="margin-bottom: 0.75rem; color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase;">Players in Match (${currentPlayers.length})</h4>
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        ${currentPlayers.map(p => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.04); border-radius: 8px;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-weight: 700;">Seat ${p.seat_number}:</span>
              <span>${escapeHtml(p.display_name)}</span>
              ${p.is_host ? '<span style="font-size: 0.75rem; color: #ff916b;">(Host)</span>' : ''}
              ${p.user_id === currentUser?.id ? '<span style="font-size: 0.75rem; color: var(--tinder-pink); font-weight: 700;">(You)</span>' : ''}
            </div>
            <span style="color: #4ade80; font-size: 0.8rem;">Ready</span>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// Event Listeners: Host Game
btnOpenHostPrompt.addEventListener('click', openHostModal);
btnCancelHost.addEventListener('click', closeHostModal);

btnConfirmCreateRoom.addEventListener('click', async () => {
  const name = hostPlayerName.value.trim();
  if (!name) {
    showAlert('Please enter a username.');
    return;
  }

  saveName(name);
  btnConfirmCreateRoom.disabled = true;
  btnConfirmCreateRoom.textContent = 'Creating...';

  try {
    const data = await createRoom(name);
    closeHostModal();
    showLobbyView(data.room, [data.player]);
  } catch (err) {
    showAlert('Failed to create room: ' + err.message);
  } finally {
    btnConfirmCreateRoom.disabled = false;
    btnConfirmCreateRoom.textContent = 'Start Game';
  }
});

hostPlayerName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    btnConfirmCreateRoom.click();
  }
});

// Event Listeners: Join Game
btnJoinGame.addEventListener('click', async () => {
  const roomId = getQueryParam('room');
  if (!roomId) {
    showAlert('Invalid invite link: Missing room ID.');
    return;
  }

  const name = joinPlayerName.value.trim();
  if (!name) {
    showAlert('Please enter a username.');
    return;
  }

  saveName(name);
  btnJoinGame.disabled = true;
  btnJoinGame.textContent = 'Joining...';

  try {
    const data = await joinRoom(roomId, name);
    const { room, players } = await fetchRoom(roomId);
    showLobbyView(room, players);
  } catch (err) {
    showAlert('Failed to join room: ' + err.message);
  } finally {
    btnJoinGame.disabled = false;
    btnJoinGame.textContent = 'Join Game';
  }
});

joinPlayerName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    btnJoinGame.click();
  }
});

// Event Listeners: Lobby Controls
btnCopyLink.addEventListener('click', async () => {
  if (!currentRoom) return;
  const joinUrl = `${window.location.origin}${window.location.pathname}?room=${currentRoom.id}`;
  try {
    await navigator.clipboard.writeText(joinUrl);
    const originalText = btnCopyLink.textContent;
    btnCopyLink.textContent = 'Copied!';
    setTimeout(() => {
      btnCopyLink.textContent = originalText;
    }, 2000);
  } catch (err) {
    showAlert('Failed to copy link to clipboard: ' + err.message);
  }
});

btnShowQr.addEventListener('click', openQrModal);
btnCloseQr.addEventListener('click', closeQrModal);

btnStartGame.addEventListener('click', async () => {
  if (!currentRoom) return;
  btnStartGame.disabled = true;
  btnStartGame.textContent = 'Starting...';

  try {
    const data = await startGame(currentRoom.id);
    currentRoom = data.room;
    loadAndShowGameView();
  } catch (err) {
    showAlert('Failed to start game: ' + err.message);
    btnStartGame.disabled = false;
    btnStartGame.textContent = 'Start Game';
  }
});

btnLeaveLobby.addEventListener('click', () => {
  if (!currentRoom) return;
  const myPlayer = currentPlayers.find((p) => p.user_id === currentUser?.id);
  if (myPlayer?.is_host) {
    openEndGameModal();
  } else {
    leaveRoom(currentRoom.id)
      .then(() => showLandingView())
      .catch((err) => showAlert('Failed to leave room: ' + err.message));
  }
});

btnCancelEndGame.addEventListener('click', closeEndGameModal);

btnConfirmEndGame.addEventListener('click', async () => {
  if (!currentRoom) return;
  btnConfirmEndGame.disabled = true;
  btnConfirmEndGame.textContent = 'Ending...';

  try {
    await leaveRoom(currentRoom.id);
    closeEndGameModal();
    showLandingView();
  } catch (err) {
    showAlert('Failed to end game: ' + err.message);
  } finally {
    btnConfirmEndGame.disabled = false;
    btnConfirmEndGame.textContent = 'End Game';
  }
});

btnEndActiveGame.addEventListener('click', openEndGameModal);

btnLeaveActiveGame.addEventListener('click', () => {
  if (!currentRoom) return;
  const myPlayer = currentPlayers.find((p) => p.user_id === currentUser?.id);
  if (myPlayer?.is_host) {
    openEndGameModal();
  } else {
    leaveRoom(currentRoom.id)
      .then(() => showLandingView())
      .catch((err) => showAlert('Failed to leave game: ' + err.message));
  }
});

// App Initialization
async function init() {
  try {
    currentUser = await ensureAnonymousSession();
  } catch (err) {
    showAlert('Could not initialize guest session: ' + err.message);
    return;
  }

  const inviteRoomId = getQueryParam('room');

  if (inviteRoomId) {
    // If room query param exists, verify room validity
    try {
      const { room, players } = await fetchRoom(inviteRoomId);
      if (room.status === 'abandoned') {
        showAlert('This room was closed or abandoned.', 'error');
        showLandingView();
        return;
      }
      if (room.status === 'in_progress') {
        const myPlayer = players.find((p) => p.user_id === currentUser?.id);
        if (myPlayer) {
          currentRoom = room;
          currentPlayers = players;
          loadAndShowGameView();
          return;
        } else {
          showAlert('This match is already in progress.', 'error');
          showLandingView();
          return;
        }
      }

      // Check if user is already a member (page refresh / reconnect)
      const myPlayer = players.find((p) => p.user_id === currentUser?.id);
      if (myPlayer) {
        showLobbyView(room, players);
        return;
      }

      // Otherwise show join card
      hostCard.classList.add('hidden');
      joinCard.classList.remove('hidden');
      joinPlayerName.value = getSavedName();
      joinPlayerName.focus();
    } catch (err) {
      showAlert('Room not found or invite expired.');
      showLandingView();
    }
  } else {
    hostCard.classList.remove('hidden');
    joinCard.classList.add('hidden');
  }
}

init();
