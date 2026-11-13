-- Migration: 20261113000004_dating_phase_and_murder_stakes.sql
-- Add Dating Phase, Pre-determined Date Outcomes (30% Great, 30% Good, 30% Bad, 10% Murdered),
-- Scoring (+1000, +500, -500, elimination), and Player Date Resolution

-- 1. Add round_phase to rooms table
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS round_phase TEXT NOT NULL DEFAULT 'swiping'
CHECK (round_phase IN ('swiping', 'dating'));

-- 2. Add score, is_murdered, date_completed, and selected_date_profile_id to room_players table
ALTER TABLE public.room_players
ADD COLUMN IF NOT EXISTS score INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_murdered BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS date_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS selected_date_profile_id UUID REFERENCES public.catalog_profiles(id) ON DELETE SET NULL;

-- 3. Add date_outcome and date_points to player_round_matches table
ALTER TABLE public.player_round_matches
ADD COLUMN IF NOT EXISTS date_outcome TEXT NOT NULL DEFAULT 'good'
CHECK (date_outcome IN ('great', 'good', 'bad', 'murdered')),
ADD COLUMN IF NOT EXISTS date_points INT NOT NULL DEFAULT 500;

-- 4. Update seed_round_data to assign pre-determined date outcomes with exact probabilities:
-- 30% Great (+1000 pts), 30% Good (+500 pts), 30% Bad (-500 pts), 10% Murdered (0 pts, elimination)
CREATE OR REPLACE FUNCTION public.seed_round_data(p_room_id UUID, p_round_number INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_player_rec RECORD;
    v_prof RECORD;
    v_pos INT;
    v_cycle_round INT;
    v_match_rec RECORD;
    v_rand FLOAT;
    v_outcome TEXT;
    v_points INT;
BEGIN
    v_cycle_round := ((p_round_number - 1) % 2);

    FOR v_player_rec IN (
        SELECT user_id, looking_for FROM public.room_players WHERE room_id = p_room_id AND is_murdered = false
    ) LOOP
        v_pos := 1;

        IF v_player_rec.looking_for = 'Man' THEN
            -- 10 Men for this round
            FOR v_prof IN (
                SELECT id FROM public.catalog_profiles
                WHERE gender = 'man'
                ORDER BY order_idx ASC
                OFFSET (v_cycle_round * 10)
                LIMIT 10
            ) LOOP
                INSERT INTO public.game_round_profiles (room_id, round_number, user_id, profile_id, position)
                VALUES (p_room_id, p_round_number, v_player_rec.user_id, v_prof.id, v_pos)
                ON CONFLICT (room_id, round_number, user_id, profile_id) DO NOTHING;
                v_pos := v_pos + 1;
            END LOOP;

        ELSIF v_player_rec.looking_for = 'Woman' THEN
            -- 10 Women for this round
            FOR v_prof IN (
                SELECT id FROM public.catalog_profiles
                WHERE gender = 'woman'
                ORDER BY order_idx ASC
                OFFSET (v_cycle_round * 10)
                LIMIT 10
            ) LOOP
                INSERT INTO public.game_round_profiles (room_id, round_number, user_id, profile_id, position)
                VALUES (p_room_id, p_round_number, v_player_rec.user_id, v_prof.id, v_pos)
                ON CONFLICT (room_id, round_number, user_id, profile_id) DO NOTHING;
                v_pos := v_pos + 1;
            END LOOP;

        ELSE
            -- 'Both': 50/50 split (5 men and 5 women)
            FOR v_prof IN (
                (
                    SELECT id, order_idx FROM public.catalog_profiles
                    WHERE gender = 'man'
                    ORDER BY order_idx ASC
                    OFFSET (v_cycle_round * 10)
                    LIMIT 5
                )
                UNION ALL
                (
                    SELECT id, order_idx FROM public.catalog_profiles
                    WHERE gender = 'woman'
                    ORDER BY order_idx ASC
                    OFFSET (v_cycle_round * 10)
                    LIMIT 5
                )
                ORDER BY order_idx ASC
            ) LOOP
                INSERT INTO public.game_round_profiles (room_id, round_number, user_id, profile_id, position)
                VALUES (p_room_id, p_round_number, v_player_rec.user_id, v_prof.id, v_pos)
                ON CONFLICT (room_id, round_number, user_id, profile_id) DO NOTHING;
                v_pos := v_pos + 1;
            END LOOP;
        END IF;

        -- Assign 3 distinct secret matches with pre-determined date outcomes
        FOR v_match_rec IN (
            SELECT grp.profile_id
            FROM public.game_round_profiles grp
            WHERE grp.room_id = p_room_id
              AND grp.round_number = p_round_number
              AND grp.user_id = v_player_rec.user_id
            ORDER BY random()
            LIMIT 3
        ) LOOP
            v_rand := random();
            IF v_rand < 0.30 THEN
                v_outcome := 'great';
                v_points := 1000;
            ELSIF v_rand < 0.60 THEN
                v_outcome := 'good';
                v_points := 500;
            ELSIF v_rand < 0.90 THEN
                v_outcome := 'bad';
                v_points := -500;
            ELSE
                v_outcome := 'murdered';
                v_points := 0;
            END IF;

            INSERT INTO public.player_round_matches (
                room_id, round_number, user_id, profile_id, date_outcome, date_points
            ) VALUES (
                p_room_id, p_round_number, v_player_rec.user_id, v_match_rec.profile_id, v_outcome, v_points
            )
            ON CONFLICT (room_id, round_number, user_id, profile_id) DO NOTHING;
        END LOOP;

    END LOOP;
END;
$$;

-- 5. Update submit_player_profile_like to transition to 'dating' phase when all alive players finish liking
CREATE OR REPLACE FUNCTION public.submit_player_profile_like(
    p_room_id UUID,
    p_profile_id UUID
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
    v_is_match BOOLEAN := false;
    v_uncompleted_swipes INT;
    v_phase_transitioned BOOLEAN := false;
BEGIN
    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room not found';
    END IF;

    IF v_room.status != 'in_progress' THEN
        RAISE EXCEPTION 'Game is not in progress';
    END IF;

    IF v_room.round_phase != 'swiping' THEN
        RAISE EXCEPTION 'Round is currently in date recap phase';
    END IF;

    -- Lock player row
    SELECT * INTO v_player
    FROM public.room_players
    WHERE room_id = p_room_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Player not in room';
    END IF;

    IF v_player.is_murdered THEN
        RAISE EXCEPTION 'Murdered players cannot swipe';
    END IF;

    IF v_player.round_completed OR v_player.likes_count >= 3 THEN
        RAISE EXCEPTION 'You have already liked 3 profiles this round.';
    END IF;

    -- Check duplicate like in this round
    IF EXISTS (
        SELECT 1 FROM public.player_profile_likes
        WHERE room_id = p_room_id
          AND round_number = v_room.current_round
          AND user_id = v_user_id
          AND profile_id = p_profile_id
    ) THEN
        RAISE EXCEPTION 'You have already liked this profile.';
    END IF;

    -- Check if this profile is one of the secret matches for this player
    IF EXISTS (
        SELECT 1 FROM public.player_round_matches
        WHERE room_id = p_room_id
          AND round_number = v_room.current_round
          AND user_id = v_user_id
          AND profile_id = p_profile_id
    ) THEN
        v_is_match := true;
    END IF;

    -- Record like
    INSERT INTO public.player_profile_likes (room_id, round_number, user_id, profile_id, is_match)
    VALUES (p_room_id, v_room.current_round, v_user_id, p_profile_id, v_is_match);

    -- Update player stats
    UPDATE public.room_players
    SET likes_count = likes_count + 1,
        matches_count = CASE WHEN v_is_match THEN matches_count + 1 ELSE matches_count END,
        round_completed = (likes_count + 1 >= 3)
    WHERE id = v_player.id
    RETURNING * INTO v_player;

    -- Check if all non-murdered players have completed their 3 likes
    SELECT COUNT(*) INTO v_uncompleted_swipes
    FROM public.room_players
    WHERE room_id = p_room_id
      AND is_murdered = false
      AND round_completed = false;

    IF v_uncompleted_swipes = 0 THEN
        -- Transition room into the 'dating' phase
        UPDATE public.rooms
        SET round_phase = 'dating',
            updated_at = now()
        WHERE id = p_room_id
        RETURNING * INTO v_room;

        v_phase_transitioned := true;
    END IF;

    RETURN json_build_object(
        'success', true,
        'is_match', v_is_match,
        'likes_count', v_player.likes_count,
        'matches_count', v_player.matches_count,
        'round_completed', v_player.round_completed,
        'round_phase', v_room.round_phase,
        'phase_transitioned', v_phase_transitioned,
        'round_advanced', false,
        'current_round', v_room.current_round
    );
END;
$$;

-- Alias submit_like to submit_player_profile_like
CREATE OR REPLACE FUNCTION public.submit_like(
    p_room_id UUID,
    p_profile_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    RETURN public.submit_player_profile_like(p_room_id, p_profile_id);
END;
$$;

-- 6. RPC: resolve_player_date (called when player selects date or confirms date/conciliatory screen)
CREATE OR REPLACE FUNCTION public.resolve_player_date(
    p_room_id UUID,
    p_profile_id UUID DEFAULT NULL
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
    v_match public.player_round_matches%ROWTYPE;
    v_uncompleted_dates INT;
    v_next_round INT;
    v_round_advanced BOOLEAN := false;
    v_outcome TEXT := NULL;
    v_points INT := 0;
BEGIN
    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room not found';
    END IF;

    IF v_room.status != 'in_progress' THEN
        RAISE EXCEPTION 'Game is not in progress';
    END IF;

    IF v_room.round_phase != 'dating' THEN
        RAISE EXCEPTION 'Game is not in dating phase';
    END IF;

    SELECT * INTO v_player
    FROM public.room_players
    WHERE room_id = p_room_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Player not found in room';
    END IF;

    -- If player was already murdered, mark date completed without points
    IF v_player.is_murdered THEN
        UPDATE public.room_players
        SET date_completed = true
        WHERE id = v_player.id
        RETURNING * INTO v_player;
    ELSE
        -- If player has chosen a date profile
        IF p_profile_id IS NOT NULL THEN
            -- Verify profile was indeed a secret match AND liked by user
            SELECT * INTO v_match
            FROM public.player_round_matches
            WHERE room_id = p_room_id
              AND round_number = v_room.current_round
              AND user_id = v_user_id
              AND profile_id = p_profile_id;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Selected profile was not a match';
            END IF;

            v_outcome := v_match.date_outcome;
            v_points := v_match.date_points;

            UPDATE public.room_players
            SET selected_date_profile_id = p_profile_id,
                score = score + v_points,
                is_murdered = (v_outcome = 'murdered'),
                date_completed = true
            WHERE id = v_player.id
            RETURNING * INTO v_player;
        ELSE
            -- 0 matches scenario: player confirms conciliatory screen
            UPDATE public.room_players
            SET date_completed = true,
                selected_date_profile_id = NULL
            WHERE id = v_player.id
            RETURNING * INTO v_player;
        END IF;
    END IF;

    -- Check if all non-murdered players have completed their date
    SELECT COUNT(*) INTO v_uncompleted_dates
    FROM public.room_players
    WHERE room_id = p_room_id
      AND is_murdered = false
      AND date_completed = false;

    IF v_uncompleted_dates = 0 THEN
        -- Advance to next round
        v_next_round := v_room.current_round + 1;

        UPDATE public.rooms
        SET current_round = v_next_round,
            round_phase = 'swiping',
            updated_at = now()
        WHERE id = p_room_id
        RETURNING * INTO v_room;

        -- Reset all players for new round
        UPDATE public.room_players
        SET likes_count = 0,
            matches_count = 0,
            round_completed = false,
            date_completed = false,
            selected_date_profile_id = NULL
        WHERE room_id = p_room_id;

        -- Seed profiles for next round
        PERFORM public.seed_round_data(p_room_id, v_next_round);

        v_round_advanced := true;
    END IF;

    RETURN json_build_object(
        'success', true,
        'date_outcome', v_outcome,
        'date_points', v_points,
        'new_score', v_player.score,
        'is_murdered', v_player.is_murdered,
        'date_completed', v_player.date_completed,
        'round_advanced', v_round_advanced,
        'current_round', v_room.current_round,
        'round_phase', v_room.round_phase
    );
END;
$$;

-- 7. Update fetch_game_round_state to include room_phase, player scores, and date matches
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

    -- Fetch round profiles for this user
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
            'position', grp.position
        ) ORDER BY grp.position ASC
    ) INTO v_profiles
    FROM public.game_round_profiles grp
    JOIN public.catalog_profiles cp ON cp.id = grp.profile_id
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
