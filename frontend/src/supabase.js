import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Ensures an anonymous authenticated session exists.
 * If none exists, creates one seamlessly.
 */
export async function ensureAnonymousSession() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    await supabase.auth.signOut().catch(() => {});
  }

  if (session?.user) {
    // Validate that the user actually exists on the backend (e.g. after database resets)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (!userError && userData?.user) {
      return userData.user;
    }
    // Stale session detected; clear it
    await supabase.auth.signOut().catch(() => {});
  }

  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
  if (authError) throw authError;

  return authData.user;
}

/**
 * Create a new room with host placed in Seat 1.
 */
export async function createRoom(displayName, lookingFor, sexOrgans = null) {
  await ensureAnonymousSession();
  const params = {
    p_display_name: displayName.trim(),
    p_looking_for: lookingFor,
    p_sex_organs: sexOrgans,
  };
  let { data, error } = await supabase.rpc('create_room', params);

  // Self-heal if the session was invalidated or stale
  if (error && error.message?.includes('foreign key constraint')) {
    await supabase.auth.signOut().catch(() => {});
    await ensureAnonymousSession();
    const retry = await supabase.rpc('create_room', params);
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;
  return data;
}

/**
 * Concurrency-safe room joining with seat allocation.
 */
export async function joinRoom(roomId, displayName, lookingFor, sexOrgans = null) {
  await ensureAnonymousSession();
  const params = {
    p_room_id: roomId,
    p_display_name: displayName.trim(),
    p_looking_for: lookingFor,
    p_sex_organs: sexOrgans,
  };
  let { data, error } = await supabase.rpc('join_room', params);

  // Self-heal if the session was invalidated or stale
  if (error && error.message?.includes('foreign key constraint')) {
    await supabase.auth.signOut().catch(() => {});
    await ensureAnonymousSession();
    const retry = await supabase.rpc('join_room', params);
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;
  return data;
}

/**
 * Fetch initial room information and current player list.
 */
export async function fetchRoom(roomId) {
  const [roomRes, playersRes] = await Promise.all([
    supabase.from('rooms').select('*').eq('id', roomId).single(),
    supabase.from('room_players').select('*').eq('room_id', roomId).order('seat_number', { ascending: true }),
  ]);

  if (roomRes.error) throw roomRes.error;
  if (playersRes.error) throw playersRes.error;

  return {
    room: roomRes.data,
    players: playersRes.data || [],
  };
}

/**
 * Lightweight fetch of room turn and status for polling heartbeat.
 */
export async function fetchRoomTurnState(roomId) {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, current_turn_seat, current_round, status, updated_at')
    .eq('id', roomId)
    .single();

  if (error) return null;
  return data;
}

/**
 * Toggle the ready status for the current user.
 */
export async function toggleReady(roomId) {
  const { data, error } = await supabase.rpc('toggle_ready', {
    p_room_id: roomId,
  });

  if (error) throw error;
  return data;
}

/**
 * Start the game (Host only).
 */
export async function startGame(roomId) {
  const { data, error } = await supabase.rpc('start_game', {
    p_room_id: roomId,
  });

  if (error) throw error;
  return data;
}

/**
 * Submit a like on a profile in the current round.
 */
export async function submitLike(roomId, profileId) {
  const { data, error } = await supabase.rpc('submit_like', {
    p_room_id: roomId,
    p_profile_id: profileId,
  });

  if (error) throw error;
  return data;
}

/**
 * Resolve player's date selection and complete their date recap reading.
 * @param {string} roomId
 * @param {string|null} profileId - Chosen match profile ID, or null if 0 matches
 */
export async function resolvePlayerDate(roomId, profileId = null) {
  const { data, error } = await supabase.rpc('resolve_player_date', {
    p_room_id: roomId,
    p_profile_id: profileId,
  });

  if (error) throw error;
  return data;
}

/**
 * Fetch the full game round state (room, players, 10 round profiles, player's likes).
 */
export async function fetchGameRoundState(roomId) {
  const { data, error } = await supabase.rpc('fetch_game_round_state', {
    p_room_id: roomId,
  });

  if (error) throw error;
  return data;
}

/**
 * Leave a room.
 */
export async function leaveRoom(roomId) {
  const { data, error } = await supabase.rpc('leave_room', {
    p_room_id: roomId,
  });

  if (error) throw error;
  return data;
}

/**
 * Subscribe to realtime table changes for players and room state.
 */
export function subscribeToRoom(roomId, onPlayersChange, onRoomChange, onLikesChange, onStatusChange) {
  const channel = supabase.channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'room_players',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        onPlayersChange && onPlayersChange(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        onRoomChange && onRoomChange(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'player_profile_likes',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        onLikesChange && onLikesChange(payload);
      }
    )
    .subscribe((status) => {
      onStatusChange && onStatusChange(status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
