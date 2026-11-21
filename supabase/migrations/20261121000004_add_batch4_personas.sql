-- Migration: 20261121000004_add_batch4_personas.sql
-- Add Batch 4 (4 of 40 new personas): Sgt. Kendra Brooks, Monique Baptiste, Elena Morales, Rosa Delgado (order_idx 56..59).

INSERT INTO public.catalog_profiles (
    slug, name, age, gender, occupation, location, bio, red_flags, green_flags, prompt_question, prompt_answer, avatar_svg, avatar_url, extra_photos, order_idx
) VALUES
(
    'kendra-brooks',
    'Sgt. Kendra Brooks',
    38,
    'woman',
    'K9 Police Patrol Sergeant',
    'Atlanta, GA',
    'Patrolling Atlanta parks with my 85-pound German Shepherd partner by day, chasing Lake Lanier wakes and spicy wings by weekend. Must pass my dog''s sniff test before you get a second date.',
    ARRAY[
        'Her K9 partner gets the passenger seat—you sit in back if it rains',
        'Spots bad intentions from half a block away',
        'Cannot turn off sergeant-voice when someone cuts in line'
    ],
    ARRAY[
        'Fearless, warmhearted, and wildly loyal once you earn her trust',
        'Knows every hidden Midtown patio with strong margaritas',
        'Athletic curves and zero time for weak excuses'
    ],
    'Rule number one on date one:',
    'Be nice to dogs, tip your bartender, and keep up when I tease you.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="37" fill="#6b3e26"/><path d="M62 80 Q100 35 138 80 Q135 120 100 116 Q65 120 62 80 Z" fill="#111827"/><path d="M50 172 Q100 132 150 172 Z" fill="#1e3a8a"/></svg>',
    '/profiles/kendra-brooks.jpg',
    ARRAY['/profiles/kendra-brooks-2.jpg', '/profiles/kendra-brooks-3.jpg'],
    56
),
(
    'monique-baptiste',
    'Monique Baptiste',
    47,
    'woman',
    'Labor & Delivery Nurse',
    'New Orleans, LA',
    'Delivering New Orleans babies for twenty years and soaking up Frenchmen Street jazz whenever I get a Saturday night off. Lush curves, big laugh, and my gumbo starts with a two-hour dark roux.',
    ARRAY[
        'Will spontaneously coach your breathing if you stub your toe',
        'Has zero tolerance for rushed dinners or bad music',
        'Puts hot sauce in her purse before leaving the house'
    ],
    ARRAY[
        'Warmest energy in the room and hugs that melt a whole bad week',
        'Cooks like a New Orleans grandmother and kisses like trouble',
        'Radiant curves and completely comfortable in her skin'
    ],
    'My ideal Saturday night:',
    'Live brass music on Frenchmen Street, cold Sazeracs, and slow dancing in the living room.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#5c3317"/><path d="M58 82 Q100 30 142 82 Q144 134 126 146 Q100 130 74 146 Z" fill="#18181b"/><path d="M48 172 Q100 130 152 172 Z" fill="#881337"/></svg>',
    '/profiles/monique-baptiste.jpg',
    ARRAY['/profiles/monique-baptiste-2.jpg', '/profiles/monique-baptiste-3.jpg'],
    57
),
(
    'elena-morales',
    'Elena Morales',
    37,
    'woman',
    'Firefighter / Paramedic',
    'San Antonio, TX',
    'Running rescue calls across San Antonio all shift, then floating Hill Country rivers or grabbing River Walk margaritas on my days off. High energy, quick laugh, and tougher than I look.',
    ARRAY[
        'Drives every road like she still has lights and sirens on',
        'Critiques CPR scenes in movies louder than the dialogue',
        'Challenges dates to spicy taco eating contests'
    ],
    ARRAY[
        'Literally saves lives before breakfast and never complains',
        'Always down for spontaneous river trips and late-night tacos',
        'Warm, passionate, and fearless in every sense'
    ],
    'Swipe right if you can:',
    'Handle bold salsa, honest banter, and a woman who likes taking the lead.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="37" fill="#c68b59"/><path d="M60 80 Q100 34 140 80 Q140 132 126 144 Q100 130 74 144 Z" fill="#1c1917"/><path d="M50 172 Q100 132 150 172 Z" fill="#1e3a8a"/></svg>',
    '/profiles/elena-morales.jpg',
    ARRAY['/profiles/elena-morales-2.jpg', '/profiles/elena-morales-3.jpg'],
    58
),
(
    'rosa-delgado',
    'Rosa Delgado',
    41,
    'woman',
    'Commercial HVAC Technician',
    'Phoenix, AZ',
    'Fixing rooftop chillers in 110-degree Phoenix summers so nobody else has to sweat—save that for after dark. Curvy, upbeat, handy with gauges, and obsessed with smoky mezcal and street tacos.',
    ARRAY[
        'Touches thermostat panels in Airbnb rentals without asking',
        'Has stronger grip strength than half the guys she meets',
        'Refuses to date anyone who complains about dry desert heat'
    ],
    ARRAY[
        'Your AC will literally never break again',
        'Warm, joyful curves and infectious laugh across the patio',
        'Zero pretense, hardworking, and deeply affectionate'
    ],
    'Best way to cool me down:',
    'Cold poolside agua fresca by afternoon, smoky mezcal and street tacos after sunset.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#c08052"/><path d="M58 80 Q100 34 142 80 Q142 132 128 146 Q100 132 72 146 Z" fill="#1f1b18"/><path d="M48 172 Q100 130 152 172 Z" fill="#a16207"/></svg>',
    '/profiles/rosa-delgado.jpg',
    ARRAY['/profiles/rosa-delgado-2.jpg', '/profiles/rosa-delgado-3.jpg'],
    59
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name, age = EXCLUDED.age, gender = EXCLUDED.gender, occupation = EXCLUDED.occupation,
    location = EXCLUDED.location, bio = EXCLUDED.bio, red_flags = EXCLUDED.red_flags, green_flags = EXCLUDED.green_flags,
    prompt_question = EXCLUDED.prompt_question, prompt_answer = EXCLUDED.prompt_answer, avatar_svg = EXCLUDED.avatar_svg,
    avatar_url = EXCLUDED.avatar_url, extra_photos = EXCLUDED.extra_photos, order_idx = EXCLUDED.order_idx;
