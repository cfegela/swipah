-- Migration: 20261112000002_player_looking_for_and_profile_genders.sql
-- Add gender to catalog profiles and looking_for preference to room players

-- 1. Add gender column to catalog_profiles
ALTER TABLE public.catalog_profiles
ADD COLUMN IF NOT EXISTS gender TEXT;

-- 2. Tag existing 20 profiles with their gender
UPDATE public.catalog_profiles
SET gender = 'man'
WHERE slug IN (
    'chad-thunderclout',
    'brad-hedge-sterling',
    'jax-nova',
    'brody-brogrammer',
    'tyler-alpha-vance',
    'hunter-wilderness',
    'maverick-skater',
    'dr-arthur-bibliophile',
    'zack-crypto-mooner',
    'chet-vanlife',
    'rex-iron-callahan'
);

UPDATE public.catalog_profiles
SET gender = 'woman'
WHERE slug IN (
    'luna-starweaver',
    'chloe-matcha',
    'daisy-wanderlust',
    'penelope-sourdough-green',
    'gemma-vintage',
    'tiffany-sparkle',
    'sierra-eco-warrior',
    'bella-cinephile',
    'zara-neon'
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_profile_gender'
    ) THEN
        ALTER TABLE public.catalog_profiles
        ADD CONSTRAINT check_profile_gender CHECK (gender IN ('man', 'woman'));
    END IF;
END $$;

ALTER TABLE public.catalog_profiles ALTER COLUMN gender SET NOT NULL;

-- 3. Add looking_for column to room_players
ALTER TABLE public.room_players
ADD COLUMN IF NOT EXISTS looking_for TEXT NOT NULL DEFAULT 'Anything That Moves';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_player_looking_for'
    ) THEN
        ALTER TABLE public.room_players
        ADD CONSTRAINT check_player_looking_for CHECK (looking_for IN ('Man', 'Woman', 'Anything That Moves'));
    END IF;
END $$;


-- 4. Update create_room stored procedure to accept p_looking_for
DROP FUNCTION IF EXISTS public.create_room(TEXT);
DROP FUNCTION IF EXISTS public.create_room(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_room(
    p_display_name TEXT,
    p_looking_for TEXT DEFAULT 'Anything That Moves'
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

    IF p_looking_for IS NULL OR p_looking_for NOT IN ('Man', 'Woman', 'Anything That Moves') THEN
        p_looking_for := 'Anything That Moves';
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


-- 5. Update join_room stored procedure to accept p_looking_for
DROP FUNCTION IF EXISTS public.join_room(UUID, TEXT);
DROP FUNCTION IF EXISTS public.join_room(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.join_room(
    p_room_id UUID,
    p_display_name TEXT,
    p_looking_for TEXT DEFAULT 'Anything That Moves'
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

    IF p_looking_for IS NULL OR p_looking_for NOT IN ('Man', 'Woman', 'Anything That Moves') THEN
        p_looking_for := 'Anything That Moves';
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


-- 6. Update seed_round_data helper to match based on player looking_for preference
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
    -- Determine 10 profiles based on round (Round 1: 1..10, Round 2: 11..20, etc.)
    -- Each set of 10 profiles contains at least 4-6 men and 4-5 women.
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

    -- For each player in room, randomly assign 3 distinct profiles as secret matches matching their looking_for preference:
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
            -- 'Anything That Moves'
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


-- 7. Update fetch_game_round_state to include profile gender
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
BEGIN
    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room not found';
    END IF;

    SELECT json_agg(p ORDER BY p.seat_number ASC) INTO v_players
    FROM public.room_players p
    WHERE p.room_id = p_room_id;

    -- Fetch the 10 profiles for the current round, including gender
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
            'avatar_svg', cp.avatar_svg,
            'position', grp.position
        ) ORDER BY grp.position ASC
    ) INTO v_profiles
    FROM public.game_round_profiles grp
    JOIN public.catalog_profiles cp ON cp.id = grp.profile_id
    WHERE grp.room_id = p_room_id AND grp.round_number = v_room.current_round;

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

    RETURN json_build_object(
        'room', row_to_json(v_room),
        'players', COALESCE(v_players, '[]'::json),
        'profiles', COALESCE(v_profiles, '[]'::json),
        'my_likes', COALESCE(v_my_likes, '[]'::json)
    );
END;
$$;
