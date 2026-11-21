-- Migration: 20261121000005_add_batch5_personas.sql
-- Add Batch 5 (4 of 40 new personas): Grace Takahashi, Mei-Ling Zhou, Tessa Delgado-Shaw, Trooper Maya Hollis (order_idx 60..63).

INSERT INTO public.catalog_profiles (
    slug, name, age, gender, occupation, location, bio, red_flags, green_flags, prompt_question, prompt_answer, avatar_svg, avatar_url, extra_photos, order_idx
) VALUES
(
    'grace-takahashi',
    'Grace Takahashi',
    39,
    'woman',
    'Critical Care Flight Nurse (RN)',
    'Seattle, WA',
    'Twelve-hour medevac helicopter shifts across the Cascades, then paddling cold Puget Sound coves and hunting down the best late-night ramen in Seattle. Calm in turbulence, spicy in person.',
    ARRAY[
        'Checks wind gusts on aviation weather apps during outdoor picnics',
        'Has zero patience for indecisive ordering at restaurants',
        'Sleeps with blackout curtains and earplugs until noon after night flights'
    ],
    ARRAY[
        'Fearless, laser-focused, and surprisingly playful once off-shift',
        'Knows every hidden Seattle sake bar that stays open past midnight',
        'Zero drama, sharp wit, and wildly passionate'
    ],
    'You should swipe right if:',
    'You can keep up on a morning paddle and enjoy quiet sake bars after dark.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="37" fill="#f3d2b3"/><path d="M62 80 Q100 34 138 80 Q138 130 126 142 Q100 128 74 142 Z" fill="#18181b"/><path d="M50 172 Q100 132 150 172 Z" fill="#1e3a8a"/></svg>',
    '/profiles/grace-takahashi.jpg',
    ARRAY['/profiles/grace-takahashi-2.jpg', '/profiles/grace-takahashi-3.jpg'],
    60
),
(
    'mei-ling-zhou',
    'Mei-Ling Zhou',
    45,
    'woman',
    'Trauma Surgical Technologist',
    'Sacramento, CA',
    'Handing trauma surgeons steel instruments at 3 AM and tending backyard Meyer lemons by afternoon. Lush BBW curves, big infectious laugh, and my homemade chili oil belongs in a museum.',
    ARRAY[
        'Organizes kitchen utensils by length and cries if you use her good chef knife',
        'Brings Tupperware to every dim sum brunch',
        'Refuses to date anyone who fears extra garlic'
    ],
    ARRAY[
        'Warmest cuddle in northern California and cooks like a dream',
        'Steady nerves, hilarious dry commentary, and zero pretense',
        'Lush curves and deeply affectionate behind closed doors'
    ],
    'My love language:',
    'Fresh dumplings, backyard shade under citrus trees, and unhurried Sunday mornings.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="39" fill="#f5d5b8"/><path d="M60 80 Q100 34 140 80 Q140 132 128 144 Q100 130 72 144 Z" fill="#0f172a"/><path d="M46 172 Q100 128 154 172 Z" fill="#1d4ed8"/></svg>',
    '/profiles/mei-ling-zhou.jpg',
    ARRAY['/profiles/mei-ling-zhou-2.jpg', '/profiles/mei-ling-zhou-3.jpg'],
    61
),
(
    'tessa-delgado-shaw',
    'Tessa Delgado-Shaw',
    39,
    'woman',
    'Commercial Pipefitter & Welder',
    'Tacoma, WA',
    'Running TIG beads on stainless steam lines all week, then beachcombing Tacoma driftwood coves with a cold stout on Friday night. Curly hair, calloused thumbs, and zero tolerance for fake charm.',
    ARRAY[
        'Points out sloppy structural welds on restaurant patio railings',
        'Has tiny burn pinholes in half her favorite t-shirts',
        'Teases relentlessly if you ask what a pipe bevel is'
    ],
    ARRAY[
        'Fiercely independent, honest to a fault, and surprisingly tender',
        'Builds custom firepits out of scrap steel for friends',
        'Striking hazel eyes and effortless Pacific Northwest cool'
    ],
    'Fastest way to win me over:',
    'Skip the polished pickup lines, bring good stout, and match my sarcasm.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="37" fill="#c68e62"/><path d="M58 78 Q100 28 142 78 Q144 128 128 142 Q100 128 72 142 Z" fill="#291d18"/><path d="M50 172 Q100 132 150 172 Z" fill="#3f6212"/></svg>',
    '/profiles/tessa-delgado-shaw.jpg',
    ARRAY['/profiles/tessa-delgado-shaw-2.jpg', '/profiles/tessa-delgado-shaw-3.jpg'],
    62
),
(
    'maya-hollis',
    'Trooper Maya Hollis',
    46,
    'woman',
    'State Trooper',
    'Raleigh, NC',
    'Twenty years working North Carolina highways without ever losing my sense of humor. Strong curves, calm presence, lake-dock bourbon drinker, and yes—I can tell when you''re speeding just by the sound.',
    ARRAY[
        'Mentally runs radar estimates on every car passing the patio',
        'Gives the "trooper stare" when someone arrives ten minutes late',
        'Keeps a spare Maglite in every jacket pocket'
    ],
    ARRAY[
        'Steady, protective, and genuinely warm once the badge comes off',
        'Knows every quiet barbecue joint and lake dock near Raleigh',
        'Confident curves and unforgettable, commanding energy in bed'
    ],
    'How to avoid getting pulled over by me:',
    'Signal early, tell the truth, and pour a proper neat bourbon.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#b47b52"/><path d="M60 80 Q100 35 140 80 Q138 128 126 142 Q100 128 74 142 Z" fill="#1c1917"/><path d="M48 172 Q100 132 152 172 Z" fill="#475569"/></svg>',
    '/profiles/maya-hollis.jpg',
    ARRAY['/profiles/maya-hollis-2.jpg', '/profiles/maya-hollis-3.jpg'],
    63
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name, age = EXCLUDED.age, gender = EXCLUDED.gender, occupation = EXCLUDED.occupation,
    location = EXCLUDED.location, bio = EXCLUDED.bio, red_flags = EXCLUDED.red_flags, green_flags = EXCLUDED.green_flags,
    prompt_question = EXCLUDED.prompt_question, prompt_answer = EXCLUDED.prompt_answer, avatar_svg = EXCLUDED.avatar_svg,
    avatar_url = EXCLUDED.avatar_url, extra_photos = EXCLUDED.extra_photos, order_idx = EXCLUDED.order_idx;
