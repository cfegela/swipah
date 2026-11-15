-- Migration: 20261115000001_player_sex_organs.sql
-- Store each player's own sex organs ('pole' or 'hole') on room_players and expose it in fetch_game_round_state.

-- 1. Add sex_organs column to room_players
ALTER TABLE public.room_players
ADD COLUMN IF NOT EXISTS sex_organs TEXT;

ALTER TABLE public.room_players
DROP CONSTRAINT IF EXISTS check_player_sex_organs;

ALTER TABLE public.room_players
ADD CONSTRAINT check_player_sex_organs
CHECK (sex_organs IS NULL OR sex_organs IN ('pole', 'hole'));

-- 2. Update create_room to persist p_sex_organs (drop old 2-arg signature to avoid overload ambiguity)
DROP FUNCTION IF EXISTS public.create_room(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_room(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_room(
    p_display_name TEXT,
    p_looking_for TEXT DEFAULT NULL,
    p_sex_organs TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room public.rooms%ROWTYPE;
    v_player public.room_players%ROWTYPE;
    v_sex_organs TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_display_name IS NULL OR length(trim(p_display_name)) = 0 THEN
        RAISE EXCEPTION 'Display name is required';
    END IF;

    IF p_looking_for IS NULL OR p_looking_for NOT IN ('Man', 'Woman', 'Both', 'Anything That Moves') THEN
        RAISE EXCEPTION 'A "Looking For" selection is required';
    END IF;

    v_sex_organs := NULLIF(lower(trim(COALESCE(p_sex_organs, ''))), '');
    IF v_sex_organs IS NOT NULL AND v_sex_organs NOT IN ('pole', 'hole') THEN
        RAISE EXCEPTION 'Invalid sex organs selection';
    END IF;

    INSERT INTO public.rooms (host_id, status, max_players, current_round)
    VALUES (v_user_id, 'waiting', 4, 1)
    RETURNING * INTO v_room;

    INSERT INTO public.room_players (room_id, user_id, display_name, seat_number, is_host, looking_for, sex_organs)
    VALUES (v_room.id, v_user_id, trim(p_display_name), 1, true, p_looking_for, v_sex_organs)
    RETURNING * INTO v_player;

    RETURN json_build_object(
        'room', row_to_json(v_room),
        'player', row_to_json(v_player)
    );
END;
$$;

-- 3. Update join_room to persist p_sex_organs (drop old 3-arg signature to avoid overload ambiguity)
DROP FUNCTION IF EXISTS public.join_room(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.join_room(UUID, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.join_room(
    p_room_id UUID,
    p_display_name TEXT,
    p_looking_for TEXT DEFAULT NULL,
    p_sex_organs TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room public.rooms%ROWTYPE;
    v_existing_player public.room_players%ROWTYPE;
    v_player public.room_players%ROWTYPE;
    v_player_count INT;
    v_next_seat INT;
    v_sex_organs TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_display_name IS NULL OR length(trim(p_display_name)) = 0 THEN
        RAISE EXCEPTION 'Display name is required';
    END IF;

    IF p_looking_for IS NULL OR p_looking_for NOT IN ('Man', 'Woman', 'Both', 'Anything That Moves') THEN
        RAISE EXCEPTION 'A "Looking For" selection is required';
    END IF;

    v_sex_organs := NULLIF(lower(trim(COALESCE(p_sex_organs, ''))), '');
    IF v_sex_organs IS NOT NULL AND v_sex_organs NOT IN ('pole', 'hole') THEN
        RAISE EXCEPTION 'Invalid sex organs selection';
    END IF;

    SELECT * INTO v_room
    FROM public.rooms
    WHERE id = p_room_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room not found';
    END IF;

    IF v_room.status != 'waiting' THEN
        RAISE EXCEPTION 'Game is already % and cannot be joined.', v_room.status;
    END IF;

    -- Check if player already in room (reconnection)
    SELECT * INTO v_existing_player
    FROM public.room_players
    WHERE room_id = p_room_id AND user_id = v_user_id;

    IF v_existing_player.id IS NOT NULL THEN
        UPDATE public.room_players
        SET display_name = trim(p_display_name),
            looking_for = p_looking_for,
            sex_organs = COALESCE(v_sex_organs, sex_organs),
            last_seen_at = now()
        WHERE id = v_existing_player.id
        RETURNING * INTO v_player;

        RETURN json_build_object(
            'room', row_to_json(v_room),
            'player', row_to_json(v_player),
            'reconnected', true
        );
    END IF;

    -- Check capacity
    SELECT COUNT(*) INTO v_player_count
    FROM public.room_players
    WHERE room_id = p_room_id;

    IF v_player_count >= v_room.max_players THEN
        RAISE EXCEPTION 'Room is full (maximum % players reached).', v_room.max_players;
    END IF;

    -- Determine next available seat number (1..4)
    SELECT COALESCE(MIN(s.seat), 1) INTO v_next_seat
    FROM generate_series(1, v_room.max_players) AS s(seat)
    WHERE s.seat NOT IN (
        SELECT seat_number FROM public.room_players WHERE room_id = p_room_id
    );

    INSERT INTO public.room_players (room_id, user_id, display_name, seat_number, is_host, looking_for, sex_organs)
    VALUES (p_room_id, v_user_id, trim(p_display_name), v_next_seat, false, p_looking_for, v_sex_organs)
    RETURNING * INTO v_player;

    RETURN json_build_object(
        'room', row_to_json(v_room),
        'player', row_to_json(v_player),
        'reconnected', false
    );
END;
$$;

-- 4. Expose sex_organs on players returned by fetch_game_round_state
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

    SELECT json_agg(
        json_build_object(
            'id', p.id,
            'user_id', p.user_id,
            'display_name', p.display_name,
            'seat_number', p.seat_number,
            'is_host', p.is_host,
            'likes_count', p.likes_count,
            'likes_required', (
                SELECT LEAST(3, COUNT(*)::INT)
                FROM public.game_round_profiles grp
                WHERE grp.room_id = p.room_id
                  AND grp.round_number = v_room.current_round
                  AND grp.user_id = p.user_id
            ),
            'dated_count', (
                SELECT COUNT(*)::INT
                FROM public.player_date_history pdh
                WHERE pdh.room_id = p.room_id
                  AND pdh.user_id = p.user_id
            ),
            'matches_count', p.matches_count,
            'round_completed', p.round_completed,
            'date_completed', p.date_completed,
            'looking_for', p.looking_for,
            'sex_organs', p.sex_organs,
            'score', p.score,
            'is_murdered', p.is_murdered,
            'selected_date_profile_id', p.selected_date_profile_id
        ) ORDER BY p.seat_number ASC
    ) INTO v_players
    FROM public.room_players p
    WHERE p.room_id = p_room_id;

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
            'extra_photos', COALESCE(cp.extra_photos, '{}'::TEXT[]),
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
            'extra_photos', COALESCE(cp.extra_photos, '{}'::TEXT[]),
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
