-- Migration: 20261116000002_add_kimber_balsam_profile.sql
-- Add Kimber Balsam persona (21st female profile, 42nd catalog profile total).

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
) VALUES (
    'kimber-balsam',
    'Kimber Balsam',
    45,
    'woman',
    'Land Conservation Director & Adirondack Trail Mom',
    'Lake Placid, NY',
    '6''1" of Adirondack grit, watershed easements, and trail-mom preparedness. Protecting forever-wild forests by weekday, out-climbing you up Cascade Mountain and biking dusty fire roads by weekend.',
    ARRAY[
        'Lectures you about invasive buckthorn and trail erosion before the appetizers arrive',
        'Insists your daypack weight distribution is off halfway up the switchbacks',
        'Has an emergency minivan cooler packed with juice boxes, bear spray, and electrolyte packets'
    ],
    ARRAY[
        'Can reach the top shelf without a stepstool and never gets lost without cell service',
        'Packs homemade trail brownies, Band-Aids, and bike spare tubes for every excursion',
        'Knows every secret cold swimming cove around Cascade Lake'
    ],
    'The fastest way to win me over:',
    'Carry your own daypack up the High Peaks without complaining and leave zero trace at camp.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#eab89c"/><rect x="64" y="72" width="30" height="19" rx="4" fill="rgba(186,230,253,0.22)" stroke="#1d4ed8" stroke-width="4.5"/><rect x="106" y="72" width="30" height="19" rx="4" fill="rgba(186,230,253,0.22)" stroke="#1d4ed8" stroke-width="4.5"/><line x1="94" y1="78" x2="106" y2="78" stroke="#1d4ed8" stroke-width="4"/><path d="M50 170 Q100 130 150 170 Z" fill="#115e59"/></svg>',
    '/profiles/kimber-balsam.jpg',
    ARRAY['/profiles/kimber-balsam-2.jpg', '/profiles/kimber-balsam-3.jpg'],
    42
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
