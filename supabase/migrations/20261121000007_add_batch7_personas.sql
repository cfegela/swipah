-- Migration: 20261121000007_add_batch7_personas.sql
-- Add Batch 7 (4 of 40 new personas): Dale Henderson, Paulie Romano, Walt Gallagher, Grant Holloway (order_idx 68..71).

INSERT INTO public.catalog_profiles (
    slug, name, age, gender, occupation, location, bio, red_flags, green_flags, prompt_question, prompt_answer, avatar_svg, avatar_url, extra_photos, order_idx
) VALUES
(
    'dale-henderson',
    'Dale Henderson',
    54,
    'man',
    'Heavy Diesel Equipment Mechanic',
    'Tulsa, OK',
    'Keeping CAT excavators and Peterbilt rigs humming in Tulsa all week, then smoking brisket on the back porch and fishing Grand Lake on Sunday. Husky shoulders, salt-and-pepper goatee, warm laugh, and hands that fix anything.',
    ARRAY[
        'Stops mid-sentence whenever a diesel pickup drives by to diagnose its injectors by ear',
        'Has three separate toolboxes in the back of his truck',
        'Insists store-bought barbecue sauce is a personal insult'
    ],
    ARRAY[
        'Big, warm husky frame built for bear hugs and late-night cuddling',
        'Steady, patient, and genuinely handy around any house',
        'Takes his time making sure you finish first every single night'
    ],
    'You should swipe right if:',
    'You want a big, steady Oklahoma guy who smokes ribs and fixes your car.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#1b1410"/><circle cx="100" cy="84" r="38" fill="#dfb392"/><path d="M62 72 Q100 44 138 72 L134 56 Q100 38 66 56 Z" fill="#6b7280"/><path d="M44 176 Q100 132 156 176 Z" fill="#7c2d12"/></svg>',
    '/profiles/dale-henderson.jpg',
    ARRAY['/profiles/dale-henderson-2.jpg', '/profiles/dale-henderson-3.jpg'],
    68
),
(
    'paulie-romano',
    'Paulie Romano',
    47,
    'man',
    'ICU Charge Nurse RN',
    'Providence, RI',
    'Running twelve-hour critical care shifts in Providence, then decompressing over Federal Hill pasta, black coffee, and backyard firepits. Classic dad-bod, dark wavy hair with silver temples, and calm hands under pressure.',
    ARRAY[
        'Checks your radial pulse automatically when holding your hand at dinner',
        'Very vocal about which Federal Hill bakery has the only real cannoli',
        'Sleeps like the dead after three straight night shifts'
    ],
    ARRAY[
        'Calm, attentive caregiver who actually listens when you talk',
        'Cooks Sunday gravy from scratch while pouring good Chianti',
        'Gentle touch outside the bedroom, intensely focused inside it'
    ],
    'You should swipe right if:',
    'You love a grounded nurse with Italian roots and warm hands.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#0f172a"/><circle cx="100" cy="85" r="36" fill="#dfb696"/><path d="M64 76 Q100 40 136 76 Q134 52 100 48 Q66 52 64 76 Z" fill="#27272a"/><path d="M48 174 Q100 132 152 174 Z" fill="#1d4ed8"/></svg>',
    '/profiles/paulie-romano.jpg',
    ARRAY['/profiles/paulie-romano-2.jpg', '/profiles/paulie-romano-3.jpg'],
    69
),
(
    'walt-gallagher',
    'Walt Gallagher',
    52,
    'man',
    'Custom Cabinetmaker & Carpenter',
    'Burlington, VT',
    'Building walnut kitchens and mortise-and-tenon heirlooms by Lake Champlain. Unhurried dad-bod, sandy-gray beard, sawdust in my cuffs, and a cabin fireplace that stays lit from October through April.',
    ARRAY[
        'Runs his thumb along restaurant table edges judging the joinery',
        'Refuses to buy anything made of particleboard',
        'Knows forty-two ways to sharpen a chisel and will explain six of them'
    ],
    ARRAY[
        'Thoughtful, quiet, and builds things meant to last decades',
        'Makes maple-glazed salmon and strong pour-over coffee',
        'Unhurried, attentive lover who savors every minute'
    ],
    'You should swipe right if:',
    'You appreciate flannel, lake sunsets, and a man who works with wood.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#13231a"/><circle cx="100" cy="84" r="36" fill="#e4bea1"/><path d="M64 76 Q100 44 136 76 Q132 54 100 50 Q68 54 64 76 Z" fill="#9ca3af"/><path d="M48 174 Q100 132 152 174 Z" fill="#15803d"/></svg>',
    '/profiles/walt-gallagher.jpg',
    ARRAY['/profiles/walt-gallagher-2.jpg', '/profiles/walt-gallagher-3.jpg'],
    70
),
(
    'grant-holloway',
    'Grant Holloway',
    44,
    'man',
    'Medevac Flight Paramedic',
    'Salt Lake City, UT',
    'Flying mountain rescue choppers out of Salt Lake all week and skinning up Wasatch backcountry bowls before sunrise. Lean, runner-fit build, crisp short hair, sharp jawline, and zero panic in tight spots.',
    ARRAY[
        'Calls 5:30 AM trailhead meetups sleeping in',
        'Checks avalanche forecasts more often than sports scores',
        'Packs ultralight snacks even for a casual neighborhood walk'
    ],
    ARRAY[
        'Lean, tireless stamina that carries straight into the bedroom',
        'Cool-headed, protective, and surprisingly romantic',
        'Knows every hidden hot spring in northern Utah'
    ],
    'You should swipe right if:',
    'You want high-altitude energy, hot springs, and an athletic partner.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#0d1b2a"/><circle cx="100" cy="84" r="35" fill="#e5be9e"/><path d="M66 74 Q100 42 134 74 Q130 52 100 48 Q70 52 66 74 Z" fill="#5c4033"/><path d="M52 174 Q100 134 148 174 Z" fill="#0369a1"/></svg>',
    '/profiles/grant-holloway.jpg',
    ARRAY['/profiles/grant-holloway-2.jpg', '/profiles/grant-holloway-3.jpg'],
    71
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
