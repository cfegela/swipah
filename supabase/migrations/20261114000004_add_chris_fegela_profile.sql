-- Migration: 20261114000004_add_chris_fegela_profile.sql
-- Add Chris Fegela persona (21st male profile, 41 catalog profiles total).
-- Uses a custom SVG placeholder until real photos are generated and wired up.

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
    'chris-fegela',
    'Chris Fegela',
    53,
    'man',
    'Tech Worker & Trail Dad',
    'Singletrack Ridge',
    '53-year-old tech dad whose home network has enterprise uptime and whose cargo shorts always contain emergency trail mix. Looking for someone down to hike steep switchbacks, send mountain bike berms, and ignore Slack pings after 6pm.',
    ARRAY[
        'Still checks Slack during scenic summit views',
        'Owns four identical Patagonia fleece vests in slightly different grays',
        'Turns every casual hike into an elevation-gain Strava flex'
    ],
    ARRAY[
        'Always packs extra snacks, Band-Aids, and bike multi-tools for both of us',
        'Can fix your home Wi-Fi and grill a killer steak without bragging'
    ],
    'My ideal Sunday',
    'Dawn patrol mountain bike ride, strong iced coffee on a sunny patio, and zero unexpected calendar invites.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gchris" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e3a5f"/><stop offset="100%" stop-color="#334155"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="76" fill="#141a45"/><path d="M46 176 Q100 128 154 176 Z" fill="url(#gchris)"/><path d="M88 142 L100 162 L112 142" stroke="#94a3b8" stroke-width="3" fill="none"/><ellipse cx="100" cy="84" rx="36" ry="42" fill="#eab89c"/><path d="M64 92 Q66 130 100 132 Q134 130 136 92 Q128 112 100 114 Q72 112 64 92 Z" fill="#cbd5e1"/><path d="M84 103 Q100 96 116 103 Q112 114 100 114 Q88 114 84 103 Z" fill="#cbd5e1"/><path d="M90 109 Q100 115 110 109" stroke="#5b3a2e" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="65" y="72" width="29" height="20" rx="5" fill="rgba(186,230,253,0.22)" stroke="#5c3317" stroke-width="4.5"/><rect x="106" y="72" width="29" height="20" rx="5" fill="rgba(186,230,253,0.22)" stroke="#5c3317" stroke-width="4.5"/><line x1="94" y1="78" x2="106" y2="78" stroke="#5c3317" stroke-width="4"/><line x1="60" y1="77" x2="66" y2="77" stroke="#5c3317" stroke-width="3.5"/><line x1="134" y1="77" x2="140" y2="77" stroke="#5c3317" stroke-width="3.5"/><circle cx="80" cy="82" r="4" fill="#2563eb"/><circle cx="120" cy="82" r="4" fill="#2563eb"/><circle cx="80" cy="82" r="1.8" fill="#0f172a"/><circle cx="120" cy="82" r="1.8" fill="#0f172a"/><path d="M84 56 Q96 47 110 53" stroke="rgba(255,255,255,0.28)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
    NULL,
    '{}'::TEXT[],
    41
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
