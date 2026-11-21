-- Migration: 20261121000002_add_batch2_personas.sql
-- Add Batch 2 (4 of 40 new personas): Tammy Kovacs, Det. Claire Byrne, Brenda Kowalski, Dan Kowalczyk (order_idx 48..51).

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
) VALUES
(
    'tammy-kovacs',
    'Tammy Kovacs',
    45,
    'woman',
    'Union Master Electrician',
    'Cleveland, OH',
    'Twenty-two years wiring commercial high-rises and still knows how to let loose on a Lake Erie pier on Friday night. Thick curves, zero bullshit, and I always carry voltage testers in my glovebox.',
    ARRAY[
        'Cannot walk into any restaurant without staring up at the conduit work',
        'Judges homeowners who buy cheap smart switches off Amazon',
        'Talks louder after two Cleveland lagers than most rock concerts'
    ],
    ARRAY[
        'Will rewire your whole garage panel in exchange for tacos and beer',
        'Warm, confident, and fiercely protective of the people she loves',
        'Looks incredible in flannel or a swimsuit by the lake'
    ],
    'You should swipe right if:',
    'You like a woman with strong hands, soft curves, and zero interest in playing games.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#f5d0b5"/><path d="M58 78 Q100 34 142 78 Q144 130 128 145 Q100 130 72 145 Z" fill="#9a3412"/><path d="M50 172 Q100 132 150 172 Z" fill="#3f6212"/></svg>',
    '/profiles/tammy-kovacs.jpg',
    ARRAY['/profiles/tammy-kovacs-2.jpg', '/profiles/tammy-kovacs-3.jpg'],
    48
),
(
    'claire-byrne',
    'Det. Claire Byrne',
    44,
    'woman',
    'Violent Crimes Detective',
    'Baltimore, MD',
    'Fourteen years closing cases in Baltimore and unwinding with crab cakes, dry Pinot Noir, and Chesapeake sunsets. I spot a bad alibi in ten seconds—just be real with me.',
    ARRAY[
        'Automatically sits facing the door in every restaurant booth',
        'Reads body language way too closely during casual small talk',
        'Occasionally answers midnight dispatch calls mid-appetizer'
    ],
    ARRAY[
        'Razor-sharp dry humor once you get past the detective stare',
        'Always knows the best tucked-away wine bars on the harbor',
        'Calm under pressure and devastatingly attentive behind closed doors'
    ],
    'How to earn a second date:',
    'Skip the rehearsed lines, pour good wine, and keep up with my sarcasm.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="37" fill="#f3d2bd"/><path d="M62 82 Q100 36 138 82 Q136 125 124 132 Q100 120 76 132 Z" fill="#271c19"/><path d="M50 172 Q100 132 150 172 Z" fill="#1f2937"/></svg>',
    '/profiles/claire-byrne.jpg',
    ARRAY['/profiles/claire-byrne-2.jpg', '/profiles/claire-byrne-3.jpg'],
    49
),
(
    'brenda-kowalski',
    'Brenda Kowalski',
    51,
    'woman',
    'Marine Diesel Mechanic',
    'Duluth, MN',
    'Keeping Lake Superior charter boats humming from May thaw to November gales. Big-hearted, curvy, silver-streaked, and happiest with grease on my knuckles or fresh walleye on the picnic table.',
    ARRAY[
        'Will stop mid-walk on the pier to diagnose a rough idle two slips over',
        'Refuses to date anyone who complains about cold Minnesota wind',
        'Smells faintly of marine diesel and vanilla body spray'
    ],
    ARRAY[
        'Biggest, warmest hug on the North Shore',
        'Fixes outboard motors before breakfast and bakes berry pies by supper',
        'Completely comfortable in her own skin with zero drama'
    ],
    'My favorite weekend vibe:',
    'Porch coffee watching fog lift off Lake Superior, followed by a lazy afternoon fish fry.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="39" fill="#f5d0b5"/><path d="M60 80 Q100 38 140 80 Q138 128 126 142 Q100 130 74 142 Z" fill="#d4b483"/><path d="M46 172 Q100 128 154 172 Z" fill="#1e3a8a"/></svg>',
    '/profiles/brenda-kowalski.jpg',
    ARRAY['/profiles/brenda-kowalski-2.jpg', '/profiles/brenda-kowalski-3.jpg'],
    50
),
(
    'dan-kowalczyk',
    'Dan Kowalczyk',
    43,
    'man',
    'Master Plumber',
    'Milwaukee, WI',
    'Independent master plumber keeping century-old Milwaukee brick houses dry and warm. Dad-bod certified, undefeated at Friday cheese curds, and always down for a quiet lake dock beer.',
    ARRAY[
        'Checks under-sink P-traps at friends'' houses without being asked',
        'Still quotes 90s Brewers games nobody else remembers',
        'Brings a thermos of black coffee everywhere'
    ],
    ARRAY[
        'Shows up on time, fixes whatever is leaking, and never charges family',
        'Zero ego, steady temperament, and genuinely affectionate',
        'Knows every corner tavern with fresh fried curds in Milwaukee'
    ],
    'What I bring to the table:',
    'Warm hands, good beer, a reliable truck, and zero games.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#f0c4a0"/><path d="M62 72 Q100 40 138 72 L134 55 Q100 36 66 55 Z" fill="#8b6544"/><path d="M50 172 Q100 134 150 172 Z" fill="#1e3a8a"/></svg>',
    '/profiles/dan-kowalczyk.jpg',
    ARRAY['/profiles/dan-kowalczyk-2.jpg', '/profiles/dan-kowalczyk-3.jpg'],
    51
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
