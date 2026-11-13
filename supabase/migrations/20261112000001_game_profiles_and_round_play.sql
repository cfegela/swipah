-- Migration: 20261112000001_game_profiles_and_round_play.sql
-- 1. Catalog Profiles Table
CREATE TABLE IF NOT EXISTS public.catalog_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    age INT NOT NULL,
    occupation TEXT NOT NULL,
    location TEXT NOT NULL,
    bio TEXT NOT NULL,
    red_flags TEXT[] NOT NULL DEFAULT '{}',
    green_flags TEXT[] NOT NULL DEFAULT '{}',
    prompt_question TEXT NOT NULL,
    prompt_answer TEXT NOT NULL,
    avatar_svg TEXT NOT NULL,
    order_idx INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalog_profiles_order ON public.catalog_profiles(order_idx);

-- 2. Game Round Profiles Table (10 profiles per round for room)
CREATE TABLE IF NOT EXISTS public.game_round_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    profile_id UUID NOT NULL REFERENCES public.catalog_profiles(id) ON DELETE CASCADE,
    position INT NOT NULL CHECK (position >= 1 AND position <= 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_room_round_profile UNIQUE (room_id, round_number, profile_id),
    CONSTRAINT uq_room_round_position UNIQUE (room_id, round_number, position)
);

CREATE INDEX IF NOT EXISTS idx_game_round_profiles_lookup ON public.game_round_profiles(room_id, round_number);

-- 3. Player Round Secret Matches (3 secret matches per player per round)
CREATE TABLE IF NOT EXISTS public.player_round_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.catalog_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_player_secret_match UNIQUE (room_id, round_number, user_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_player_round_matches ON public.player_round_matches(room_id, round_number, user_id);

-- 4. Player Profile Likes Table (Max 3 likes per player per round)
CREATE TABLE IF NOT EXISTS public.player_profile_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.catalog_profiles(id) ON DELETE CASCADE,
    is_match BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_player_profile_like UNIQUE (room_id, round_number, user_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_player_profile_likes ON public.player_profile_likes(room_id, round_number, user_id);

-- 5. Alter room_players to track likes and completion
ALTER TABLE public.room_players
ADD COLUMN IF NOT EXISTS likes_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS matches_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS round_completed BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS
ALTER TABLE public.catalog_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_round_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_round_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_profile_likes ENABLE ROW LEVEL SECURITY;

-- Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_round_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_profile_likes;

-- RLS Policies
CREATE POLICY "Anyone authenticated can view catalog profiles"
    ON public.catalog_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Anyone authenticated can view game round profiles"
    ON public.game_round_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can view their own secret matches"
    ON public.player_round_matches FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view room player likes"
    ON public.player_profile_likes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own likes"
    ON public.player_profile_likes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Seed 20 Catalog Profiles
INSERT INTO public.catalog_profiles (slug, name, age, occupation, location, bio, red_flags, green_flags, prompt_question, prompt_answer, avatar_svg, order_idx)
VALUES
(
    'chad-thunderclout',
    'Chad Thunderclout',
    24,
    'Fitness Influencer & Day Trader',
    'Gym Mirror #4',
    'CEO of waking up at 4am. If you can not handle me at my bulk, you do not deserve me at my cut. Let us optimize our synergy.',
    ARRAY['Calls sparkling water "spicy water"', 'Takes creatine directly from tub', 'Lists podcast appearances in bio'],
    ARRAY['Knows macros of every fast food item', 'Carries all grocery bags in one trip'],
    'My most controversial opinion',
    'Leg day is optional if your upper body is wide enough to block doorways.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#b8281b"/><stop offset="100%" stop-color="#fb5107"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="85" r="38" fill="#e0a98b"/><path d="M62 80 Q100 50 138 80 L138 68 Q100 42 62 68 Z" fill="#ffd700"/><rect x="68" y="70" width="64" height="10" rx="4" fill="#fb5107"/><ellipse cx="88" cy="88" rx="4" ry="5" fill="#000"/><ellipse cx="112" cy="88" rx="4" ry="5" fill="#000"/><path d="M92 105 Q100 112 108 105" stroke="#000" stroke-width="3" fill="none"/><path d="M50 170 Q100 130 150 170 Z" fill="url(#g1)"/><rect x="35" y="145" width="20" height="8" rx="3" fill="#888"/><rect x="42" y="137" width="6" height="24" rx="2" fill="#555"/></svg>',
    1
  ),
(
    'luna-starweaver',
    'Luna Starweaver',
    22,
    'Astrologer & Tarot Influencer',
    'In Retrograde',
    'Gemini sun, Scorpio rising, Chaos moon. Do not message me if your Mercury is wonky. Crystals charged under the blood moon.',
    ARRAY['Blames speeding tickets on Jupiter', 'Burns sage in Uber rides', 'Has 47 unorganized tarot decks'],
    ARRAY['Can predict your ex downfall', 'Bakes amazing vegan banana bread'],
    'A non-negotiable for me',
    'You must provide your birth certificate and exact birth minute on the first date.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7a0c23"/><stop offset="100%" stop-color="#991032"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="85" r="38" fill="#f5cbb7"/><path d="M60 85 Q100 35 140 85 Q145 130 135 150 Q100 120 65 150 Z" fill="#4a154b"/><ellipse cx="88" cy="85" rx="4" ry="4" fill="#2d132c"/><ellipse cx="112" cy="85" rx="4" ry="4" fill="#2d132c"/><path d="M93 102 Q100 108 107 102" stroke="#7a0c23" stroke-width="3" fill="none"/><path d="M55 170 Q100 135 145 170 Z" fill="url(#g2)"/><path d="M100 50 L103 58 L111 60 L105 66 L107 74 L100 70 L93 74 L95 66 L89 60 L97 58 Z" fill="#ffd700"/></svg>',
    2
  ),
(
    'brad-hedge-sterling',
    'Brad Sterling',
    31,
    'Private Equity Associate',
    'Hamptons via Heli',
    'Work hard, leverage harder. Patagonia vest collector. Looking for someone to synergize my portfolio and attend charity galas.',
    ARRAY['Mentions EBITDA on date one', 'Refuses carbs after 3 PM', 'Unironically quotes Gordon Gekko'],
    ARRAY['Expense account pays for dinner', 'Has Centurion Lounge access'],
    'I geek out on',
    'Leveraged buyouts of mid-sized commercial HVAC distribution companies.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#334155"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="82" r="36" fill="#e8beac"/><path d="M64 75 Q100 45 136 75 L136 60 Q95 38 64 60 Z" fill="#4a2e18"/><ellipse cx="88" cy="82" rx="4" ry="4" fill="#000"/><ellipse cx="112" cy="82" rx="4" ry="4" fill="#000"/><path d="M94 98 Q100 102 106 98" stroke="#000" stroke-width="2.5" fill="none"/><path d="M52 170 Q100 130 148 170 Z" fill="#ffffff"/><path d="M70 140 L88 170 L112 170 L130 140 Q100 130 70 140 Z" fill="url(#g3)"/><polygon points="100,140 96,165 104,165" fill="#fb5107"/></svg>',
    3
  ),
(
    'jax-nova',
    'Jax Nova',
    27,
    'Soundcloud Trap DJ',
    'Basement Studio',
    'Drop dropping soon. Pioneering post-industrial ambient trap dubstep. Looking for a muse or someone with aux cord privileges.',
    ARRAY['Wears sunglasses indoors at 2am', 'Paid $800 for ripped jeans', 'DMs Spotify link in first message'],
    ARRAY['Free guest list to warehouse raves', 'Elite playlist curation'],
    'Together, we could',
    'Mix an 8-hour set while ignoring all mutual red flags.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#b8281b"/><stop offset="100%" stop-color="#7a0c23"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="85" r="37" fill="#c68662"/><path d="M60 80 Q100 40 140 80 Z" fill="#1a1a1a"/><rect x="68" y="78" width="64" height="16" rx="4" fill="#111"/><ellipse cx="84" cy="86" rx="10" ry="6" fill="#fb5107"/><ellipse cx="116" cy="86" rx="10" ry="6" fill="#fb5107"/><path d="M55 70 Q100 30 145 70" stroke="#fb5107" stroke-width="8" fill="none"/><rect x="48" y="68" width="14" height="26" rx="6" fill="#fb5107"/><rect x="138" y="68" width="14" height="26" rx="6" fill="#fb5107"/><path d="M50 170 Q100 135 150 170 Z" fill="url(#g4)"/></svg>',
    4
  ),
(
    'chloe-matcha',
    'Chloe Matcha',
    25,
    'Matcha Reviewer & Aesthetician',
    'Aesthetic Cafe',
    'Living for candid photo dumps, oat milk lattes, and minimalist beige aesthetics. 2.4k followers and climbing.',
    ARRAY['Food must get cold while photographed', 'Every outfit must be beige', 'Says "I did a thing" weekly'],
    ARRAY['Takes incredible portrait photos of you', 'Always carries 2 portable powerbanks'],
    'The secret to my heart',
    'Ordering ceremonial grade matcha whisked exclusively clockwise.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#a3b18a"/><stop offset="100%" stop-color="#588157"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="88" r="36" fill="#fad2cf"/><path d="M60 85 Q100 35 140 85 Q145 140 130 160 Q100 135 70 160 Z" fill="#b08968"/><ellipse cx="60" cy="65" rx="30" ry="12" fill="#588157" transform="rotate(-15 60 65)"/><ellipse cx="88" cy="88" rx="4" ry="4" fill="#2d132c"/><ellipse cx="112" cy="88" rx="4" ry="4" fill="#2d132c"/><circle cx="80" cy="98" r="6" fill="#ffb4a2" opacity="0.6"/><circle cx="120" cy="98" r="6" fill="#ffb4a2" opacity="0.6"/><path d="M94 104 Q100 108 106 104" stroke="#7a0c23" stroke-width="2.5" fill="none"/><path d="M52 170 Q100 138 148 170 Z" fill="url(#g5)"/></svg>',
    5
  ),
(
    'brody-brogrammer',
    'Brody Brogrammer',
    29,
    '10x Full Stack AI Architect',
    'Standing Desk #12',
    'I prompt LLMs so you do not have to. Built 14 SaaS startups this weekend. Arch Linux user. Looking for someone to optimize my dopamine receptors.',
    ARRAY['Explains recursion unprompted', 'Wears company swag hoodie to formal dinner', 'Tracks date metrics in Notion'],
    ARRAY['Automated entire job, free all day', 'Fixes broken WiFi in 4 seconds flat'],
    'I will know it is love when',
    'Our Git merge conflicts resolve cleanly on the very first try.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#222954"/><stop offset="100%" stop-color="#0a0e2a"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="85" r="37" fill="#f2c8a0"/><path d="M63 80 Q100 45 137 80 L137 65 Q100 40 63 65 Z" fill="#2b2d42"/><rect x="72" y="76" width="24" height="18" rx="3" fill="none" stroke="#fb5107" stroke-width="3"/><rect x="104" y="76" width="24" height="18" rx="3" fill="none" stroke="#fb5107" stroke-width="3"/><line x1="96" y1="85" x2="104" y2="85" stroke="#fb5107" stroke-width="3"/><ellipse cx="84" cy="85" rx="3" ry="3" fill="#000"/><ellipse cx="116" cy="85" rx="3" ry="3" fill="#000"/><path d="M94 104 Q100 108 106 104" stroke="#000" stroke-width="2.5" fill="none"/><path d="M50 170 Q100 132 150 170 Z" fill="url(#g6)"/><text x="92" y="160" fill="#4ade80" font-size="12" font-family="monospace">&lt;/&gt;</text></svg>',
    6
  ),
(
    'daisy-wanderlust',
    'Daisy Wanderlust',
    26,
    'Digital Nomad & Backpacker',
    'Boarding Gate 4B',
    'Passport stamped 52 times. Home is wherever my backpack lands. Looking for someone to split an Airbnb in Bali for 3 days.',
    ARRAY['Never stays anywhere over 72 hours', 'Expects you to quit your job to climb mountains', 'Lost 6 passports'],
    ARRAY['Knows hidden street food gems globally', 'Physically immune to jetlag'],
    'My bucket list',
    'Sleep in an igloo, dive with bull sharks, and find decent WiFi in the Sahara desert.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g7" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#d97706"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="90" r="36" fill="#fad2cf"/><path d="M55 85 Q100 40 145 85 Q145 130 135 155 Q100 130 65 155 Z" fill="#936639"/><ellipse cx="100" cy="65" rx="55" ry="14" fill="#e9c46a"/><path d="M75 65 Q100 45 125 65 Z" fill="#d4a373"/><ellipse cx="88" cy="90" rx="4" ry="4" fill="#000"/><ellipse cx="112" cy="90" rx="4" ry="4" fill="#000"/><path d="M93 105 Q100 112 107 105" stroke="#7a0c23" stroke-width="2.5" fill="none"/><path d="M52 170 Q100 138 148 170 Z" fill="url(#g7)"/></svg>',
    7
  ),
(
    'tyler-alpha-vance',
    'Tyler Vance',
    28,
    'Motivational Hustle Coach',
    'Cold Plunge',
    'Sleep is a scam invented by the weak. I run 15 miles before you wake up. Monetize your hobbies. Looking for high-value synergy.',
    ARRAY['Takes ice baths during Zoom calls', 'Calls dating "romantic networking"', 'Zero chill, 24/7 hustle mentality'],
    ARRAY['Will hyper-motivate you to win', 'Wakes up early every single day'],
    'Change my mind',
    'A 30-minute podcast episode is more valuable than a 4-year college degree.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g8" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#b8281b"/><stop offset="100%" stop-color="#111827"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="85" r="37" fill="#dfa891"/><path d="M68 76 Q100 58 132 76 Z" fill="#1f2937"/><ellipse cx="88" cy="85" rx="4" ry="4" fill="#000"/><ellipse cx="112" cy="85" rx="4" ry="4" fill="#000"/><path d="M82 78 L94 80" stroke="#000" stroke-width="2.5"/><path d="M118 80 L106 78" stroke="#000" stroke-width="2.5"/><path d="M92 104 Q100 108 108 104" stroke="#000" stroke-width="3" fill="none"/><path d="M50 170 Q100 132 150 170 Z" fill="url(#g8)"/><circle cx="75" cy="72" r="3" fill="#38bdf8"/></svg>',
    8
  ),
(
    'penelope-sourdough-green',
    'Penelope Green',
    28,
    'Urban Homesteader & Plant Mom',
    'Fire Escape Greenhouse',
    'Mother to 64 houseplants and a 5-year sourdough starter named Bartholomew. I ferment everything. Looking for someone to water the ficus.',
    ARRAY['Talks to plants in public', 'Ferments things that smell like gym socks', 'Judges your municipal tap water'],
    ARRAY['Endless fresh artisan sourdough & kombucha', 'Apartment smells like eucalyptus'],
    'I value',
    'Heritage seed varieties, rich compost quality, and unbleached stoneground flour.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g9" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2d6a4f"/><stop offset="100%" stop-color="#1b4332"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="90" r="36" fill="#fad2cf"/><circle cx="100" cy="50" r="18" fill="#bc6c25"/><path d="M60 88 Q100 55 140 88 Q140 130 130 150 Q100 130 70 150 Z" fill="#bc6c25"/><ellipse cx="88" cy="90" rx="4" ry="4" fill="#000"/><ellipse cx="112" cy="90" rx="4" ry="4" fill="#000"/><path d="M93 105 Q100 110 107 105" stroke="#7a0c23" stroke-width="2.5" fill="none"/><path d="M52 170 Q100 138 148 170 Z" fill="url(#g9)"/><path d="M125 70 Q145 60 140 80 Q130 85 125 70 Z" fill="#52b788"/></svg>',
    9
  ),
(
    'hunter-wilderness',
    'Hunter Wilderness',
    30,
    'Survivalist & Bushcrafter',
    'Pine Forest',
    'If civilization collapses tomorrow, I have 40 pounds of jerky and a solar radio. Can skin a deer in 10 minutes. Bear spray certified.',
    ARRAY['Owns 17 tactical survival knives', 'Refuses to sleep indoors on weekends', 'Builds shelters out of mud for fun'],
    ARRAY['Can start roaring campfire in pouring rain', 'Absolute zero fear of spiders'],
    'Survival skill I am proud of',
    'Accurately identifying all poisonous wild berries by scent and texture alone.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g10" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#414833"/><stop offset="100%" stop-color="#333d29"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="85" r="37" fill="#dfa891"/><path d="M62 70 Q100 40 138 70 L138 60 Q100 35 62 60 Z" fill="#656d4a"/><ellipse cx="100" cy="58" rx="38" ry="14" fill="#333d29"/><path d="M70 95 Q100 135 130 95 Q135 125 100 135 Q65 125 70 95 Z" fill="#582f0e"/><ellipse cx="88" cy="82" rx="4" ry="4" fill="#000"/><ellipse cx="112" cy="82" rx="4" ry="4" fill="#000"/><path d="M50 170 Q100 132 150 170 Z" fill="url(#g10)"/></svg>',
    10
  ),
(
    'gemma-vintage',
    'Gemma Vintage',
    24,
    'Thrifting Queen & Depop Seller',
    'Flea Market Stall 8',
    'Y2K aesthetics only. That jacket you are wearing is definitely not original 1998. Looking for someone to hold bags at the swap meet.',
    ARRAY['Rips tags off clothes to date the stitch', 'Charges $140 for stained vintage tee', 'Refuses to buy anything made post-2003'],
    ARRAY['Will style you into a runway model', 'Unbelievable bargain hunter'],
    'My toxic trait',
    'Buying oversized leather trench coats that I will realistically never wear.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g11" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f72585"/><stop offset="100%" stop-color="#7209b7"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="88" r="36" fill="#fad2cf"/><path d="M60 82 Q100 40 140 82 Q145 130 130 155 Q100 130 70 155 Z" fill="#ffb703"/><rect x="74" y="80" width="22" height="12" rx="3" fill="#f72585" opacity="0.8"/><rect x="104" y="80" width="22" height="12" rx="3" fill="#f72585" opacity="0.8"/><ellipse cx="85" cy="86" rx="3" ry="3" fill="#000"/><ellipse cx="115" cy="86" rx="3" ry="3" fill="#000"/><path d="M94 104 Q100 108 106 104" stroke="#7a0c23" stroke-width="2.5" fill="none"/><path d="M52 170 Q100 138 148 170 Z" fill="url(#g11)"/></svg>',
    11
  ),
(
    'maverick-skater',
    'Maverick Skater',
    23,
    'Sidewalk Menace & Skater',
    'Skatepark Ledge',
    'Skate or cry. Currently nursing 3 sprained ankles. Looking for someone who does not mind watching me fail kickflips for 4 hours.',
    ARRAY['Skateboards through grocery aisles', 'Shoes held together by duct tape', 'Has chipped the same tooth twice'],
    ARRAY['Incredible balance and resilience', 'Does not take life too seriously'],
    'Best date idea',
    'Sharing a two-dollar slice of pizza on the sidewalk curb at midnight.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g12" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3a0ca3"/><stop offset="100%" stop-color="#4361ee"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="85" r="37" fill="#f0c294"/><ellipse cx="100" cy="62" rx="40" ry="14" fill="#b8281b"/><path d="M60 62 Q100 45 140 62 Z" fill="#7a0c23"/><ellipse cx="88" cy="85" rx="4" ry="4" fill="#000"/><ellipse cx="112" cy="85" rx="4" ry="4" fill="#000"/><rect x="80" y="96" width="14" height="6" rx="2" fill="#e9d8a6" transform="rotate(-15 87 99)"/><path d="M93 105 Q100 110 107 105" stroke="#000" stroke-width="2.5" fill="none"/><path d="M50 170 Q100 132 150 170 Z" fill="url(#g12)"/></svg>',
    12
  ),
(
    'dr-arthur-bibliophile',
    'Dr. Arthur Bibliophile',
    34,
    'Tenure-Track Literature Professor',
    'Library Stacks',
    'Books over humans. Smells faintly of old parchment and Earl Grey. Looking for someone to debate 19th-century post-structuralism with.',
    ARRAY['Corrects your grammar mid-argument', 'Overdue library fines in 3 states', 'Quotes obscure essays in casual chats'],
    ARRAY['Mesmerizing storytelling ability', 'Genuinely attentive listener'],
    'A life goal of mine',
    'Finish reading Infinite Jest cover-to-cover without falling asleep.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g13" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#582f0e"/><stop offset="100%" stop-color="#7f4f24"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="85" r="36" fill="#e8c2a5"/><path d="M65 72 Q100 45 135 72 L135 60 Q100 38 65 60 Z" fill="#6c757d"/><circle cx="85" cy="84" r="10" fill="none" stroke="#d4af37" stroke-width="2.5"/><circle cx="115" cy="84" r="10" fill="none" stroke="#d4af37" stroke-width="2.5"/><line x1="95" y1="84" x2="105" y2="84" stroke="#d4af37" stroke-width="2.5"/><ellipse cx="85" cy="84" rx="3" ry="3" fill="#000"/><ellipse cx="115" cy="84" rx="3" ry="3" fill="#000"/><path d="M94 102 Q100 106 106 102" stroke="#000" stroke-width="2" fill="none"/><path d="M52 170 Q100 134 148 170 Z" fill="url(#g13)"/><polygon points="100,138 97,168 103,168" fill="#7a0c23"/></svg>',
    13
  ),
(
    'tiffany-sparkle',
    'Tiffany Sparkle',
    27,
    'Reality TV Addict & Influencer',
    'Rooftop Mimosa Lounge',
    'Bottomless mimosas, Bravo network drama, and matching loungewear. If we can not dissect reality TV gossip for 3 hours, it will not work.',
    ARRAY['Records TikToks during movies', 'Considers brunch a 6-hour endurance sport', 'Treats celebrity rumors as breaking news'],
    ARRAY['Unmatched restaurant recommendations', 'Life of every single party'],
    'The real key to my heart',
    'A spicy passionfruit margarita and VIP passes to BravoCon.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g14" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff007f"/><stop offset="100%" stop-color="#ff758c"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="88" r="36" fill="#fad2cf"/><path d="M58 85 Q100 35 142 85 Q145 140 132 160 Q100 135 68 160 Z" fill="#e0a96d"/><ellipse cx="84" cy="85" rx="13" ry="9" fill="#111"/><ellipse cx="116" cy="85" rx="13" ry="9" fill="#111"/><path d="M93 105 Q100 112 107 105" stroke="#ff007f" stroke-width="3" fill="none"/><path d="M52 170 Q100 138 148 170 Z" fill="url(#g14)"/><circle cx="130" cy="65" r="4" fill="#ffd700"/><circle cx="70" cy="60" r="3" fill="#ffd700"/></svg>',
    14
  ),
(
    'zack-crypto-mooner',
    'Zack Mooner',
    26,
    'Web3 Evangelist & NFT HODLer',
    'The Metaverse',
    'Down 94% all-time but still HODLing strong. We are still early. Bought my avatar for 4 ETH. Looking for someone to moon with.',
    ARRAY['Explains smart contracts to waitstaff', 'Checks coin charts while driving', 'Profile pic is an 8-bit ape'],
    ARRAY['Unshakeable eternal optimism', 'Always tips service staff in Bitcoin'],
    'My biggest flex',
    'Never selling the dip (because I lost my physical hardware seed phrase).',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g15" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#4cc9f0"/><stop offset="100%" stop-color="#4361ee"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="85" r="37" fill="#dfa891"/><path d="M65 75 Q100 50 135 75 Z" fill="#2b2d42"/><rect x="68" y="78" width="64" height="15" rx="2" fill="#000"/><text x="75" y="90" fill="#4ade80" font-size="10" font-family="monospace">HODL</text><path d="M94 104 Q100 108 106 104" stroke="#000" stroke-width="2.5" fill="none"/><path d="M50 170 Q100 132 150 170 Z" fill="url(#g15)"/><circle cx="100" cy="155" r="8" fill="#f7931a"/></svg>',
    15
  ),
(
    'sierra-eco-warrior',
    'Sierra Eco-Warrior',
    27,
    'Zero Waste Activist & Forager',
    'Bicycle Lane',
    'My trash for the last 3 years fits in a mason jar. Bicycles only. Looking for someone to forage wild mushrooms and compost together.',
    ARRAY['Inspects your trash can on date one', 'Refuses plastic straws with volcanic anger', 'Makes toothpaste out of charcoal'],
    ARRAY['Cleanest carbon footprint on Earth', 'Never wastes any food'],
    'Simple pleasures',
    'Finding a fully ripe dumpster apple and composting the core responsibly.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g16" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#386641"/><stop offset="100%" stop-color="#6a994e"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="88" r="36" fill="#f5cbb7"/><path d="M60 85 Q100 35 140 85 Q145 130 132 155 Q100 130 68 155 Z" fill="#382110"/><rect x="65" y="75" width="70" height="8" rx="4" fill="#a7c957"/><ellipse cx="88" cy="88" rx="4" ry="4" fill="#000"/><ellipse cx="112" cy="88" rx="4" ry="4" fill="#000"/><path d="M94 104 Q100 108 106 104" stroke="#7a0c23" stroke-width="2.5" fill="none"/><path d="M52 170 Q100 138 148 170 Z" fill="url(#g16)"/></svg>',
    16
  ),
(
    'chet-vanlife',
    'Chet VanLife',
    29,
    'Rust Bucket Nomad',
    'Walmart Parking Lot',
    'Converted a 1994 Dodge Ram van into a 32-sq-ft palace with fairy lights and cedar planks. Looking for a co-pilot with strong knees.',
    ARRAY['Shower status is complicated', 'Engine sounds like a dying jet engine', 'Subsists entirely on canned pinto beans'],
    ARRAY['Camps anywhere with ocean views for free', 'Extremely handy with a socket wrench'],
    'My golden rule',
    'Never park under eucalyptus trees when the forecast calls for rain.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g17" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#bc6c25"/><stop offset="100%" stop-color="#dda15e"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="85" r="37" fill="#dfa891"/><ellipse cx="100" cy="55" rx="36" ry="14" fill="#d62828"/><ellipse cx="88" cy="85" rx="4" ry="4" fill="#000"/><ellipse cx="112" cy="85" rx="4" ry="4" fill="#000"/><path d="M72 100 Q100 135 128 100 Q130 120 100 130 Q70 120 72 100 Z" fill="#6f4e37"/><path d="M50 170 Q100 132 150 170 Z" fill="url(#g17)"/></svg>',
    17
  ),
(
    'bella-cinephile',
    'Bella Cinephile',
    25,
    'Criterion Collection Devotee',
    'Art House Cinema',
    'Blockbuster movies are visual junk food. 35mm French New Wave cinema is true art. Looking for someone who will not talk during foreign films.',
    ARRAY['Sighs audibly if you enjoy superhero movies', 'Owns 40 identical black turtlenecks', 'Ranked 3,000 films on Letterboxd'],
    ARRAY['Always gets center sweet-spot theater seats', 'Deeply passionate conversationalist'],
    'Do not hate me if I',
    'Cry during a 14-minute subtitled black and white scene about cutting bread.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g18" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#111111"/><stop offset="100%" stop-color="#2b2d42"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="88" r="36" fill="#f8edeb"/><path d="M60 85 Q100 35 140 85 Q145 130 132 155 Q100 130 68 155 Z" fill="#111111"/><ellipse cx="90" cy="62" rx="35" ry="12" fill="#e63946" transform="rotate(-15 90 62)"/><ellipse cx="88" cy="88" rx="4" ry="4" fill="#000"/><ellipse cx="112" cy="88" rx="4" ry="4" fill="#000"/><path d="M94 104 Q100 108 106 104" stroke="#e63946" stroke-width="3" fill="none"/><path d="M52 170 Q100 138 148 170 Z" fill="url(#g18)"/><rect x="90" y="138" width="20" height="15" fill="#111111"/></svg>',
    18
  ),
(
    'rex-iron-callahan',
    'Rex Callahan',
    32,
    'Strongman & Carnivore Purist',
    'Butcher Shop Counter',
    'Carnivore diet strictly. I deadlift 600 lbs and sleep 10 hours. Looking for someone to spot my bench press and eat ribeyes.',
    ARRAY['Brings cooked steaks in plastic bags to bars', 'Broken 3 chairs by sitting down too hard', 'Vegetables are a foreign concept'],
    ARRAY['Can open any stuck pickle jar in 0.5s', 'Extremely loyal and protective'],
    'My personal motto',
    'Heavy iron, raw honey, and zero excuses.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g19" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7a0c23"/><stop offset="100%" stop-color="#b8281b"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="85" r="39" fill="#dfa891"/><path d="M62 72 Q100 50 138 72 Z" fill="#2d132c"/><ellipse cx="86" cy="84" rx="4" ry="4" fill="#000"/><ellipse cx="114" cy="84" rx="4" ry="4" fill="#000"/><path d="M68 94 Q100 140 132 94 Q136 126 100 138 Q64 126 68 94 Z" fill="#2d132c"/><path d="M48 170 Q100 128 152 170 Z" fill="url(#g19)"/></svg>',
    19
  ),
(
    'zara-neon',
    'Zara Neon',
    24,
    'Cyberpunk Cosplayer & Streamer',
    'Twitch Livestream',
    'Level 100 Mage. Mechanical keyboard enthusiast. Looking for Player 2 to carry in Ranked queues and build Gundam models with.',
    ARRAY['Screams at monitors at 3am', 'RGB light strips in every room including shower', 'Subs before duds'],
    ARRAY['Insane gaming setup and reflexes', 'Crafts museum-grade EVA foam armor'],
    'A secret talent',
    'Executing S-tier fighting game combos while eating extra spicy ramen.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g20" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#06d6a0"/><stop offset="100%" stop-color="#118ab2"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="100" r="75" fill="#141a45"/><circle cx="100" cy="88" r="36" fill="#f8edeb"/><path d="M58 85 Q100 30 142 85 Q145 135 130 155 Q100 125 70 155 Z" fill="#ff007f"/><path d="M55 70 Q100 35 145 70" stroke="#06d6a0" stroke-width="7" fill="none"/><polygon points="68,60 78,40 88,60" fill="#06d6a0"/><polygon points="112,60 122,40 132,60" fill="#06d6a0"/><ellipse cx="88" cy="88" rx="4" ry="4" fill="#06d6a0"/><ellipse cx="112" cy="88" rx="4" ry="4" fill="#06d6a0"/><path d="M94 104 Q100 108 106 104" stroke="#ff007f" stroke-width="2.5" fill="none"/><path d="M52 170 Q100 138 148 170 Z" fill="url(#g20)"/></svg>',
    20
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  age = EXCLUDED.age,
  occupation = EXCLUDED.occupation,
  location = EXCLUDED.location,
  bio = EXCLUDED.bio,
  red_flags = EXCLUDED.red_flags,
  green_flags = EXCLUDED.green_flags,
  prompt_question = EXCLUDED.prompt_question,
  prompt_answer = EXCLUDED.prompt_answer,
  avatar_svg = EXCLUDED.avatar_svg,
  order_idx = EXCLUDED.order_idx;

-- 6. Helper Function: Seed Round Profiles and Secret Matches
CREATE OR REPLACE FUNCTION public.seed_round_data(p_room_id UUID, p_round_number INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_profile_rec RECORD;
    v_pos INT := 1;
    v_player_rec RECORD;
    v_offset INT;
BEGIN
    -- Determine 10 profiles based on round (Round 1: 1..10, Round 2: 11..20, etc.)
    v_offset := ((p_round_number - 1) * 10) % 20;

    -- Insert 10 profiles into game_round_profiles
    FOR v_profile_rec IN (
        SELECT id FROM public.catalog_profiles
        ORDER BY ((order_idx - 1 - v_offset + 20) % 20) ASC
        LIMIT 10
    ) LOOP
        INSERT INTO public.game_round_profiles (room_id, round_number, profile_id, position)
        VALUES (p_room_id, p_round_number, v_profile_rec.id, v_pos)
        ON CONFLICT (room_id, round_number, profile_id) DO NOTHING;
        v_pos := v_pos + 1;
    END LOOP;

    -- For each player in room, randomly assign 3 distinct profiles as secret matches
    FOR v_player_rec IN (
        SELECT user_id FROM public.room_players WHERE room_id = p_room_id
    ) LOOP
        INSERT INTO public.player_round_matches (room_id, round_number, user_id, profile_id)
        SELECT p_room_id, p_round_number, v_player_rec.user_id, grp.profile_id
        FROM public.game_round_profiles grp
        WHERE grp.room_id = p_room_id AND grp.round_number = p_round_number
        ORDER BY random()
        LIMIT 3
        ON CONFLICT (room_id, round_number, user_id, profile_id) DO NOTHING;
    END LOOP;
END;
$$;


-- 7. Update start_game RPC to seed Round 1 profiles and matches
CREATE OR REPLACE FUNCTION public.start_game(p_room_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room public.rooms%ROWTYPE;
    v_player_count INT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_room
    FROM public.rooms
    WHERE id = p_room_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room not found';
    END IF;

    IF v_room.host_id != v_user_id THEN
        RAISE EXCEPTION 'Only the host can start the game';
    END IF;

    IF v_room.status != 'waiting' THEN
        RAISE EXCEPTION 'Game is already %', v_room.status;
    END IF;

    SELECT COUNT(*) INTO v_player_count
    FROM public.room_players
    WHERE room_id = p_room_id;

    IF v_player_count < 1 THEN
        RAISE EXCEPTION 'At least 1 player is required to start the game';
    END IF;

    -- Update room to in_progress with Round 1
    UPDATE public.rooms
    SET status = 'in_progress',
        current_turn_seat = 1,
        current_round = 1,
        updated_at = now()
    WHERE id = p_room_id
    RETURNING * INTO v_room;

    -- Reset all player stats for fresh match
    UPDATE public.room_players
    SET likes_count = 0,
        matches_count = 0,
        round_completed = false
    WHERE room_id = p_room_id;

    -- Seed 10 profiles and 3 secret matches per player for Round 1
    PERFORM public.seed_round_data(p_room_id, 1);

    RETURN json_build_object(
        'success', true,
        'room', row_to_json(v_room)
    );
END;
$$;


-- 8. Stored Procedure: Submit Like
CREATE OR REPLACE FUNCTION public.submit_like(p_room_id UUID, p_profile_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room public.rooms%ROWTYPE;
    v_player public.room_players%ROWTYPE;
    v_is_match BOOLEAN := false;
    v_likes_count INT;
    v_uncompleted_count INT;
    v_round_advanced BOOLEAN := false;
    v_next_round INT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Lock room
    SELECT * INTO v_room
    FROM public.rooms
    WHERE id = p_room_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room not found';
    END IF;

    IF v_room.status != 'in_progress' THEN
        RAISE EXCEPTION 'Game is not in progress';
    END IF;

    -- Lock player row
    SELECT * INTO v_player
    FROM public.room_players
    WHERE room_id = p_room_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Player not in room';
    END IF;

    IF v_player.round_completed OR v_player.likes_count >= 3 THEN
        RAISE EXCEPTION 'You have already liked 3 profiles this round.';
    END IF;

    -- Check if already liked this profile in this round
    IF EXISTS (
        SELECT 1 FROM public.player_profile_likes
        WHERE room_id = p_room_id
          AND round_number = v_room.current_round
          AND user_id = v_user_id
          AND profile_id = p_profile_id
    ) THEN
        RAISE EXCEPTION 'You have already liked this profile.';
    END IF;

    -- Check if this profile is one of the 3 secret matches for this player
    IF EXISTS (
        SELECT 1 FROM public.player_round_matches
        WHERE room_id = p_room_id
          AND round_number = v_room.current_round
          AND user_id = v_user_id
          AND profile_id = p_profile_id
    ) THEN
        v_is_match := true;
    END IF;

    -- Record like
    INSERT INTO public.player_profile_likes (room_id, round_number, user_id, profile_id, is_match)
    VALUES (p_room_id, v_room.current_round, v_user_id, p_profile_id, v_is_match);

    -- Update player stats
    UPDATE public.room_players
    SET likes_count = likes_count + 1,
        matches_count = CASE WHEN v_is_match THEN matches_count + 1 ELSE matches_count END,
        round_completed = (likes_count + 1 >= 3)
    WHERE id = v_player.id
    RETURNING * INTO v_player;

    -- Check if all players in the room have completed the round
    SELECT COUNT(*) INTO v_uncompleted_count
    FROM public.room_players
    WHERE room_id = p_room_id AND round_completed = false;

    IF v_uncompleted_count = 0 THEN
        -- Immediately advance to next round!
        v_next_round := v_room.current_round + 1;

        UPDATE public.rooms
        SET current_round = v_next_round,
            updated_at = now()
        WHERE id = p_room_id
        RETURNING * INTO v_room;

        -- Reset all players for the new round
        UPDATE public.room_players
        SET likes_count = 0,
            round_completed = false
        WHERE room_id = p_room_id;

        -- Seed profiles and secret matches for the new round
        PERFORM public.seed_round_data(p_room_id, v_next_round);

        v_round_advanced := true;
    END IF;

    RETURN json_build_object(
        'success', true,
        'is_match', v_is_match,
        'likes_count', v_player.likes_count,
        'matches_count', v_player.matches_count,
        'round_completed', v_player.round_completed,
        'round_advanced', v_round_advanced,
        'current_round', v_room.current_round
    );
END;
$$;


-- 9. Stored Procedure: Fetch Round Game State
CREATE OR REPLACE FUNCTION public.fetch_game_round_state(p_room_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room public.rooms%ROWTYPE;
    v_players json;
    v_profiles json;
    v_my_likes json;
BEGIN
    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room not found';
    END IF;

    SELECT json_agg(p ORDER BY p.seat_number ASC) INTO v_players
    FROM public.room_players p
    WHERE p.room_id = p_room_id;

    -- Fetch the 10 profiles for the current round
    SELECT json_agg(
        json_build_object(
            'id', cp.id,
            'slug', cp.slug,
            'name', cp.name,
            'age', cp.age,
            'occupation', cp.occupation,
            'location', cp.location,
            'bio', cp.bio,
            'red_flags', cp.red_flags,
            'green_flags', cp.green_flags,
            'prompt_question', cp.prompt_question,
            'prompt_answer', cp.prompt_answer,
            'avatar_svg', cp.avatar_svg,
            'position', grp.position
        ) ORDER BY grp.position ASC
    ) INTO v_profiles
    FROM public.game_round_profiles grp
    JOIN public.catalog_profiles cp ON cp.id = grp.profile_id
    WHERE grp.room_id = p_room_id AND grp.round_number = v_room.current_round;

    -- Fetch current user likes in this round
    SELECT json_agg(
        json_build_object(
            'profile_id', ppl.profile_id,
            'is_match', ppl.is_match,
            'created_at', ppl.created_at
        )
    ) INTO v_my_likes
    FROM public.player_profile_likes ppl
    WHERE ppl.room_id = p_room_id
      AND ppl.round_number = v_room.current_round
      AND ppl.user_id = v_user_id;

    RETURN json_build_object(
        'room', row_to_json(v_room),
        'players', COALESCE(v_players, '[]'::json),
        'profiles', COALESCE(v_profiles, '[]'::json),
        'my_likes', COALESCE(v_my_likes, '[]'::json)
    );
END;
$$;
