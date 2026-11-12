import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function createAnonymousClient() {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await client.auth.signInAnonymously();
  if (error) throw new Error('Anonymous sign in failed: ' + error.message);
  return { client, user: data.user };
}

async function runTest() {
  console.log('🧪 Starting Swipah Lobby & Multiplayer Workflow Test...\n');

  // 1. Create 5 separate anonymous sessions
  console.log('1. Signing in 5 anonymous players...');
  const p1 = await createAnonymousClient();
  const p2 = await createAnonymousClient();
  const p3 = await createAnonymousClient();
  const p4 = await createAnonymousClient();
  const p5 = await createAnonymousClient();
  console.log('   ✓ 5 anonymous sessions created successfully.');

  // 2. Host creates room
  console.log('2. Host (Player 1) creating room...');
  const { data: createData, error: createErr } = await p1.client.rpc('create_room', {
    p_display_name: 'HostAlice',
    p_looking_for: 'Both',
  });
  if (createErr) throw new Error('create_room failed: ' + createErr.message);

  const roomId = createData.room.id;
  console.log(`   ✓ Room created! UUID: ${roomId}`);
  console.log(`   ✓ Host seated: Seat ${createData.player.seat_number}, Host=${createData.player.is_host}`);

  if (createData.player.seat_number !== 1 || !createData.player.is_host) {
    throw new Error('Host must be seated in Seat 1 with is_host = true');
  }

  // 3. Players 2, 3, and 4 join
  console.log('3. Players 2, 3, and 4 joining room...');
  const joiners = [
    { client: p2, name: 'Bob', expectedSeat: 2 },
    { client: p3, name: 'Charlie', expectedSeat: 3 },
    { client: p4, name: 'Dave', expectedSeat: 4 },
  ];

  for (const joiner of joiners) {
    const { data: joinData, error: joinErr } = await joiner.client.client.rpc('join_room', {
      p_room_id: roomId,
      p_display_name: joiner.name,
      p_looking_for: 'Both',
    });
    if (joinErr) throw new Error(`Player ${joiner.name} join failed: ${joinErr.message}`);
    console.log(`   ✓ Player ${joiner.name} joined: Seat ${joinData.player.seat_number}`);
    if (joinData.player.seat_number !== joiner.expectedSeat) {
      throw new Error(`Expected Seat ${joiner.expectedSeat} for ${joiner.name}, got ${joinData.player.seat_number}`);
    }
  }

  // 4. Verify player list has 4 players
  console.log('4. Verifying room player count in database...');
  const { data: currentPlayers, error: fetchErr } = await p1.client
    .from('room_players')
    .select('*')
    .eq('room_id', roomId)
    .order('seat_number', { ascending: true });
  if (fetchErr) throw fetchErr;

  console.log(`   ✓ Room currently has ${currentPlayers.length}/4 players.`);
  if (currentPlayers.length !== 4) {
    throw new Error(`Expected 4 players in room, found ${currentPlayers.length}`);
  }

  // 5. Test reconnection / idempotent join
  console.log('5. Testing reconnection for Player 2 (Bob)...');
  const { data: reconnectData, error: reconnectErr } = await p2.client.rpc('join_room', {
    p_room_id: roomId,
    p_display_name: 'BobUpdated',
    p_looking_for: 'Woman',
  });
  if (reconnectErr) throw new Error('Reconnection failed: ' + reconnectErr.message);
  if (!reconnectData.reconnected || reconnectData.player.seat_number !== 2) {
    throw new Error('Reconnection failed to preserve player seat or flag reconnected');
  }
  console.log('   ✓ Reconnection handled seamlessly without duplicate seat.');

  // 6. Player 5 attempts to join full room (Should be rejected)
  console.log('6. Testing capacity limit with 5th player (Eve)...');
  const { error: fullRoomErr } = await p5.client.rpc('join_room', {
    p_room_id: roomId,
    p_display_name: 'Eve',
    p_looking_for: 'Man',
  });
  if (!fullRoomErr) {
    throw new Error('Expected 5th player to be rejected, but join succeeded!');
  }
  console.log(`   ✓ 5th player correctly rejected: "${fullRoomErr.message}"`);

  // 7. Non-host attempts to start game (Should fail)
  console.log('7. Testing unauthorized game start by non-host...');
  const { error: nonHostStartErr } = await p2.client.rpc('start_game', {
    p_room_id: roomId,
  });
  if (!nonHostStartErr) {
    throw new Error('Non-host was able to start game!');
  }
  console.log(`   ✓ Non-host start rejected: "${nonHostStartErr.message}"`);

  // 8. Host starts game
  console.log('8. Host starting game...');
  const { data: startData, error: hostStartErr } = await p1.client.rpc('start_game', {
    p_room_id: roomId,
  });
  if (hostStartErr) throw new Error('Host start_game failed: ' + hostStartErr.message);
  if (startData.room.status !== 'in_progress') {
    throw new Error(`Expected room status 'in_progress', got '${startData.room.status}'`);
  }
  console.log('   ✓ Game started! Room status is now in_progress.');

  // 9. Joining in-progress game is rejected
  console.log('9. Testing join rejection on in-progress game...');
  const { error: lateJoinErr } = await p5.client.rpc('join_room', {
    p_room_id: roomId,
    p_display_name: 'LateEve',
    p_looking_for: 'Both',
  });
  if (!lateJoinErr) {
    throw new Error('Late join succeeded on active game!');
  }
  console.log(`   ✓ Late join correctly rejected: "${lateJoinErr.message}"`);

  // 10. Host ends game
  console.log('10. Host ending game...');
  const { data: leaveData, error: leaveErr } = await p1.client.rpc('leave_room', {
    p_room_id: roomId,
  });
  if (leaveErr) throw new Error('Host leave_room failed: ' + leaveErr.message);
  if (!leaveData.was_host) throw new Error('Expected was_host to be true');

  const { data: abandonedRoom } = await p1.client
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (abandonedRoom.status !== 'abandoned') {
    throw new Error(`Expected room to be 'abandoned', got '${abandonedRoom.status}'`);
  }
  console.log('   ✓ Host successfully ended game; room status set to abandoned.');

  // 11. Single-player test mode (host only can start game)
  console.log('11. Testing single-player start (temporary testing mode)...');
  const soloHost = await createAnonymousClient();
  const { data: soloCreate } = await soloHost.client.rpc('create_room', {
    p_display_name: 'SoloTester',
    p_looking_for: 'Both',
  });
  const soloRoomId = soloCreate.room.id;
  const { data: soloStart, error: soloStartErr } = await soloHost.client.rpc('start_game', {
    p_room_id: soloRoomId,
  });
  if (soloStartErr) throw new Error('Single player start failed: ' + soloStartErr.message);
  if (soloStart.room.status !== 'in_progress') {
    throw new Error('Single player room failed to transition to in_progress');
  }
  console.log('   ✓ Single-player room started successfully!');

  console.log('\n🎉 ALL LOBBY & MULTIPLAYER TESTS PASSED!\n');
}

runTest().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
