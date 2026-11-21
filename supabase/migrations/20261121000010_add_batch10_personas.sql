-- Migration: 20261121000010_add_batch10_personas.sql
-- Add Batch 10 (4 of 40 new personas): Jace Bennett, Devon Morales, Andre Takahashi, Mike Alvarez-Cole (order_idx 80..83).

INSERT INTO public.catalog_profiles (
    slug, name, age, gender, occupation, location, bio, red_flags, green_flags, prompt_question, prompt_answer, avatar_svg, avatar_url, extra_photos, order_idx
) VALUES
(
    'jace-bennett',
    'Jace Bennett',
    39,
    'man',
    'Wildland Fire Foreman',
    'Missoula, MT',
    'Leading hotshot crews across Montana summers and spending off-season mornings fly-fishing the Clark Fork. Sun-weathered caramel skin, wavy dark curls with subtle sun streaks, neat stubble, everyday dad-bod, easy campfire laugh.',
    ARRAY[
        'Still smells faintly like cedar smoke even after three hot showers',
        'Checks wildfire wind gusts before picking a dinner patio',
        'Drives a 2006 Tacoma with 260,000 miles and refuses to sell it'
    ],
    ARRAY[
        'Calm under extreme pressure and endlessly steady in person',
        'Cooks killer cast-iron trout and pours heavy Montana bourbon',
        'Warm, deeply attentive, and passionate once the door closes'
    ],
    'You should swipe right if:',
    'You love mountain rivers, woodsmoke, and steady Montana energy.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#17201a"/><circle cx="100" cy="84" r="36" fill="#b47b52"/><path d="M64 76 Q100 38 136 76 Q134 50 100 46 Q66 50 64 76 Z" fill="#27272a"/><path d="M48 174 Q100 132 152 174 Z" fill="#b45309"/></svg>',
    '/profiles/jace-bennett.jpg',
    ARRAY['/profiles/jace-bennett-2.jpg', '/profiles/jace-bennett-3.jpg'],
    80
),
(
    'devon-morales',
    'Devon Morales',
    45,
    'man',
    'Industrial Welder & Fabricator',
    'Jacksonville, FL',
    'TIG-welding custom marine aluminum and shipyard steel in Jacksonville all week, then taking the skiff out at dawn on weekends. Broad stocky build, warm golden-brown skin, shaved fade, trimmed goatee, big grin.',
    ARRAY[
        'Inspects patio handrail welds while waiting for his drink order',
        'Has permanent tiny arc-tan freckles across both forearms',
        'Turns every beach walk into a shell-hunting competition'
    ],
    ARRAY[
        'Broad, powerful shoulders and hands that build anything from scratch',
        'Sunny coastal energy paired with old-school loyalty',
        'Slow, deep, and unforgettable between the sheets'
    ],
    'You should swipe right if:',
    'You want broad shoulders, salt air, and a guy who builds things to last.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#0f172a"/><circle cx="100" cy="84" r="37" fill="#a86d46"/><path d="M64 70 Q100 46 136 70 Q132 50 100 46 Q68 50 64 70 Z" fill="#18181b"/><path d="M44 176 Q100 132 156 176 Z" fill="#0284c7"/></svg>',
    '/profiles/devon-morales.jpg',
    ARRAY['/profiles/devon-morales-2.jpg', '/profiles/devon-morales-3.jpg'],
    81
),
(
    'andre-takahashi',
    'Andre Takahashi',
    49,
    'man',
    'Nurse Anesthetist CRNA',
    'Honolulu, HI',
    'Keeping surgical patients peaceful on Oahu all week, then unwinding with sunset outrigger paddles, grilled mahi, and quiet lanai drinks. Mixed Japanese-Black heritage, salt-and-pepper curls, easy dad-bod, velvet voice.',
    ARRAY[
        'Never raises his voice even when traffic on H-1 stops dead',
        'Critiques everyone else''s poke seasoning silently',
        'Falls asleep instantly whenever ocean rain hits the tin roof'
    ],
    ARRAY[
        'Calm, soothing hands and zero ego anywhere in sight',
        'Makes slow-cooked kalua pork and cold pineapple-rum highballs',
        'Unhurried, attentive lover who reads your body effortlessly'
    ],
    'You should swipe right if:',
    'You want island calm, velvet hands, and sunset lanai nights.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#0d1b2a"/><circle cx="100" cy="84" r="36" fill="#a6734e"/><path d="M64 76 Q100 40 136 76 Q134 52 100 48 Q66 52 64 76 Z" fill="#27272a"/><path d="M48 174 Q100 132 152 174 Z" fill="#0f766e"/></svg>',
    '/profiles/andre-takahashi.jpg',
    ARRAY['/profiles/andre-takahashi-2.jpg', '/profiles/andre-takahashi-3.jpg'],
    82
),
(
    'mike-alvarez-cole',
    'Mike Alvarez-Cole',
    55,
    'man',
    'Craft Smokehouse & Taproom Owner',
    'Nashville, TN',
    'Running hickory smokers since 5 AM in East Nashville and pouring small-batch rye on the back porch by midnight. Big husky build, silver-streaked dark beard, warm brown eyes, gravelly laugh, and serious bear hugs.',
    ARRAY[
        'Smells permanently like hickory smoke and cracked black pepper',
        'Will not let you put ketchup anywhere near his brisket',
        'Knows every pedal-steel player in Davidson County by first name'
    ],
    ARRAY[
        'Big, warm husky frame built for long nights and cozy mornings',
        'Generous, funny, and genuinely takes care of his people',
        'Deeply sensual, unhurried, and commands every inch of the bed'
    ],
    'You should swipe right if:',
    'You love hickory brisket, East Nashville bourbon, and a warm silver bear.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#1c1410"/><circle cx="100" cy="84" r="38" fill="#a9744f"/><path d="M62 74 Q100 44 138 74 Q134 52 100 48 Q66 52 62 74 Z" fill="#3f3f46"/><path d="M44 176 Q100 132 156 176 Z" fill="#7c2d12"/></svg>',
    '/profiles/mike-alvarez-cole.jpg',
    ARRAY['/profiles/mike-alvarez-cole-2.jpg', '/profiles/mike-alvarez-cole-3.jpg'],
    83
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
