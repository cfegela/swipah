-- Migration: 20261113000008_randomize_round_profile_order.sql
-- Randomize profile selection and display order per round while avoiding repeats within each cycle

CREATE OR REPLACE FUNCTION public.seed_round_data(p_room_id UUID, p_round_number INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_player_rec RECORD;
    v_cycle_start INT;
    v_match_rec RECORD;
    v_rand FLOAT;
    v_outcome TEXT;
    v_points INT;
    v_outcomes TEXT[];
    v_match_idx INT;
BEGIN
    FOR v_player_rec IN (
        SELECT user_id, looking_for FROM public.room_players WHERE room_id = p_room_id AND is_murdered = false
    ) LOOP
        IF EXISTS (
            SELECT 1 FROM public.game_round_profiles
            WHERE room_id = p_room_id
              AND round_number = p_round_number
              AND user_id = v_player_rec.user_id
        ) THEN
            CONTINUE;
        END IF;

        IF v_player_rec.looking_for IN ('Man', 'Woman') THEN
            -- 20 profiles per gender -> 2-round non-repeating cycle (10 per round)
            v_cycle_start := p_round_number - ((p_round_number - 1) % 2);

            INSERT INTO public.game_round_profiles (room_id, round_number, user_id, profile_id, position)
            SELECT
                p_room_id,
                p_round_number,
                v_player_rec.user_id,
                picked.id,
                row_number() OVER ()
            FROM (
                SELECT cp.id
                FROM public.catalog_profiles cp
                WHERE cp.gender = lower(v_player_rec.looking_for)
                  AND NOT EXISTS (
                      SELECT 1
                      FROM public.game_round_profiles grp
                      WHERE grp.room_id = p_room_id
                        AND grp.user_id = v_player_rec.user_id
                        AND grp.round_number >= v_cycle_start
                        AND grp.round_number < p_round_number
                        AND grp.profile_id = cp.id
                  )
                ORDER BY random()
                LIMIT 10
            ) AS picked;
        ELSE
            -- 'Both': 50/50 split (5 men and 5 women) across a 4-round non-repeating cycle, shuffled together
            v_cycle_start := p_round_number - ((p_round_number - 1) % 4);

            INSERT INTO public.game_round_profiles (room_id, round_number, user_id, profile_id, position)
            SELECT
                p_room_id,
                p_round_number,
                v_player_rec.user_id,
                shuffled.id,
                row_number() OVER ()
            FROM (
                SELECT combined.id
                FROM (
                    (
                        SELECT cp.id
                        FROM public.catalog_profiles cp
                        WHERE cp.gender = 'man'
                          AND NOT EXISTS (
                              SELECT 1
                              FROM public.game_round_profiles grp
                              WHERE grp.room_id = p_room_id
                                AND grp.user_id = v_player_rec.user_id
                                AND grp.round_number >= v_cycle_start
                                AND grp.round_number < p_round_number
                                AND grp.profile_id = cp.id
                          )
                        ORDER BY random()
                        LIMIT 5
                    )
                    UNION ALL
                    (
                        SELECT cp.id
                        FROM public.catalog_profiles cp
                        WHERE cp.gender = 'woman'
                          AND NOT EXISTS (
                              SELECT 1
                              FROM public.game_round_profiles grp
                              WHERE grp.room_id = p_room_id
                                AND grp.user_id = v_player_rec.user_id
                                AND grp.round_number >= v_cycle_start
                                AND grp.round_number < p_round_number
                                AND grp.profile_id = cp.id
                          )
                        ORDER BY random()
                        LIMIT 5
                    )
                ) AS combined
                ORDER BY random()
            ) AS shuffled;
        END IF;

        -- Pick 3 distinct outcomes (so no 2 dates in any given round have the same outcome)
        -- Maintaining exact 30% Great, 30% Good, 30% Bad, 10% Murdered marginal distribution:
        -- 70% of rounds: ['great', 'good', 'bad']
        -- 10% of rounds: ['good', 'bad', 'murdered']
        -- 10% of rounds: ['great', 'bad', 'murdered']
        -- 10% of rounds: ['great', 'good', 'murdered']
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

        -- Shuffle the 3 unique outcomes randomly
        SELECT array_agg(elem ORDER BY random()) INTO v_outcomes
        FROM unnest(v_outcomes) AS elem;

        -- Assign the 3 unique outcomes to the 3 secret match profiles
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
