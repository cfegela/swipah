-- Migration: 20261113000000_profile_attractiveness_category.sql
-- Add hidden attractiveness category to catalog profiles (for future phases)

-- 1. Add attractiveness column to catalog_profiles
ALTER TABLE public.catalog_profiles
ADD COLUMN IF NOT EXISTS attractiveness TEXT;

-- 2. Tag existing 20 profiles across High, Medium, and Low tiers based on parody archetypes
-- High (6 profiles: 3 men, 3 women)
UPDATE public.catalog_profiles
SET attractiveness = 'high'
WHERE slug IN (
    'chad-thunderclout',
    'brad-hedge-sterling',
    'tyler-alpha-vance',
    'chloe-matcha',
    'daisy-wanderlust',
    'tiffany-sparkle'
);

-- Medium (8 profiles: 5 men, 3 women)
UPDATE public.catalog_profiles
SET attractiveness = 'medium'
WHERE slug IN (
    'jax-nova',
    'brody-brogrammer',
    'maverick-skater',
    'dr-arthur-bibliophile',
    'chet-vanlife',
    'luna-starweaver',
    'gemma-vintage',
    'zara-neon'
);

-- Low (6 profiles: 3 men, 3 women)
UPDATE public.catalog_profiles
SET attractiveness = 'low'
WHERE slug IN (
    'hunter-wilderness',
    'zack-crypto-mooner',
    'rex-iron-callahan',
    'penelope-sourdough-green',
    'sierra-eco-warrior',
    'bella-cinephile'
);

-- 3. Add check constraint and set NOT NULL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_profile_attractiveness'
    ) THEN
        ALTER TABLE public.catalog_profiles
        ADD CONSTRAINT check_profile_attractiveness CHECK (attractiveness IN ('high', 'medium', 'low'));
    END IF;
END $$;

ALTER TABLE public.catalog_profiles ALTER COLUMN attractiveness SET NOT NULL;

-- 4. Update fetch_game_round_state to include attractiveness in profile objects
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

    -- Fetch the 10 profiles for the current round, including gender and hidden attractiveness
    SELECT json_agg(
        json_build_object(
            'id', cp.id,
            'slug', cp.slug,
            'name', cp.name,
            'age', cp.age,
            'gender', cp.gender,
            'attractiveness', cp.attractiveness,
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
