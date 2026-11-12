-- Migration: 20261112000003_allow_both_looking_for.sql
-- Allow selecting both 'Man' and 'Woman' (stored as 'Both') and require a valid selection

-- 1. Update check constraint on room_players.looking_for
ALTER TABLE public.room_players
DROP CONSTRAINT IF EXISTS check_player_looking_for;

ALTER TABLE public.room_players
ADD CONSTRAINT check_player_looking_for
CHECK (looking_for IN ('Man', 'Woman', 'Both', 'Anything That Moves'));

-- 2. Update create_room stored procedure
CREATE OR REPLACE FUNCTION public.create_room(
    p_display_name TEXT,
    p_looking_for TEXT DEFAULT NULL
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

    INSERT INTO public.rooms (host_id, status, max_players, current_round)
    VALUES (v_user_id, 'waiting', 4, 1)
    RETURNING * INTO v_room;

    INSERT INTO public.room_players (room_id, user_id, display_name, seat_number, is_host, looking_for)
    VALUES (v_room.id, v_user_id, trim(p_display_name), 1, true, p_looking_for)
    RETURNING * INTO v_player;

    RETURN json_build_object(
        'room', row_to_json(v_room),
        'player', row_to_json(v_player)
    );
END;
$$;

-- 3. Update join_room stored procedure
CREATE OR REPLACE FUNCTION public.join_room(
    p_room_id UUID,
    p_display_name TEXT,
    p_looking_for TEXT DEFAULT NULL
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

    INSERT INTO public.room_players (room_id, user_id, display_name, seat_number, is_host, looking_for)
    VALUES (p_room_id, v_user_id, trim(p_display_name), v_next_seat, false, p_looking_for)
    RETURNING * INTO v_player;

    RETURN json_build_object(
        'room', row_to_json(v_room),
        'player', row_to_json(v_player),
        'reconnected', false
    );
END;
$$;

-- 4. Update seed_round_data helper to support 'Both'
CREATE OR REPLACE FUNCTION public.seed_round_data(p_room_id UUID, p_round_number INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_profile_rec RECORD;
    v_pos INT := 1;
    v_player_rec RECORD;
    v_offset INT;
BEGIN
    v_offset := ((p_round_number - 1) * 10) % 20;

    -- Insert 10 profiles into game_round_profiles
    FOR v_profile_rec IN (
        SELECT id FROM public.catalog_profiles
        ORDER BY ((order_idx - 1 - v_offset + 20) % 20) ASC
        LIMIT 10
    ) LOOP
        INSERT INTO public.game_round_profiles (room_id, round_number, profile_id, position)
        VALUES (p_room_id, p_round_number, v_profile_rec.id, v_pos)
        ON CONFLICT (room_id, round_number, profile_id) DO NOTHING;
        v_pos := v_pos + 1;
    END LOOP;

    -- Assign 3 distinct secret matches matching each player's looking_for preference:
    FOR v_player_rec IN (
        SELECT user_id, looking_for FROM public.room_players WHERE room_id = p_room_id
    ) LOOP
        IF v_player_rec.looking_for = 'Man' THEN
            INSERT INTO public.player_round_matches (room_id, round_number, user_id, profile_id)
            SELECT p_room_id, p_round_number, v_player_rec.user_id, grp.profile_id
            FROM public.game_round_profiles grp
            JOIN public.catalog_profiles cp ON cp.id = grp.profile_id
            WHERE grp.room_id = p_room_id
              AND grp.round_number = p_round_number
              AND cp.gender = 'man'
            ORDER BY random()
            LIMIT 3
            ON CONFLICT (room_id, round_number, user_id, profile_id) DO NOTHING;
        ELSIF v_player_rec.looking_for = 'Woman' THEN
            INSERT INTO public.player_round_matches (room_id, round_number, user_id, profile_id)
            SELECT p_room_id, p_round_number, v_player_rec.user_id, grp.profile_id
            FROM public.game_round_profiles grp
            JOIN public.catalog_profiles cp ON cp.id = grp.profile_id
            WHERE grp.room_id = p_room_id
              AND grp.round_number = p_round_number
              AND cp.gender = 'woman'
            ORDER BY random()
            LIMIT 3
            ON CONFLICT (room_id, round_number, user_id, profile_id) DO NOTHING;
        ELSE
            -- 'Both' or 'Anything That Moves'
            INSERT INTO public.player_round_matches (room_id, round_number, user_id, profile_id)
            SELECT p_room_id, p_round_number, v_player_rec.user_id, grp.profile_id
            FROM public.game_round_profiles grp
            WHERE grp.room_id = p_room_id
              AND grp.round_number = p_round_number
            ORDER BY random()
            LIMIT 3
            ON CONFLICT (room_id, round_number, user_id, profile_id) DO NOTHING;
        END IF;
    END LOOP;
END;
$$;
