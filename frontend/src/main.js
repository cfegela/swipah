import './style.css';
import QRCode from 'qrcode';
import { getDateStory, getConciliatoryMessage } from './dateStories.js';
import {
  ensureAnonymousSession,
  createRoom,
  joinRoom,
  fetchRoom,
  leaveRoom,
  subscribeToRoom,
  startGame,
  fetchGameRoundState,
  submitLike,
  resolvePlayerDate,
} from './supabase.js';

// Application State
let currentUser = null;
let currentRoom = null;
let currentPlayers = [];
let currentRoundProfiles = [];
let currentProfileIdx = 0;
let myLikes = [];
let myMatches = [];
let chosenDateProfileId = null;
let isResolvingDate = false;
let lastSeenRound = 0;
let lastLoggedRoundKey = '';
let isSubmittingLike = false;
let dateInProgressTimerId = null;
let dateInProgressIntervalId = null;
let dateInProgressActive = false;
let dateSuspenseCompleted = false;

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
    // Ascending melody chime: F5 (698Hz) -> A5 (880Hz) -> C6 (1046Hz)
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
const STORAGE_KEY_LOOKING_FOR = 'swipah_looking_for';

function getSavedName() {
  return localStorage.getItem(STORAGE_KEY_NAME) || '';
}

function saveName(name) {
  if (name) {
    localStorage.setItem(STORAGE_KEY_NAME, name.trim());
  }
}

function getSavedLookingFor() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOOKING_FOR);
    if (!raw) return [];
    if (raw === 'Both' || raw === 'Anything That Moves') return ['Man', 'Woman'];
    if (raw === 'Man') return ['Man'];
    if (raw === 'Woman') return ['Woman'];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function saveLookingFor(val) {
  if (Array.isArray(val)) {
    localStorage.setItem(STORAGE_KEY_LOOKING_FOR, JSON.stringify(val));
  } else if (typeof val === 'string') {
    localStorage.setItem(STORAGE_KEY_LOOKING_FOR, val);
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

// DOM Elements: Views
const landingView = document.getElementById('landing-view');
const lobbyView = document.getElementById('lobby-view');
const gameView = document.getElementById('game-view');

const hostCard = document.getElementById('host-card');
const joinCard = document.getElementById('join-card');

const hostModal = document.getElementById('host-modal');
const hostPlayerName = document.getElementById('host-player-name');
const hostLookingForGroup = document.getElementById('host-looking-for-group');
const hostLookingForInput = document.getElementById('host-looking-for');
const btnOpenHostPrompt = document.getElementById('btn-open-host-prompt');
const btnCancelHost = document.getElementById('btn-cancel-host');
const btnConfirmCreateRoom = document.getElementById('btn-confirm-create-room');

const joinPlayerName = document.getElementById('join-player-name');
const joinLookingForGroup = document.getElementById('join-looking-for-group');
const joinLookingForInput = document.getElementById('join-looking-for');
const btnJoinGame = document.getElementById('btn-join-game');

const qrModal = document.getElementById('qr-modal');
const qrCanvas = document.getElementById('qr-canvas');
const btnCloseQr = document.getElementById('btn-close-qr');

const endGameModal = document.getElementById('end-game-modal');
const btnCancelEndGame = document.getElementById('btn-cancel-end-game');
const btnConfirmEndGame = document.getElementById('btn-confirm-end-game');

// DOM Elements: Round Start & Match Modals
const roundStartModal = document.getElementById('round-start-modal');
const modalRoundTitle = document.getElementById('modal-round-title');
const btnStartRound = document.getElementById('btn-start-round');

const matchModal = document.getElementById('match-modal');
const matchPlayerAvatar = document.getElementById('match-player-avatar');
const matchProfileAvatar = document.getElementById('match-profile-avatar');
const matchProfileName = document.getElementById('match-profile-name');
const matchProfileDesc = document.getElementById('match-profile-desc');
const btnCloseMatchModal = document.getElementById('btn-close-match-modal');

// DOM Elements: Photo Lightbox Modal
const photoLightboxModal = document.getElementById('photo-lightbox-modal');
const btnCloseLightbox = document.getElementById('btn-close-lightbox');
const lightboxViewport = document.getElementById('lightbox-viewport');
const lightboxTrack = document.getElementById('lightbox-track');
const lightboxImgPrev = document.getElementById('lightbox-img-prev');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxImgNext = document.getElementById('lightbox-img-next');
const lightboxSvg = document.getElementById('lightbox-svg');
const lightboxDots = document.getElementById('lightbox-dots');

let lightboxPhotos = [];
let lightboxPhotoIndex = 0;
let lightboxProfileName = '';
let lightboxSuppressClick = false;

// DOM Elements: Alerts
const alertBox = document.getElementById('alert-box');
const alertMsg = document.getElementById('alert-msg');
const alertClose = document.getElementById('alert-close');

// DOM Elements: Lobby
const seatsGrid = document.getElementById('seats-grid');
const playerCount = document.getElementById('player-count');
const hostInviteControls = document.getElementById('host-invite-controls');
const lobbyWaitMsg = document.getElementById('lobby-wait-msg');
const btnCopyLink = document.getElementById('btn-copy-link');
const btnShowQr = document.getElementById('btn-show-qr');
const btnStartGame = document.getElementById('btn-start-game');

// DOM Elements: Game HUD & Controls
const hudRoundNumber = document.getElementById('hud-round-number');
const hudLikesRemaining = document.getElementById('hud-likes-remaining');
const hudMatchesCount = document.getElementById('hud-matches-count');
const hudScoreBox = document.getElementById('hud-score-box');
const hudScoreCount = document.getElementById('hud-score-count');
const btnEndActiveGame = document.getElementById('btn-end-active-game');
const btnLeaveActiveGame = document.getElementById('btn-leave-active-game');

// DOM Elements: Profile Swipe Deck & Waiting Area
const waitingRoundOverlay = document.getElementById('waiting-round-overlay');
const waitingRoundSubtitle = document.getElementById('waiting-round-subtitle');
const waitingPlayersList = document.getElementById('waiting-players-list');
const profileSwipeSection = document.getElementById('profile-swipe-section');
const profileCardWrapper = document.getElementById('profile-card-wrapper');
const btnPrevProfile = document.getElementById('btn-prev-profile');
const btnLikeProfile = document.getElementById('btn-like-profile');
const btnNextProfile = document.getElementById('btn-next-profile');
const currentProfileNum = document.getElementById('current-profile-num');
const totalProfilesNum = document.getElementById('total-profiles-num');

// DOM Elements: Dating Phase Section
const datingPhaseSection = document.getElementById('dating-phase-section');
const datePickerCard = document.getElementById('date-picker-card');
const datePickerGrid = document.getElementById('date-picker-grid');
const datePickerSubheading = document.getElementById('date-picker-subheading');
const datePickerMatchCount = document.getElementById('date-picker-match-count');

const dateInProgressCard = document.getElementById('date-in-progress-card');
const dateInProgressAvatar = document.getElementById('date-in-progress-avatar');
const dateInProgressName = document.getElementById('date-in-progress-name');
const dateInProgressSub = document.getElementById('date-in-progress-sub');
const dateInProgressIcon = document.getElementById('date-in-progress-icon');
const dateInProgressStatus = document.getElementById('date-in-progress-status');
const dateProgressBarFill = document.getElementById('date-progress-bar-fill');

const dateStoryCard = document.getElementById('date-story-card');
const dateOutcomeBadge = document.getElementById('date-outcome-badge');
const datePartnerAvatar = document.getElementById('date-partner-avatar');
const datePartnerName = document.getElementById('date-partner-name');
const datePartnerSub = document.getElementById('date-partner-sub');
const dateStoryContent = document.getElementById('date-story-content');
const dateScoreDeltaVal = document.getElementById('date-score-delta-val');
const btnConfirmDateRead = document.getElementById('btn-confirm-date-read');
const datingPlayersStatusBox = document.getElementById('dating-players-status-box');
const datingPlayersList = document.getElementById('dating-players-list');

const dateZeroMatchesCard = document.getElementById('date-zero-matches-card');
const zeroMatchesIcon = document.getElementById('zero-matches-icon');
const zeroMatchesHeadline = document.getElementById('zero-matches-headline');
const zeroMatchesBody = document.getElementById('zero-matches-body');
const btnConfirmZeroMatches = document.getElementById('btn-confirm-zero-matches');
const zeroMatchesPlayersStatusBox = document.getElementById('zero-matches-players-status-box');
const zeroMatchesPlayersList = document.getElementById('zero-matches-players-list');

const dateSpectatorCard = document.getElementById('date-spectator-card');
const btnEndActiveGameDating = document.getElementById('btn-end-active-game-dating');

// DOM Elements: Game Completed Section
const gameCompletedSection = document.getElementById('game-completed-section');
const completedStandingsList = document.getElementById('completed-standings-list');
const btnCompletedHome = document.getElementById('btn-completed-home');

function getRequiredLikes(player = null) {
  if (typeof player?.likes_required === 'number') {
    return player.likes_required;
  }
  const deckLen = currentRoundProfiles ? currentRoundProfiles.length : 0;
  return Math.min(3, deckLen);
}

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

// Pill Toggle Group Helpers (Supports selecting Man, Woman, or Both)
function getPillGroupSelectedValues(groupEl) {
  if (!groupEl) return [];
  const activeBtns = groupEl.querySelectorAll('.pill-radio-btn.active');
  return Array.from(activeBtns).map((b) => b.getAttribute('data-value'));
}

function computeLookingForValue(selectedArr) {
  const hasMan = selectedArr.includes('Man');
  const hasWoman = selectedArr.includes('Woman');
  if (hasMan && hasWoman) return 'Both';
  if (hasMan) return 'Man';
  if (hasWoman) return 'Woman';
  return '';
}

function setPillToggleSelections(groupEl, hiddenInputEl, selectedArr) {
  if (!groupEl || !hiddenInputEl) return;
  const buttons = groupEl.querySelectorAll('.pill-radio-btn');
  buttons.forEach((btn) => {
    const val = btn.getAttribute('data-value');
    const isSelected = selectedArr.includes(val);
    btn.classList.toggle('active', isSelected);
    btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  });
  hiddenInputEl.value = computeLookingForValue(selectedArr);
}

function initPillToggleGroup(groupEl, hiddenInputEl, onChange) {
  if (!groupEl || !hiddenInputEl) return;
  const buttons = groupEl.querySelectorAll('.pill-radio-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-value');
      let currentSelected = getPillGroupSelectedValues(groupEl);
      if (currentSelected.includes(val)) {
        currentSelected = currentSelected.filter((v) => v !== val);
      } else {
        currentSelected.push(val);
      }
      setPillToggleSelections(groupEl, hiddenInputEl, currentSelected);
      saveLookingFor(currentSelected);
      if (onChange) onChange();
    });
  });
}

function updateHostFormValidity() {
  const name = hostPlayerName.value.trim();
  const lookingFor = hostLookingForInput?.value || '';
  const isValid = name.length > 0 && lookingFor.length > 0;
  btnConfirmCreateRoom.disabled = !isValid;
}

function updateJoinFormValidity() {
  const name = joinPlayerName.value.trim();
  const lookingFor = joinLookingForInput?.value || '';
  const isValid = name.length > 0 && lookingFor.length > 0;
  btnJoinGame.disabled = !isValid;
}

// Modals
function openHostModal() {
  hostPlayerName.value = getSavedName();
  setPillToggleSelections(hostLookingForGroup, hostLookingForInput, []);
  updateHostFormValidity();
  hostModal.classList.remove('hidden');
  hostPlayerName.focus();
}

function closeHostModal() {
  hostModal.classList.add('hidden');
}

function openQrModal() {
  if (!currentRoom) return;
  const joinUrl = `${window.location.origin}${window.location.pathname}?room=${currentRoom.id}`;
  QRCode.toCanvas(
    qrCanvas,
    joinUrl,
    { width: 200, margin: 1, color: { dark: '#000022', light: '#ffffff' } },
    (err) => {
      if (err) {
        showAlert('Failed to generate QR code: ' + err.message);
        return;
      }
      qrModal.classList.remove('hidden');
    }
  );
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

function openRoundStartModal(roundNumber) {
  modalRoundTitle.textContent = `Round ${roundNumber}`;
  roundStartModal.classList.remove('hidden');
}

function closeRoundStartModal() {
  roundStartModal.classList.add('hidden');
}

function openMatchModal(profile) {
  const myPlayer = currentPlayers.find((p) => p.user_id === currentUser?.id);
  const playerInitial = (myPlayer?.display_name || 'Y').charAt(0).toUpperCase();

  matchPlayerAvatar.textContent = playerInitial;
  const avatarHtml = profile.avatar_url
    ? `<img src="${escapeHtml(profile.avatar_url)}" alt="${escapeHtml(profile.name)}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />`
    : (profile.avatar_svg || '');
  matchProfileAvatar.innerHTML = avatarHtml;
  matchProfileName.textContent = `Matched with ${profile.name}!`;
  matchProfileDesc.textContent = `You and ${profile.name} liked each other!`;

  matchModal.classList.remove('hidden');
}

function closeMatchModal() {
  matchModal.classList.add('hidden');
  if (currentRoom?.round_phase === 'dating') {
    loadAndShowGameView();
    return;
  }
  const myPlayer = currentPlayers.find((p) => p.user_id === currentUser?.id);
  const reqLikes = getRequiredLikes(myPlayer);
  if (myPlayer?.round_completed || myLikes.length >= reqLikes) {
    showWaitingOverlay();
  } else {
    renderCurrentProfile();
  }
}

function getProfilePhotos(profile) {
  if (!profile) return [];
  const candidates = [];
  if (profile.avatar_url) candidates.push(profile.avatar_url);
  if (Array.isArray(profile.extra_photos)) {
    for (const url of profile.extra_photos) {
      if (url && !candidates.includes(url)) {
        candidates.push(url);
      }
    }
  }
  return candidates;
}

let lightboxSlideResetTimer = null;

function syncLightboxNeighbors() {
  const prevUrl = lightboxPhotoIndex > 0 ? lightboxPhotos[lightboxPhotoIndex - 1] : '';
  const nextUrl =
    lightboxPhotoIndex < lightboxPhotos.length - 1 ? lightboxPhotos[lightboxPhotoIndex + 1] : '';

  if (lightboxImgPrev) {
    lightboxImgPrev.src = prevUrl || '';
    lightboxImgPrev.style.visibility = prevUrl ? 'visible' : 'hidden';
  }
  if (lightboxImgNext) {
    lightboxImgNext.src = nextUrl || '';
    lightboxImgNext.style.visibility = nextUrl ? 'visible' : 'hidden';
  }
}

function settleLightboxTrackIdle() {
  if (!lightboxTrack) return;
  lightboxTrack.classList.remove('is-sliding');
  lightboxTrack.style.transition = 'none';
  lightboxTrack.style.transform = 'translate3d(0, 0, 0)';
  syncLightboxNeighbors();
}

function renderLightboxPhoto(direction = 0, dragOffsetPx = 0, outgoingUrl = '') {
  const total = lightboxPhotos.length;
  if (total === 0) return;

  if (lightboxSlideResetTimer) {
    clearTimeout(lightboxSlideResetTimer);
    lightboxSlideResetTimer = null;
  }

  const currentUrl = lightboxPhotos[lightboxPhotoIndex];
  if (lightboxViewport) lightboxViewport.style.display = 'flex';
  lightboxImg.src = currentUrl;
  lightboxImg.alt = lightboxProfileName
    ? `${lightboxProfileName}'s photo ${lightboxPhotoIndex + 1} of ${total}`
    : `Profile photo ${lightboxPhotoIndex + 1} of ${total}`;
  lightboxImg.style.display = 'block';
  lightboxSvg.style.display = 'none';
  lightboxSvg.innerHTML = '';

  syncLightboxNeighbors();

  if (lightboxTrack) {
    if (direction !== 0 && total > 1) {
      if (direction > 0 && lightboxImgPrev && outgoingUrl) {
        lightboxImgPrev.src = outgoingUrl;
        lightboxImgPrev.style.visibility = 'visible';
      } else if (direction < 0 && lightboxImgNext && outgoingUrl) {
        lightboxImgNext.src = outgoingUrl;
        lightboxImgNext.style.visibility = 'visible';
      }

      const startPct = direction > 0 ? '0%' : '-200%';
      lightboxTrack.classList.add('is-sliding');
      lightboxTrack.style.transition = 'none';
      lightboxTrack.style.transform = `translate3d(calc(${startPct} + ${dragOffsetPx}px), 0, 0)`;
      void lightboxTrack.offsetWidth;
      lightboxTrack.style.transition = 'transform 0.26s cubic-bezier(0.22, 1, 0.36, 1)';
      lightboxTrack.style.transform = 'translate3d(-100%, 0, 0)';

      lightboxSlideResetTimer = setTimeout(() => {
        settleLightboxTrackIdle();
        lightboxSlideResetTimer = null;
      }, 275);
    } else {
      settleLightboxTrackIdle();
    }
  }

  const showMulti = total > 1;
  if (lightboxDots) {
    lightboxDots.classList.toggle('hidden', !showMulti);
    if (showMulti) {
      lightboxDots.innerHTML = lightboxPhotos
        .map(
          (_, idx) => `
          <button
            type="button"
            class="lightbox-dot ${idx === lightboxPhotoIndex ? 'active' : ''}"
            data-photo-idx="${idx}"
            aria-label="View photo ${idx + 1} of ${total}"
            aria-selected="${idx === lightboxPhotoIndex ? 'true' : 'false'}"
          ></button>`
        )
        .join('');
    } else {
      lightboxDots.innerHTML = '';
    }
  }
}

function setLightboxPhoto(idx, dragOffsetPx = 0) {
  if (idx < 0 || idx >= lightboxPhotos.length || idx === lightboxPhotoIndex) return;
  const outgoingUrl = lightboxPhotos[lightboxPhotoIndex] || '';
  const direction = idx > lightboxPhotoIndex ? 1 : -1;
  lightboxPhotoIndex = idx;
  renderLightboxPhoto(direction, dragOffsetPx, outgoingUrl);
}

function stepLightboxPhoto(delta, dragOffsetPx = 0) {
  setLightboxPhoto(lightboxPhotoIndex + delta, dragOffsetPx);
}

// Photo Lightbox Modal
function openPhotoLightbox(profile, startIdx = 0) {
  if (!profile || !photoLightboxModal) return;

  lightboxPhotos = getProfilePhotos(profile);
  lightboxProfileName = profile.name || '';

  if (lightboxPhotos.length > 0) {
    // Preload and decode sibling photos immediately so swipes never flicker
    for (const url of lightboxPhotos) {
      const pre = new Image();
      pre.src = url;
      if (typeof pre.decode === 'function') {
        pre.decode().catch(() => {});
      }
    }
    lightboxPhotoIndex = Math.max(0, Math.min(startIdx, lightboxPhotos.length - 1));
    renderLightboxPhoto(0);
  } else if (profile.avatar_svg) {
    lightboxPhotos = [];
    if (lightboxViewport) lightboxViewport.style.display = 'none';
    lightboxImg.src = '';
    lightboxImg.style.display = 'none';
    lightboxSvg.style.display = 'flex';
    lightboxSvg.innerHTML = profile.avatar_svg;
    if (lightboxDots) {
      lightboxDots.classList.add('hidden');
      lightboxDots.innerHTML = '';
    }
  } else {
    return;
  }

  photoLightboxModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closePhotoLightbox() {
  if (photoLightboxModal && !photoLightboxModal.classList.contains('hidden')) {
    photoLightboxModal.classList.add('hidden');
    document.body.style.overflow = '';
    if (lightboxSlideResetTimer) {
      clearTimeout(lightboxSlideResetTimer);
      lightboxSlideResetTimer = null;
    }
    lightboxPhotos = [];
    lightboxPhotoIndex = 0;
    lightboxProfileName = '';
    lightboxSuppressClick = false;
    if (lightboxViewport) lightboxViewport.style.display = 'flex';
    if (lightboxTrack) {
      lightboxTrack.classList.remove('is-sliding');
      lightboxTrack.style.transition = 'none';
      lightboxTrack.style.transform = 'translate3d(0, 0, 0)';
    }
    if (lightboxImgPrev) lightboxImgPrev.src = '';
    if (lightboxImgNext) lightboxImgNext.src = '';
    if (lightboxImg) {
      lightboxImg.src = '';
      lightboxImg.style.transform = '';
    }
    if (lightboxSvg) lightboxSvg.innerHTML = '';
    if (lightboxDots) lightboxDots.innerHTML = '';
  }
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
    } catch (_) {
      // Ignore transient polling errors
    }
  }, 2500);
}

function startGamePolling(roomId) {
  if (gamePollInterval) clearInterval(gamePollInterval);
  if (!roomId) return;

  gamePollInterval = setInterval(async () => {
    if (!currentRoom || currentRoom.status !== 'in_progress' || currentRoom.id !== roomId) return;
    try {
      const state = await fetchGameRoundState(roomId);
      if (!state || !state.room) return;

      if (state.room.status === 'abandoned') {
        stopPolling();
        showAlert('The host closed this game.', 'error');
        showLandingView();
        return;
      }

      if (state.room.status === 'completed') {
        stopPolling();
        currentRoom = state.room;
        currentPlayers = state.players || currentPlayers;
        await loadAndShowGameView();
        return;
      }

      // Check if round advanced
      if (state.room.current_round > currentRoom.current_round) {
        currentRoom = state.room;
        currentPlayers = state.players || currentPlayers;
        currentRoundProfiles = state.profiles || [];
        myLikes = state.my_likes || [];
        myMatches = state.my_matches || [];
        lastSeenRound = state.room.current_round;
        currentProfileIdx = 0;
        chosenDateProfileId = null;
      dateSuspenseCompleted = false;
      clearDateInProgressTimer();

        updateHUD();
        await loadAndShowGameView();
        return;
      }

      // Check if phase transitioned
      if (state.room.round_phase !== currentRoom.round_phase) {
        currentRoom = state.room;
        currentPlayers = state.players || currentPlayers;
        currentRoundProfiles = state.profiles || [];
        myLikes = state.my_likes || [];
        myMatches = state.my_matches || [];
        updateHUD();
        await loadAndShowGameView();
        return;
      }

      // Update player states in waiting overlay or dating phase
      if (state.players) {
        currentPlayers = state.players;
        myMatches = state.my_matches || myMatches;
        updateHUD();
        const myP = currentPlayers.find((p) => p.user_id === currentUser?.id);
        if (currentRoom.round_phase === 'dating') {
          renderDatingPhase();
        } else if (myP?.round_completed || myLikes.length >= getRequiredLikes(myP)) {
          renderWaitingPlayersList();
        }
      }
    } catch (_) {
      // Ignore transient errors
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
        if (currentRoom && currentRoom.status === 'in_progress') {
          const state = await fetchGameRoundState(roomId);
          if (state && state.players) {
            currentPlayers = state.players;
            myMatches = state.my_matches || myMatches;
            updateHUD();
            if (state.room.status === 'completed' || state.room.current_round > currentRoom.current_round || state.room.round_phase !== currentRoom.round_phase) {
              currentRoom = state.room;
              loadAndShowGameView();
            } else {
              const myP = currentPlayers.find((p) => p.user_id === currentUser?.id);
              if (currentRoom.round_phase === 'dating') {
                renderDatingPhase();
              } else if (myP?.round_completed || myLikes.length >= getRequiredLikes(myP)) {
                renderWaitingPlayersList();
              }
            }
          }
        } else {
          const { players: updatedPlayers } = await fetchRoom(roomId);
          if (updatedPlayers) {
            const hadFewer = updatedPlayers.length > currentPlayers.length;
            currentPlayers = updatedPlayers;
            renderSeats();
            if (hadFewer) {
              playChime();
            }
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

      if (updatedRoom.status === 'in_progress') {
        if (!currentRoom || currentRoom.status !== 'in_progress' || updatedRoom.current_round > (currentRoom.current_round || 0) || updatedRoom.round_phase !== currentRoom.round_phase) {
          currentRoom = updatedRoom;
          playChime();
          loadAndShowGameView();
        }
      } else if (updatedRoom.status === 'completed') {
        stopPolling();
        currentRoom = updatedRoom;
        playChime();
        loadAndShowGameView();
      } else if (updatedRoom.status === 'abandoned') {
        stopPolling();
        showAlert('The host closed this room.', 'error');
        showLandingView();
      }
    },
    // On likes change
    async () => {
      if (currentRoom && currentRoom.status === 'in_progress') {
        try {
          const state = await fetchGameRoundState(roomId);
          if (state) {
            currentPlayers = state.players || currentPlayers;
            myMatches = state.my_matches || myMatches;
            updateHUD();
            if (state.room.status === 'completed' || state.room.current_round > currentRoom.current_round || state.room.round_phase !== currentRoom.round_phase) {
              currentRoom = state.room;
              loadAndShowGameView();
            } else {
              const myP = currentPlayers.find((p) => p.user_id === currentUser?.id);
              if (currentRoom.round_phase === 'dating') {
                renderDatingPhase();
              } else if (myP?.round_completed || myLikes.length >= getRequiredLikes(myP)) {
                renderWaitingPlayersList();
              }
            }
          }
        } catch (_) {}
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
        ${player.is_host ? '<div class="status-host-badge">Host</div>' : ''}
        <div class="seat-header">
          <span>Player ${seatNum}</span>
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
          <span>Player ${seatNum}</span>
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

  document.getElementById('app').classList.remove('in-game');
  document.getElementById('app').classList.add('in-lobby');
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
  currentRoundProfiles = [];
  currentProfileIdx = 0;
  myLikes = [];
  myMatches = [];
  chosenDateProfileId = null;
  isResolvingDate = false;
  lastSeenRound = 0;
  lastLoggedRoundKey = '';

  setRoomUrl(null);
  closeHostModal();
  closeQrModal();
  closeEndGameModal();
  closeRoundStartModal();
  matchModal.classList.add('hidden');
  closePhotoLightbox();

  btnEndActiveGame.style.display = 'none';
  if (btnEndActiveGameDating) btnEndActiveGameDating.style.display = 'none';
  btnLeaveActiveGame.style.display = 'none';

  document.getElementById('app').classList.remove('in-lobby', 'in-game');
  lobbyView.classList.add('hidden');
  gameView.classList.add('hidden');
  if (gameCompletedSection) gameCompletedSection.classList.add('hidden');
  landingView.classList.remove('hidden');

  hostCard.classList.remove('hidden');
  joinCard.classList.add('hidden');
}

// Update Game HUD
function updateHUD() {
  const myPlayer = currentPlayers.find((p) => p.user_id === currentUser?.id);
  const reqLikes = getRequiredLikes(myPlayer);

  if (hudRoundNumber) {
    hudRoundNumber.textContent = currentRoom?.current_round || 1;
  }
  if (hudLikesRemaining) {
    const likesLeft = Math.max(0, reqLikes - myLikes.length);
    hudLikesRemaining.textContent = `${likesLeft}/${reqLikes}`;
  }
  if (hudMatchesCount) {
    hudMatchesCount.textContent = `${myPlayer ? myPlayer.matches_count : 0} ❤️`;
  }
  if (hudScoreCount) {
    if (myPlayer?.is_murdered) {
      hudScoreCount.textContent = 'Murdered';
      hudScoreCount.className = 'hud-value hud-score-value score-murdered';
    } else {
      const score = myPlayer?.score ?? 0;
      hudScoreCount.textContent = `${score} pts`;
      hudScoreCount.className = `hud-value hud-score-value ${score < 0 ? 'score-negative' : ''}`;
    }
  }
  // Only host sees the End Game button
  const isHost = !!myPlayer?.is_host;
  if (btnEndActiveGame) {
    btnEndActiveGame.style.display = isHost ? 'inline-flex' : 'none';
  }
  if (btnEndActiveGameDating) {
    btnEndActiveGameDating.style.display = isHost ? 'inline-flex' : 'none';
  }
}

// Show Waiting Screen
function showWaitingOverlay() {
  profileSwipeSection.classList.add('hidden');
  waitingRoundOverlay.classList.remove('hidden');
  const myPlayer = currentPlayers.find((p) => p.user_id === currentUser?.id);
  const reqLikes = getRequiredLikes(myPlayer);
  if (waitingRoundSubtitle) {
    waitingRoundSubtitle.textContent =
      reqLikes === 0
        ? "You've dated every eligible profile in this game! Waiting for remaining players..."
        : `You used all ${reqLikes} like${reqLikes === 1 ? '' : 's'} for this round. Waiting for other players to finish swiping...`;
  }
  renderWaitingPlayersList();
}

// Render Waiting List of Opponents
function renderWaitingPlayersList() {
  if (!waitingPlayersList) return;
  waitingPlayersList.innerHTML = currentPlayers
    .map((p) => {
      const isMe = p.user_id === currentUser?.id;
      const reqLikes = p.likes_required ?? 3;
      const isDone = p.round_completed || (p.likes_count >= reqLikes);
      const initial = (p.display_name || '?').charAt(0).toUpperCase();
      const statusHtml = p.is_murdered
        ? '<span style="color: #ef4444; font-weight: 700; font-size: 0.85rem;">Murdered 💀</span>'
        : reqLikes === 0
          ? '<span style="color: #4ade80; font-weight: 700; font-size: 0.85rem;">Dated Everyone 🏆</span>'
          : isDone
            ? `<span style="color: #4ade80; font-weight: 700; font-size: 0.85rem;">Ready (${p.likes_count || 0}/${reqLikes}) ✅</span>`
            : `<span style="color: #ff916b; font-size: 0.85rem;">Swiping... (${p.likes_count || 0}/${reqLikes}) ⏳</span>`;

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.85rem; background: rgba(255,255,255,0.05); border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--swipah-gradient); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; color: #fff;">
              ${escapeHtml(initial)}
            </div>
            <div>
              <span style="font-weight: 700; font-size: 0.9rem;">Player ${p.seat_number}</span>
              <span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 0.35rem;">(${escapeHtml(p.display_name)})</span>
              ${isMe ? '<span style="font-size: 0.75rem; color: var(--accent); font-weight: 700; margin-left: 0.35rem;">(You)</span>' : ''}
            </div>
          </div>
          <div>
            ${statusHtml}
          </div>
        </div>
      `;
    })
    .join('');
}

// Render Dating Phase Checklist
function renderDatingChecklist(containerEl) {
  if (!containerEl) return;
  containerEl.innerHTML = currentPlayers
    .map((p) => {
      const isMe = p.user_id === currentUser?.id;

      if (p.is_murdered) {
        return `
          <div class="dating-player-row murdered">
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <span style="font-size: 1.15rem;">💀</span>
              <div>
                <strong style="color: #ef4444;">${escapeHtml(p.display_name)} ${isMe ? '(You)' : ''}</strong>
                <div style="font-size: 0.78rem; color: #fca5a5;">Murdered • Spectator</div>
              </div>
            </div>
            <span style="font-size: 0.82rem; font-weight: 700; color: #fca5a5;">Ghost</span>
          </div>
        `;
      }

      if (p.date_completed) {
        return `
          <div class="dating-player-row ready">
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <span style="font-size: 1.15rem;">✓</span>
              <div>
                <strong style="color: #fff;">${escapeHtml(p.display_name)} ${isMe ? '(You)' : ''}</strong>
                <div style="font-size: 0.78rem; color: #86efac;">Score: ${p.score ?? 0} pts</div>
              </div>
            </div>
            <span style="font-size: 0.82rem; font-weight: 700; color: #22c55e;">Ready</span>
          </div>
        `;
      }

      return `
        <div class="dating-player-row reading">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <span style="font-size: 1.15rem;">📖</span>
            <div>
              <strong style="color: #fff;">${escapeHtml(p.display_name)} ${isMe ? '(You)' : ''}</strong>
              <div style="font-size: 0.78rem; color: #fcd34d;">Reading recap to group...</div>
            </div>
          </div>
          <span style="font-size: 0.82rem; font-weight: 700; color: #f59e0b;">Reading...</span>
        </div>
      `;
    })
    .join('');
}

// Date In Progress Interstitial Helpers
function clearDateInProgressTimer() {
  if (dateInProgressTimerId) {
    clearTimeout(dateInProgressTimerId);
    dateInProgressTimerId = null;
  }
  if (dateInProgressIntervalId) {
    clearInterval(dateInProgressIntervalId);
    dateInProgressIntervalId = null;
  }
  dateInProgressActive = false;
}

function startDateInProgress(profileId) {
  clearDateInProgressTimer();

  const selectedMatch = myMatches.find((m) => (m.profile_id || m.id) === profileId);
  if (!selectedMatch) return;

  chosenDateProfileId = profileId;
  dateInProgressActive = true;

  // Show only Date In Progress Card
  datePickerCard.classList.add('hidden');
  dateStoryCard.classList.add('hidden');
  dateZeroMatchesCard.classList.add('hidden');
  dateSpectatorCard.classList.add('hidden');
  if (dateInProgressCard) {
    dateInProgressCard.classList.remove('hidden');
  }

  const avatarHtml = selectedMatch.avatar_url
    ? `<img src="${escapeHtml(selectedMatch.avatar_url)}" alt="${escapeHtml(selectedMatch.name)}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />`
    : (selectedMatch.avatar_svg || '');
  if (dateInProgressAvatar) dateInProgressAvatar.innerHTML = avatarHtml;
  if (dateInProgressName) dateInProgressName.textContent = selectedMatch.name;
  if (dateInProgressSub) dateInProgressSub.textContent = `${selectedMatch.age} • ${selectedMatch.occupation || 'Mystery Job'}`;

  // Reset and animate progress bar smoothly over 10000ms
  if (dateProgressBarFill) {
    dateProgressBarFill.style.transition = 'none';
    dateProgressBarFill.style.width = '0%';
    void dateProgressBarFill.offsetWidth;
    dateProgressBarFill.style.transition = 'width 10000ms linear';
    dateProgressBarFill.style.width = '100%';
  }

  const stages = [
    { icon: '🥂', text: 'Ordering drinks & sizing each other up...' },
    { icon: '🚩', text: 'Dodging conversational red flags...' },
    { icon: '🕯️', text: 'Wondering if they\'re a psycho or the one...' },
    { icon: '🧾', text: 'Waiting for the bill... did you survive?' },
  ];

  let currentStageIdx = 0;
  if (dateInProgressIcon) dateInProgressIcon.textContent = stages[0].icon;
  if (dateInProgressStatus) {
    dateInProgressStatus.textContent = stages[0].text;
    dateInProgressStatus.style.opacity = '1';
  }

  const startTime = Date.now();
  const totalDuration = 10000;

  dateInProgressIntervalId = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const nextStageIdx = Math.min(
      Math.floor((elapsed / totalDuration) * stages.length),
      stages.length - 1
    );

    if (nextStageIdx !== currentStageIdx) {
      currentStageIdx = nextStageIdx;
      if (dateInProgressIcon) dateInProgressIcon.textContent = stages[currentStageIdx].icon;
      if (dateInProgressStatus) {
        dateInProgressStatus.style.opacity = '0';
        setTimeout(() => {
          if (dateInProgressStatus) {
            dateInProgressStatus.textContent = stages[currentStageIdx].text;
            dateInProgressStatus.style.opacity = '1';
          }
        }, 150);
      }
    }
  }, 100);

  dateInProgressTimerId = setTimeout(() => {
    clearDateInProgressTimer();
    dateSuspenseCompleted = true;
    playChime();
    renderDatingPhase();
  }, totalDuration);
}

// Render Dating Phase View
function renderDatingPhase() {
  const myPlayer = currentPlayers.find((p) => p.user_id === currentUser?.id);
  if (!myPlayer) return;

  // 1. Ghost / Murdered Spectator
  if (myPlayer.is_murdered) {
    clearDateInProgressTimer();
    datePickerCard.classList.add('hidden');
    if (dateInProgressCard) dateInProgressCard.classList.add('hidden');
    dateStoryCard.classList.add('hidden');
    dateZeroMatchesCard.classList.add('hidden');
    dateSpectatorCard.classList.remove('hidden');
    return;
  }

  // 1.5 If Date In Progress suspense is currently running, keep it visible and do not interrupt
  if (dateInProgressActive) {
    return;
  }

  // 2. Zero Matches (or Catalog Exhausted for this player)
  if (!myMatches || myMatches.length === 0) {
    clearDateInProgressTimer();
    datePickerCard.classList.add('hidden');
    if (dateInProgressCard) dateInProgressCard.classList.add('hidden');
    dateStoryCard.classList.add('hidden');
    dateSpectatorCard.classList.add('hidden');
    dateZeroMatchesCard.classList.remove('hidden');

    if (currentRoundProfiles.length === 0) {
      zeroMatchesIcon.textContent = '💘 🏆 ✨';
      zeroMatchesHeadline.textContent = 'You Dated Everyone!';
      zeroMatchesBody.innerHTML = `
        <p>You've gone on a date with every eligible profile in this game. Hang tight while the remaining players finish their dates!</p>
      `;
    } else {
      const msg = getConciliatoryMessage(currentRoom?.current_round || 1);
      zeroMatchesIcon.textContent = msg.icon;
      zeroMatchesHeadline.textContent = msg.headline;
      zeroMatchesBody.innerHTML = `
        <p>${escapeHtml(msg.body)}</p>
        <p>💡 ${escapeHtml(msg.advice)}</p>
      `;
    }

    if (myPlayer.date_completed) {
      btnConfirmZeroMatches.disabled = true;
      btnConfirmZeroMatches.textContent = '✓ Ready (Waiting for dates to finish...)';
      zeroMatchesPlayersStatusBox.classList.remove('hidden');
      renderDatingChecklist(zeroMatchesPlayersList);
    } else {
      btnConfirmZeroMatches.disabled = false;
      btnConfirmZeroMatches.textContent = 'Ready for Next Round ➔';
      zeroMatchesPlayersStatusBox.classList.add('hidden');
    }
    return;
  }

  // 3. Match Selected: Show Date Story Recap or run Date In Progress suspense
  const selectedMatch = myMatches.find(
    (m) => (m.profile_id || m.id) === (chosenDateProfileId || myPlayer.selected_date_profile_id)
  );

  if (selectedMatch) {
    chosenDateProfileId = selectedMatch.profile_id || selectedMatch.id;

    // If date has not been completed and suspense has not completed yet, run the 4-second waiting period!
    if (!myPlayer.date_completed && !dateSuspenseCompleted) {
      startDateInProgress(chosenDateProfileId);
      return;
    }

    datePickerCard.classList.add('hidden');
    if (dateInProgressCard) dateInProgressCard.classList.add('hidden');
    dateZeroMatchesCard.classList.add('hidden');
    dateSpectatorCard.classList.add('hidden');
    dateStoryCard.classList.remove('hidden');

    const outcome = selectedMatch.date_outcome || 'good';
    const story = getDateStory(selectedMatch, outcome);

    dateOutcomeBadge.textContent = story.badgeText;
    dateOutcomeBadge.className = `date-outcome-badge ${story.badgeClass}`;

    const avatarHtml = selectedMatch.avatar_url
      ? `<img src="${escapeHtml(selectedMatch.avatar_url)}" alt="${escapeHtml(selectedMatch.name)}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />`
      : (selectedMatch.avatar_svg || '');
    datePartnerAvatar.innerHTML = avatarHtml;
    datePartnerName.textContent = selectedMatch.name;
    datePartnerSub.textContent = `${selectedMatch.age} • ${selectedMatch.occupation || 'Mystery Job'}`;

    dateStoryContent.innerHTML = story.paragraphs
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join('');

    dateScoreDeltaVal.textContent = story.scoreDeltaText;

    if (myPlayer.date_completed) {
      btnConfirmDateRead.disabled = true;
      btnConfirmDateRead.textContent = '✓ Ready (Waiting for others...)';
      datingPlayersStatusBox.classList.remove('hidden');
      renderDatingChecklist(datingPlayersList);
    } else {
      btnConfirmDateRead.disabled = false;
      btnConfirmDateRead.textContent = 'Continue';
      datingPlayersStatusBox.classList.add('hidden');
    }
    return;
  }

  // 4. One or More Matches and hasn't chosen yet: Show Picker Grid
  if (dateInProgressCard) dateInProgressCard.classList.add('hidden');
  dateStoryCard.classList.add('hidden');
  dateZeroMatchesCard.classList.add('hidden');
  dateSpectatorCard.classList.add('hidden');
  datePickerCard.classList.remove('hidden');

  const countText = myMatches.length === 1 ? '1 profile' : `${myMatches.length} profiles`;
  const instructionHtml = myMatches.length === 1
    ? ''
    : `<br />Pick who you want to go on a date with this round:`;

  if (datePickerSubheading) {
    datePickerSubheading.innerHTML = `You matched with <strong id="date-picker-match-count" style="color: var(--accent);">${escapeHtml(countText)}</strong>!${instructionHtml}`;
  } else if (datePickerMatchCount) {
    datePickerMatchCount.textContent = countText;
  }
  datePickerGrid.innerHTML = myMatches
    .map((match) => {
      const matchId = match.profile_id || match.id;
      const avatarHtml = match.avatar_url
        ? `<img src="${escapeHtml(match.avatar_url)}" alt="${escapeHtml(match.name)}" />`
        : (match.avatar_svg || '');

      return `
        <button type="button" class="date-picker-item" data-profile-id="${escapeHtml(matchId)}">
          <div class="date-picker-avatar">${avatarHtml}</div>
          <div class="date-picker-info">
            <div class="date-picker-name">${escapeHtml(match.name)}, ${match.age}</div>
            <div class="date-picker-sub">${escapeHtml(match.occupation || '')}</div>
            <span class="date-picker-btn">Go on Date</span>
          </div>
        </button>
      `;
    })
    .join('');

  const pickerButtons = datePickerGrid.querySelectorAll('.date-picker-item');
  pickerButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const pId = btn.getAttribute('data-profile-id');
      if (pId) {
        chosenDateProfileId = pId;
        renderDatingPhase();
      }
    });
  });
}

// Dating Phase Action Handlers
async function handleConfirmDateRead() {
  if (isResolvingDate || !currentRoom) return;
  const myPlayer = currentPlayers.find((p) => p.user_id === currentUser?.id);
  if (!myPlayer || myPlayer.date_completed) return;

  isResolvingDate = true;
  btnConfirmDateRead.disabled = true;
  btnConfirmDateRead.textContent = 'Submitting...';

  try {
    const res = await resolvePlayerDate(currentRoom.id, chosenDateProfileId);
    if (res.new_score !== undefined) {
      myPlayer.score = res.new_score;
    }
    if (res.is_murdered !== undefined) {
      myPlayer.is_murdered = res.is_murdered;
    }
    myPlayer.date_completed = true;

    updateHUD();

    if (res.round_advanced) {
      chosenDateProfileId = null;
      dateSuspenseCompleted = false;
      clearDateInProgressTimer();
      await loadAndShowGameView();
    } else {
      renderDatingPhase();
    }
  } catch (err) {
    showAlert(err.message || 'Failed to confirm date completion.');
    btnConfirmDateRead.disabled = false;
    btnConfirmDateRead.textContent = 'Continue';
  } finally {
    isResolvingDate = false;
  }
}

async function handleConfirmZeroMatches() {
  if (isResolvingDate || !currentRoom) return;
  const myPlayer = currentPlayers.find((p) => p.user_id === currentUser?.id);
  if (!myPlayer || myPlayer.date_completed) return;

  isResolvingDate = true;
  btnConfirmZeroMatches.disabled = true;
  btnConfirmZeroMatches.textContent = 'Submitting...';

  try {
    const res = await resolvePlayerDate(currentRoom.id, null);
    myPlayer.date_completed = true;
    updateHUD();

    if (res.round_advanced) {
      chosenDateProfileId = null;
      dateSuspenseCompleted = false;
      clearDateInProgressTimer();
      await loadAndShowGameView();
    } else {
      renderDatingPhase();
    }
  } catch (err) {
    showAlert(err.message || 'Failed to confirm readiness.');
    btnConfirmZeroMatches.disabled = false;
    btnConfirmZeroMatches.textContent = 'Ready for Next Round ➔';
  } finally {
    isResolvingDate = false;
  }
}

function formatTestOutcome(profile) {
  if (!profile.is_match) return 'N/A';
  const outcome = profile.date_outcome;
  if (outcome === 'great') return 'Great (+1000 pts)';
  if (outcome === 'good') return 'Good (+500 pts)';
  if (outcome === 'bad') return 'Bad (-500 pts)';
  if (outcome === 'murdered') return 'Murdered (0 pts)';
  return outcome ? outcome.toUpperCase() : 'N/A';
}

// Render Currently Viewed Profile
function renderCurrentProfile() {
  if (!profileCardWrapper) return;

  if (!currentRoundProfiles || currentRoundProfiles.length === 0) {
    profileCardWrapper.innerHTML = `
      <div class="dating-profile-card" style="display: flex; align-items: center; justify-content: center; padding: 2rem; text-align: center;">
        <p style="color: var(--text-muted);">Loading round profiles...</p>
      </div>
    `;
    return;
  }

  // Bound index safely
  if (currentProfileIdx < 0) currentProfileIdx = 0;
  if (currentProfileIdx >= currentRoundProfiles.length) {
    currentProfileIdx = currentRoundProfiles.length - 1;
  }

  const profile = currentRoundProfiles[currentProfileIdx];
  const likeInfo = myLikes.find((l) => l.profile_id === profile.id);
  const isLiked = !!likeInfo;

  // Counter
  currentProfileNum.textContent = currentProfileIdx + 1;
  totalProfilesNum.textContent = currentRoundProfiles.length;

  // Nav buttons
  btnPrevProfile.disabled = currentProfileIdx === 0;
  btnNextProfile.disabled = currentProfileIdx === currentRoundProfiles.length - 1;

  const redFlagsListHtml = (profile.red_flags || [])
    .map((rf) => `<li>${escapeHtml(rf)}</li>`)
    .join('');

  const greenFlagsListHtml = (profile.green_flags || [])
    .map((gf) => `<li>${escapeHtml(gf)}</li>`)
    .join('');

  const photos = getProfilePhotos(profile);
  const avatarHtml = profile.avatar_url
    ? `<img src="${escapeHtml(profile.avatar_url)}" alt="${escapeHtml(profile.name)}" class="profile-hero-photo" />`
    : (profile.avatar_svg || '');
  const heroPhotoPillHtml =
    photos.length > 1
      ? `<div class="profile-hero-photo-pill" aria-label="${photos.length} photos available">
          <span class="profile-hero-photo-dots">${photos
            .map((_, idx) => `<span class="profile-hero-photo-dot ${idx === 0 ? 'active' : ''}"></span>`)
            .join('')}</span>
        </div>`
      : '';

  profileCardWrapper.innerHTML = `
    <div class="dating-profile-card" id="active-profile-card">
      <div class="profile-hero" data-photos="${escapeHtml(JSON.stringify(photos))}" title="Tap to view photos" role="button" aria-label="Tap to view photos">
        ${avatarHtml}
        ${heroPhotoPillHtml}
        <button
          type="button"
          id="btn-hero-like-profile"
          class="btn-circle btn-heart profile-hero-like-btn"
          title="Like profile"
          aria-label="Like profile"
        >
          <svg class="heart-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
        <div class="profile-hero-gradient"></div>
        <div class="profile-header-overlay">
          <span class="profile-name">${escapeHtml(profile.name)}</span>
          <span class="profile-age">${profile.age}</span>
          <span class="profile-verified-badge" title="Verified Parody">✓</span>
        </div>
      </div>
      <div class="profile-content">
        <div class="profile-field-row">
          <span class="profile-field-label">Occupation:</span>
          <span class="profile-field-value">${escapeHtml(profile.occupation)}</span>
        </div>
        <div class="profile-field-section">
          <div class="profile-field-label">Description:</div>
          <div class="profile-bio">${escapeHtml(profile.bio)}</div>
        </div>
        ${
          redFlagsListHtml
            ? `
          <div class="profile-field-section">
            <div class="profile-field-label">Red Flags:</div>
            <ul class="profile-bullet-list flags-bullet-red">${redFlagsListHtml}</ul>
          </div>
        `
            : ''
        }
        ${
          greenFlagsListHtml
            ? `
          <div class="profile-field-section">
            <div class="profile-field-label">Green Flags:</div>
            <ul class="profile-bullet-list flags-bullet-green">${greenFlagsListHtml}</ul>
          </div>
        `
            : ''
        }
        ${
          profile.prompt_question
            ? `
          <div class="profile-field-section">
            <div class="profile-field-label">${escapeHtml(
              profile.prompt_question.endsWith(':')
                ? profile.prompt_question
                : `${profile.prompt_question}:`
            )}</div>
            <div class="profile-prompt-answer">${escapeHtml(profile.prompt_answer)}</div>
          </div>
        `
            : ''
        }
      </div>
    </div>
  `;

  console.log(
    `[Swipah Testing Info] ${profile.name} (${currentProfileIdx + 1}/${currentRoundProfiles.length}) | Match: ${profile.is_match ? 'YES' : 'NO'} | Date Outcome: ${formatTestOutcome(profile)}`
  );

  syncLikeButtons(isLiked);
}

/**
 * Keeps the bottom and hero-overlay heart buttons in sync for the active profile.
 */
function syncLikeButtons(isLiked) {
  const heroLikeBtn = document.getElementById('btn-hero-like-profile');
  const buttons = [btnLikeProfile, heroLikeBtn].filter(Boolean);
  const myPlayer = currentPlayers.find((p) => p.user_id === currentUser?.id);
  const reqLikes = getRequiredLikes(myPlayer);

  for (const btn of buttons) {
    if (isLiked) {
      btn.classList.add('btn-liked');
      btn.disabled = true;
      btn.title = 'Already liked';
    } else if (myLikes.length >= reqLikes) {
      btn.classList.remove('btn-liked');
      btn.disabled = true;
      btn.title = 'No likes remaining this round';
    } else {
      btn.classList.remove('btn-liked');
      btn.disabled = isSubmittingLike;
      btn.title = 'Like profile';
    }
  }
}

// Horizontal Finger / Touch Drag Swiping Gestures
let touchStartX = 0;
let touchStartY = 0;
let isPointerDragging = false;
let isPointerSwiping = false;
let hasSwipedOrMoved = false;

function initSwipeGestures() {
  if (!profileCardWrapper) return;

  profileCardWrapper.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.profile-hero-like-btn')) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    touchStartX = e.clientX;
    touchStartY = e.clientY;
    isPointerDragging = true;
    isPointerSwiping = false;
    hasSwipedOrMoved = false;
  });

  window.addEventListener('pointermove', (e) => {
    if (!isPointerDragging) return;
    const card = profileCardWrapper.querySelector('.dating-profile-card');
    if (!card) return;

    const diffX = e.clientX - touchStartX;
    const diffY = e.clientY - touchStartY;

    if (Math.hypot(diffX, diffY) > 8) {
      hasSwipedOrMoved = true;
    }

    if (!isPointerSwiping) {
      if (Math.abs(diffX) > 12 && Math.abs(diffX) > Math.abs(diffY)) {
        isPointerSwiping = true;
        card.classList.add('dragging');
      } else if (Math.abs(diffY) > 12) {
        // Vertical scroll within the card content - abort horizontal swipe
        isPointerDragging = false;
        return;
      }
    }

    if (isPointerSwiping) {
      const rotation = diffX * 0.035;
      card.style.transform = `translateX(${diffX}px) rotate(${rotation}deg)`;
      card.style.opacity = `${Math.max(0.35, 1 - Math.abs(diffX) / 450)}`;
    }
  });

  const handlePointerEnd = (e) => {
    if (!isPointerDragging) return;
    const card = profileCardWrapper.querySelector('.dating-profile-card');
    isPointerDragging = false;

    if (!card) return;
    card.classList.remove('dragging');

    if (!isPointerSwiping) return;
    isPointerSwiping = false;

    const diffX = e.clientX - touchStartX;
    const SWIPE_THRESHOLD = 50;

    if (diffX < -SWIPE_THRESHOLD && currentProfileIdx < currentRoundProfiles.length - 1) {
      // Swiped Left -> Next Profile
      card.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
      card.style.transform = 'translateX(-120%) rotate(-12deg)';
      card.style.opacity = '0';
      setTimeout(() => {
        currentProfileIdx++;
        renderCurrentProfile();
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 180);
    } else if (diffX > SWIPE_THRESHOLD && currentProfileIdx > 0) {
      // Swiped Right -> Previous Profile
      card.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
      card.style.transform = 'translateX(120%) rotate(12deg)';
      card.style.opacity = '0';
      setTimeout(() => {
        currentProfileIdx--;
        renderCurrentProfile();
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 180);
    } else {
      // Snap back to center
      card.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
      card.style.transform = '';
      card.style.opacity = '';
    }
  };

  window.addEventListener('pointerup', handlePointerEnd);
  window.addEventListener('pointercancel', handlePointerEnd);

  // Tap on hero-overlay heart button likes profile; tap elsewhere on hero opens lightbox
  profileCardWrapper.addEventListener('click', (e) => {
    const heroLikeBtn = e.target.closest('.profile-hero-like-btn');
    if (heroLikeBtn) {
      e.stopPropagation();
      handleLikeProfile();
      return;
    }

    const hero = e.target.closest('.profile-hero');
    if (!hero) return;
    if (hasSwipedOrMoved) return;

    const profile =
      currentRoundProfiles && currentRoundProfiles[currentProfileIdx]
        ? currentRoundProfiles[currentProfileIdx]
        : null;

    if (profile) {
      openPhotoLightbox(profile);
    } else {
      // Fallback: extract directly from hero DOM
      const photoEl = hero.querySelector('.profile-hero-photo');
      const svgEl = hero.querySelector('svg');
      const nameEl = hero.querySelector('.profile-name');
      const name = nameEl ? nameEl.textContent.trim() : '';
      let domPhotos = [];
      if (hero.dataset.photos) {
        try {
          const parsed = JSON.parse(hero.dataset.photos);
          if (Array.isArray(parsed)) domPhotos = parsed.filter(Boolean);
        } catch (err) {}
      }

      if (domPhotos.length > 0) {
        openPhotoLightbox({
          name,
          avatar_url: domPhotos[0],
          extra_photos: domPhotos.slice(1)
        });
      } else if (photoEl && photoEl.src) {
        openPhotoLightbox({
          name,
          avatar_url: photoEl.getAttribute('src') || photoEl.src
        });
      } else if (svgEl) {
        openPhotoLightbox({
          name,
          avatar_svg: svgEl.outerHTML
        });
      }
    }
  });
}

// Like Profile Action (Only triggered by clicking ❤️ button)
async function handleLikeProfile() {
  if (isSubmittingLike || !currentRoom) return;
  const profile = currentRoundProfiles[currentProfileIdx];
  if (!profile) return;

  if (myLikes.some((l) => l.profile_id === profile.id)) {
    return;
  }

  const myPlayerForLimit = currentPlayers.find((p) => p.user_id === currentUser?.id);
  const reqLikes = getRequiredLikes(myPlayerForLimit);
  if (myLikes.length >= reqLikes) {
    showAlert(`You have already used all ${reqLikes} likes for this round.`, 'info');
    return;
  }

  isSubmittingLike = true;
  const heroLikeBtn = document.getElementById('btn-hero-like-profile');
  btnLikeProfile.disabled = true;
  if (heroLikeBtn) heroLikeBtn.disabled = true;

  try {
    const res = await submitLike(currentRoom.id, profile.id);

    // Save to local likes
    myLikes.push({
      profile_id: profile.id,
      is_match: res.is_match,
      created_at: new Date().toISOString(),
    });

    // Update player status
    const myPlayer = currentPlayers.find((p) => p.user_id === currentUser?.id);
    if (myPlayer) {
      myPlayer.likes_count = res.likes_count;
      myPlayer.likes_required = res.likes_required ?? myPlayer.likes_required;
      myPlayer.matches_count = res.matches_count;
      myPlayer.round_completed = res.round_completed;
    }

    updateHUD();

    if (res.is_match) {
      playChime();
      openMatchModal(profile);
    }

    if (res.phase_transitioned || res.round_phase === 'dating') {
      // Swiping completed for all players -> transition into dating phase!
      currentRoom.round_phase = 'dating';
      await loadAndShowGameView();
    } else if (res.round_advanced) {
      // All players in room finished 3 likes -> immediately advance to next round!
      await loadAndShowGameView();
    } else if (res.round_completed) {
      // Current player finished all 3 likes -> show waiting screen if match modal is not open
      if (!res.is_match) {
        showWaitingOverlay();
      }
    } else {
      // Likes remaining — keep current profile displayed in liked state
      if (!res.is_match) {
        renderCurrentProfile();
      }
    }
  } catch (err) {
    showAlert(err.message || 'Failed to submit like.');
  } finally {
    isSubmittingLike = false;
    const activeProfile = currentRoundProfiles[currentProfileIdx];
    const activeIsLiked = activeProfile
      ? myLikes.some((l) => l.profile_id === activeProfile.id)
      : false;
    syncLikeButtons(activeIsLiked);
  }
}

function renderGameCompleted() {
  if (!gameCompletedSection || !completedStandingsList) return;
  gameCompletedSection.classList.remove('hidden');

  const sortedPlayers = [...currentPlayers].sort((a, b) => {
    if (a.is_murdered !== b.is_murdered) return a.is_murdered ? 1 : -1;
    return (b.score ?? 0) - (a.score ?? 0);
  });

  completedStandingsList.innerHTML = sortedPlayers
    .map((p, idx) => {
      const isMe = p.user_id === currentUser?.id;
      const isWinner = idx === 0 && !p.is_murdered;
      const rowClass = p.is_murdered ? 'murdered' : isWinner ? 'winner' : 'ready';
      const rankBadge = p.is_murdered ? '💀' : isWinner ? '👑' : `#${idx + 1}`;
      const scoreText = p.is_murdered ? 'Murdered' : `${p.score ?? 0} pts`;
      const datesText = typeof p.dated_count === 'number' ? ` • ${p.dated_count} date${p.dated_count === 1 ? '' : 's'}` : '';

      return `
        <div class="dating-player-row ${rowClass}">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <span style="font-size: 1.1rem; min-width: 1.5rem; text-align: center;">${rankBadge}</span>
            <div>
              <strong style="color: ${p.is_murdered ? '#ef4444' : '#fff'};">${escapeHtml(p.display_name)} ${isMe ? '(You)' : ''}</strong>
              <div style="font-size: 0.78rem; color: var(--text-muted);">Player ${p.seat_number}${escapeHtml(datesText)}</div>
            </div>
          </div>
          <span style="font-size: 0.9rem; font-weight: 700; color: ${p.is_murdered ? '#fca5a5' : isWinner ? '#facc15' : '#4ade80'};">
            ${escapeHtml(scoreText)}
          </span>
        </div>
      `;
    })
    .join('');
}

// Switch to Active Game View
async function loadAndShowGameView() {
  document.getElementById('app').classList.remove('in-lobby');
  document.getElementById('app').classList.add('in-game');
  landingView.classList.add('hidden');
  lobbyView.classList.add('hidden');
  gameView.classList.remove('hidden');

  try {
    const state = await fetchGameRoundState(currentRoom.id);
    if (!state || !state.room) {
      throw new Error('Failed to load round state');
    }

    currentRoom = state.room;
    currentPlayers = state.players || currentPlayers;
    currentRoundProfiles = state.profiles || [];
    myLikes = state.my_likes || [];
    myMatches = state.my_matches || [];

    const roundLogKey = `${currentRoom.id}:${currentRoom.current_round}`;
    if (roundLogKey !== lastLoggedRoundKey && currentRoundProfiles.length > 0) {
      lastLoggedRoundKey = roundLogKey;
      console.log(
        `[Swipah Round ${currentRoom.current_round}] Profiles:`,
        currentRoundProfiles.map((p, idx) => ({
          '#': idx + 1,
          name: p.name,
          match: !!p.is_match,
          dateOutcome: formatTestOutcome(p),
        }))
      );
    }

    const myPlayer = currentPlayers.find((p) => p.user_id === currentUser?.id);
    const isHost = !!myPlayer?.is_host;

    if (btnEndActiveGame) {
      btnEndActiveGame.style.display = isHost && currentRoom.status === 'in_progress' ? 'inline-flex' : 'none';
    }
    if (btnEndActiveGameDating) {
      btnEndActiveGameDating.style.display = isHost && currentRoom.status === 'in_progress' ? 'inline-flex' : 'none';
    }
    if (btnLeaveActiveGame) {
      btnLeaveActiveGame.style.display = 'none';
    }

    updateHUD();

    if (currentRoom.status === 'completed') {
      stopPolling();
      clearDateInProgressTimer();
      closeRoundStartModal();
      profileSwipeSection.classList.add('hidden');
      waitingRoundOverlay.classList.add('hidden');
      datingPhaseSection.classList.add('hidden');
      renderGameCompleted();
      return;
    }

    if (gameCompletedSection) gameCompletedSection.classList.add('hidden');

    // Check if new round
    if (currentRoom.current_round !== lastSeenRound) {
      lastSeenRound = currentRoom.current_round;
      currentProfileIdx = 0;
      chosenDateProfileId = null;
      dateSuspenseCompleted = false;
      clearDateInProgressTimer();
      if (!myPlayer?.is_murdered && currentRoundProfiles.length > 0) {
        openRoundStartModal(currentRoom.current_round);
      }
      playChime();
    }

    if (currentRoom.round_phase === 'dating') {
      profileSwipeSection.classList.add('hidden');
      waitingRoundOverlay.classList.add('hidden');
      datingPhaseSection.classList.remove('hidden');
      renderDatingPhase();
    } else {
      datingPhaseSection.classList.add('hidden');
      const reqLikes = getRequiredLikes(myPlayer);
      if (myPlayer?.is_murdered) {
        profileSwipeSection.classList.add('hidden');
        waitingRoundOverlay.classList.add('hidden');
        datingPhaseSection.classList.remove('hidden');
        renderDatingPhase();
      } else if (currentRoundProfiles.length === 0 || myPlayer?.round_completed || myLikes.length >= reqLikes) {
        showWaitingOverlay();
      } else {
        waitingRoundOverlay.classList.add('hidden');
        profileSwipeSection.classList.remove('hidden');
        renderCurrentProfile();
      }
    }

    // Start active game polling
    startGamePolling(currentRoom.id);
  } catch (err) {
    showAlert('Error loading game: ' + err.message);
  }
}

// Event Listeners: Host Game
btnOpenHostPrompt.addEventListener('click', openHostModal);
btnCancelHost.addEventListener('click', closeHostModal);

btnConfirmCreateRoom.addEventListener('click', async () => {
  const name = hostPlayerName.value.trim();
  const lookingFor = hostLookingForInput?.value || '';
  if (!name) {
    showAlert('Please enter a username.');
    return;
  }
  if (!lookingFor) {
    showAlert('Please select who you are looking for (Men, Women, or both).');
    return;
  }

  saveName(name);
  btnConfirmCreateRoom.disabled = true;
  btnConfirmCreateRoom.textContent = 'Creating...';

  try {
    const data = await createRoom(name, lookingFor);
    closeHostModal();
    showLobbyView(data.room, [data.player]);
  } catch (err) {
    showAlert('Failed to create room: ' + err.message);
  } finally {
    btnConfirmCreateRoom.disabled = false;
    btnConfirmCreateRoom.textContent = 'Start Game';
    updateHostFormValidity();
  }
});

hostPlayerName.addEventListener('input', updateHostFormValidity);

hostPlayerName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (!btnConfirmCreateRoom.disabled) {
      btnConfirmCreateRoom.click();
    }
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
  const lookingFor = joinLookingForInput?.value || '';
  if (!name) {
    showAlert('Please enter a username.');
    return;
  }
  if (!lookingFor) {
    showAlert('Please select who you are looking for (Men, Women, or both).');
    return;
  }

  saveName(name);
  btnJoinGame.disabled = true;
  btnJoinGame.textContent = 'Joining...';

  try {
    const data = await joinRoom(roomId, name, lookingFor);
    const { room, players } = await fetchRoom(roomId);
    showLobbyView(room, players);
  } catch (err) {
    showAlert('Failed to join room: ' + err.message);
  } finally {
    btnJoinGame.disabled = false;
    btnJoinGame.textContent = 'Join Game';
    updateJoinFormValidity();
  }
});

joinPlayerName.addEventListener('input', updateJoinFormValidity);

joinPlayerName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (!btnJoinGame.disabled) {
      btnJoinGame.click();
    }
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

// Event Listeners: In-Game Action Controls
btnPrevProfile.addEventListener('click', () => {
  if (currentProfileIdx > 0) {
    currentProfileIdx--;
    renderCurrentProfile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

btnNextProfile.addEventListener('click', () => {
  if (currentProfileIdx < currentRoundProfiles.length - 1) {
    currentProfileIdx++;
    renderCurrentProfile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

btnLikeProfile.addEventListener('click', handleLikeProfile);

btnStartRound.addEventListener('click', closeRoundStartModal);

btnCloseMatchModal.addEventListener('click', closeMatchModal);

if (btnCloseLightbox) {
  btnCloseLightbox.addEventListener('click', (e) => {
    e.stopPropagation();
    closePhotoLightbox();
  });
}

if (lightboxDots) {
  lightboxDots.addEventListener('click', (e) => {
    e.stopPropagation();
    const dotBtn = e.target.closest('.lightbox-dot');
    if (dotBtn && dotBtn.dataset.photoIdx !== undefined) {
      setLightboxPhoto(Number(dotBtn.dataset.photoIdx));
    }
  });
}

if (photoLightboxModal) {
  let lbStartX = 0;
  let lbStartY = 0;
  let lbStartTime = 0;
  let lbDragging = false;
  let lbDragged = false;
  let lbEffectiveOffset = 0;

  const startLightboxDrag = (clientX, clientY, target) => {
    if (lightboxPhotos.length <= 1) return;
    if (target && target.closest('button')) return;
    if (lightboxSlideResetTimer) {
      clearTimeout(lightboxSlideResetTimer);
      lightboxSlideResetTimer = null;
    }
    lbStartX = clientX;
    lbStartY = clientY;
    lbStartTime = performance.now();
    lbDragging = true;
    lbDragged = false;
    lbEffectiveOffset = 0;
    if (lightboxTrack) {
      syncLightboxNeighbors();
      lightboxTrack.classList.add('is-sliding');
      lightboxTrack.style.transition = 'none';
      lightboxTrack.style.transform = 'translate3d(-100%, 0, 0)';
    }
  };

  const moveLightboxDrag = (clientX, clientY) => {
    if (!lbDragging) return;
    const diffX = clientX - lbStartX;
    const diffY = clientY - lbStartY;
    if (Math.abs(diffX) > 6 && Math.abs(diffX) > Math.abs(diffY)) {
      lbDragged = true;
      const atStartBoundary = lightboxPhotoIndex === 0 && diffX > 0;
      const atEndBoundary = lightboxPhotoIndex === lightboxPhotos.length - 1 && diffX < 0;
      lbEffectiveOffset = atStartBoundary || atEndBoundary ? diffX * 0.22 : diffX;
      if (lightboxTrack) {
        lightboxTrack.style.transform = `translate3d(calc(-100% + ${lbEffectiveOffset}px), 0, 0)`;
      }
    }
  };

  const endLightboxDrag = (clientX) => {
    if (!lbDragging) return;
    lbDragging = false;
    const diffX = clientX - lbStartX;
    const elapsed = Math.max(1, performance.now() - lbStartTime);
    const velocity = Math.abs(diffX) / elapsed;
    const swipedThreshold =
      lbDragged && (Math.abs(diffX) >= 40 || (Math.abs(diffX) >= 18 && velocity >= 0.35));

    if (lbDragged) {
      lightboxSuppressClick = true;
      setTimeout(() => {
        lightboxSuppressClick = false;
      }, 60);
    }

    if (swipedThreshold && diffX < 0 && lightboxPhotoIndex < lightboxPhotos.length - 1) {
      stepLightboxPhoto(1, lbEffectiveOffset);
    } else if (swipedThreshold && diffX > 0 && lightboxPhotoIndex > 0) {
      stepLightboxPhoto(-1, lbEffectiveOffset);
    } else if (lightboxTrack) {
      if (lbDragged) {
        lightboxTrack.style.transition = 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)';
        lightboxTrack.style.transform = 'translate3d(-100%, 0, 0)';
        lightboxSlideResetTimer = setTimeout(() => {
          settleLightboxTrackIdle();
          lightboxSlideResetTimer = null;
        }, 250);
      } else {
        settleLightboxTrackIdle();
      }
    }
  };

  photoLightboxModal.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    startLightboxDrag(e.clientX, e.clientY, e.target);
  });

  photoLightboxModal.addEventListener('pointermove', (e) => {
    moveLightboxDrag(e.clientX, e.clientY);
  });

  photoLightboxModal.addEventListener('pointerup', (e) => {
    endLightboxDrag(e.clientX);
  });

  photoLightboxModal.addEventListener('pointercancel', () => {
    lbDragging = false;
    if (lightboxTrack) {
      lightboxTrack.style.transition = 'transform 0.24s cubic-bezier(0.22, 1, 0.36, 1)';
      lightboxTrack.style.transform = 'translate3d(-100%, 0, 0)';
      lightboxSlideResetTimer = setTimeout(() => {
        settleLightboxTrackIdle();
        lightboxSlideResetTimer = null;
      }, 250);
    }
  });

  photoLightboxModal.addEventListener('click', (e) => {
    if (lightboxSuppressClick) {
      lightboxSuppressClick = false;
      return;
    }
    if (e.target.closest('button')) return;
    closePhotoLightbox();
  });
}

window.addEventListener('keydown', (e) => {
  if (!photoLightboxModal || photoLightboxModal.classList.contains('hidden')) return;
  if (e.key === 'Escape') {
    closePhotoLightbox();
  } else if (e.key === 'ArrowLeft') {
    stepLightboxPhoto(-1);
  } else if (e.key === 'ArrowRight') {
    stepLightboxPhoto(1);
  }
});

// Event Listeners: End & Leave Game
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
if (btnEndActiveGameDating) {
  btnEndActiveGameDating.addEventListener('click', openEndGameModal);
}

if (btnConfirmDateRead) {
  btnConfirmDateRead.addEventListener('click', handleConfirmDateRead);
}

if (btnConfirmZeroMatches) {
  btnConfirmZeroMatches.addEventListener('click', handleConfirmZeroMatches);
}

if (btnCompletedHome) {
  btnCompletedHome.addEventListener('click', showLandingView);
}

btnLeaveActiveGame.addEventListener('click', async () => {
  if (!currentRoom) return;
  const myPlayer = currentPlayers.find((p) => p.user_id === currentUser?.id);
  if (myPlayer?.is_host) {
    openEndGameModal();
  } else {
    try {
      await leaveRoom(currentRoom.id);
      showLandingView();
    } catch (err) {
      showAlert('Failed to leave game: ' + err.message);
    }
  }
});

// App Initialization
async function init() {
  initSwipeGestures();
  setPillToggleSelections(hostLookingForGroup, hostLookingForInput, []);
  setPillToggleSelections(joinLookingForGroup, joinLookingForInput, []);
  initPillToggleGroup(hostLookingForGroup, hostLookingForInput, updateHostFormValidity);
  initPillToggleGroup(joinLookingForGroup, joinLookingForInput, updateJoinFormValidity);
  updateHostFormValidity();
  updateJoinFormValidity();

  try {
    currentUser = await ensureAnonymousSession();
  } catch (err) {
    showAlert('Could not initialize guest session: ' + err.message);
    return;
  }

  const inviteRoomId = getQueryParam('room');

  if (inviteRoomId) {
    try {
      const { room, players } = await fetchRoom(inviteRoomId);
      if (room.status === 'abandoned') {
        showAlert('This room was closed or abandoned.', 'error');
        showLandingView();
        return;
      }
      if (room.status === 'in_progress' || room.status === 'completed') {
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
      setPillToggleSelections(joinLookingForGroup, joinLookingForInput, []);
      updateJoinFormValidity();
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
