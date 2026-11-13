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

  // 1. Create players: Host Alice, Player 2 Bob, Player 3 Charlie
  console.log('1. Signing in Host (Alice), Player 2 (Bob), and Player 3 (Charlie)...');
  const aliceClient = createAnonClient();
  const bobClient = createAnonClient();
  const charlieClient = createAnonClient();

  const { data: aliceAuth, error: aliceAuthErr } = await aliceClient.auth.signInAnonymously();
  assert(!aliceAuthErr, 'Alice auth failed: ' + aliceAuthErr?.message);
  const aliceUser = aliceAuth.user;

  const { data: bobAuth, error: bobAuthErr } = await bobClient.auth.signInAnonymously();
  assert(!bobAuthErr, 'Bob auth failed: ' + bobAuthErr?.message);
  const bobUser = bobAuth.user;

  const { data: charlieAuth, error: charlieAuthErr } = await charlieClient.auth.signInAnonymously();
  assert(!charlieAuthErr, 'Charlie auth failed: ' + charlieAuthErr?.message);
  const charlieUser = charlieAuth.user;

  console.log(`   ✓ Alice ID: ${aliceUser.id}`);
  console.log(`   ✓ Bob ID: ${bobUser.id}`);
  console.log(`   ✓ Charlie ID: ${charlieUser.id}`);

  // Test missing looking_for rejection
  console.log('\nTesting rejection when "looking for" is not selected...');
  const { error: noOptionErr } = await aliceClient.rpc('create_room', {
    p_display_name: 'NoOptionAlice',
  });
  assert(noOptionErr && noOptionErr.message.includes('Looking For'), 'Must reject when looking_for is missing: ' + noOptionErr?.message);
  console.log(`   ✓ Correctly rejected missing looking_for: "${noOptionErr.message}"`);

  // 2. Host creates room with looking_for: 'Man'
  console.log('\n2. Alice creates room (Looking for: "Man")...');
  const { data: roomData, error: createErr } = await aliceClient.rpc('create_room', {
    p_display_name: 'Alice',
    p_looking_for: 'Man',
  });
  assert(!createErr, 'Failed to create room: ' + createErr?.message);
  const roomId = roomData.room.id;
  assert(roomData.player.looking_for === 'Man', 'Alice looking_for should be Man');
  console.log(`   ✓ Room created: ${roomId}, Alice looking_for: ${roomData.player.looking_for}`);

  // 3. Bob joins room with looking_for: 'Woman'
  console.log('\n3. Bob joins room (Looking for: "Woman")...');
  const { data: joinData, error: joinErr } = await bobClient.rpc('join_room', {
    p_room_id: roomId,
    p_display_name: 'Bob',
    p_looking_for: 'Woman',
  });
  assert(!joinErr, 'Failed to join room: ' + joinErr?.message);
  assert(joinData.player.looking_for === 'Woman', 'Bob looking_for should be Woman');
  console.log(`   ✓ Bob seated: Seat ${joinData.player.seat_number}, looking_for: ${joinData.player.looking_for}`);

  // 4. Charlie joins room with looking_for: 'Both' (Both Man and Woman selected)
  console.log('\n4. Charlie joins room (Looking for: "Both" - clicked both Man and Woman)...');
  const { data: charlieJoin, error: charlieJoinErr } = await charlieClient.rpc('join_room', {
    p_room_id: roomId,
    p_display_name: 'Charlie',
    p_looking_for: 'Both',
  });
  assert(!charlieJoinErr, 'Failed to join room: ' + charlieJoinErr?.message);
  assert(charlieJoin.player.looking_for === 'Both', 'Charlie looking_for should be Both');
  console.log(`   ✓ Charlie seated: Seat ${charlieJoin.player.seat_number}, looking_for: ${charlieJoin.player.looking_for}`);

  // 5. Start game
  console.log('\n5. Alice starts the game...');
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

  // Fetch Charlie state
  const { data: charlieState, error: charlieStateErr } = await charlieClient.rpc('fetch_game_round_state', {
    p_room_id: roomId
  });
  assert(!charlieStateErr, 'Charlie fetch state failed: ' + charlieStateErr?.message);
  assert(charlieState.profiles.length === 10, 'Charlie should see 10 round profiles');

  // Verify gender filtering per player preference:
  // Alice (looking for Man): 100% of profiles are Men!
  assert(aliceState.profiles.every(p => p.gender === 'man'), 'Alice (looking for Man) must see ONLY men');
  console.log('   ✓ Alice (Looking for Men): 100% of profiles in deck are Men (0 women seen).');

  // Bob (looking for Woman): 100% of profiles are Women!
  assert(bobState.profiles.every(p => p.gender === 'woman'), 'Bob (looking for Woman) must see ONLY women');
  console.log('   ✓ Bob (Looking for Women): 100% of profiles in deck are Women (0 men seen).');

  // Charlie (looking for Both): exactly 5 Men and 5 Women (50/50 split)!
  const charlieMen = charlieState.profiles.filter(p => p.gender === 'man');
  const charlieWomen = charlieState.profiles.filter(p => p.gender === 'woman');
  assert(charlieMen.length === 5 && charlieWomen.length === 5, 'Charlie (looking for Both) must see a 50/50 split (5 men, 5 women)');
  console.log('   ✓ Charlie (Looking for Both): 50/50 split (5 men, 5 women).');

  // Check profile fields
  const sampleProfile = aliceState.profiles[0];
  assert(sampleProfile.name && sampleProfile.age, 'Profile has name and age');
  assert(sampleProfile.gender === 'man' || sampleProfile.gender === 'woman', 'Profile has gender (man/woman)');
  assert(sampleProfile.attractiveness === undefined, 'Attractiveness field must not be present');
  for (const prof of aliceState.profiles) {
    assert(prof.attractiveness === undefined, `Profile ${prof.name} must not have attractiveness field`);
  }
  assert(sampleProfile.bio, 'Profile has bio');
  assert(sampleProfile.red_flags?.length > 0, 'Profile has red flags');
  assert(sampleProfile.green_flags?.length > 0, 'Profile has green flags');
  assert(sampleProfile.avatar_url && sampleProfile.avatar_url.startsWith('/profiles/'), 'Profile has avatar_url');
  for (const prof of aliceState.profiles) {
    assert(prof.avatar_url && prof.avatar_url.endsWith('.jpg'), `Profile ${prof.name} must have valid avatar_url (.jpg)`);
  }
  assert(sampleProfile.avatar_svg?.includes('<svg'), 'Profile has embedded SVG avatar fallback');
  console.log(`   ✓ Profile sample validated: "${sampleProfile.name}" (${sampleProfile.age}, gender: ${sampleProfile.gender}, photo: ${sampleProfile.avatar_url}), ${sampleProfile.occupation}`);

  // 6. Check secret matches and gender targeting
  console.log('\n6. Checking secret matches and gender preference targeting for Round 1...');
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

  const { data: charlieMatches, error: cMatchesErr } = await charlieClient
    .from('player_round_matches')
    .select('profile_id')
    .eq('room_id', roomId)
    .eq('round_number', 1)
    .eq('user_id', charlieUser.id);
  assert(!cMatchesErr, 'Failed to fetch Charlie matches: ' + cMatchesErr?.message);
  assert(charlieMatches.length === 3, `Charlie should have 3 secret matches, got ${charlieMatches.length}`);

  // Verify Alice (looking for Man) only got Men as secret matches from her deck
  const aliceProfileMap = new Map(aliceState.profiles.map(p => [p.id, p]));
  for (const m of aliceMatches) {
    const p = aliceProfileMap.get(m.profile_id);
    assert(p && p.gender === 'man', `Alice (Looking for Man) matched with non-man: ${p?.name} (${p?.gender})`);
  }
  console.log('   ✓ Alice (Looking for Man): 100% of secret matches are Men!');

  // Verify Bob (looking for Woman) only got Women as secret matches from his deck
  const bobProfileMap = new Map(bobState.profiles.map(p => [p.id, p]));
  for (const m of bobMatches) {
    const p = bobProfileMap.get(m.profile_id);
    assert(p && p.gender === 'woman', `Bob (Looking for Woman) matched with non-woman: ${p?.name} (${p?.gender})`);
  }
  console.log('   ✓ Bob (Looking for Woman): 100% of secret matches are Women!');

  // Verify Charlie (looking for Both) secret matches are from their deck
  const charlieProfileMap = new Map(charlieState.profiles.map(p => [p.id, p]));
  for (const m of charlieMatches) {
    const p = charlieProfileMap.get(m.profile_id);
    assert(p, `Charlie secret match must be in Charlie's deck: ${m.profile_id}`);
  }
  console.log('   ✓ Charlie (Looking for Both): 100% of secret matches from deck!');

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

  // 12. Bob likes 3 profiles
  console.log('\n12. Bob likes 3 profiles...');
  const bobMatchIdSet = new Set(bobMatches.map(m => m.profile_id));
  const bobMatch1 = bobState.profiles.find(p => bobMatchIdSet.has(p.id));
  const bobNonMatch = bobState.profiles.find(p => !bobMatchIdSet.has(p.id));
  const bobMatch2 = bobState.profiles.find(p => bobMatchIdSet.has(p.id) && p.id !== bobMatch1.id);

  const { data: bLike1 } = await bobClient.rpc('submit_like', { p_room_id: roomId, p_profile_id: bobMatch1.id });
  assert(bLike1.is_match === true, 'Bob match 1 is true');
  const { data: bLike2 } = await bobClient.rpc('submit_like', { p_room_id: roomId, p_profile_id: bobNonMatch.id });
  assert(bLike2.is_match === false, 'Bob non-match is false');
  const { data: bLike3 } = await bobClient.rpc('submit_like', { p_room_id: roomId, p_profile_id: bobMatch2.id });
  assert(bLike3.round_completed === true, 'Bob round_completed should be true');
  assert(bLike3.round_advanced === false, 'Round should not advance yet because Charlie is still swiping');
  console.log(`   ✓ Bob completed 3 likes (round waiting for Charlie).`);

  // 13. Charlie likes 3 profiles (all players now completed swiping) -> triggers transition to 'dating' phase!
  console.log('\n13. Charlie likes 3 profiles (all players now completed swiping)...');
  const charlieMatchIdSet = new Set(charlieMatches.map(m => m.profile_id));
  const charlieMatch1 = charlieState.profiles.find(p => charlieMatchIdSet.has(p.id));
  const charlieNonMatch1 = charlieState.profiles.find(p => !charlieMatchIdSet.has(p.id));
  const charlieNonMatch2 = charlieState.profiles.find(p => !charlieMatchIdSet.has(p.id) && p.id !== charlieNonMatch1.id);

  // Charlie likes 1 match and 2 non-matches
  await charlieClient.rpc('submit_like', { p_room_id: roomId, p_profile_id: charlieMatch1.id });
  await charlieClient.rpc('submit_like', { p_room_id: roomId, p_profile_id: charlieNonMatch1.id });
  const { data: cLike3, error: cLike3Err } = await charlieClient.rpc('submit_like', {
    p_room_id: roomId,
    p_profile_id: charlieNonMatch2.id,
  });
  assert(!cLike3Err, 'Charlie like 3 failed: ' + cLike3Err?.message);
  assert(cLike3.round_completed === true, 'Charlie round_completed should be true');
  assert(cLike3.round_phase === 'dating', 'Room round_phase should now be "dating"');
  assert(cLike3.phase_transitioned === true, 'phase_transitioned should be true');
  console.log('   ✓ Room transitioned to "dating" phase! 🎉');

  // 14. Verify Dating Phase State & Date Outcomes for all players
  console.log('\n14. Verifying Dating Phase state & date outcomes...');
  const { data: aliceDatingState } = await aliceClient.rpc('fetch_game_round_state', { p_room_id: roomId });
  assert(aliceDatingState.room.round_phase === 'dating', 'Alice state: round_phase should be dating');
  assert(aliceDatingState.my_matches.length >= 1, 'Alice should have at least 1 match');
  console.log(`   ✓ Alice has ${aliceDatingState.my_matches.length} match(es) for dating.`);

  const aliceChosenMatch = aliceDatingState.my_matches[0];
  assert(['great', 'good', 'bad', 'murdered'].includes(aliceChosenMatch.date_outcome), 'Valid date outcome: ' + aliceChosenMatch.date_outcome);
  if (aliceChosenMatch.date_outcome === 'great') assert(aliceChosenMatch.date_points === 1000, 'Great date is 1000 pts');
  if (aliceChosenMatch.date_outcome === 'good') assert(aliceChosenMatch.date_points === 500, 'Good date is 500 pts');
  if (aliceChosenMatch.date_outcome === 'bad') assert(aliceChosenMatch.date_points === -500, 'Bad date is -500 pts (scores can go negative)');
  if (aliceChosenMatch.date_outcome === 'murdered') assert(aliceChosenMatch.date_points === 0, 'Murdered date is 0 pts');
  console.log(`   ✓ Alice date outcome verified: ${aliceChosenMatch.date_outcome} (${aliceChosenMatch.date_points} pts).`);

  // 15. Alice resolves her date
  console.log('\n15. Alice goes on date and reads recap...');
  const { data: aliceDateRes, error: aliceDateErr } = await aliceClient.rpc('resolve_player_date', {
    p_room_id: roomId,
    p_profile_id: aliceChosenMatch.profile_id,
  });
  assert(!aliceDateErr, 'Alice date resolution failed: ' + aliceDateErr?.message);
  assert(aliceDateRes.date_completed === true, 'Alice date_completed should be true');
  assert(aliceDateRes.round_advanced === false, 'Round should not advance yet (Bob and Charlie still reading)');
  console.log(`   ✓ Alice date resolved! New Score: ${aliceDateRes.new_score} pts (Murdered: ${aliceDateRes.is_murdered})`);

  // 16. Bob resolves his date (prefers a surviving outcome to verify Round 2 deck)
  console.log('\n16. Bob goes on date and reads recap...');
  const { data: bobDatingState } = await bobClient.rpc('fetch_game_round_state', { p_room_id: roomId });
  const bobChosenMatch = bobDatingState.my_matches.find(m => m.date_outcome !== 'murdered') || bobDatingState.my_matches[0];
  const { data: bobDateRes, error: bobDateErr } = await bobClient.rpc('resolve_player_date', {
    p_room_id: roomId,
    p_profile_id: bobChosenMatch.profile_id,
  });
  assert(!bobDateErr, 'Bob date resolution failed: ' + bobDateErr?.message);
  assert(bobDateRes.date_completed === true, 'Bob date_completed should be true');
  assert(bobDateRes.round_advanced === false, 'Round should not advance yet (Charlie still reading)');
  console.log(`   ✓ Bob date resolved! New Score: ${bobDateRes.new_score} pts`);

  // 17. Charlie resolves date / conciliatory screen
  console.log('\n17. Charlie finishes reading date/conciliatory screen (last player to confirm)...');
  const { data: charlieDatingState } = await charlieClient.rpc('fetch_game_round_state', { p_room_id: roomId });
  const charlieMatch = charlieDatingState.my_matches[0];
  const { data: charlieDateRes, error: charlieDateErr } = await charlieClient.rpc('resolve_player_date', {
    p_room_id: roomId,
    p_profile_id: charlieMatch ? charlieMatch.profile_id : null,
  });
  assert(!charlieDateErr, 'Charlie date resolution failed: ' + charlieDateErr?.message);
  assert(charlieDateRes.date_completed === true, 'Charlie date_completed should be true');
  assert(charlieDateRes.round_advanced === true, 'Round should advance to Round 2 now that all players have read!');
  assert(charlieDateRes.current_round === 2, 'Current round should now be 2');
  assert(charlieDateRes.round_phase === 'swiping', 'Round phase should be reset to "swiping"');
  console.log('   ✓ All players finished dates! Round automatically advanced to Round 2 swiping! 🎉');

  // 18. Verify Round 2 state
  console.log('\n18. Verifying Round 2 state for all players...');
  const { data: aliceR2State } = await aliceClient.rpc('fetch_game_round_state', { p_room_id: roomId });
  assert(aliceR2State.room.current_round === 2, 'Alice state: round should be 2');
  assert(aliceR2State.room.round_phase === 'swiping', 'Alice state: round_phase should be swiping');
  assert(aliceR2State.my_likes.length === 0, 'Alice likes reset for Round 2');

  const alicePlayerInR2 = aliceR2State.players.find(p => p.user_id === aliceUser.id);
  assert(alicePlayerInR2.score === aliceDateRes.new_score, 'Score persisted across rounds: ' + alicePlayerInR2.score);
  console.log(`   ✓ Score persisted into Round 2: ${alicePlayerInR2.score} pts`);

  const { data: bobR2State } = await bobClient.rpc('fetch_game_round_state', { p_room_id: roomId });
  assert(bobR2State.room.current_round === 2, 'Bob state: round should be 2');
  assert(bobR2State.profiles.length === 10, 'Round 2 has 10 profiles');
  assert(bobR2State.profiles.every(p => p.gender === 'woman'), 'Bob Round 2 must still be 100% Women');
  assert(bobR2State.my_likes.length === 0, 'Bob likes reset for Round 2');

  // Verify unseen personas across rounds
  const bobR1Ids = new Set(bobState.profiles.map(p => p.id));
  const bobOverlap = bobR2State.profiles.filter(p => bobR1Ids.has(p.id));
  assert(bobOverlap.length === 0, 'Bob Round 2 must show 100% unseen personas!');
  console.log('   ✓ Bob Round 2: 10 new unseen Women (0 overlap with Round 1).');

  // If a player was murdered in Round 1, test that they cannot swipe in Round 2
  const murderedPlayer = [alicePlayerInR2, bobR2State.players.find(p => p.user_id === bobUser.id)].find(p => p.is_murdered);
  if (murderedPlayer) {
    console.log(`\n19. Testing murdered player rejection (${murderedPlayer.display_name})...`);
    const murderedClient = murderedPlayer.user_id === aliceUser.id ? aliceClient : bobClient;
    const { error: murderedSwipeErr } = await murderedClient.rpc('submit_like', {
      p_room_id: roomId,
      p_profile_id: bobR2State.profiles[0].id,
    });
    assert(murderedSwipeErr && murderedSwipeErr.message.includes('Murdered players cannot swipe'), 'Must block murdered player from swiping');
    console.log('   ✓ Murdered player successfully blocked from swiping in Round 2!');
  }

  console.log('\n🎉 ALL DATING PHASE & MURDER STAKES TESTS PASSED SUCCESSFULLY!\n');
}

runRoundGameplayTest().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
