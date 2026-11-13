-- Migration: 20261113000003_personalized_round_profiles_and_catalog_expansion.sql
-- Expand catalog to 20 Men and 20 Women (40 profiles total)
-- Implement personalized player-specific round profiles matching player looking_for preference:
-- - Players looking for Women see 10 women (0 men)
-- - Players looking for Men see 10 men (0 women)
-- - Players looking for Both see 5 men and 5 women (50/50 split)
-- - Consecutive rounds show 100% unseen personas

-- 1. Reassign order_idx for the existing 20 profiles: Men 1..11, Women 21..29
UPDATE public.catalog_profiles SET order_idx = 1 WHERE slug = 'chad-thunderclout';
UPDATE public.catalog_profiles SET order_idx = 2 WHERE slug = 'brad-hedge-sterling';
UPDATE public.catalog_profiles SET order_idx = 3 WHERE slug = 'jax-nova';
UPDATE public.catalog_profiles SET order_idx = 4 WHERE slug = 'brody-brogrammer';
UPDATE public.catalog_profiles SET order_idx = 5 WHERE slug = 'tyler-alpha-vance';
UPDATE public.catalog_profiles SET order_idx = 6 WHERE slug = 'hunter-wilderness';
UPDATE public.catalog_profiles SET order_idx = 7 WHERE slug = 'maverick-skater';
UPDATE public.catalog_profiles SET order_idx = 8 WHERE slug = 'dr-arthur-bibliophile';
UPDATE public.catalog_profiles SET order_idx = 9 WHERE slug = 'zack-crypto-mooner';
UPDATE public.catalog_profiles SET order_idx = 10 WHERE slug = 'chet-vanlife';
UPDATE public.catalog_profiles SET order_idx = 11 WHERE slug = 'rex-iron-callahan';

UPDATE public.catalog_profiles SET order_idx = 21 WHERE slug = 'luna-starweaver';
UPDATE public.catalog_profiles SET order_idx = 22 WHERE slug = 'chloe-matcha';
UPDATE public.catalog_profiles SET order_idx = 23 WHERE slug = 'daisy-wanderlust';
UPDATE public.catalog_profiles SET order_idx = 24 WHERE slug = 'penelope-sourdough-green';
UPDATE public.catalog_profiles SET order_idx = 25 WHERE slug = 'gemma-vintage';
UPDATE public.catalog_profiles SET order_idx = 26 WHERE slug = 'tiffany-sparkle';
UPDATE public.catalog_profiles SET order_idx = 27 WHERE slug = 'sierra-eco-warrior';
UPDATE public.catalog_profiles SET order_idx = 28 WHERE slug = 'bella-cinephile';
UPDATE public.catalog_profiles SET order_idx = 29 WHERE slug = 'zara-neon';

-- 2. Insert 20 New Catalog Profiles (9 Men, 11 Women)
-- Men: 1 in his 20s (Kyle, 28), 8 in their 30s (Marcus 33, Julian 35, Diego 36, Sergei 31, Garrison 37, Owen 34, Winston 38, Trent 32)
-- Women: 1 in her 20s (Fiona, 29), 10 in their 30s (Harper 32, Sabrina 34, Maya 33, Camila 31, Elena 36, Nadia 35, Beatrice 37, Violet 33, Astrid 38, Piper 35)
INSERT INTO public.catalog_profiles (
    slug, name, age, gender, occupation, location, bio, red_flags, green_flags, prompt_question, prompt_answer, avatar_svg, avatar_url, order_idx
) VALUES
-- Men Batch 2 (order_idx 12..20)
(
    'kyle-triathlete',
    'Kyle Henderson',
    28,
    'man',
    'Ironman Triathlete & Hydration Consultant',
    'Pacific Beach, CA (1.4 miles away)',
    'Cycling 65 miles before my 8:30am standup. My VO2 max is 64 and my smartwatch knows my sleep score better than my ex did.',
    ARRAY['Wears compression recovery boots on the couch during movie night', 'Calculates sodium-to-potassium ratios for restaurant cocktails', 'Refuses to walk anywhere because it wastes recovery energy'],
    ARRAY['Has boundless Saturday morning enthusiasm', 'Assembles any flat-pack furniture in record time without instructions', 'Makes incredible high-protein acai bowls'],
    'A boundary of mine:',
    'Sunday morning 5am zone 2 cycling runs, rain or shine.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#e2a789"/><rect x="68" y="72" width="64" height="12" rx="4" fill="#0284c7"/><path d="M50 170 Q100 130 150 170 Z" fill="#0369a1"/></svg>',
    '/profiles/kyle-triathlete.jpg',
    12
),
(
    'marcus-master-distiller',
    'Marcus O''Connor',
    33,
    'man',
    'Craft Bourbon Distiller & Haberdasher',
    'NuLu District, KY (2.8 miles away)',
    'Aged in charred new American oak barrels. Looking for someone who appreciates heavyweight selvedge denim, woodsmoke, and single-barrel rye.',
    ARRAY['Takes 20 minutes to order a cocktail while interrogating the bartender', 'Refuses to wear pants made with synthetic fibers', 'Has 40 different moustache grooming waxes on his bathroom shelf'],
    ARRAY['Builds a roaring campfire in torrential rain in under 3 minutes', 'Handcrafts bespoke Old Fashioneds with smoked orange bitters', 'Always smells like cedarwood and toasted vanilla'],
    'The quickest way to my heart:',
    'Appreciate a neat pour of cask-strength bourbon without wincing.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#d49b78"/><path d="M75 95 Q100 120 125 95 Z" fill="#5c2c16"/><path d="M50 170 Q100 130 150 170 Z" fill="#854d0e"/></svg>',
    '/profiles/marcus-master-distiller.jpg',
    13
),
(
    'julian-architectural-digest',
    'Julian Mercer',
    35,
    'man',
    'Interior Architect & Manual Espresso Purist',
    'DUMBO Loft, NY (0.9 miles away)',
    'If your kitchen counter has visible small appliances, do not invite me over. I hand-grind Ethiopian single-origin beans on a brass lever machine every morning.',
    ARRAY['Wears indoor slippers that cost more than your monthly rent', 'Will readjust your living room picture frames without asking', 'Refuses to drink coffee that was extracted in under 28 seconds'],
    ARRAY['Furnishes entire homes with museum-grade Scandinavian lighting', 'Brews coffee that tastes like jasmine and stone fruit nectar', 'Never wears wrinkled shirts or unpolished leather shoes'],
    'A pet peeve of mine:',
    'Overhead recessed lighting on full brightness. Dim the room, please.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#e0a98b"/><path d="M50 170 Q100 130 150 170 Z" fill="#3f3f46"/></svg>',
    '/profiles/julian-architectural-digest.jpg',
    14
),
(
    'diego-dj-restaurateur',
    'Diego Alvarez',
    36,
    'man',
    'Tapas Bar Mogul & Deep House Resident',
    'Brickell, FL (3.2 miles away)',
    'Late night Iberian jamón tastings, sunset boat rides on Biscayne Bay, and Ibiza residencies every July. Seeking my muse and permanent co-diner.',
    ARRAY['Considers 11:30 PM an "early dinner"', 'Greets every bouncer in South Beach with a kiss on both cheeks', 'Plays ambient house music in the background during breakfast'],
    ARRAY['VIP table and free cava at every venue south of Orlando', 'Incredible dancer who will actually take you out on the floor', 'Generous host who insists on cooking for everyone'],
    'Together we could:',
    'Fly to Barcelona on a Tuesday just for midnight churros.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#c68662"/><path d="M50 170 Q100 130 150 170 Z" fill="#dc2626"/></svg>',
    '/profiles/diego-dj-restaurateur.jpg',
    15
),
(
    'sergei-chess-quant',
    'Sergei Volkov',
    31,
    'man',
    'Algorithmic Trading Quant & FIDE Chess Master',
    'Exchange Place, NJ (1.1 miles away)',
    'I exploit statistical arbitrage in currency markets by day and play blitz chess in Washington Square Park by night. Blundering a bishop is my version of flirting.',
    ARRAY['Calculates probability distributions of relationship longevity on napkins', 'Has 3,000 Elo on Lichess and will not let you take back moves', 'Wears the same gray cashmere sweater 5 days a week'],
    ARRAY['Never gets flustered by unexpected flight delays or travel chaos', 'Incredible problem solver who fixes all tech and financial glitches', 'Dry, hilarious Russian humor and total loyalty'],
    'You should leave a comment if:',
    'You can name three defenses against 1. d4 without googling.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#e2a789"/><path d="M50 170 Q100 130 150 170 Z" fill="#1e3a8a"/></svg>',
    '/profiles/sergei-chess-quant.jpg',
    16
),
(
    'garrison-gearhead',
    'Garrison ''Gary'' Holt',
    37,
    'man',
    'Air-Cooled Porsche Restorer & Track Instructor',
    'Old Town, AZ (4.5 miles away)',
    'Air-cooled flat-six engines and manual transmissions only. If a vehicle doesn''t require heel-toe downshifting, it''s just an oversized appliance.',
    ARRAY['Spends more on vintage German motor oil than on groceries', 'Diagnoses engine troubles by listening to cars pass on the street', 'Refuses to ride in anything that has an automatic gearbox'],
    ARRAY['Can fix literally any mechanical breakdown on the side of the road', 'Takes you on breathtaking scenic drives through desert canyons at dawn', 'Incredible work ethic and humble gentleman manners'],
    'I geek out on:',
    'The sound of a mechanical tachometer needle snapping past 7,000 RPM.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#d49b78"/><path d="M50 170 Q100 130 150 170 Z" fill="#ea580c"/></svg>',
    '/profiles/garrison-gearhead.jpg',
    17
),
(
    'owen-organic-farmer',
    'Owen MacLeod',
    34,
    'man',
    'Regenerative Farmer & Apple Orchardist',
    'Hillside Orchard, VT (8.0 miles away)',
    'Off-grid on 40 acres with 12 heirloom cider apple varieties and 3 border collies. Looking for someone who doesn''t mind dirt on my boots and wool socks by the wood stove.',
    ARRAY['Goes to sleep at 8:30 PM every night because roosters do not respect weekends', 'Pays for dinner in bartered cider and beeswax candles', 'Refuses to visit cities with populations greater than 15,000'],
    ARRAY['Unlimited fresh organic cider, honey, and maple syrup', 'Builds custom hardwood cedar furniture by hand', 'The gentlest, kindest heart in all of New England'],
    'My favorite Sunday activity:',
    'Pressing cider in the barn while the border collies herd fallen leaves.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#e2a789"/><path d="M50 170 Q100 130 150 170 Z" fill="#15803d"/></svg>',
    '/profiles/owen-organic-farmer.jpg',
    18
),
(
    'winston-wealth-advisor',
    'Winston C. Prescott IV',
    38,
    'man',
    'Family Office Managing Partner & Regatta Sailor',
    'Ocean Drive, RI (2.1 miles away)',
    'Summer in Newport, winter in Gstaad. Must know how to tie a bowline knot blindfolded and appreciate a crisp navy blazer with solid brass buttons.',
    ARRAY['Refers to his father as "The Senior Partner"', 'Owns monogrammed linen pocket squares for every day of the month', 'Checks Bloomberg terminal alerts while riding on chairlifts'],
    ARRAY['Access to private sailing yachts and exclusive coastal clubs', 'Never stresses about restaurant bills or travel bookings', 'Chivalrous old-school manners and impeccable etiquette'],
    'My weekend ritual:',
    'Early morning regatta race followed by dark ''n stormies on the club lawn.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#e0a98b"/><path d="M50 170 Q100 130 150 170 Z" fill="#1e40af"/></svg>',
    '/profiles/winston-wealth-advisor.jpg',
    19
),
(
    'trent-tech-executive',
    'Trent Holbrook',
    32,
    'man',
    'Deep-Tech VC Partner & Bio-Hacker',
    'University Ave, CA (0.8 miles away)',
    'Investing in longevity biotech and orbital robotics. When I''m not taking investor calls from my standup paddleboard, I''m testing my continuous glucose monitor.',
    ARRAY['Puts grass-fed butter and MCT oil into his ceremonial matcha', 'Has a hyperbaric oxygen chamber in his second guest bedroom', 'Talks about "synergies" during romantic dinners'],
    ARRAY['Generous investor with boundless enthusiasm for the future', 'Plans incredible trips to tech summits in Switzerland and Tokyo', 'Great conversationalist who loves hearing other people''s ideas'],
    'My most ambitious goal:',
    'Living to 125 with biological markers of a 30-year-old.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#e2a789"/><path d="M50 170 Q100 130 150 170 Z" fill="#4b5563"/></svg>',
    '/profiles/trent-tech-executive.jpg',
    20
),

-- Women Batch 1 & 2 (order_idx 30..40)
(
    'fiona-delacroix',
    'Fiona Delacroix',
    29,
    'woman',
    'Michelin Restaurant Critic & Natural Wine Fiend',
    'West Loop, IL (1.6 miles away)',
    'I have eaten at 47 tasting-menu restaurants this year and silently judge how you hold your butter knife. Seeking someone who can discuss orange pet-nat without checking Google.',
    ARRAY['Sends food back to ask if the microgreens are biodynamic', 'Keeps a spreadsheet rating her friends dinner parties', 'Refuses to eat anywhere with fluorescent lighting'],
    ARRAY['Can get us a reservation anywhere on 10 minutes notice', 'Splits the check with exact tip math in under 4 seconds', 'Bakes sourdough focaccia for your parents'],
    'A secret about me:',
    'I keep a bottle of aged balsamic vinegar in my purse for restaurant emergencies.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#f2c0a2"/><path d="M50 170 Q100 130 150 170 Z" fill="#991b1b"/></svg>',
    '/profiles/fiona-delacroix.jpg',
    30
),
(
    'harper-corporate-climber',
    'Harper Sterling',
    32,
    'woman',
    'Senior Management Consultant & SoulCycle Zealot',
    'Midtown East, NY (0.5 miles away)',
    '65-hour workweeks, Delta Diamond Medallion, and 5:30am spin classes before my Tokyo client sync. Looking for someone with an Amex Centurion card and emotional availability.',
    ARRAY['Answers client Slack pings during first dates', 'Calendar-invites you to Sunday brunch with an agenda attached', 'Only dates men who went to Ivy League business schools'],
    ARRAY['Can get upgraded to first class on any airline', 'Never leaves unread notifications on her phone', 'Has an immaculate credit score and clear 5-year plan'],
    'My most irrational fear:',
    'Accidentally replying-all with "Per my previous email" to the CEO.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#f5d0b5"/><path d="M50 170 Q100 130 150 170 Z" fill="#18181b"/></svg>',
    '/profiles/harper-corporate-climber.jpg',
    31
),
(
    'sabrina-sommelier',
    'Sabrina Vance',
    34,
    'woman',
    'Certified Sommelier & Charcuterie Architect',
    'St. Helena, CA (3.8 miles away)',
    'I can identify the terroir of a 2014 Bordeaux by scent alone. If your home wine rack is stored next to your radiator, we are irreconcilably incompatible.',
    ARRAY['Sniffs corks at casual pizza dinners', 'Rank-orders her dinner guests by their palate sophistication', 'Owns $4,000 worth of hand-blown Austrian stemware'],
    ARRAY['Always brings the best vintage to casual gatherings', 'Knows every vineyard owner on a first-name basis', 'Refuses to let you drink cheap celebratory sparkling wine'],
    'The best way to win me over:',
    'Blind-taste a Jura vin jaune and correctly name the grape variety.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#eab69f"/><path d="M50 170 Q100 130 150 170 Z" fill="#701a75"/></svg>',
    '/profiles/sabrina-sommelier.jpg',
    32
),
(
    'maya-meditation',
    'Maya Lin',
    33,
    'woman',
    'Executive Mindfulness Coach & Silent Retreat Veteran',
    'Chautauqua, CO (2.4 miles away)',
    'Guiding stressed tech executives through transformative breathwork. I spent 21 days in silent meditation in Rishikesh and speak fluent energetic frequencies.',
    ARRAY['Analyzes your micro-expressions during arguments to check your chakras', 'Charges $800 for guided journaling sessions', 'Will sage your apartment before agreeing to step inside'],
    ARRAY['Never raises her voice or loses her cool under pressure', 'Makes incredible golden milk lattes from scratch', 'Has zero unaddressed emotional baggage'],
    'Together we could:',
    'Spend 72 hours without spoken words on a remote cliffside yurt.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#e5b497"/><path d="M50 170 Q100 130 150 170 Z" fill="#047857"/></svg>',
    '/profiles/maya-meditation.jpg',
    33
),
(
    'camila-crossfit',
    'Camila Reyes',
    31,
    'woman',
    'CrossFit Box Owner & Olympic Weightlifter',
    'East Austin, TX (1.9 miles away)',
    'PR or ER. Looking for someone who can spot my 260lb back squat without trembling. Recovery days mean 10-mile trail runs and ice baths.',
    ARRAY['Logs her macros down to the half-gram on restaurant dates', 'Thinks resting heart rates above 52 bpm indicate weakness', 'Judges your handshake by your forearm grip strength'],
    ARRAY['Can effortlessly carry all 14 grocery bags in one trip', 'Deep tissue massage wizard', 'Never complains about sore legs or walking uphill'],
    'Swipe right if:',
    'You have calluses on your hands and do not mind chalk dust on the furniture.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#c68662"/><path d="M50 170 Q100 130 150 170 Z" fill="#b91c1c"/></svg>',
    '/profiles/camila-crossfit.jpg',
    34
),
(
    'elena-estate-lawyer',
    'Elena Rostova',
    36,
    'woman',
    'High-Stakes Trial Attorney & True Crime Sleuth',
    'Beacon Hill, MA (0.7 miles away)',
    'I cross-examine hostile witnesses for breakfast. Don''t lie to me—I subpoena deleted text messages and cross-reference your Venmo transactions.',
    ARRAY['Drafts non-disclosure agreements before a third date', 'Treats routine relationship check-ins like formal depositions', 'Never admits she is wrong even when presented with mathematical proof'],
    ARRAY['Will defend you aggressively in any legal or customer service dispute', 'Has the sharpest wardrobe in the northeastern corridor', 'Master of witty banter and razor-sharp comebacks'],
    'My pet peeve:',
    'People who say "technically" without understanding statutory precedent.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#eab69f"/><path d="M50 170 Q100 130 150 170 Z" fill="#1f2937"/></svg>',
    '/profiles/elena-estate-lawyer.jpg',
    35
),
(
    'nadia-neuroscientist',
    'Dr. Nadia Thorne',
    35,
    'woman',
    'Cognitive Neuroscientist & Circadian Purist',
    'Mission District, CA (1.5 miles away)',
    'Mapping brain plasticity by day, wearing red-tinted blue-light blocking glasses by night. If your bedroom has an LED indicator light, I will cover it with electrical tape.',
    ARRAY['Measures your cortisol levels via saliva swab before morning coffee', 'Bans all digital screens within 40 feet of the bedroom', 'Refuses to stay out past 9:45 PM even on New Year Eve'],
    ARRAY['Optimizes your sleep environment until you experience permanent REM bliss', 'Explains complex neurochemical concepts with infectious enthusiasm', 'Always brings scientifically proven nootropic snacks'],
    'Fact about me:',
    'My sleep score on my smart ring has not dropped below 94 in three years.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#b07d62"/><path d="M50 170 Q100 130 150 170 Z" fill="#0369a1"/></svg>',
    '/profiles/nadia-neuroscientist.jpg',
    36
),
(
    'beatrice-baker',
    'Beatrice Beaumont',
    37,
    'woman',
    'Artisanal French Pastry Chef & Lamination Expert',
    'Pike Place, WA (2.2 miles away)',
    'My classic croissant dough has 81 layers and I have 82 emotional boundaries. Looking for someone who appreciates real Normandy butter and quiet mornings.',
    ARRAY['Will openly weep if bakery humidity drops below 55%', 'Refuses to eat at any brunch spot that uses store-bought puff pastry', 'Wakes up at 3:15 AM every single day regardless of bedtime'],
    ARRAY['Your home will permanently smell like caramelized vanilla and warm brioche', 'Sends you to work with fresh chocolate kouign-amanns', 'Incredible patience and attention to fine detail'],
    'The key to my heart:',
    'Let me sleep between 1 PM and 3 PM without making a sound.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#f5d0b5"/><path d="M50 170 Q100 130 150 170 Z" fill="#d97706"/></svg>',
    '/profiles/beatrice-baker.jpg',
    37
),
(
    'violet-vintage-revival',
    'Violet Montgomery',
    33,
    'woman',
    'Mid-Century Modern Restorer & Archival Curator',
    'Hawthorne, OR (1.2 miles away)',
    'I drive 500 miles on weekend notices for authentic 1958 Danish teak credenzas. Particle board furniture is a personal insult to my ancestors.',
    ARRAY['Inspects underneath dining chairs on dinner dates to verify manufacturer stamps', 'Forbids cups without coasters within a 5-meter radius', 'Has a storage unit full of vintage lamps she refuses to sell'],
    ARRAY['Can thrift an entire luxury living room set for under $250', 'Knows the exact historical provenance of every object in her loft', 'Handmade linseed oil furniture polish smells incredible'],
    'Don’t hate me if I:',
    'Ask our waiter if the restaurant chairs are original Herman Miller or reproduction.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#f2c0a2"/><path d="M50 170 Q100 130 150 170 Z" fill="#6d28d9"/></svg>',
    '/profiles/violet-vintage-revival.jpg',
    38
),
(
    'astrid-architect',
    'Astrid Lindholm',
    38,
    'woman',
    'Brutalist Architect & Monochromatic Minimalist',
    'North Loop, MN (1.7 miles away)',
    'Exposed concrete, structural glass, black turtlenecks. If your home has visual clutter, I will silently draft a floor plan renovation in my sketchbook.',
    ARRAY['Only wears three distinct shades of charcoal gray', 'Believes throw pillows are structural flaws in domestic design', 'Measures doorframes with a laser meter when visiting your home'],
    ARRAY['Designs custom architectural shelving that looks like museum installations', 'Extremely decisive and handles all restaurant bookings with precision', 'Appreciates quiet moments and high-ceiling architecture'],
    'My dream date:',
    'A private tour of a brutalist concrete library followed by double espressos.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#f5d0b5"/><path d="M50 170 Q100 130 150 170 Z" fill="#334155"/></svg>',
    '/profiles/astrid-architect.jpg',
    39
),
(
    'piper-parenting-influencer',
    'Piper Hayes',
    35,
    'woman',
    'Gentle Parenting Author & Organic Lifestyle Creator',
    '12 South, TN (3.0 miles away)',
    'Unbleached wooden toys, sourdough morning rituals, and gentle emotional validation. We don’t say "calm down"—we say "I see you having a big human feeling."',
    ARRAY['Films unboxing videos of organic bone broth at 6:30 AM', 'Uses emotional regulation therapy language during sports matches', 'Refuses to allow primary colors in her home aesthetic'],
    ARRAY['World-class emotional listening and communication skills', 'Homemade herbal chamomile tea that cures all existential anxiety', 'Warm, welcoming home with fresh flowers everywhere'],
    'I will know we are compatible if:',
    'You can regulate your nervous system during Nashville rush hour traffic.',
    '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" rx="30" fill="#090d2a"/><circle cx="100" cy="85" r="38" fill="#f2c0a2"/><path d="M50 170 Q100 130 150 170 Z" fill="#ca8a04"/></svg>',
    '/profiles/piper-parenting-influencer.jpg',
    40
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
    order_idx = EXCLUDED.order_idx;

-- 3. Upgrade game_round_profiles to be player-specific (user_id)
-- Clear any existing ephemeral round profiles
TRUNCATE TABLE public.game_round_profiles;

-- Add user_id column if not exists
ALTER TABLE public.game_round_profiles
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old constraints
ALTER TABLE public.game_round_profiles
DROP CONSTRAINT IF EXISTS uq_room_round_profile;

ALTER TABLE public.game_round_profiles
DROP CONSTRAINT IF EXISTS uq_room_round_position;

-- Add player-scoped unique constraints
ALTER TABLE public.game_round_profiles
ADD CONSTRAINT uq_room_round_user_profile UNIQUE (room_id, round_number, user_id, profile_id);

ALTER TABLE public.game_round_profiles
ADD CONSTRAINT uq_room_round_user_position UNIQUE (room_id, round_number, user_id, position);

-- Update RLS policy for game_round_profiles
DROP POLICY IF EXISTS "game_round_profiles_select" ON public.game_round_profiles;
CREATE POLICY "game_round_profiles_select"
    ON public.game_round_profiles FOR SELECT
    USING (user_id = auth.uid());

-- 4. Rewrite seed_round_data to support personalized decks matching player looking_for preference
CREATE OR REPLACE FUNCTION public.seed_round_data(p_room_id UUID, p_round_number INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_player_rec RECORD;
    v_prof RECORD;
    v_pos INT;
    v_cycle_round INT;
BEGIN
    -- For single-gender (20 profiles total per gender): 2 distinct 10-card rounds (Round 1 -> batch 0, Round 2 -> batch 1)
    v_cycle_round := ((p_round_number - 1) % 2);

    FOR v_player_rec IN (
        SELECT user_id, looking_for FROM public.room_players WHERE room_id = p_room_id
    ) LOOP
        v_pos := 1;

        IF v_player_rec.looking_for = 'Man' THEN
            -- 10 Men for this round (Round 1: offset 0, Round 2: offset 10) -> 0 Women shown
            FOR v_prof IN (
                SELECT id FROM public.catalog_profiles
                WHERE gender = 'man'
                ORDER BY order_idx ASC
                OFFSET (v_cycle_round * 10)
                LIMIT 10
            ) LOOP
                INSERT INTO public.game_round_profiles (room_id, round_number, user_id, profile_id, position)
                VALUES (p_room_id, p_round_number, v_player_rec.user_id, v_prof.id, v_pos)
                ON CONFLICT (room_id, round_number, user_id, profile_id) DO NOTHING;
                v_pos := v_pos + 1;
            END LOOP;

        ELSIF v_player_rec.looking_for = 'Woman' THEN
            -- 10 Women for this round (Round 1: offset 0, Round 2: offset 10) -> 0 Men shown
            FOR v_prof IN (
                SELECT id FROM public.catalog_profiles
                WHERE gender = 'woman'
                ORDER BY order_idx ASC
                OFFSET (v_cycle_round * 10)
                LIMIT 10
            ) LOOP
                INSERT INTO public.game_round_profiles (room_id, round_number, user_id, profile_id, position)
                VALUES (p_room_id, p_round_number, v_player_rec.user_id, v_prof.id, v_pos)
                ON CONFLICT (room_id, round_number, user_id, profile_id) DO NOTHING;
                v_pos := v_pos + 1;
            END LOOP;

        ELSE
            -- 'Both' or 'Anything That Moves': 50/50 split (5 men and 5 women, unseen across rounds)
            FOR v_prof IN (
                (
                    SELECT id, order_idx FROM public.catalog_profiles
                    WHERE gender = 'man'
                    ORDER BY order_idx ASC
                    OFFSET (v_cycle_round * 10)
                    LIMIT 5
                )
                UNION ALL
                (
                    SELECT id, order_idx FROM public.catalog_profiles
                    WHERE gender = 'woman'
                    ORDER BY order_idx ASC
                    OFFSET (v_cycle_round * 10)
                    LIMIT 5
                )
                ORDER BY order_idx ASC
            ) LOOP
                INSERT INTO public.game_round_profiles (room_id, round_number, user_id, profile_id, position)
                VALUES (p_room_id, p_round_number, v_player_rec.user_id, v_prof.id, v_pos)
                ON CONFLICT (room_id, round_number, user_id, profile_id) DO NOTHING;
                v_pos := v_pos + 1;
            END LOOP;
        END IF;

        -- Assign 3 distinct secret matches for this player chosen exclusively from their 10 round profiles
        INSERT INTO public.player_round_matches (room_id, round_number, user_id, profile_id)
        SELECT p_room_id, p_round_number, v_player_rec.user_id, grp.profile_id
        FROM public.game_round_profiles grp
        WHERE grp.room_id = p_room_id
          AND grp.round_number = p_round_number
          AND grp.user_id = v_player_rec.user_id
        ORDER BY random()
        LIMIT 3
        ON CONFLICT (room_id, round_number, user_id, profile_id) DO NOTHING;

    END LOOP;
END;
$$;

-- 5. Update fetch_game_round_state to filter by user_id
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

    -- If called without an active auth session, fallback to first player in room
    IF v_user_id IS NULL THEN
        SELECT user_id INTO v_user_id FROM public.room_players WHERE room_id = p_room_id ORDER BY seat_number ASC LIMIT 1;
    END IF;

    SELECT json_agg(p ORDER BY p.seat_number ASC) INTO v_players
    FROM public.room_players p
    WHERE p.room_id = p_room_id;

    -- Fetch the 10 profiles for the current user and round
    SELECT json_agg(
        json_build_object(
            'id', cp.id,
            'slug', cp.slug,
            'name', cp.name,
            'age', cp.age,
            'gender', cp.gender,
            'occupation', cp.occupation,
            'location', cp.location,
            'bio', cp.bio,
            'red_flags', cp.red_flags,
            'green_flags', cp.green_flags,
            'prompt_question', cp.prompt_question,
            'prompt_answer', cp.prompt_answer,
            'avatar_url', cp.avatar_url,
            'avatar_svg', cp.avatar_svg,
            'position', grp.position
        ) ORDER BY grp.position ASC
    ) INTO v_profiles
    FROM public.game_round_profiles grp
    JOIN public.catalog_profiles cp ON cp.id = grp.profile_id
    WHERE grp.room_id = p_room_id
      AND grp.round_number = v_room.current_round
      AND grp.user_id = v_user_id;

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
