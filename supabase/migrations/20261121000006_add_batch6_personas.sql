-- Migration: 20261121000006_add_batch6_personas.sql
-- Add Batch 6 (4 of 40 new personas): Simone Laurent, Carmen Reyes-Cole, Boone Whitaker, Deputy Greg Harrell (order_idx 64..67).

INSERT INTO public.catalog_profiles (
    slug, name, age, gender, occupation, location, bio, red_flags, green_flags, prompt_question, prompt_answer, avatar_svg, avatar_url, extra_photos, order_idx
) VALUES
(
    'simone-laurent',
    'Simone Laurent',
    49,
    'woman',
    'Orthopedic Physical Therapist',
    'Minneapolis, MN',
    'Helping stubborn athletes walk right again all week, then paddleboarding Lake Harriet and sipping North Loop Pinot Noir all weekend. Silver-streaked curls, magic hands, and I notice a tight hip flexor from across the room.',
    ARRAY[
        'Cannot watch anyone jog past the patio without silently critiquing their gait',
        'Brings a lacrosse ball for trigger-point release on road trips',
        'Pushes you into cold plunge lakes before breakfast'
    ],
    ARRAY[
        'Strong, soothing hands that fix your lower back in ten minutes flat',
        'Warm, grounded, and radiates effortless athletic confidence',
        'Passionate, unhurried, and deeply attentive behind closed doors'
    ],
    'You should swipe right if:',
    'You appreciate strong hands, lake mornings, and good red wine at dusk.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="37" fill="#c69168"/><path d="M58 80 Q100 32 142 80 Q142 132 126 144 Q100 130 74 144 Z" fill="#3f2e26"/><path d="M50 172 Q100 132 150 172 Z" fill="#0f766e"/></svg>',
    '/profiles/simone-laurent.jpg',
    ARRAY['/profiles/simone-laurent-2.jpg', '/profiles/simone-laurent-3.jpg'],
    64
),
(
    'carmen-reyes-cole',
    'Carmen Reyes-Cole',
    57,
    'woman',
    'Neighborhood Bakery & Café Owner',
    'Oakland, CA',
    'Up at 4 AM laminating butter croissants in Oakland and unwinding on my redwood deck with cold brew or Sonoma Zinfandel by dusk. Lush BBW curves, silver curls, warm kitchen energy, and plenty to hold onto.',
    ARRAY[
        'Refuses to eat grocery-store bread anywhere on earth',
        'Takes personal offense if you skip pastry crust edges',
        'Falls asleep on the sofa by 9:30 PM if you turn the fireplace on'
    ],
    ARRAY[
        'Wakes you up with warm almond croissants and French press coffee',
        'Biggest, most welcoming laugh in the East Bay',
        'Lush, unapologetic curves and deeply sensual warmth'
    ],
    'My perfect Sunday morning:',
    'Warm croissants straight out of the deck oven, coffee in the redwoods, and zero alarm clocks.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="39" fill="#9f6c4c"/><path d="M58 80 Q100 32 142 80 Q140 132 126 144 Q100 130 74 144 Z" fill="#64748b"/><path d="M46 172 Q100 128 154 172 Z" fill="#9d174d"/></svg>',
    '/profiles/carmen-reyes-cole.jpg',
    ARRAY['/profiles/carmen-reyes-cole-2.jpg', '/profiles/carmen-reyes-cole-3.jpg'],
    65
),
(
    'boone-whitaker',
    'Boone Whitaker',
    45,
    'man',
    'Structural Ironworker',
    'Kansas City, MO',
    'Walking high steel beams over Kansas City by week, floating Lake of the Ozarks with a cooler full of beer by weekend. Broad-shouldered, stocky, tough as nails on the job, and gentle as hell with the right person.',
    ARRAY[
        'Brags shamelessly about Kansas City burnt ends vs every other city',
        'Hates heights-fear complaints when crossing pedestrian bridges',
        'Still wears steel-toe boots to casual neighborhood patios'
    ],
    ARRAY[
        'Fearless, steady, and carries heavy groceries in one trip without blinking',
        'Knows every hidden Ozarks cove and smoky barbecue counter',
        'Old-school loyal and surprisingly tender behind closed doors'
    ],
    'Swipe right if you like:',
    'Broad shoulders, honest conversation, lake days, and real smoked brisket.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="88" r="38" fill="#ebc09c"/><path d="M56 70 Q100 32 144 70 L148 80 L52 80 Z" fill="#f8fafc"/><path d="M48 172 Q100 132 152 172 Z" fill="#4d7c0f"/></svg>',
    '/profiles/boone-whitaker.jpg',
    ARRAY['/profiles/boone-whitaker-2.jpg', '/profiles/boone-whitaker-3.jpg'],
    66
),
(
    'greg-harrell',
    'Deputy Greg Harrell',
    41,
    'man',
    'County Sheriff''s Deputy',
    'Knoxville, TN',
    'Patrolling East Tennessee backroads by day and bass-fishing Norris Lake on my days off. Average dad-bod, sandy beard, zero city pretension, and I always know which roadhouse pours the coldest sweet tea or whiskey.',
    ARRAY[
        'Stops mid-sentence to wave at every passing pickup truck on rural roads',
        'Has twenty tackle boxes organized better than his sock drawer',
        'Refuses to take the interstate if a scenic two-lane exists'
    ],
    ARRAY[
        'Shows up when he says he will and never leaves you stranded',
        'Easy laugh, warm hands, and zero ego',
        'Makes killer campfire skillet trout after sunset'
    ],
    'My ideal day off:',
    'Early morning cast on Norris Lake, lazy afternoon porch nap, and roadhouse whiskey by dark.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#f0c4a0"/><path d="M62 74 Q100 38 138 74 L134 56 Q100 36 66 56 Z" fill="#926c40"/><path d="M50 172 Q100 132 150 172 Z" fill="#a16207"/></svg>',
    '/profiles/greg-harrell.jpg',
    ARRAY['/profiles/greg-harrell-2.jpg', '/profiles/greg-harrell-3.jpg'],
    67
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name, age = EXCLUDED.age, gender = EXCLUDED.gender, occupation = EXCLUDED.occupation,
    location = EXCLUDED.location, bio = EXCLUDED.bio, red_flags = EXCLUDED.red_flags, green_flags = EXCLUDED.green_flags,
    prompt_question = EXCLUDED.prompt_question, prompt_answer = EXCLUDED.prompt_answer, avatar_svg = EXCLUDED.avatar_svg,
    avatar_url = EXCLUDED.avatar_url, extra_photos = EXCLUDED.extra_photos, order_idx = EXCLUDED.order_idx;
