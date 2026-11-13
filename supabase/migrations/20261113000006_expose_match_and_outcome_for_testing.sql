-- Migration: 20261113000006_expose_match_and_outcome_for_testing.sql
-- Expose match status and pre-determined date outcome in fetch_game_round_state profiles for testing

CREATE OR REPLACE FUNCTION public.fetch_game_round_state(p_room_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room public.rooms%ROWTYPE;
    v_players json;
    v_profiles json;
    v_my_likes json;
    v_my_matches json;
BEGIN
    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room not found';
    END IF;

    IF v_user_id IS NULL THEN
        SELECT user_id INTO v_user_id FROM public.room_players WHERE room_id = p_room_id ORDER BY seat_number ASC LIMIT 1;
    END IF;

    -- Fetch all players in room with score, is_murdered, date_completed, looking_for
    SELECT json_agg(
        json_build_object(
            'id', p.id,
            'user_id', p.user_id,
            'display_name', p.display_name,
            'seat_number', p.seat_number,
            'is_host', p.is_host,
            'likes_count', p.likes_count,
            'matches_count', p.matches_count,
            'round_completed', p.round_completed,
            'date_completed', p.date_completed,
            'looking_for', p.looking_for,
            'score', p.score,
            'is_murdered', p.is_murdered,
            'selected_date_profile_id', p.selected_date_profile_id
        ) ORDER BY p.seat_number ASC
    ) INTO v_players
    FROM public.room_players p
    WHERE p.room_id = p_room_id;

    -- Fetch round profiles for this user (including testing match & date outcome values)
    SELECT json_agg(
        json_build_object(
            'id', cp.id,
            'slug', cp.slug,
            'name', cp.name,
            'age', cp.age,
            'gender', cp.gender,
            'occupation', cp.occupation,
            'location', cp.location,
            'bio', cp.bio,
            'red_flags', cp.red_flags,
            'green_flags', cp.green_flags,
            'prompt_question', cp.prompt_question,
            'prompt_answer', cp.prompt_answer,
            'avatar_url', cp.avatar_url,
            'avatar_svg', cp.avatar_svg,
            'position', grp.position,
            'is_match', (prm.id IS NOT NULL),
            'date_outcome', prm.date_outcome,
            'date_points', prm.date_points
        ) ORDER BY grp.position ASC
    ) INTO v_profiles
    FROM public.game_round_profiles grp
    JOIN public.catalog_profiles cp ON cp.id = grp.profile_id
    LEFT JOIN public.player_round_matches prm
      ON prm.room_id = grp.room_id
     AND prm.round_number = grp.round_number
     AND prm.user_id = grp.user_id
     AND prm.profile_id = grp.profile_id
    WHERE grp.room_id = p_room_id
      AND grp.round_number = v_room.current_round
      AND grp.user_id = v_user_id;

    -- Fetch current user likes in this round
    SELECT json_agg(
        json_build_object(
            'profile_id', ppl.profile_id,
            'is_match', ppl.is_match,
            'created_at', ppl.created_at
        )
    ) INTO v_my_likes
    FROM public.player_profile_likes ppl
    WHERE ppl.room_id = p_room_id
      AND ppl.round_number = v_room.current_round
      AND ppl.user_id = v_user_id;

    -- Fetch current user matches that were liked (with date outcome info)
    SELECT json_agg(
        json_build_object(
            'profile_id', cp.id,
            'slug', cp.slug,
            'name', cp.name,
            'age', cp.age,
            'gender', cp.gender,
            'occupation', cp.occupation,
            'location', cp.location,
            'bio', cp.bio,
            'red_flags', cp.red_flags,
            'green_flags', cp.green_flags,
            'prompt_question', cp.prompt_question,
            'prompt_answer', cp.prompt_answer,
            'avatar_url', cp.avatar_url,
            'avatar_svg', cp.avatar_svg,
            'date_outcome', prm.date_outcome,
            'date_points', prm.date_points
        )
    ) INTO v_my_matches
    FROM public.player_profile_likes ppl
    JOIN public.player_round_matches prm
      ON prm.room_id = ppl.room_id
     AND prm.round_number = ppl.round_number
     AND prm.user_id = ppl.user_id
     AND prm.profile_id = ppl.profile_id
    JOIN public.catalog_profiles cp ON cp.id = prm.profile_id
    WHERE ppl.room_id = p_room_id
      AND ppl.round_number = v_room.current_round
      AND ppl.user_id = v_user_id
      AND ppl.is_match = true;

    RETURN json_build_object(
        'room', row_to_json(v_room),
        'players', COALESCE(v_players, '[]'::json),
        'profiles', COALESCE(v_profiles, '[]'::json),
        'my_likes', COALESCE(v_my_likes, '[]'::json),
        'my_matches', COALESCE(v_my_matches, '[]'::json)
    );
END;
$$;
