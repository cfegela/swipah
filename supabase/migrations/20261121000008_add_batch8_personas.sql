-- Migration: 20261121000008_add_batch8_personas.sql
-- Add Batch 8 (4 of 40 new personas): Lt. Frank McAllister, Chief Rick Halvorsen, Darius Vance, Det. Andre Bellamy (order_idx 72..75).

INSERT INTO public.catalog_profiles (
    slug, name, age, gender, occupation, location, bio, red_flags, green_flags, prompt_question, prompt_answer, avatar_svg, avatar_url, extra_photos, order_idx
) VALUES
(
    'frank-mcallister',
    'Lt. Frank McAllister',
    56,
    'man',
    'Police Homicide Lieutenant',
    'Philadelphia, PA',
    'Thirty years working Philadelphia street cases, still sharp, still loyal, and finally slowing down for good South Philly roast pork and late-night vinyl. Silver-gray hair, steady dad-bod, dry wit, and zero drama.',
    ARRAY[
        'Always sits facing the restaurant door even on a quiet Tuesday',
        'Knows every corner deli in South Philly by sandwich weight',
        'Reads true-crime paperbacks and points out procedural errors out loud'
    ],
    ARRAY[
        'Protective, observant, and remembers every tiny detail you mention',
        'Old-school gentleman who opens doors and pours stiff bourbons',
        'Deeply passionate, patient, and commanding behind closed doors'
    ],
    'You should swipe right if:',
    'You want a sharp, protective Philly lieutenant with dry humor.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#111827"/><circle cx="100" cy="84" r="36" fill="#dfb595"/><path d="M64 74 Q100 44 136 74 Q134 52 100 48 Q66 52 64 74 Z" fill="#9ca3af"/><path d="M48 174 Q100 132 152 174 Z" fill="#1e3a8a"/></svg>',
    '/profiles/frank-mcallister.jpg',
    ARRAY['/profiles/frank-mcallister-2.jpg', '/profiles/frank-mcallister-3.jpg'],
    72
),
(
    'rick-halvorsen',
    'Chief Rick Halvorsen',
    51,
    'man',
    'Battalion Fire Chief',
    'Boise, ID',
    'Running multi-alarm brush and structure responses across Boise while staying marathon-fit at fifty-one. Lean athletic build, short silver-blonde hair, crisp mustache-and-stubble, and calm command under heat.',
    ARRAY[
        'Counts exits and sprinkler risers in every bar you walk into',
        'Runs ten miles along the Boise Greenbelt before 7 AM',
        'Refuses to let anyone else touch the backyard grill'
    ],
    ARRAY[
        'Lean, tireless stamina and rock-steady presence',
        'Fixes everything at the firehouse and around your house too',
        'Warm, confident leader who makes you feel completely safe'
    ],
    'You should swipe right if:',
    'You appreciate a fit silver-fox fire chief with endless stamina.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#1c1917"/><circle cx="100" cy="84" r="35" fill="#e5be9e"/><path d="M66 72 Q100 44 134 72 Q132 52 100 48 Q68 52 66 72 Z" fill="#cbd5e1"/><path d="M52 174 Q100 134 148 174 Z" fill="#991b1b"/></svg>',
    '/profiles/rick-halvorsen.jpg',
    ARRAY['/profiles/rick-halvorsen-2.jpg', '/profiles/rick-halvorsen-3.jpg'],
    73
),
(
    'darius-vance',
    'Darius Vance',
    37,
    'man',
    'Trauma ER Physician Assistant',
    'Houston, TX',
    'Patching up Houston ER trauma bays all week, then unwinding with Gulf Coast oysters, cold mezcal, and late-night R&B. Warm brown skin, neat short fade and beard, everyday dad-bod, and steady bedside charm.',
    ARRAY[
        'Evaluates everyone at the gym for hidden shoulder impingements',
        'Takes way too long choosing hot sauce at taco trucks',
        'Leaves half-read medical journals on every coffee table'
    ],
    ARRAY[
        'Gentle, confident hands and effortless Southern warmth',
        'Cooks blackened redfish better than half the restaurants in Houston',
        'Intense, attentive lover who never rushes a single touch'
    ],
    'You should swipe right if:',
    'You want Gulf Coast charm, warm hands, and late-night R&B.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#0f172a"/><circle cx="100" cy="84" r="36" fill="#7c4f31"/><path d="M66 72 Q100 48 134 72 Q130 50 100 46 Q70 50 66 72 Z" fill="#18181b"/><path d="M48 174 Q100 132 152 174 Z" fill="#0f766e"/></svg>',
    '/profiles/darius-vance.jpg',
    ARRAY['/profiles/darius-vance-2.jpg', '/profiles/darius-vance-3.jpg'],
    74
),
(
    'andre-bellamy',
    'Det. Andre Bellamy',
    46,
    'man',
    'Major Crimes Detective',
    'Detroit, MI',
    'Working Detroit major crimes with patience and sharp instincts, then trading the badge for Motown vinyl, cast-iron steaks, and quiet nights in. Broad stocky build, bald head, neat salt-and-pepper beard, deep voice.',
    ARRAY[
        'Spots a half-truth from three rooms away without blinking',
        'Strictly forbids bad speakers in his living room',
        'Takes his coffee black and his whiskey neat'
    ],
    ARRAY[
        'Broad, solid shoulders and a deep voice that melts tension instantly',
        'Calm, observant, and fiercely loyal once you earn his trust',
        'Slow, powerful, and unforgettable in the bedroom'
    ],
    'You should swipe right if:',
    'You love a broad-shouldered Detroit detective with Motown soul.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#18181b"/><circle cx="100" cy="84" r="37" fill="#6b4228"/><path d="M74 106 Q100 124 126 106 Q124 122 100 126 Q76 122 74 106 Z" fill="#27272a"/><path d="M44 176 Q100 132 156 176 Z" fill="#374151"/></svg>',
    '/profiles/andre-bellamy.jpg',
    ARRAY['/profiles/andre-bellamy-2.jpg', '/profiles/andre-bellamy-3.jpg'],
    75
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
