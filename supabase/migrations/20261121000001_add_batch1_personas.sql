-- Migration: 20261121000001_add_batch1_personas.sql
-- Add Batch 1 (4 of 40 new personas): Jolene Mercer, Heather Callahan, Vivienne Ashcroft, Colt Maddox (order_idx 44..47).

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
    'jolene-mercer',
    'Jolene Mercer',
    38,
    'woman',
    'Working Cowgirl & Quarter Horse Trainer',
    'Bozeman, MT',
    '5''6", sun-freckled, and up before dawn breaking two-year-old quarter horses in the Bridger foothills. Looking for someone who isn''t scared of ranch mud, cold creek swims, or sharing whiskey on the porch.',
    ARRAY[
        'Judges your character within three seconds of seeing how you coil a rope',
        'Has missed two weddings because a mare was due to foal',
        'Leaves hay chaff in the bed of every truck she owns'
    ],
    ARRAY[
        'Can back a gooseneck horse trailer into a tight alley on the first try',
        'Bakes cast-iron peach cobbler from scratch after a twelve-hour day',
        'Warmest laugh in Gallatin County and zero pretense'
    ],
    'The fastest way onto my good side:',
    'Show up in boots you do not mind getting dusty and bring a six-pack for the porch swing.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="88" r="38" fill="#f3c6a5"/><path d="M55 72 Q100 45 145 72 L160 80 L40 80 Z" fill="#a16207"/><path d="M68 58 Q100 32 132 58 Z" fill="#854d0e"/><path d="M50 172 Q100 132 150 172 Z" fill="#1d4ed8"/></svg>',
    '/profiles/jolene-mercer.jpg',
    ARRAY['/profiles/jolene-mercer-2.jpg', '/profiles/jolene-mercer-3.jpg'],
    44
),
(
    'heather-callahan',
    'Heather Callahan',
    43,
    'woman',
    'ER Charge Nurse',
    'Pittsburgh, PA',
    'Three twelves a week running trauma triage, four days off chasing lake breezes, dive-bar wings, and loud laughs. Dark humor comes free with the stethoscope.',
    ARRAY[
        'Casually diagnoses everyone at the next table while eating nachos',
        'Falls asleep mid-movie at 8:45 PM after a double shift',
        'Always carries trauma shears in her purse "just in case"'
    ],
    ARRAY[
        'Literally never panics in an emergency—real or romantic',
        'Makes the best Sunday morning hangover breakfast in Pittsburgh',
        'Loyal, zero-drama, and genuinely listens'
    ],
    'My ideal off-shift Sunday:',
    'Iced tea on a quiet lake deck, a good playlist, and nobody asking me to look at a weird rash.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#f5d0b5"/><path d="M60 82 Q100 35 140 82 Q142 135 128 148 Q100 132 72 148 Z" fill="#5c3a21"/><path d="M50 172 Q100 132 150 172 Z" fill="#1e3a8a"/></svg>',
    '/profiles/heather-callahan.jpg',
    ARRAY['/profiles/heather-callahan-2.jpg', '/profiles/heather-callahan-3.jpg'],
    45
),
(
    'vivienne-ashcroft',
    'Vivienne Ashcroft',
    42,
    'woman',
    'Equestrian & Show-Jumping Heiress',
    'Wellington, FL',
    'Wintering in Wellington with four Dutch warmbloods and summering wherever the champagne is chilled properly. I ride Grand Prix courses by morning and expect impeccable table manners by dusk.',
    ARRAY[
        'Her favorite horse has a larger travel budget than most tech startups',
        'Will silently evaluate your footwear within four seconds of meeting',
        'Considers economy boarding a mild human rights violation'
    ],
    ARRAY[
        'Private Palm Beach pool cabanas and box seats at every show',
        'Sharp dry wit once she decides you are actually worth her time',
        'Effortlessly poised in riding boots or evening silk'
    ],
    'How to impress me on date one:',
    'Pick a quiet table, skip the bragging, and appreciate a woman who knows her own mind.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="37" fill="#f7dcc8"/><path d="M62 80 Q100 34 138 80 Q135 120 100 118 Q65 120 62 80 Z" fill="#291d18"/><path d="M50 172 Q100 134 150 172 Z" fill="#065f46"/></svg>',
    '/profiles/vivienne-ashcroft.jpg',
    ARRAY['/profiles/vivienne-ashcroft-2.jpg', '/profiles/vivienne-ashcroft-3.jpg'],
    46
),
(
    'colt-maddox',
    'Colt Maddox',
    38,
    'man',
    'Cattle Rancher & Rodeo Cowboy',
    'Cheyenne, WY',
    'Running 900 head of black Angus outside Cheyenne and still dumb enough to enter weekend saddle bronc jackpots. Built broad, loyal to the bone, and looking for somebody who likes big skies and bonfire smoke.',
    ARRAY[
        'Leaves dusty boots right beside the front door no matter how often asked',
        'Refers to two-hour drives across Wyoming as "just down the road"',
        'Owns more belt buckles than dress shirts'
    ],
    ARRAY[
        'Fixes anything with baling wire, grease, and zero complaining',
        'Grills a ribeye that puts steakhouse chefs to shame',
        'Opens every door and keeps his word every single time'
    ],
    'You should swipe right if:',
    'You love reservoir sunsets, tailgates, and a man who is not afraid of hard work.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="90" r="38" fill="#ecc19c"/><path d="M54 74 Q100 44 146 74 L162 82 L38 82 Z" fill="#b48a5a"/><path d="M68 58 Q100 34 132 58 Z" fill="#926c40"/><path d="M48 172 Q100 134 152 172 Z" fill="#374151"/></svg>',
    '/profiles/colt-maddox.jpg',
    ARRAY['/profiles/colt-maddox-2.jpg', '/profiles/colt-maddox-3.jpg'],
    47
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
