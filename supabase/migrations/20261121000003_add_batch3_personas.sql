-- Migration: 20261121000003_add_batch3_personas.sql
-- Add Batch 3 (4 of 40 new personas): Diane Gallagher, Ruthie Vance, Capt. Erin Becker, Natalie Sterling (order_idx 52..55).

INSERT INTO public.catalog_profiles (
    slug, name, age, gender, occupation, location, bio, red_flags, green_flags, prompt_question, prompt_answer, avatar_svg, avatar_url, extra_photos, order_idx
) VALUES
(
    'diane-gallagher',
    'Diane Gallagher',
    55,
    'woman',
    'Oncology Nurse Practitioner',
    'Portland, ME',
    'Thirty years caring for patients along the Maine coast and savoring every quiet sunset I get off the clock. Silver hair, warm hands, dry humor, and deeply appreciative of someone who knows how to slow down.',
    ARRAY[
        'Brings chamomile tea and unsolicited vitamin advice to every second date',
        'Knows every nurse in southern Maine so sneaking around is impossible',
        'Will gently correct your posture mid-walk along the waterfront'
    ],
    ARRAY[
        'Calm, deeply kind, and completely unfazed by real-life chaos',
        'Knows which Portland lobster shacks stay open past September',
        'Affectionate, sensual, and unhurried behind closed doors'
    ],
    'What I value most:',
    'Presence, honesty, good oysters, and a partner who laughs easily.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#f5d0b5"/><path d="M60 80 Q100 35 140 80 Q140 128 128 142 Q100 130 72 142 Z" fill="#cbd5e1"/><path d="M50 172 Q100 132 150 172 Z" fill="#065f46"/></svg>',
    '/profiles/diane-gallagher.jpg',
    ARRAY['/profiles/diane-gallagher-2.jpg', '/profiles/diane-gallagher-3.jpg'],
    52
),
(
    'ruthie-vance',
    'Ruthie Vance',
    52,
    'woman',
    'Finish Carpenter & Cabinetmaker',
    'Asheville, NC',
    'Building heirloom walnut kitchens in the Blue Ridge foothills and hiking quiet ridge trails every Sunday. Sawdust in my hair, callouses on my thumbs, and zero patience for cheap veneer.',
    ARRAY[
        'Silently checks drawer dovetails inside your bathroom vanity',
        'Has seventeen half-finished furniture sketches on coffee-shop napkins',
        'Refuses to buy anything that arrives in a flat-pack box'
    ],
    ARRAY[
        'Builds custom floating shelves just because you mentioned liking plants',
        'Warm, grounded mountain energy and effortless natural beauty',
        'Always smells faintly of cedar shavings and espresso'
    ],
    'My ideal Sunday afternoon:',
    'Iced coffee on a cabin porch overlooking misty ridges with good music playing.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#f0c8a8"/><path d="M60 80 Q100 34 140 80 Q138 128 126 142 Q100 130 74 142 Z" fill="#5c4033"/><path d="M50 172 Q100 132 150 172 Z" fill="#b45309"/></svg>',
    '/profiles/ruthie-vance.jpg',
    ARRAY['/profiles/ruthie-vance-2.jpg', '/profiles/ruthie-vance-3.jpg'],
    53
),
(
    'erin-becker',
    'Capt. Erin Becker',
    48,
    'woman',
    'Municipal Fire Captain',
    'Denver, CO',
    'Running Truck 12 in Denver for twenty-four hours at a time, then escaping to mountain lakes and thick ribeyes on my four days off. Strong, curvy, straightforward, and I never bluff.',
    ARRAY[
        'Tests smoke detectors in Airbnb rentals before unpacking her suitcase',
        'Gives orders like a shift commander when assembling IKEA patio chairs',
        'Beats almost everyone she dates at arm-wrestling'
    ],
    ARRAY[
        'Fiercely protective, steady under pressure, and wildly affectionate',
        'Knows every hidden mountain cove and dive steakhouse in Colorado',
        'Confident curves and zero interest in petty mind games'
    ],
    'How to win my attention:',
    'Show up confident, match my energy, and never flinch when I tease you.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#f3cbb0"/><path d="M60 78 Q100 36 140 78 Q138 118 100 115 Q62 118 60 78 Z" fill="#d97706"/><path d="M48 172 Q100 132 152 172 Z" fill="#1e3a8a"/></svg>',
    '/profiles/erin-becker.jpg',
    ARRAY['/profiles/erin-becker-2.jpg', '/profiles/erin-becker-3.jpg'],
    54
),
(
    'natalie-sterling',
    'Natalie Sterling',
    54,
    'woman',
    'Commercial Airline First Officer',
    'Charlotte, NC',
    'Three-day East Coast pairings in the flight deck, quiet coastal sailing and crisp Pinot Grigio when I touch back down. Slender, sharp-eyed, well-traveled, and completely allergic to drama.',
    ARRAY[
        'Tracks turbulence fronts on radar apps during backyard barbecues',
        'Checks out within thirty seconds if someone wastes time at airport security',
        'Has layover dinner opinions about forty different cities'
    ],
    ARRAY[
        'Always calm, punctual, and impeccably put together',
        'Companion flight passes if you actually pass the vibe check',
        'Dry wit and thrilling, unhurried confidence behind closed doors'
    ],
    'The fastest way to impress me:',
    'Carry-on only, crisp conversation, and knowing how to pour a proper drink.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="36" fill="#f5d5c0"/><path d="M62 80 Q100 36 138 80 Q136 122 124 128 Q100 116 76 128 Z" fill="#e2e8f0"/><path d="M52 172 Q100 134 148 172 Z" fill="#0f172a"/></svg>',
    '/profiles/natalie-sterling.jpg',
    ARRAY['/profiles/natalie-sterling-2.jpg', '/profiles/natalie-sterling-3.jpg'],
    55
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name, age = EXCLUDED.age, gender = EXCLUDED.gender, occupation = EXCLUDED.occupation,
    location = EXCLUDED.location, bio = EXCLUDED.bio, red_flags = EXCLUDED.red_flags, green_flags = EXCLUDED.green_flags,
    prompt_question = EXCLUDED.prompt_question, prompt_answer = EXCLUDED.prompt_answer, avatar_svg = EXCLUDED.avatar_svg,
    avatar_url = EXCLUDED.avatar_url, extra_photos = EXCLUDED.extra_photos, order_idx = EXCLUDED.order_idx;
