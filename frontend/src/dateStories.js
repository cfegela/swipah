// dateStories.js - Generates humorous, spicy R-rated date recaps based on outcome and date gender

export function cleanLocation(loc) {
  return loc ? loc.replace(/\s*\([^)]*(?:miles?|mi\s*away|online)[^)]*\)/gi, '').trim() : '';
}

function getVariantIndex(profile) {
  if (!profile) return Math.floor(Math.random() * 1000);
  const seed = String(profile.id || profile.profile_id || profile.name || '');
  if (!seed) return Math.floor(Math.random() * 1000);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

function getDatePronouns(gender) {
  if (gender === 'man') {
    return {
      subj: 'he',
      Subj: 'He',
      obj: 'him',
      poss: 'his',
      Poss: 'His',
      possPron: 'his',
      refl: 'himself',
      wasWere: 'was',
      isAre: 'is',
      subjIs: "he's",
      subjHad: "he'd",
      wereNot: "wasn't"
    };
  }
  if (gender === 'woman') {
    return {
      subj: 'she',
      Subj: 'She',
      obj: 'her',
      poss: 'her',
      Poss: 'Her',
      possPron: 'hers',
      refl: 'herself',
      wasWere: 'was',
      isAre: 'is',
      subjIs: "she's",
      subjHad: "she'd",
      wereNot: "wasn't"
    };
  }
  return {
    subj: 'they',
    Subj: 'They',
    obj: 'them',
    poss: 'their',
    Poss: 'Their',
    possPron: 'theirs',
    refl: 'themselves',
    wasWere: 'were',
    isAre: 'are',
    subjIs: "they're",
    subjHad: "they'd",
    wereNot: "weren't"
  };
}

function pickStory(stories, gender, variant) {
  const eligible = stories.filter((s) => !s.gender || s.gender === gender);
  const pool = eligible.length > 0 ? eligible : stories;
  return pool[variant % pool.length];
}

export function getDateStory(profile, outcome) {
  const name = profile?.name || 'Your Date';
  const firstName = name.split(' ')[0] || name;
  const gender = profile?.gender === 'man' || profile?.gender === 'woman' ? profile.gender : null;
  const p = getDatePronouns(gender);
  const variant = getVariantIndex(profile);

  let title = '';
  let badgeText = '';
  let badgeClass = '';
  let scoreDeltaText = '';
  let paragraphs = [];

  switch (outcome) {
    case 'great': {
      badgeText = '🌟 INCREDIBLE DATE (+1000 PTS)';
      badgeClass = 'date-badge-great';
      scoreDeltaText = '+1,000 pts';

      const stories = [
        // Variant 0: The Penthouse Marathon
        {
          title: `Sparks Flew with ${name}!`,
          paragraphs: [
            `What started as two innocent espresso martinis escalated into reckless, heavy making out in the back of an Uber before you even made it to the highway. By the time you stumbled into ${p.poss} apartment, clothes were flying across the foyer like confetti.`,
            `The sexual chemistry was borderline athletic. You spent half the night tangled in ${p.poss} Egyptian cotton sheets trading breathless compliments, dirty talk, and discovering brand-new positions that defied human anatomy. Neither of you reached for your phones once.`,
            `You woke up tangled together at noon to the smell of fresh coffee and warm pastries ${firstName} had quietly slipped out to buy. ${p.Subj} kissed your forehead, pulled you right back under the duvet for round two, and whispered that you're not allowed to leave. An unforgettable 10/10 romance.`
          ]
        },
        // Variant 1: The Dive Bar Bathroom & Beyond
        {
          title: `Pure Animal Magnetism with ${name}!`,
          paragraphs: [
            `You two couldn't keep your hands off each other. Thirty minutes into the date, ${p.poss} hands were wandering under the table, and after one whispered dare, you both snuck into the single-stall bathroom for a frantic, breathless quickie against the graffiti-covered door.`,
            `Flushed and grinning like maniacs, you bolted back to ${p.poss} place to finish what you started. What followed was four hours of sweaty, uninhibited bedroom bliss where every touch, tease, and gasp hit the exact right note.`,
            `By 3 AM, you were sharing cold takeout pizza naked in bed, laughing until your ribs ached. ${firstName} massaged your back until you drifted off to sleep and sent you home in the morning with a lingering, passionate kiss and a promise to see each other tomorrow.`
          ]
        },
        // Variant 2: The Steamy Jacuzzi Midnight Romp
        {
          title: `Skinny Dipping Fireworks with ${name}!`,
          paragraphs: [
            `Dinner was electric, but the date truly took off when ${firstName} casually suggested heading up to ${p.poss} rooftop jacuzzi. Within ten minutes, two glasses of champagne were drained and your clothes were resting neatly on the patio chairs.`,
            `Skinny dipping quickly turned into breathless underwater foreplay. Pressed against the warm bubbling jets under the night sky, the passion was intoxicating—intense, vocal, and completely free of any awkward hesitation.`,
            `After migrating to ${p.poss} king-sized bed wrapped in fluffy robes, the marathon continued until the sun started peeking over the skyline. ${p.Subj} made you avocado toast in bed and texted you three heart emojis before you even reached your door.`
          ]
        },
        // Variant 3: The Kinky Synchronicity
        {
          title: `Freaks of a Feather with ${name}!`,
          paragraphs: [
            `Over craft cocktails, you both got tipsy enough to start confessing your most guarded bedroom fantasies. Miraculously, not only ${p.wereNot} ${p.subj} scared off, ${p.poss} eyes widened in ravenous excitement because ${p.subj} shared the exact same freaky tastes.`,
            `Back at ${p.poss} loft, you skipped the small talk entirely. What followed was a wild, consensual, boundary-pushing session of hair-pulling, dirty secrets, and mind-bending climaxes that left handprints on the headboard and scratches on ${p.poss} back.`,
            `The afterglow was pure euphoria. You laid together completely spent, exchanging smug smiles and debriefing your new favorite memories. You walked out the next morning feeling like a conquering deity with a massive grin.`
          ]
        },
        // Variant 4: The Front Door Ambush
        {
          title: `Total Bedside Domination with ${name}!`,
          paragraphs: [
            `The sexual tension during drinks was so thick you could cut it with a steak knife. The second ${p.poss} front door clicked shut behind you, ${firstName} pinned you against the wall, shoved ${p.poss} tongue down your throat, and ripped your shirt buttons clean off.`,
            `It was a masterclass in passionate foreplay. From the entryway floor to the kitchen counter to the mattress, every single inch of your body was thoroughly worshipped. Both of you experienced multiple earth-shattering climaxes that shook the bedframe.`,
            `The morning after was somehow even better: lazy snuggles, gentle kisses, and an enthusiastic round of shower sex that almost made you miss your afternoon shift. You have officially found your new favorite human.`
          ]
        },
        // Variant 5: The Boutique Hotel Wrecking Ball
        {
          title: `Fucking Like Animals with ${name}!`,
          paragraphs: [
            `One stiff tequila shot turned into heavy grinding on the dive bar dance floor, and neither of you had the patience to wait for an apartment. You split a last-minute boutique hotel room down the block and were already tearing each other's clothes off before the elevator doors even closed.`,
            `Once inside, it was pure, unfiltered filth. ${firstName} talked dirty in your ear, fucked you raw-passion style across the king bed, spun you around against the floor-to-ceiling window, and went down on you like ${p.poss} rent depended on it. Your legs were literally shaking too hard to stand.`,
            `You wrecked every pillow in the room, ordered obscene amounts of room-service fries at 2 AM buck-naked, and squeezed in one more filthy morning quickie before checkout. Hall-of-fame level chemistry.`
          ]
        },
        // Variant 6: The Balcony Quickie & Championship Rounds
        {
          title: `Mind-Blowing Filth with ${name}!`,
          paragraphs: [
            `Dinner was hot enough, but when ${firstName} pulled you out onto ${p.poss} private terrace with two glasses of wine, things went straight past PG-13. Within five minutes your pants were around your ankles while ${p.subj} bent you over the patio table under the city skyline.`,
            `Knowing someone could spot you only made it ten times hotter. You moved inside before getting arrested and spent the next three hours trading sloppy, breathless oral, spanking, and relentless pounding until the sheets looked like a crime scene.`,
            `Completely dehydrated and grinning like an idiot, you got tucked into bed with a cold bottle of Gatorade and a morning blow-your-mind finale. Worth every ounce of soreness.`
          ]
        },
        // Variant 7: The Dirty Talk & Oral Grandmaster
        {
          title: `Soul Left Your Body with ${name}!`,
          paragraphs: [
            `${firstName} spent the whole bar tab flirting like an absolute menace, whispering filthy promises under ${p.poss} breath every time the bartender walked away. By the time you hit ${p.poss} mattress, you were practically feral.`,
            `Turns out, ${p.subj} ${p.wereNot} bluffing one bit. ${p.Poss} tongue game was certified black-belt wizardry—teasing, lapping, and driving you completely out of your goddamn mind until you were cursing in tongues and gripping the headboard for dear life.`,
            `After you came hard enough to see dead ancestors, ${p.subj} fucked you slow, deep, and filthy until dawn. You walked to your morning Uber feeling like royalty.`
          ]
        },
        // Variant 8: The Kitchen Island Rodeo
        {
          title: `Zero Chill, All Thrill with ${name}!`,
          paragraphs: [
            `You went back to ${firstName}'s place supposedly to "check out ${p.poss} vinyl collection." Five seconds past the threshold, you were hoisting each other onto the marble kitchen island while knocking a bowl of avocados straight onto the floor.`,
            `The raw fucking on the countertop was loud, sloppy, and absurdly good. Skin slapping, breathless cursing, biting shoulders, and zero awkwardness—just two horny adults completely synced up and chasing the nastiest, hottest orgasm possible.`,
            `You wiped avocado off your elbow, tumbled into ${p.poss} bed for round three, and woke up to ${firstName} grinning between your thighs. Ten out of fucking ten.`
          ]
        },
        // Variant 9: The Speakeasy Booth Escalation
        {
          title: `Certified Freak Match with ${name}!`,
          paragraphs: [
            `Hidden in the dim corner booth of a speakeasy, hands crept straight under shirts and waistbands before the second round of cocktails even landed. Walking home, you barely made it up ${p.poss} brownstone steps without tearing buttons off.`,
            `Behind closed doors, ${firstName} brought out the good toys, slapped your ass just right, and hit angles you didn't even know existed. Every filthy whisper landed dead-on, turning the bedroom into an athletic, sweat-drenched marathon.`,
            `You left ${p.poss} apartment at noon with hickeys hidden under your collar, sore thighs, and a calendar invite already booked for Friday night.`
          ]
        }
      ];

      const s = pickStory(stories, gender, variant);
      title = s.title;
      paragraphs = s.paragraphs;
      break;
    }

    case 'good': {
      badgeText = '😊 GOOD DATE (+500 PTS)';
      badgeClass = 'date-badge-good';
      scoreDeltaText = '+500 pts';

      const bedroomTerm =
        gender === 'man' ? 'dick' : gender === 'woman' ? 'pussy' : 'bedroom';

      const stories = [
        // Variant 0: The Clumsy Backseat Tryst
        {
          title: `A Solid Evening with ${name}`,
          paragraphs: [
            `After sharing a couple of strong margaritas, mutual horny glances led to an impromptu detour into the backseat of ${p.poss} hatchback. It was cramped, slightly uncoordinated, and someone's knee accidentally honked the horn twice, but the mutual enthusiasm was unmatched.`,
            `There was heavy breathing, tangled denim, and an elbow jammed uncomfortably into a cupholder, but once you found your rhythm, the chemistry carried you across the finish line with a very satisfying climax.`,
            `You brushed your hair in ${p.poss} rearview mirror, shared a hearty laugh over the fogged-up windows, and parted ways on high spirits. Not a fairytale, but a genuinely fun, spicy romp you'd gladly repeat.`
          ]
        },
        // Variant 1: The Enthusiastic Over-Moaner
        {
          title: `Vocal Vibrations with ${name}`,
          paragraphs: [
            `The date flowed smoothly from cocktails into an easy nightcap at ${p.poss} apartment. Things quickly got frisky on ${p.poss} velvet sofa, leading to a mutually enthusiastic scramble out of your jeans and onto the rug.`,
            `The sex was genuinely great and full of playful banter, though ${firstName}'s theatrical, stadium-level groans definitely alerted ${p.poss} roommate and possibly three neighboring units. You had to playfully bite your hand to keep from bursting into giggles.`,
            `After catching your breath, you curled up together for an hour of sweet pillow talk and shared ${p.poss} last sleeve of Oreos. You called a cab around 1 AM feeling thoroughly satisfied, smiling all the way home.`
          ]
        },
        // Variant 2: The Couch Cushion Tumble
        {
          title: `A Cozy Hookup with ${name}`,
          paragraphs: [
            `What was supposed to be "just one drink" turned into lounging on ${p.poss} couch watching bad reality TV. Naturally, hands started wandering under shirts within twenty minutes, and the TV was quickly forgotten.`,
            `It was a messy, giggly, thoroughly enjoyable tumble. You lost your socks between the couch cushions and someone got mildly tangled in a knitted throw blanket, but the mutual pleasure was undeniable.`,
            `You didn't stay the night, but the post-coital cuddles were warm, sweet, and zero-pressure. ${firstName} walked you down to your car, gave you a lingering smack on the ass, and texted you before midnight.`
          ]
        },
        // Variant 3: The Steamy Fogged-Up Windows
        {
          title: `Heavy Petting Heat with ${name}`,
          paragraphs: [
            `You parked in an empty scenic lookout after dinner to "look at the city lights." Within five minutes, both seatbelts were unbuckled and you were climbing into ${p.poss} seat with your hands tangled in ${p.poss} hair.`,
            `It turned into an intense, nostalgic, high-school-style heavy petting session that left every window in the vehicle completely opaque with steam. Hands explored everywhere, and both of you walked away with flushed cheeks and very happy smiles.`,
            `While you decided to save the full bedroom rodeo for date number two, the sexual chemistry was undeniable. A damn solid evening that left you eagerly anticipating the sequel.`
          ]
        },
        // Variant 4: The Morning-After Scramble
        {
          title: `A Fun Sleepover with ${name}`,
          paragraphs: [
            `Dinner vibes were warm and casual, but once you both kicked off your shoes at ${p.poss} place, the flirting got deliciously filthy. You fell into bed together for a tender, passionate romp that hit all the right spots.`,
            `${p.Subj} ${p.wasWere} generous and attentive between the sheets, making sure you got yours before taking care of ${p.refl}. Falling asleep wrapped in ${p.poss} arms felt effortless and comfortable.`,
            `Sneaking past ${p.poss} sleeping golden retriever at 7 AM was an Olympic stealth challenge, but ${firstName} woke up just enough to pull you in for one last sleepy, affectionate kiss. A thoroughly pleasant victory.`
          ]
        },
        // Variant 5: Tipsy Foreplay & Solid Finish
        {
          title: `Horny & Wholesome with ${name}`,
          paragraphs: [
            `After three overpriced IPAs, you both got loose, giggly, and shamelessly handsy walking back to ${firstName}'s place. Clothes came off in a hurried trail down the hallway while someone's elbow smacked a houseplant off its stand.`,
            `Even with a couple goofy fumbles trying to get protection open in the dark, the actual banging was super fun, loud, and mutually satisfying. Plenty of dirty jokes mid-session and nobody took themselves too seriously.`,
            `You shared leftover tacos in your underwear at 1 AM and got a lingering smooch at the door. Solid B+ ${bedroomTerm} game and awesome company.`
          ]
        },
        // Variant 6: Neighbor Wall-Bang Applause
        {
          title: `Noisy Good Time with ${name}`,
          paragraphs: [
            `You headed back to ${firstName}'s shoebox studio where the bed creaked like a haunted pirate ship. Once you started fooling around, neither of you cared one bit about the paper-thin drywall.`,
            `The hookup was sweaty, energetic, and surprisingly well-paced. Just as you both finished with a loud string of f-bombs, someone through the wall politely tapped back twice in approval.`,
            `You both died laughing under the sheets, cracked a warm sparkling water, and cuddled for an hour. Slightly shameless, definitely satisfying.`
          ]
        },
        // Variant 7: Beat the Roommate Clock
        {
          title: `Sneaky Fun with ${name}`,
          paragraphs: [
            `You snuck back to ${firstName}'s room knowing ${p.poss} roommate's shift ended in exactly forty-five minutes. That ticking clock turned into instant adrenaline and sloppy, desperate making out on top of the bedspread.`,
            `No fancy positions—just fast, focused, straight-to-the-point fucking that got the job done cleanly with five minutes to spare. Both of you finished right as keys jingled down the stairwell.`,
            `Pulling your jeans up in record time while sharing a smug high-five made you feel like horny teenagers again. Short, dirty, and thoroughly worth it.`
          ]
        },
        // Variant 8: No-AC Summer Sweatbox
        {
          title: `Humid & Satisfied with ${name}`,
          paragraphs: [
            `${p.Poss} apartment thermostat was broken in the middle of August, so peeling off your sweaty clothes wasn't even a hard sell. Five minutes into kissing on the mattress, you were both slicked in sweat like glazed donuts.`,
            `Sure, sliding apart sounded like peeling vinyl off a booth, and a box fan was wheezing two feet from your ass, but ${firstName} knew how to move ${p.poss} hips and kept the rhythm filthy enough to distract from the swamp heat.`,
            `A cold double shower afterward washed off the funk and earned a cheeky ass grab on the way out. Messy, muggy, and damn good.`
          ]
        },
        // Variant 9: Shaky Start, Strong Finish
        {
          title: `Slow Start, Great Finish with ${name}`,
          paragraphs: [
            `Things started slightly awkward when your teeth clacked hard during the first makeout and ${firstName} accidentally banged ${p.poss} knee into the edge of the bedframe. For thirty seconds, you thought the night was cooked.`,
            `Thank god you both brushed it off, poured another drink, and got back on track. Once ${p.subj} swapped to using ${p.poss} hands and mouth properly, the tension melted into a really hot, satisfying bang session.`,
            `Not every move looked like a porn shoot, but everybody got off happy and left with a genuine smile.`
          ]
        }
      ];

      const s = pickStory(stories, gender, variant);
      title = s.title;
      paragraphs = s.paragraphs;
      break;
    }

    case 'bad': {
      badgeText = '🚩 DISASTER DATE (-500 PTS)';
      badgeClass = 'date-badge-bad';
      scoreDeltaText = '-500 pts';

      const dirtyTalkLine =
        gender === 'man'
          ? `${p.Subj} kept referring to ${p.poss} own junk in the third person as "Daddy's little tax write-off," smacked your butt like ${p.subj} ${p.wasWere} testing a ripe watermelon at Costco, and aggressively whispered, "Yeah, take this mediocre dick, little spreadsheet."`
          : gender === 'woman'
            ? `${p.Subj} kept referring to ${p.refl} in the third person as "Corporate Mommy's little write-off," smacked your butt like ${p.subj} ${p.wasWere} testing a ripe watermelon at Costco, and aggressively whispered, "Yeah, earn that quarterly bonus, little spreadsheet."`
            : `${p.Subj} kept referring to ${p.refl} in the third person as "The CFO's little tax write-off," smacked your butt like ${p.subj} ${p.wasWere} testing a ripe watermelon at Costco, and aggressively whispered, "Yeah, audit my quarterly projections, little spreadsheet."`;

      const stories = [
        // Variant 0: The 18-Second Wonder
        {
          title: `Total Disaster with ${name}!`,
          paragraphs: [
            `Things seemed reasonably promising when you agreed to head back to ${p.poss} place. You stripped down, hopped under ${p.poss} unwashed duvet, and braced yourself for a passionate night.`,
            `Things got heated for roughly eighteen seconds. After four hurried, uncoordinated moments, ${firstName} let out a sharp gasp, collapsed onto your shoulder, rolled over, and immediately opened Instagram while still breathing heavily.`,
            `While you lay there staring at the ceiling in complete disbelief and profound frustration, ${p.subj} casually asked if you could Venmo ${p.obj} $12 for the drinks. You put your pants on in total silence and bolted for the curb.`
          ]
        },
        // Variant 1: The Judgmental Feline Audience
        {
          title: `Creepy Bedroom Vibes with ${name}!`,
          paragraphs: [
            `The hookup started with reasonable enthusiasm, but the second your clothes came off, things took a deeply bizarre turn. ${p.Poss} bedroom smelled faintly of damp cardboard and unburned sage.`,
            `As you tried to get into the groove, ${p.poss} three hairless sphinx cats hopped onto the mattress and formed a silent, unblinking circle around you, watching your every move like demonic sports judges while ${firstName} whispered weird roleplay lines about ${p.poss} boss.`,
            `Any semblance of arousal withered instantly into dust. You faked an "urgent family emergency," gathered your scattered socks from under a litter box, and made a frantic escape into the rainy night.`
          ]
        },
        // Variant 2: The Hamstring Cramp Catastrophe
        {
          title: `Medical Misadventure with ${name}!`,
          paragraphs: [
            `You were midway through a promising sexual session on ${p.poss} squeaky futon when disaster struck. In the heat of passion, ${firstName} attempted an ambitious gymnastics maneuver ${p.subj} clearly had not stretched for.`,
            `A sickening pop echoed through the room. ${p.Subj} shrieked in agony, seized up in a full-body hamstring cramp, and violently kicked ${p.poss} nightstand, sending a glass bong crashing down onto your bare toes.`,
            `The rest of the night was spent in the ER waiting room listening to ${p.obj} groan in a wheelchair while you iced your bleeding toe with frozen peas. Zero climax, negative romance, total catastrophe.`
          ]
        },
        // Variant 3: The Wrong Name at the Climax
        {
          title: `A Mortifying Encounter with ${name}!`,
          paragraphs: [
            `The chemistry seemed okay at first, and after a few stiff drinks, you ended up in bed making out furiously with clothes tossed across the bedroom rug.`,
            `Just as things were reaching an intense, passionate peak, ${firstName} gripped your hips, threw ${p.poss} head back, and emphatically screamed ${p.poss} ex-fiancé's full legal name right into your ear.`,
            `A deafening, soul-crushing silence swallowed the room. ${p.Subj} froze, tried to mumble that "it was just an old reflex," and you put your shoes on so fast you nearly tore the laces. A horrifying disaster.`
          ]
        },
        // Variant 4: The Avant-Garde Techno Nightmare
        {
          title: `Sweaty, Chafed & Traumatized with ${name}!`,
          paragraphs: [
            `You agreed to a casual bedroom hookup, but before getting into bed, ${p.subj} insisted on putting on a 4-hour "spiritual tantric dark-techno" mix featuring uncomfortably loud metallic clanging noises.`,
            `What followed was two hours of relentless, uncoordinated, rhythm-less friction. Every time you tried to adjust or guide ${p.obj}, ${firstName} shushed you and insisted on "aligning our root chakras." You felt like you were being scrubbed with 80-grit sandpaper.`,
            `Sweaty, chafed, completely unfulfilled, and emotionally drained, you slipped out while ${p.subj} ${p.wasWere} in the bathroom re-lighting ${p.poss} sage bundle. Blocked and deleted forever.`
          ]
        },
        // Variant 5: The Live Podcast Sex Lecture
        {
          title: `Total Vibe Killer with ${name}!`,
          paragraphs: [
            `Things were actually getting heavy until you got undressed and ${firstName} paused everything to give you a 20-minute TED Talk about biohacking, seed oils, and why orgasms supposedly drain ${p.poss} "peak frequency."`,
            `When ${p.subj} finally agreed to touch you, ${p.subj} treated foreplay like assembling IKEA furniture without the Allen wrench—rushing at a bizarre 45-degree angle while asking if you were "close yet" every nine seconds.`,
            `Zero clue what ${p.subj} ${p.wasWere} doing, negative self-awareness, and your libido packed its bags and died. You ordered an Uber before ${p.subj} finished putting ${p.poss} compression socks back on.`
          ]
        },
        // Variant 6: The Post-Chipotle Tragedy
        {
          title: `Biological Warfare with ${name}!`,
          paragraphs: [
            `Against all better judgment, you let ${firstName} order extra-hot carnitas, queso, and double beans right before going back to ${p.poss} apartment to fool around. Ten minutes into making out, ${p.poss} stomach let out a sound like a dying trombone.`,
            `Midway through undressing you, ${p.subj} ripped a silent, lethal fart under the fitted sheet that instantly weaponized the entire bedroom air supply. Worse, ${p.subj} didn't apologize—${p.subj} just giggled and pulled the blanket up over both your heads like a psychopath.`,
            `You gagged, kicked your way out of the Dutch oven like a trapped badger, grabbed your shoes bare-assed, and ghosted ${p.obj} mid-stride down the hallway.`
          ]
        },
        // Variant 7 (Man): Whiskey Dick & Pure Audacity
        {
          gender: 'man',
          title: `All Talk, Zero Action with ${name}!`,
          paragraphs: [
            `${firstName} spent two full hours at the bar bragging endlessly about what an unstoppable sex god he was. Naturally, your expectations were sky high when you stumbled through his door.`,
            `Turns out, six tequila sodas rendered his dick completely offline. Instead of owning it gracefully, he spent forty minutes awkwardly mashing marshmallow-soft equipment against your thigh while whining that "condoms feel weird" and blaming your lighting.`,
            `You left frustrated as hell, annoyed, and insulted—and he still had the fucking nerve to text you "round 2 soon 😉" the next morning.`
          ]
        },
        // Variant 7 (Woman): Wine-Drunk Pillow Princess & Pure Audacity
        {
          gender: 'woman',
          title: `All Talk, Zero Effort with ${name}!`,
          paragraphs: [
            `${firstName} spent two full hours at the bar bragging endlessly about what an untamed bedroom freak she was. Naturally, your expectations were sky high when you stumbled through her door.`,
            `Turns out, four espresso martinis reduced her to a motionless starfish scrolling TikTok on mute. Every time you tried kissing her neck, she sighed dramatically, complained you were ruining her $90 hyaluronic acid barrier, and told you to hurry up.`,
            `You left sexually frustrated, annoyed, and insulted—and she still had the fucking nerve to text you "crazy night 😉 round 2 soon" the next morning.`
          ]
        },
        // Variant 8: Worst Dirty Talk in History
        {
          title: `Unclean Dirty Talk with ${name}!`,
          paragraphs: [
            `You were totally down to get laid until ${firstName} leaned in close during foreplay and tried ${p.poss} hand at spontaneous dirty talk. Whatever came out of ${p.poss} mouth should be investigated by the Hague.`,
            dirtyTalkLine,
            `You couldn't stop laughing or cringing hard enough to recover. You faked a sudden migraine, shoved your underwear in your pocket, and deleted the app.`
          ]
        },
        // Variant 9: Ex's Mattress & Surprise Venmo
        {
          title: `Pure Ick Overload with ${name}!`,
          paragraphs: [
            `Should have turned around the moment you walked into ${firstName}'s room and saw a bare stained mattress on the floor next to a giant framed photo of ${p.poss} ex's golden retriever named "Alimony."`,
            `Between dog hair sticking to every sweaty inch of skin, terrible unwashed breath, and ${p.obj} stopping midway through to answer a FaceTime call from ${p.poss} mom on speakerphone, the hookup was an absolute trainwreck.`,
            `Walking home unsatisfied in the cold rain, your phone buzzed with a $47.50 Venmo request from ${firstName} titled "split tap water + towel laundry." Straight to jail.`
          ]
        }
      ];

      const s = pickStory(stories, gender, variant);
      title = s.title;
      paragraphs = s.paragraphs;
      break;
    }

    case 'murdered': {
      badgeText = 'YOU WERE MURDERED!';
      badgeClass = 'date-badge-murdered';
      scoreDeltaText = 'Eliminated';

      const stories = [
        // Variant 0: The Dungeon Bondage Trap
        {
          title: `A Fatal Encounter with ${name}...`,
          paragraphs: [
            `The sexual tension was volcanic. After a steamy makeout session in the hallway, ${firstName} purred in your ear and invited you down to ${p.poss} "private playroom" for a night of boundary-pushing kinky fun.`,
            `Giggling and thoroughly turned on, you willingly let ${p.obj} strap your wrists and ankles into a plush, leather-padded bondage rack. ${p.Subj} stroked your cheek, gave you one last sultry, breathtaking kiss, and stepped backward into the shadows.`,
            `"You look gorgeous like that," ${p.subj} whispered, as the reinforced steel vault door slammed shut and the ceiling vents hissed with mustard gas. You were tragically eliminated from Swipah! You must now spend the rest of the game haunting the lobby as a horny ghost.`
          ]
        },
        // Variant 1: The Midnight Jacuzzi Toast
        {
          title: `Fried in the Jacuzzi with ${name}...`,
          paragraphs: [
            `Dinner led directly to skinny dipping in ${p.poss} secluded backyard hot tub under the stars. The physical chemistry was wild—breathless underwater groping, passionate moans, and endless champagne.`,
            `Wrapped around each other in the swirling jets, you were having the hookup of your life. ${firstName} smiled tenderly, kissed your collarbone, and purred, "I want to remember this spark forever."`,
            `${p.Subj} reached over to the patio bar, picked up a plugged-in industrial four-slice toaster, and casually dropped it into the water between you. A dazzling bolt of 240-volt lightning turned your climax into sudden cardiac arrest! You have been fatally eliminated from Swipah.`
          ]
        },
        // Variant 2: The Secret Cult Climax
        {
          title: `Sacrificed on the Altar of ${name}...`,
          paragraphs: [
            `The bedroom vibes were dark, seductive, and drenched in candlelight. Clothes were torn off with mutual ravenous hunger, leading to an intense, sweat-soaked sexual marathon that blew your mind.`,
            `Right as you both reached a trembling, simultaneous climax, ${firstName} traced ${p.poss} fingernails down your chest and chanted in ancient Latin: "The harvest is ripe! The blood is sweet!"`,
            `Before you could catch your breath, eight hooded cultists filed silently out of the walk-in closet wielding gilded ceremonial daggers. You went out with a bang—literally and spiritually. You are now permanently deceased.`
          ]
        },
        // Variant 3: The Hatchback Taxidermy Tryst
        {
          title: `Turned into a Throw Pillow by ${name}...`,
          paragraphs: [
            `Spicy drinks turned into passionate, frantic heavy petting in the tinted backseat of ${p.poss} SUV. Buttons popped, hands wandered, and you were halfway through unbuckling ${p.poss} jeans when ${p.subj} pulled you close.`,
            `"I like it rough, baby," ${firstName} whispered seductively, nibbling on your earlobe. You eagerly leaned in for a deep makeout, totally oblivious as ${p.subj} smoothly uncoiled a length of piano wire behind your head.`,
            `The child-safety locks clicked, the wire snapped taut, and your romantic evening came to an abrupt, breathless end. Your impeccably stuffed, taxidermied corpse will now spend eternity sitting on ${p.poss} velvet living room armchair. Eliminated!`
          ]
        },
        // Variant 4: The Poisonous Aphrodisiac
        {
          title: `A Lethal Nightcap with ${name}...`,
          paragraphs: [
            `An incredible makeout session on ${p.poss} rug had both of you stripped down to your underwear, breathless and completely intoxicated with mutual lust. ${firstName} offered to pour a special "secret aphrodisiac" to kick things into high gear.`,
            `You happily clinked glasses, downed the sweet cherry concoction, and pulled ${p.obj} back onto the mattress for a fiery round of foreplay. But as your lips met ${p.possPron}, your limbs suddenly went completely numb.`,
            `"The paralytic works fast, doesn't it?" ${p.subj} giggled affectionately, stroking your paralyzed face before dragging your limp body toward the basement meat grinder. You were thoroughly seduced, and then thoroughly murdered. Eliminated from Swipah!`
          ]
        },
        // Variant 5: The Blindfold Guillotine
        {
          title: `Blown Away (Literally) by ${name}...`,
          paragraphs: [
            `After three tequila shots, ${firstName} dragged you into ${p.poss} soundproofed "freak dungeon," talking dirty as hell and promising to blow your fucking mind. Horny and zero-percent cautious, you eagerly stripped naked and stretched out across ${p.poss} velvet bench when ${p.subj} slipped on a silk blindfold.`,
            `"Don't move a muscle while I work some magic, babe," ${p.subj} whispered darkly. You were breathless, grinning like an idiot, waiting for the ride of your life—right up until you heard the unmistakable rattle of a heavy pulley chain.`,
            `A custom-engraved stainless steel blade dropped faster than your standards, slicing the evening catastrophically short. You died doing what you loved—being ridiculously down bad for a hot psycho. Eliminated from Swipah!`
          ]
        },
        // Variant 6: The Trapdoor Disposal
        {
          title: `Rough Play Gone Way Too Far with ${name}...`,
          paragraphs: [
            `The foreplay was feral—biting, scratching, throwing each other onto ${p.poss} king-sized bed like absolute animals. Sweat dripping, ${firstName} pinned your wrists down, kissed your neck, and growled, "Tell me how dirty you want it tonight."`,
            `"Make me regret it," you gasped like a dumbass. ${p.Poss} eyes lit up like a kid on Christmas morning, and ${p.subj} reached behind the headboard—not for handcuffs, but for a concealed brass lever labeled 'DISPOSAL.'`,
            `The mattress folded cleanly in half, dropping your naked, confused ass forty feet straight into a pit of hungry snapping turtles and hydrochloric acid. No safe word on Earth would've saved you anyway. You are dead as fuck!`
          ]
        },
        // Variant 7: The Sexy Oil & Blowtorch Finale
        {
          title: `Too Hot to Handle with ${name}...`,
          paragraphs: [
            `Things escalated stupidly fast on ${p.poss} kitchen island—clothes flying, dirty talk cranked to eleven, and ${firstName} slathering your entire naked body in "imported sensual massage oil" while biting ${p.poss} lip.`,
            `You were grinding together, moaning shamelessly and thinking you'd hit the absolute jackpot, until you noticed the distinct, unmistakable smell of unleaded 93-octane gasoline.`,
            `"Baby, you're smoking hot," ${firstName} purred, pulling a silver Zippo out of ${p.poss} bathrobe and tossing it casually onto your glistening chest. You went up in a glorious fireball visible from space. Eliminated from Swipah!`
          ]
        },
        // Variant 8: The Strap-On Harpoon
        {
          title: `Deeply Penetrated by ${name}'s Betrayal...`,
          paragraphs: [
            `${firstName} promised a "kinky little surprise" if you put on the silk blindfold and got on all fours across ${p.poss} shag rug. Feeling adventurous and horny out of your damn mind, you said fuck it and complied immediately.`,
            `You heard leather straps buckling, heavy breathing, and the ominous metallic click-clack of a pneumatic pressurized air tank. "Ready to take all of it?" ${p.subj} whispered darkly right behind you.`,
            `Before you could utter a single syllable, a CO2-powered commercial whale harpoon launched straight through your sternum and pinned you to the drywall like a fucked-up butterfly. Rest in pieces, champ—you've been eliminated!`
          ]
        },
        // Variant 9: The Acid-Bath Orgasm
        {
          title: `Dissolved in Lust with ${name}...`,
          paragraphs: [
            `By midnight, both of you were butt-naked, tangled in satin sheets, and going at it so loud the neighbors probably filed a noise complaint with the UN. ${firstName} was an absolute demon in bed, and you thought you'd genuinely found your soulmate.`,
            `After round two, still panting and covered in sweat, ${firstName} kissed your forehead and drew you a "steaming mineral detox bath" in a weirdly reinforced fiberglass tub. You slipped right in, groaning in pure post-orgasm bliss.`,
            `"Enjoy the tingling sensation, babe—that's drain cleaner," ${p.subj} smiled sweetly, kicking back with a glass of Pinot Noir as you fizzed away like a giant horny Alka-Seltzer tablet. Permanently eliminated from Swipah!`
          ]
        }
      ];

      const s = pickStory(stories, gender, variant);
      title = s.title;
      paragraphs = s.paragraphs;
      break;
    }

    default: {
      title = `Date with ${name}`;
      badgeText = 'DATE RECAP';
      badgeClass = 'date-badge-good';
      scoreDeltaText = '0 pts';
      paragraphs = [`You spent time with ${name}.`];
      break;
    }
  }

  return {
    title,
    badgeText,
    badgeClass,
    scoreDeltaText,
    paragraphs
  };
}

export function getConciliatoryMessage(roundNumber) {
  const messages = [
    {
      icon: '🍕 📺 🧦',
      headline: 'Netflix & Microwave Pizza For One',
      body: 'Oof. Tough night on Swipah! You used all your likes, but not a single profile swiped right back on you. The dating pool can be brutal, but your sweatpants are comfortable and your microwave pizza doesn\'t have red flags.',
      advice: 'Pro-tip: Lower your standards or hire a professional bio ghostwriter for next round.'
    },
    {
      icon: '🐈 🍷 🛋️',
      headline: 'A Quiet Evening with the Cat',
      body: 'Zero matches this round! While the other players are currently out risking emotional devastation (or literal homicide) on their dates, you get to enjoy total peace, silence, and zero shared checks.',
      advice: 'Silver lining: You survived with 100% of your points intact and your dignity mostly undamaged.'
    },
    {
      icon: '🍦 📱 🚫',
      headline: 'Left on Read by the Universe',
      body: 'Zero sparks, zero matches, zero chemistry. None of the profiles in your deck fancied you back this round! Take a deep breath, refresh your emotional battery, and prepare for the next round.',
      advice: 'Remember: It\'s not you, it\'s the algorithm. (Okay, maybe a little bit you).'
    }
  ];

  const idx = (Math.max(1, roundNumber) - 1) % messages.length;
  return messages[idx];
}
