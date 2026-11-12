import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

function createAnonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function runRoundGameplayTest() {
  console.log('🧪 Starting Phase 1 Dating Game Loop & Round Play Test...\n');

  // 1. Create two players: Host Alice and Player Bob
  console.log('1. Signing in Host (Alice) and Player 2 (Bob)...');
  const aliceClient = createAnonClient();
  const bobClient = createAnonClient();

  const { data: aliceAuth, error: aliceAuthErr } = await aliceClient.auth.signInAnonymously();
  assert(!aliceAuthErr, 'Alice auth failed: ' + aliceAuthErr?.message);
  const aliceUser = aliceAuth.user;

  const { data: bobAuth, error: bobAuthErr } = await bobClient.auth.signInAnonymously();
  assert(!bobAuthErr, 'Bob auth failed: ' + bobAuthErr?.message);
  const bobUser = bobAuth.user;

  console.log(`   ✓ Alice ID: ${aliceUser.id}`);
  console.log(`   ✓ Bob ID: ${bobUser.id}`);

  // 2. Host creates room
  console.log('\n2. Alice creates room...');
  const { data: roomData, error: createErr } = await aliceClient.rpc('create_room', {
    p_display_name: 'Alice',
  });
  assert(!createErr, 'Failed to create room: ' + createErr?.message);
  const roomId = roomData.room.id;
  console.log(`   ✓ Room created: ${roomId}`);

  // 3. Bob joins room
  console.log('\n3. Bob joins room...');
  const { data: joinData, error: joinErr } = await bobClient.rpc('join_room', {
    p_room_id: roomId,
    p_display_name: 'Bob',
  });
  assert(!joinErr, 'Failed to join room: ' + joinErr?.message);
  console.log(`   ✓ Bob seated: Seat ${joinData.player.seat_number}`);

  // 4. Start game
  console.log('\n4. Alice starts the game...');
  const { data: startData, error: startErr } = await aliceClient.rpc('start_game', {
    p_room_id: roomId,
  });
  assert(!startErr, 'Failed to start game: ' + startErr?.message);
  assert(startData.room.status === 'in_progress', 'Room status should be in_progress');
  assert(startData.room.current_round === 1, 'Starting round should be 1');
  console.log('   ✓ Game started! Round 1 active.');

  // 5. Fetch round state for Alice and Bob
  console.log('\n5. Fetching Round 1 state for both players...');
  const { data: aliceState, error: aliceStateErr } = await aliceClient.rpc('fetch_game_round_state', {
    p_room_id: roomId,
  });
  assert(!aliceStateErr, 'Alice fetch state failed: ' + aliceStateErr?.message);
  assert(aliceState.profiles.length === 10, `Expected 10 round profiles, got ${aliceState.profiles.length}`);
  assert(aliceState.my_likes.length === 0, 'Alice initial likes should be 0');

  const { data: bobState, error: bobStateErr } = await bobClient.rpc('fetch_game_round_state', {
    p_room_id: roomId,
  });
  assert(!bobStateErr, 'Bob fetch state failed: ' + bobStateErr?.message);
  assert(bobState.profiles.length === 10, 'Bob should also see 10 round profiles');
  assert(bobState.my_likes.length === 0, 'Bob initial likes should be 0');

  // Verify both players see the identical 10 profiles in the same order
  const aliceProfileIds = aliceState.profiles.map(p => p.id);
  const bobProfileIds = bobState.profiles.map(p => p.id);
  assert(JSON.stringify(aliceProfileIds) === JSON.stringify(bobProfileIds), 'Both players must see the same 10 profiles in round 1');
  console.log('   ✓ Both players received the exact same 10 profiles.');

  // Check profile fields
  const sampleProfile = aliceState.profiles[0];
  assert(sampleProfile.name && sampleProfile.age, 'Profile has name and age');
  assert(sampleProfile.bio, 'Profile has bio');
  assert(sampleProfile.red_flags?.length > 0, 'Profile has red flags');
  assert(sampleProfile.green_flags?.length > 0, 'Profile has green flags');
  assert(sampleProfile.avatar_svg?.includes('<svg'), 'Profile has embedded SVG avatar');
  console.log(`   ✓ Profile sample validated: "${sampleProfile.name}" (${sampleProfile.age}), ${sampleProfile.occupation}`);

  // 6. Check secret matches
  console.log('\n6. Checking secret matches in DB for Round 1...');
  const { data: aliceMatches, error: aMatchesErr } = await aliceClient
    .from('player_round_matches')
    .select('profile_id')
    .eq('room_id', roomId)
    .eq('round_number', 1)
    .eq('user_id', aliceUser.id);
  assert(!aMatchesErr, 'Failed to fetch Alice matches: ' + aMatchesErr?.message);
  assert(aliceMatches.length === 3, `Alice should have 3 secret matches, got ${aliceMatches.length}`);

  const { data: bobMatches, error: bMatchesErr } = await bobClient
    .from('player_round_matches')
    .select('profile_id')
    .eq('room_id', roomId)
    .eq('round_number', 1)
    .eq('user_id', bobUser.id);
  assert(!bMatchesErr, 'Failed to fetch Bob matches: ' + bMatchesErr?.message);
  assert(bobMatches.length === 3, `Bob should have 3 secret matches, got ${bobMatches.length}`);
  console.log('   ✓ Exactly 3 secret matches assigned to each player.');

  const aliceMatchIdSet = new Set(aliceMatches.map(m => m.profile_id));
  const nonMatchForAlice = aliceState.profiles.find(p => !aliceMatchIdSet.has(p.id));
  const matchForAlice1 = aliceState.profiles.find(p => aliceMatchIdSet.has(p.id));
  const matchForAlice2 = aliceState.profiles.find(p => aliceMatchIdSet.has(p.id) && p.id !== matchForAlice1.id);

  // 7. Alice likes a matching profile
  console.log('\n7. Alice likes a matching profile...');
  const { data: like1, error: like1Err } = await aliceClient.rpc('submit_like', {
    p_room_id: roomId,
    p_profile_id: matchForAlice1.id,
  });
  assert(!like1Err, 'Like 1 failed: ' + like1Err?.message);
  assert(like1.is_match === true, 'Profile was a secret match, is_match must be true');
  assert(like1.likes_count === 1, 'Likes count should be 1');
  assert(like1.matches_count === 1, 'Matches count should be 1');
  assert(like1.round_completed === false, 'Round should not be completed yet');
  console.log(`   ✓ Match registered! Res: is_match=${like1.is_match}, matches_count=${like1.matches_count}`);

  // 8. Alice likes a non-matching profile
  console.log('\n8. Alice likes a non-matching profile...');
  const { data: like2, error: like2Err } = await aliceClient.rpc('submit_like', {
    p_room_id: roomId,
    p_profile_id: nonMatchForAlice.id,
  });
  assert(!like2Err, 'Like 2 failed: ' + like2Err?.message);
  assert(like2.is_match === false, 'Profile was not a secret match, is_match must be false');
  assert(like2.likes_count === 2, 'Likes count should be 2');
  assert(like2.matches_count === 1, 'Matches count should still be 1');
  console.log(`   ✓ Non-match registered: is_match=${like2.is_match}, likes_count=${like2.likes_count}`);

  // 9. Alice tries to duplicate like the same profile
  console.log('\n9. Testing duplicate like rejection...');
  const { error: dupErr } = await aliceClient.rpc('submit_like', {
    p_room_id: roomId,
    p_profile_id: nonMatchForAlice.id,
  });
  assert(dupErr && dupErr.message.includes('already liked'), 'Duplicate like should be rejected');
  console.log(`   ✓ Duplicate like correctly rejected: "${dupErr.message}"`);

  // 10. Alice submits 3rd like (completing her 3 likes)
  console.log('\n10. Alice submits 3rd like (reaching 3/3 limit)...');
  const { data: like3, error: like3Err } = await aliceClient.rpc('submit_like', {
    p_room_id: roomId,
    p_profile_id: matchForAlice2.id,
  });
  assert(!like3Err, 'Like 3 failed: ' + like3Err?.message);
  assert(like3.is_match === true, 'Match 2 is true');
  assert(like3.likes_count === 3, 'Likes count should be 3');
  assert(like3.matches_count === 2, 'Matches count should be 2');
  assert(like3.round_completed === true, 'Alice round_completed should be true');
  assert(like3.round_advanced === false, 'Round should not advance yet because Bob is still swiping');
  console.log(`   ✓ Alice completed round (3/3 likes). Round waiting for Bob.`);

  // 11. Alice attempts 4th like
  console.log('\n11. Alice attempts 4th like...');
  const remainingProfile = aliceState.profiles.find(p => p.id !== matchForAlice1.id && p.id !== nonMatchForAlice.id && p.id !== matchForAlice2.id);
  const { error: fourthErr } = await aliceClient.rpc('submit_like', {
    p_room_id: roomId,
    p_profile_id: remainingProfile.id,
  });
  assert(fourthErr && fourthErr.message.includes('already liked 3 profiles'), 'Exceeding 3 likes should be rejected');
  console.log(`   ✓ 4th like correctly rejected: "${fourthErr.message}"`);

  // 12. Bob likes 2 profiles
  console.log('\n12. Bob likes 2 profiles...');
  const bobMatchIdSet = new Set(bobMatches.map(m => m.profile_id));
  const bobMatch1 = bobState.profiles.find(p => bobMatchIdSet.has(p.id));
  const bobNonMatch = bobState.profiles.find(p => !bobMatchIdSet.has(p.id));
  const bobMatch2 = bobState.profiles.find(p => bobMatchIdSet.has(p.id) && p.id !== bobMatch1.id);

  const { data: bLike1 } = await bobClient.rpc('submit_like', { p_room_id: roomId, p_profile_id: bobMatch1.id });
  assert(bLike1.is_match === true, 'Bob match 1 is true');
  const { data: bLike2 } = await bobClient.rpc('submit_like', { p_room_id: roomId, p_profile_id: bobNonMatch.id });
  assert(bLike2.is_match === false, 'Bob non-match is false');
  console.log(`   ✓ Bob submitted 2 likes (likes_count=2, round_completed=false).`);

  // 13. Bob submits 3rd like -> triggers room auto-advance to Round 2!
  console.log('\n13. Bob submits 3rd like (all players now completed 3 likes)...');
  const { data: bLike3, error: bLike3Err } = await bobClient.rpc('submit_like', {
    p_room_id: roomId,
    p_profile_id: bobMatch2.id,
  });
  assert(!bLike3Err, 'Bob like 3 failed: ' + bLike3Err?.message);
  assert(bLike3.round_completed === true, 'Bob round_completed should be true');
  assert(bLike3.round_advanced === true, 'Round should immediately advance to next round!');
  assert(bLike3.current_round === 2, 'Current round should now be 2');
  console.log('   ✓ Round automatically advanced to Round 2! 🎉');

  // 14. Verify Round 2 state
  console.log('\n14. Verifying Round 2 state for both players...');
  const { data: aliceR2State } = await aliceClient.rpc('fetch_game_round_state', { p_room_id: roomId });
  assert(aliceR2State.room.current_round === 2, 'Alice state: round should be 2');
  assert(aliceR2State.profiles.length === 10, 'Round 2 has 10 profiles');
  assert(aliceR2State.my_likes.length === 0, 'Alice likes reset for Round 2');

  const { data: bobR2State } = await bobClient.rpc('fetch_game_round_state', { p_room_id: roomId });
  assert(bobR2State.room.current_round === 2, 'Bob state: round should be 2');
  assert(bobR2State.profiles.length === 10, 'Round 2 has 10 profiles');
  assert(bobR2State.my_likes.length === 0, 'Bob likes reset for Round 2');

  // Check Round 2 secret matches (RLS ensures each player only sees their own 3 secret matches)
  const { data: aliceR2Matches } = await aliceClient
    .from('player_round_matches')
    .select('*')
    .eq('room_id', roomId)
    .eq('round_number', 2);
  assert(aliceR2Matches.length === 3, `Expected 3 matches for Alice in Round 2, got ${aliceR2Matches?.length}`);

  const { data: bobR2Matches } = await bobClient
    .from('player_round_matches')
    .select('*')
    .eq('room_id', roomId)
    .eq('round_number', 2);
  assert(bobR2Matches.length === 3, `Expected 3 matches for Bob in Round 2, got ${bobR2Matches?.length}`);
  console.log('   ✓ Round 2 successfully seeded with 10 profiles and 3 new secret matches per player (protected by RLS).');

  console.log('\n🎉 ALL PHASE 1 DATING GAMEPLAY LOOP TESTS PASSED SUCCESSFULLY!\n');
}

runRoundGameplayTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
