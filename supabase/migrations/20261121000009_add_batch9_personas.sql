-- Migration: 20261121000009_add_batch9_personas.sql
-- Add Batch 9 (4 of 40 new personas): Carlos Mendoza, Hector Navarro, Kenji Sato, Victor Park (order_idx 76..79).

INSERT INTO public.catalog_profiles (
    slug, name, age, gender, occupation, location, bio, red_flags, green_flags, prompt_question, prompt_answer, avatar_svg, avatar_url, extra_photos, order_idx
) VALUES
(
    'carlos-mendoza',
    'Carlos Mendoza',
    39,
    'man',
    'Commercial Master Electrician',
    'Austin, TX',
    'Wiring Austin commercial builds all day, then grilling carne asada on the patio and catching live East Sixth blues by night. Warm tan skin, thick dark wavy hair, neat beard, easy dad-bod, and quick hands.',
    ARRAY[
        'Cannot sit in any patio bar without pointing out crooked conduit runs',
        'Brings three kinds of homemade salsa to every cookout',
        'Talks to his rescue mutt like a full-grown roommate'
    ],
    ARRAY[
        'Warm, funny, and genuinely lights up every room he walks into',
        'Fixes your breaker panel and makes killer breakfast tacos afterward',
        'Attentive, passionate, and unhurried between the sheets'
    ],
    'You should swipe right if:',
    'You love live music, backyard carne asada, and a guy with spark.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#1e1b18"/><circle cx="100" cy="84" r="36" fill="#c68b59"/><path d="M64 76 Q100 40 136 76 Q134 52 100 48 Q66 52 64 76 Z" fill="#18181b"/><path d="M48 174 Q100 132 152 174 Z" fill="#b45309"/></svg>',
    '/profiles/carlos-mendoza.jpg',
    ARRAY['/profiles/carlos-mendoza-2.jpg', '/profiles/carlos-mendoza-3.jpg'],
    76
),
(
    'hector-navarro',
    'Hector Navarro',
    42,
    'man',
    'Ladder Truck Firefighter',
    'Albuquerque, NM',
    'Riding the ladder truck across Albuquerque and unwinding under high-desert sunsets with green chile stew and cold cerveza. Broad stocky shoulders, close-cropped dark hair, thick mustache-and-goatee, warm grin.',
    ARRAY[
        'Puts Hatch green chile on literally everything including eggs and burgers',
        'Always claims the firmest pillow on the bed',
        'Takes firehouse chili cookoffs deadly seriously'
    ],
    ARRAY[
        'Broad, strong arms that lift you effortlessly against the wall',
        'Steady, loyal, and protective without ever being controlling',
        'Loves loud laughs, slow mornings, and intense nights'
    ],
    'You should swipe right if:',
    'You want a broad-shouldered firefighter who cooks with real Hatch chile.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#27120b"/><circle cx="100" cy="84" r="37" fill="#c18553"/><path d="M64 72 Q100 44 136 72 Q132 52 100 48 Q68 52 64 72 Z" fill="#18181b"/><path d="M44 176 Q100 132 156 176 Z" fill="#991b1b"/></svg>',
    '/profiles/hector-navarro.jpg',
    ARRAY['/profiles/hector-navarro-2.jpg', '/profiles/hector-navarro-3.jpg'],
    77
),
(
    'kenji-sato',
    'Kenji Sato',
    38,
    'man',
    'Harbor Patrol Police Officer',
    'San Diego, CA',
    'Patrolling San Diego Bay by boat all shift and paddling out at Sunset Cliffs before dinner. Clean-cut dad-bod, short textured black hair, sharp eyes, calm coastal vibe, and zero ego.',
    ARRAY[
        'Checks tide charts before deciding what time to grab coffee',
        'Quietly judges bad boat-docking technique from waterfront bars',
        'Has seventeen surfboards leaning along his garage wall'
    ],
    ARRAY[
        'Calm, observant, and completely drama-free',
        'Makes seared ahi poke and cold sake on warm evenings',
        'Intense, focused, and deeply attentive in bed'
    ],
    'You should swipe right if:',
    'You want sunset ocean air, fresh poke, and steady coastal energy.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#0c1b2a"/><circle cx="100" cy="84" r="35" fill="#dfba96"/><path d="M64 74 Q100 40 136 74 Q134 52 100 48 Q66 52 64 74 Z" fill="#18181b"/><path d="M48 174 Q100 132 152 174 Z" fill="#0369a1"/></svg>',
    '/profiles/kenji-sato.jpg',
    ARRAY['/profiles/kenji-sato-2.jpg', '/profiles/kenji-sato-3.jpg'],
    78
),
(
    'victor-park',
    'Victor Park',
    48,
    'man',
    'Respiratory Therapist',
    'Chicago, IL',
    'Keeping Chicago lungs breathing easy all week, then hunting down late-night Korean barbecue and West Loop jazz on weekends. Big warm husky build, salt-and-pepper black hair, glasses, easy laugh, bear hugs.',
    ARRAY[
        'Hands out unsolicited breathing exercises whenever you sigh loudly',
        'Insists on grilling every strip of galbi himself at the table',
        'Owns too many vintage jazz LPs and zero matching coffee mugs'
    ],
    ARRAY[
        'Big, cozy husky presence that makes you feel instantly safe',
        'Dry humor, warm heart, and surprisingly wild in the bedroom',
        'Takes his time making sure you finish breathless'
    ],
    'You should swipe right if:',
    'You love Korean BBQ, jazz records, and a big warm bear.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#18181b"/><circle cx="100" cy="84" r="38" fill="#dfb994"/><path d="M62 72 Q100 42 138 72 Q134 52 100 48 Q66 52 62 72 Z" fill="#27272a"/><path d="M44 176 Q100 132 156 176 Z" fill="#312e81"/></svg>',
    '/profiles/victor-park.jpg',
    ARRAY['/profiles/victor-park-2.jpg', '/profiles/victor-park-3.jpg'],
    79
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
