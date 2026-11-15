<p align="center">
  <img src="./swipah-tagline-light-logo.jpeg" alt="Swipah logo" width="480" />
</p>

# Swipah — Online Multiplayer Game

Welcome to **Swipah**, a fast-paced multiplayer online spoof on Tinder where players connect, lobby up, and compete.

Built with local-first development targeting deployment to **Supabase** (database, anonymous auth, and real-time events) and **Cloudflare Workers** (static assets SPA via Wrangler).

---

## Architecture & Tech Stack

- **Frontend**: Vite SPA, Modern Vanilla JavaScript / DOM, CSS3, `@supabase/supabase-js`, `qrcode`
- **Backend / DB**: Supabase PostgreSQL, Row Level Security (RLS), Stored Procedures (RPCs), and Realtime WebSocket replication
- **Hosting / Edge**: Cloudflare Workers (`wrangler.jsonc` SPA asset hosting)
- **Visual Design**: Dark `#000022` background paired with Tinder-inspired warm flame rose/coral gradients (`#fd267d` to `#ff6036`), sleek frosted cards, glowing responsive seats grid, and Web Audio API ascending chimes.

---

## Features (Step 1: Landing Page & Lobby)

1. **Frictionless Anonymous Guest Authentication**:
   - Zero login or email required. Seamless anonymous session generation via Supabase Auth with self-healing reconnection handling.
2. **Landing Page**:
   - **Host Game Card**: Start a fresh game room with an auto-generated invite link.
   - **Join Game Card**: Automatically activates when opening an invite link (`?room=<UUID>`) to join with a custom username.
   - **Persistent Display Names**: Player usernames are saved to `localStorage` across sessions.
3. **Multiplayer Lobby**:
   - Concurrency-safe room joining with row-level locking (`FOR UPDATE`) in PostgreSQL.
   - 4 designated player seats (Seats 1–4) with host badge, connected status indicator, and dynamic player count.
   - Host-only controls: Copy invite link with clipboard toast, generate instant join QR code modal, and start game.
   - Reconnection support: Players refreshing the browser automatically reclaim their existing seat.
   - Real-time room status updates via Supabase channels + 2.5s polling heartbeat fallback.
   - Temporary single-player testing mode supported (allows starting a test game with 1 player).

---

## Local Development Setup

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/) (running)
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)

### 2. Start Supabase
In the project root:
```bash
supabase start
```
This spins up PostgreSQL, Gotrue Auth (with anonymous logins enabled), PostgREST, and Realtime on ports `54321` and `54322`.

### 3. Install & Start Frontend
In `frontend/`:
```bash
cd frontend
npm install
npm run dev
```

### 4. Run Automated End-to-End Tests
To run the automated multiplayer lobby test suite:
```bash
cd frontend
npm test
```
The test verifies:
- Multi-client anonymous session generation
- Concurrency-safe room creation and seat 1–4 assignment
- 5th player rejection when room is full
- Seamless player reconnection / refresh retention
- Host-only game start permissions
- In-progress room joining lockdown
- Host room closure / abandonment cascade
- Single-player start mode for testing

### 5. Production Build
```bash
cd frontend
npm run build
```
Builds static distribution bundle to `frontend/dist`.
