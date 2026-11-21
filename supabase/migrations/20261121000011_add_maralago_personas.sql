-- Migration: 20261121000011_add_maralago_personas.sql
-- Add 2 new personas: Brynlee Beaumont & Trey Kensington (order_idx 84..85).

INSERT INTO public.catalog_profiles (
    slug, name, age, gender, occupation, location, bio, red_flags, green_flags, prompt_question, prompt_answer, avatar_svg, avatar_url, extra_photos, order_idx
) VALUES
(
    'brynlee-beaumont',
    'Brynlee Beaumont',
    40,
    'woman',
    'Patriotic Med-Spa & Cryo-Contour Founder',
    'Palm Beach, FL',
    'Four minutes from the Southern Boulevard bridge and living proof that God blesses great injectors. Heavy glam by 9 AM, champagne by noon, and my eyebrows haven''t moved since the 2020 primary.',
    ARRAY[
        'Brings a ring light and setting powder to every steakhouse booth',
        'Has seventeen skincare syringes labeled "emergency touch-up" in her Birkin',
        'Refuses to sit within forty feet of overhead fluorescent lighting'
    ],
    ARRAY[
        'Always dressed like she''s about to cut a ribbon at a Palm Beach gala',
        'Will happily book your teeth-whitening and IV drip appointments too',
        'Surprising stamina once the Spanx and false lashes finally come off'
    ],
    'You should swipe right if:',
    'You appreciate blinding veneers, double-contour bronzer, and Palm Beach drama.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#2a0a1e"/><circle cx="100" cy="84" r="36" fill="#e59e6d"/><path d="M56 80 Q100 24 144 80 Q146 142 126 154 Q100 136 74 154 Z" fill="#fef08a"/><path d="M48 174 Q100 132 152 174 Z" fill="#db2777"/></svg>',
    '/profiles/brynlee-beaumont.jpg',
    ARRAY['/profiles/brynlee-beaumont-2.jpg', '/profiles/brynlee-beaumont-3.jpg'],
    84
),
(
    'trey-kensington',
    'Trey Kensington',
    40,
    'man',
    'Member-Guest Lobbyist & Crypto PAC Chair',
    'West Palm Beach, FL',
    'Splitting time between Worth Avenue steak dinners, golf-cart diplomacy near Mar-a-Lago, and my quarterly jawline-filler refresh. Veneers brighter than your future and a forehead smoother than a fresh putting green.',
    ARRAY[
        'Smiles aggressively in mirrors while adjusting his own jaw angle',
        'Pays for dinner exclusively with a metallic Freedom Coin rewards card',
        'Insists his spray tan is "just three days on the yacht"'
    ],
    ARRAY[
        'Always gets past the velvet rope without checking the guest list',
        'Knows every valet in Palm Beach by first name and tips in crisp hundreds',
        'Surprisingly eager to please once the velvet blazer hits the floor'
    ],
    'You should swipe right if:',
    'You want VIP country club access, blinding teeth, and zero forehead wrinkles.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#0f172a"/><circle cx="100" cy="84" r="36" fill="#d98b54"/><path d="M64 72 Q100 42 136 72 Q132 52 100 48 Q68 52 64 72 Z" fill="#27272a"/><path d="M48 174 Q100 132 152 174 Z" fill="#1d4ed8"/></svg>',
    '/profiles/trey-kensington.jpg',
    ARRAY['/profiles/trey-kensington-2.jpg', '/profiles/trey-kensington-3.jpg'],
    85
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
