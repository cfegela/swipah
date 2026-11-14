-- Migration: 20261114000001_exclude_previously_dated_profiles.sql
-- Exclude profiles a player has previously gone on a date with in the current game room.
-- Keeps 10-card rounds full by prioritizing unseen undated profiles first, then wrapping back
-- to undated profiles from earlier rounds, and handles <10 or 0 remaining undated profiles cleanly.

-- 1. Track every completed date per room & user across rounds
CREATE TABLE IF NOT EXISTS public.player_date_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.catalog_profiles(id) ON DELETE CASCADE,
    date_outcome TEXT NOT NULL,
    date_points INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_player_date_history UNIQUE (room_id, user_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_player_date_history_lookup
    ON public.player_date_history(room_id, user_id, profile_id);

ALTER TABLE public.player_date_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own date history" ON public.player_date_history;
CREATE POLICY "Users can view their own date history"
    ON public.player_date_history FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 2. Update seed_round_data to exclude dated profiles and handle <10 or 0 remaining profiles
CREATE OR REPLACE FUNCTION public.seed_round_data(p_room_id UUID, p_round_number INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_player_rec RECORD;
    v_match_rec RECORD;
    v_rand FLOAT;
    v_outcome TEXT;
    v_points INT;
    v_outcomes TEXT[];
    v_match_idx INT;
    v_seeded_count INT;
    v_picked_ids UUID[];
    v_remaining_needed INT;
BEGIN
    FOR v_player_rec IN (
        SELECT user_id, looking_for
        FROM public.room_players
        WHERE room_id = p_room_id AND is_murdered = false
    ) LOOP
        IF EXISTS (
            SELECT 1 FROM public.game_round_profiles
            WHERE room_id = p_room_id
              AND round_number = p_round_number
              AND user_id = v_player_rec.user_id
        ) THEN
            CONTINUE;
        END IF;

        v_picked_ids := '{}';

        IF v_player_rec.looking_for IN ('Man', 'Woman') THEN
            -- Pick up to 10 undated profiles of the chosen gender:
            -- Prioritize never-seen profiles first, then oldest-seen undated profiles, then random
            SELECT COALESCE(array_agg(picked.id), '{}')
            INTO v_picked_ids
            FROM (
                SELECT cp.id
                FROM public.catalog_profiles cp
                LEFT JOIN (
                    SELECT grp.profile_id,
                           COUNT(*)::INT AS seen_count,
                           MAX(grp.round_number)::INT AS last_seen_round
                    FROM public.game_round_profiles grp
                    WHERE grp.room_id = p_room_id
                      AND grp.user_id = v_player_rec.user_id
                    GROUP BY grp.profile_id
                ) seen ON seen.profile_id = cp.id
                WHERE cp.gender = lower(v_player_rec.looking_for)
                  AND NOT EXISTS (
                      SELECT 1
                      FROM public.player_date_history pdh
                      WHERE pdh.room_id = p_room_id
                        AND pdh.user_id = v_player_rec.user_id
                        AND pdh.profile_id = cp.id
                  )
                ORDER BY COALESCE(seen.seen_count, 0) ASC,
                         COALESCE(seen.last_seen_round, 0) ASC,
                         random()
                LIMIT 10
            ) AS picked;
        ELSE
            -- 'Both': target 5 undated men + 5 undated women, topping up from the other gender if one runs short
            SELECT COALESCE(array_agg(picked.id), '{}')
            INTO v_picked_ids
            FROM (
                (
                    SELECT cp.id
                    FROM public.catalog_profiles cp
                    LEFT JOIN (
                        SELECT grp.profile_id,
                               COUNT(*)::INT AS seen_count,
                               MAX(grp.round_number)::INT AS last_seen_round
                        FROM public.game_round_profiles grp
                        WHERE grp.room_id = p_room_id
                          AND grp.user_id = v_player_rec.user_id
                        GROUP BY grp.profile_id
                    ) seen ON seen.profile_id = cp.id
                    WHERE cp.gender = 'man'
                      AND NOT EXISTS (
                          SELECT 1
                          FROM public.player_date_history pdh
                          WHERE pdh.room_id = p_room_id
                            AND pdh.user_id = v_player_rec.user_id
                            AND pdh.profile_id = cp.id
                      )
                    ORDER BY COALESCE(seen.seen_count, 0) ASC,
                             COALESCE(seen.last_seen_round, 0) ASC,
                             random()
                    LIMIT 5
                )
                UNION ALL
                (
                    SELECT cp.id
                    FROM public.catalog_profiles cp
                    LEFT JOIN (
                        SELECT grp.profile_id,
                               COUNT(*)::INT AS seen_count,
                               MAX(grp.round_number)::INT AS last_seen_round
                        FROM public.game_round_profiles grp
                        WHERE grp.room_id = p_room_id
                          AND grp.user_id = v_player_rec.user_id
                        GROUP BY grp.profile_id
                    ) seen ON seen.profile_id = cp.id
                    WHERE cp.gender = 'woman'
                      AND NOT EXISTS (
                          SELECT 1
                          FROM public.player_date_history pdh
                          WHERE pdh.room_id = p_room_id
                            AND pdh.user_id = v_player_rec.user_id
                            AND pdh.profile_id = cp.id
                      )
                    ORDER BY COALESCE(seen.seen_count, 0) ASC,
                             COALESCE(seen.last_seen_round, 0) ASC,
                             random()
                    LIMIT 5
                )
            ) AS picked;

            v_remaining_needed := 10 - COALESCE(array_length(v_picked_ids, 1), 0);
            IF v_remaining_needed > 0 THEN
                SELECT v_picked_ids || COALESCE(array_agg(extra.id), '{}')
                INTO v_picked_ids
                FROM (
                    SELECT cp.id
                    FROM public.catalog_profiles cp
                    LEFT JOIN (
                        SELECT grp.profile_id,
                               COUNT(*)::INT AS seen_count,
                               MAX(grp.round_number)::INT AS last_seen_round
                        FROM public.game_round_profiles grp
                        WHERE grp.room_id = p_room_id
                          AND grp.user_id = v_player_rec.user_id
                        GROUP BY grp.profile_id
                    ) seen ON seen.profile_id = cp.id
                    WHERE NOT (cp.id = ANY(v_picked_ids))
                      AND NOT EXISTS (
                          SELECT 1
                          FROM public.player_date_history pdh
                          WHERE pdh.room_id = p_room_id
                            AND pdh.user_id = v_player_rec.user_id
                            AND pdh.profile_id = cp.id
                      )
                    ORDER BY COALESCE(seen.seen_count, 0) ASC,
                             COALESCE(seen.last_seen_round, 0) ASC,
                             random()
                    LIMIT v_remaining_needed
                ) AS extra;
            END IF;
        END IF;

        v_seeded_count := COALESCE(array_length(v_picked_ids, 1), 0);

        IF v_seeded_count = 0 THEN
            -- Player has dated every eligible profile in this room; do not stall other players
            UPDATE public.room_players
            SET round_completed = true,
                date_completed = true
            WHERE room_id = p_room_id
              AND user_id = v_player_rec.user_id;
            CONTINUE;
        END IF;

        -- Insert picked profiles in a freshly shuffled order
        INSERT INTO public.game_round_profiles (room_id, round_number, user_id, profile_id, position)
        SELECT
            p_room_id,
            p_round_number,
            v_player_rec.user_id,
            shuffled.id,
            row_number() OVER ()
        FROM (
            SELECT elem AS id
            FROM unnest(v_picked_ids) AS elem
            ORDER BY random()
        ) AS shuffled;

        -- Pick up to 3 distinct outcomes (matching <= 3 profiles in deck)
        v_rand := random();
        IF v_rand < 0.70 THEN
            v_outcomes := ARRAY['great', 'good', 'bad'];
        ELSIF v_rand < 0.80 THEN
            v_outcomes := ARRAY['good', 'bad', 'murdered'];
        ELSIF v_rand < 0.90 THEN
            v_outcomes := ARRAY['great', 'bad', 'murdered'];
        ELSE
            v_outcomes := ARRAY['great', 'good', 'murdered'];
        END IF;

        SELECT array_agg(elem ORDER BY random()) INTO v_outcomes
        FROM unnest(v_outcomes) AS elem;

        v_match_idx := 1;
        FOR v_match_rec IN (
            SELECT grp.profile_id
            FROM public.game_round_profiles grp
            WHERE grp.room_id = p_room_id
              AND grp.round_number = p_round_number
              AND grp.user_id = v_player_rec.user_id
            ORDER BY random()
            LIMIT 3
        ) LOOP
            v_outcome := v_outcomes[v_match_idx];
            IF v_outcome = 'great' THEN
                v_points := 1000;
            ELSIF v_outcome = 'good' THEN
                v_points := 500;
            ELSIF v_outcome = 'bad' THEN
                v_points := -500;
            ELSE
                v_points := 0;
            END IF;

            INSERT INTO public.player_round_matches (
                room_id, round_number, user_id, profile_id, date_outcome, date_points
            ) VALUES (
                p_room_id, p_round_number, v_player_rec.user_id, v_match_rec.profile_id, v_outcome, v_points
            )
            ON CONFLICT (room_id, round_number, user_id, profile_id) DO NOTHING;

            v_match_idx := v_match_idx + 1;
        END LOOP;
    END LOOP;
END;
$$;

-- 3. Update submit_player_profile_like to support decks with <3 profiles remaining
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
    v_required_likes INT := 3;
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

    SELECT LEAST(3, COUNT(*)::INT)
    INTO v_required_likes
    FROM public.game_round_profiles
    WHERE room_id = p_room_id
      AND round_number = v_room.current_round
      AND user_id = v_user_id;

    IF v_required_likes = 0 OR v_player.round_completed OR v_player.likes_count >= v_required_likes THEN
        RAISE EXCEPTION 'You have already used all % likes for this round.', v_required_likes;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.player_profile_likes
        WHERE room_id = p_room_id
          AND round_number = v_room.current_round
          AND user_id = v_user_id
          AND profile_id = p_profile_id
    ) THEN
        RAISE EXCEPTION 'You have already liked this profile.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.player_round_matches
        WHERE room_id = p_room_id
          AND round_number = v_room.current_round
          AND user_id = v_user_id
          AND profile_id = p_profile_id
    ) THEN
        v_is_match := true;
    END IF;

    INSERT INTO public.player_profile_likes (room_id, round_number, user_id, profile_id, is_match)
    VALUES (p_room_id, v_room.current_round, v_user_id, p_profile_id, v_is_match);

    UPDATE public.room_players
    SET likes_count = likes_count + 1,
        matches_count = CASE WHEN v_is_match THEN matches_count + 1 ELSE matches_count END,
        round_completed = (likes_count + 1 >= v_required_likes)
    WHERE id = v_player.id
    RETURNING * INTO v_player;

    SELECT COUNT(*) INTO v_uncompleted_swipes
    FROM public.room_players
    WHERE room_id = p_room_id
      AND is_murdered = false
      AND round_completed = false;

    IF v_uncompleted_swipes = 0 THEN
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
        'likes_required', v_required_likes,
        'matches_count', v_player.matches_count,
        'round_completed', v_player.round_completed,
        'round_phase', v_room.round_phase,
        'phase_transitioned', v_phase_transitioned,
        'round_advanced', false,
        'current_round', v_room.current_round
    );
END;
$$;

-- 4. Update resolve_player_date to record dated profile in player_date_history
--    and end game cleanly (status = 'completed') if 0 undated profiles remain for all alive players
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
    v_alive_count INT := 0;
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

    IF v_player.is_murdered THEN
        UPDATE public.room_players
        SET date_completed = true
        WHERE id = v_player.id
        RETURNING * INTO v_player;
    ELSIF NOT v_player.date_completed THEN
        IF p_profile_id IS NOT NULL THEN
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

            -- Persist date history so this profile never reappears in this player's feed in this room
            INSERT INTO public.player_date_history (
                room_id, round_number, user_id, profile_id, date_outcome, date_points
            ) VALUES (
                p_room_id, v_room.current_round, v_user_id, p_profile_id, v_outcome, v_points
            )
            ON CONFLICT (room_id, user_id, profile_id) DO NOTHING;

            UPDATE public.room_players
            SET selected_date_profile_id = p_profile_id,
                score = score + v_points,
                is_murdered = (v_outcome = 'murdered'),
                date_completed = true
            WHERE id = v_player.id
            RETURNING * INTO v_player;
        ELSE
            UPDATE public.room_players
            SET date_completed = true,
                selected_date_profile_id = NULL
            WHERE id = v_player.id
            RETURNING * INTO v_player;
        END IF;
    END IF;

    SELECT COUNT(*) INTO v_uncompleted_dates
    FROM public.room_players
    WHERE room_id = p_room_id
      AND is_murdered = false
      AND date_completed = false;

    IF v_uncompleted_dates = 0 THEN
        v_next_round := v_room.current_round + 1;

        UPDATE public.rooms
        SET current_round = v_next_round,
            round_phase = 'swiping',
            updated_at = now()
        WHERE id = p_room_id
        RETURNING * INTO v_room;

        UPDATE public.room_players
        SET likes_count = 0,
            matches_count = 0,
            round_completed = false,
            date_completed = false,
            selected_date_profile_id = NULL
        WHERE room_id = p_room_id;

        PERFORM public.seed_round_data(p_room_id, v_next_round);

        SELECT COUNT(*) INTO v_alive_count
        FROM public.room_players
        WHERE room_id = p_room_id
          AND is_murdered = false;

        -- End game cleanly if all living players have exhausted every undated profile
        IF v_alive_count > 0 AND NOT EXISTS (
            SELECT 1
            FROM public.game_round_profiles grp
            JOIN public.room_players rp
              ON rp.room_id = grp.room_id
             AND rp.user_id = grp.user_id
            WHERE grp.room_id = p_room_id
              AND grp.round_number = v_next_round
              AND rp.is_murdered = false
        ) THEN
            UPDATE public.rooms
            SET status = 'completed',
                updated_at = now()
            WHERE id = p_room_id
            RETURNING * INTO v_room;
        END IF;

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
        'round_phase', v_room.round_phase,
        'room_status', v_room.status
    );
END;
$$;

-- 5. Update fetch_game_round_state to expose likes_required and dated_count per player
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
