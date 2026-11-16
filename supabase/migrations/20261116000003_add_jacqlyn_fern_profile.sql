-- Migration: 20261116000003_add_jacqlyn_fern_profile.sql
-- Add Jacqlyn Fern persona (22nd female profile, 43 catalog profiles total).

INSERT INTO public.catalog_profiles (
    slug,
    name,
    age,
    gender,
    occupation,
    location,
    bio,
    red_flags,
    green_flags,
    prompt_question,
    prompt_answer,
    avatar_svg,
    avatar_url,
    extra_photos,
    order_idx
) VALUES (
    'jacqlyn-fern',
    'Jacqlyn Fern',
    45,
    'woman',
    'VP of Business Development & Fun Aunt',
    'Seaport, MA',
    '5''2", copper-red curls, green eyes, and enough freckles to map New England. Closing seven-figure Boston tech partnerships by Thursday, crushing theme-park rope drops with my niece and nephew or sipping rum punch by a Jamaican infinity pool by Saturday.',
    ARRAY[
        'Turns casual dinner conversation into a B2B pipeline discovery call',
        'Keeps a color-coded Lightning Lane spreadsheet even for neighborhood walks',
        'Will ditch midnight bar-hopping for an 8am nonstop flight to Montego Bay'
    ],
    ARRAY[
        'Scores impossible Seaport patio tables before the host even checks the tablet',
        'Doting cool aunt who runs theme-park chaos on pure optimism and espresso',
        'Red hair, emerald eyes, and dangerously fun on island vacations'
    ],
    'The key to winning me over:',
    'Match my energy at a Seaport oyster bar and never complain about carry-on-only island packing.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#f5d0b5"/><path d="M58 80 Q100 34 142 80 Q144 135 128 150 Q100 130 72 150 Z" fill="#c2410c"/><circle cx="84" cy="84" r="4" fill="#15803d"/><circle cx="116" cy="84" r="4" fill="#15803d"/><path d="M50 170 Q100 130 150 170 Z" fill="#047857"/></svg>',
    '/profiles/jacqlyn-fern.jpg',
    ARRAY['/profiles/jacqlyn-fern-2.jpg', '/profiles/jacqlyn-fern-3.jpg'],
    43
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    age = EXCLUDED.age,
    gender = EXCLUDED.gender,
    occupation = EXCLUDED.occupation,
    location = EXCLUDED.location,
    bio = EXCLUDED.bio,
    red_flags = EXCLUDED.red_flags,
    green_flags = EXCLUDED.green_flags,
    prompt_question = EXCLUDED.prompt_question,
    prompt_answer = EXCLUDED.prompt_answer,
    avatar_svg = EXCLUDED.avatar_svg,
    avatar_url = EXCLUDED.avatar_url,
    extra_photos = EXCLUDED.extra_photos,
    order_idx = EXCLUDED.order_idx;
