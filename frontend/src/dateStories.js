// dateStories.js - Generates humorous, spicy R-rated date recaps based on outcome

export function cleanLocation(loc) {
  return loc ? loc.replace(/\s*\([^)]*(?:miles?|mi\s*away|online)[^)]*\)/gi, '').trim() : '';
}

function getVariantIndex(profile, numVariants = 5) {
  if (!profile) return Math.floor(Math.random() * numVariants);
  const seed = String(profile.id || profile.profile_id || profile.name || '');
  if (!seed) return Math.floor(Math.random() * numVariants);
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % numVariants;
}

export function getDateStory(profile, outcome) {
  const name = profile?.name || 'Your Date';
  const firstName = name.split(' ')[0] || name;
  const variant = getVariantIndex(profile, 5);

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
            `What started as two innocent espresso martinis escalated into reckless, heavy making out in the back of an Uber before you even made it to the highway. By the time you stumbled into their apartment, clothes were flying across the foyer like confetti.`,
            `The sexual chemistry was borderline athletic. You spent half the night tangled in their Egyptian cotton sheets trading breathless compliments, dirty talk, and discovering brand-new positions that defied human anatomy. Neither of you reached for your phones once.`,
            `You woke up tangled together at noon to the smell of fresh coffee and warm pastries ${firstName} had quietly slipped out to buy. They kissed your forehead, pulled you right back under the duvet for round two, and whispered that you're not allowed to leave. An unforgettable 10/10 romance.`
          ]
        },
        // Variant 1: The Dive Bar Bathroom & Beyond
        {
          title: `Pure Animal Magnetism with ${name}!`,
          paragraphs: [
            `You two couldn't keep your hands off each other. Thirty minutes into the date, their hands were wandering under the table, and after one whispered dare, you both snuck into the single-stall bathroom for a frantic, breathless quickie against the graffiti-covered door.`,
            `Flushed and grinning like maniacs, you bolted back to their place to finish what you started. What followed was four hours of sweaty, uninhibited bedroom bliss where every touch, tease, and gasp hit the exact right note.`,
            `By 3 AM, you were sharing cold takeout pizza naked in bed, laughing until your ribs ached. ${firstName} massaged your back until you drifted off to sleep and sent you home in the morning with a lingering, passionate kiss and a promise to see each other tomorrow.`
          ]
        },
        // Variant 2: The Steamy Jacuzzi Midnight Romp
        {
          title: `Skinny Dipping Fireworks with ${name}!`,
          paragraphs: [
            `Dinner was electric, but the date truly took off when ${firstName} casually suggested heading up to their rooftop jacuzzi. Within ten minutes, two glasses of champagne were drained and your clothes were resting neatly on the patio chairs.`,
            `Skinny dipping quickly turned into breathless underwater foreplay. Pressed against the warm bubbling jets under the night sky, the passion was intoxicating—intense, vocal, and completely free of any awkward hesitation.`,
            `After migrating to their king-sized bed wrapped in fluffy robes, the marathon continued until the sun started peeking over the skyline. They made you avocado toast in bed and texted you three heart emojis before you even reached your door.`
          ]
        },
        // Variant 3: The Kinky Synchronicity
        {
          title: `Freaks of a Feather with ${name}!`,
          paragraphs: [
            `Over craft cocktails, you both got tipsy enough to start confessing your most guarded bedroom fantasies. Miraculously, not only were they not scared off, but their eyes widened in ravenous excitement because they shared the exact same freaky tastes.`,
            `Back at their loft, you skipped the small talk entirely. What followed was a wild, consensual, boundary-pushing session of hair-pulling, dirty secrets, and mind-bending climaxes that left handprints on the headboard and scratches on their back.`,
            `The afterglow was pure euphoria. You laid together completely spent, exchanging smug smiles and debriefing your new favorite memories. You walked out the next morning feeling like a conquering deity with a massive grin.`
          ]
        },
        // Variant 4: The Front Door Ambush
        {
          title: `Total Bedside Domination with ${name}!`,
          paragraphs: [
            `The sexual tension during drinks was so thick you could cut it with a steak knife. The second their front door clicked shut behind you, ${firstName} pinned you against the wall, shoved their tongue down your throat, and ripped your shirt buttons clean off.`,
            `It was a masterclass in passionate foreplay. From the entryway floor to the kitchen counter to the mattress, every single inch of your body was thoroughly worshipped. Both of you experienced multiple earth-shattering climaxes that shook the bedframe.`,
            `The morning after was somehow even better: lazy snuggles, gentle kisses, and an enthusiastic round of shower sex that almost made you miss your afternoon shift. You have officially found your new favorite human.`
          ]
        }
      ];

      const s = stories[variant % stories.length];
      title = s.title;
      paragraphs = s.paragraphs;
      break;
    }

    case 'good': {
      badgeText = '😊 GOOD DATE (+500 PTS)';
      badgeClass = 'date-badge-good';
      scoreDeltaText = '+500 pts';

      const stories = [
        // Variant 0: The Clumsy Backseat Tryst
        {
          title: `A Solid Evening with ${name}`,
          paragraphs: [
            `After sharing a couple of strong margaritas, mutual horny glances led to an impromptu detour into the backseat of their hatchback. It was cramped, slightly uncoordinated, and someone's knee accidentally honked the horn twice, but the mutual enthusiasm was unmatched.`,
            `There was heavy breathing, tangled denim, and an elbow jammed uncomfortably into a cupholder, but once you found your rhythm, the chemistry carried you across the finish line with a very satisfying climax.`,
            `You brushed your hair in their rearview mirror, shared a hearty laugh over the fogged-up windows, and parted ways on high spirits. Not a fairytale, but a genuinely fun, spicy romp you'd gladly repeat.`
          ]
        },
        // Variant 1: The Enthusiastic Over-Moaner
        {
          title: `Vocal Vibrations with ${name}`,
          paragraphs: [
            `The date flowed smoothly from cocktails into an easy nightcap at their apartment. Things quickly got frisky on their velvet sofa, leading to a mutually enthusiastic scramble out of your jeans and onto the rug.`,
            `The sex was genuinely great and full of playful banter, though ${firstName}'s theatrical, stadium-level groans definitely alerted their roommate and possibly three neighboring units. You had to playfully bite your hand to keep from bursting into giggles.`,
            `After catching your breath, you curled up together for an hour of sweet pillow talk and shared their last sleeve of Oreos. You called a cab around 1 AM feeling thoroughly satisfied, smiling all the way home.`
          ]
        },
        // Variant 2: The Couch Cushion Tumble
        {
          title: `A Cozy Hookup with ${name}`,
          paragraphs: [
            `What was supposed to be "just one drink" turned into lounging on their couch watching bad reality TV. Naturally, hands started wandering under shirts within twenty minutes, and the TV was quickly forgotten.`,
            `It was a messy, giggly, thoroughly enjoyable tumble. You lost your socks between the couch cushions and someone got mildly tangled in a knitted throw blanket, but the mutual pleasure was undeniable.`,
            `You didn't stay the night, but the post-coital cuddles were warm, sweet, and zero-pressure. ${firstName} walked you down to your car, gave you a lingering smack on the ass, and texted you before midnight.`
          ]
        },
        // Variant 3: The Steamy Fogged-Up Windows
        {
          title: `Heavy Petting Heat with ${name}`,
          paragraphs: [
            `You parked in an empty scenic lookout after dinner to "look at the city lights." Within five minutes, both seatbelts were unbuckled and you were straddling their lap with your hands firmly gripping their hair.`,
            `It turned into an intense, nostalgic, high-school-style heavy petting session that left every window in the vehicle completely opaque with steam. Hands explored everywhere, and both of you walked away with flushed cheeks and very happy smiles.`,
            `While you decided to save the full bedroom rodeo for date number two, the sexual chemistry was undeniable. A rock-solid evening that left you eagerly anticipating the sequel.`
          ]
        },
        // Variant 4: The Morning-After Scramble
        {
          title: `A Fun Sleepover with ${name}`,
          paragraphs: [
            `Dinner vibes were warm and casual, but once you both kicked off your shoes at their place, the flirting got deliciously filthy. You fell into bed together for a tender, passionate romp that hit all the right spots.`,
            `They were generous and attentive between the sheets, making sure you got yours before taking care of themselves. Falling asleep wrapped in their arms felt effortless and comfortable.`,
            `Sneaking past their sleeping golden retriever at 7 AM was an Olympic stealth challenge, but ${firstName} woke up just enough to pull you in for one last sleepy, affectionate kiss. A thoroughly pleasant victory.`
          ]
        }
      ];

      const s = stories[variant % stories.length];
      title = s.title;
      paragraphs = s.paragraphs;
      break;
    }

    case 'bad': {
      badgeText = '🚩 DISASTER DATE (-500 PTS)';
      badgeClass = 'date-badge-bad';
      scoreDeltaText = '-500 pts';

      const stories = [
        // Variant 0: The 18-Second Wonder
        {
          title: `Total Disaster with ${name}!`,
          paragraphs: [
            `Things seemed reasonably promising when you agreed to head back to their place. You stripped down, hopped under their unwashed duvet, and braced yourself for a passionate night.`,
            `Things got heated for roughly eighteen seconds. After four hurried, uncoordinated pumps, ${firstName} let out a sharp gasp, collapsed onto your shoulder, rolled over, and immediately opened Instagram while still breathing heavily.`,
            `While you lay there staring at the ceiling in complete disbelief and profound frustration, they casually asked if you could Venmo them $12 for the drinks. You put your pants on in total silence and bolted for the curb.`
          ]
        },
        // Variant 1: The Judgmental Feline Audience
        {
          title: `Creepy Bedroom Vibes with ${name}!`,
          paragraphs: [
            `The hookup started with reasonable enthusiasm, but the second your clothes came off, things took a deeply bizarre turn. Their bedroom smelled faintly of damp cardboard and unburned sage.`,
            `As you tried to get into the groove, their three hairless sphinx cats hopped onto the mattress and formed a silent, unblinking circle around you, watching your every thrust like demonic sports judges while ${firstName} whispered weird roleplay lines about their boss.`,
            `Any semblance of arousal withered instantly into dust. You faked an "urgent family emergency," gathered your scattered socks from under a litter box, and made a frantic escape into the rainy night.`
          ]
        },
        // Variant 2: The Hamstring Cramp Catastrophe
        {
          title: `Medical Misadventure with ${name}!`,
          paragraphs: [
            `You were midway through a promising sexual session on their squeaky futon when disaster struck. In the heat of passion, ${firstName} attempted an ambitious gymnastics maneuver they clearly had not stretched for.`,
            `A sickening pop echoed through the room. They shrieked in agony, seized up in a full-body hamstring cramp, and violently kicked their nightstand, sending a glass bong crashing down onto your bare toes.`,
            `The rest of the night was spent in the ER waiting room listening to them groan in a wheelchair while you iced your bleeding toe with frozen peas. Zero climax, negative romance, total catastrophe.`
          ]
        },
        // Variant 3: The Wrong Name at the Climax
        {
          title: `A Mortifying Encounter with ${name}!`,
          paragraphs: [
            `The chemistry seemed okay at first, and after a few stiff drinks, you ended up in bed making out furiously with clothes tossed across the bedroom rug.`,
            `Just as things were reaching an intense, passionate peak, ${firstName} gripped your hips, threw their head back, and emphatically screamed their ex-fiancé's full legal name right into your ear.`,
            `A deafening, soul-crushing silence swallowed the room. They froze, tried to mumble that "it was just an old reflex," and you put your shoes on so fast you nearly tore the laces. A horrifying disaster.`
          ]
        },
        // Variant 4: The Avant-Garde Techno Nightmare
        {
          title: `Sweaty, Chafed & Traumatized with ${name}!`,
          paragraphs: [
            `You agreed to a casual bedroom hookup, but before getting into bed, they insisted on putting on a 4-hour "spiritual tantric dark-techno" mix featuring uncomfortably loud metallic clanging noises.`,
            `What followed was two hours of relentless, uncoordinated, rhythm-less friction. Every time you tried to adjust or guide them, ${firstName} shushed you and insisted on "aligning our root chakras." You felt like you were being scrubbed with 80-grit sandpaper.`,
            `Sweaty, chafed, completely unfulfilled, and emotionally drained, you slipped out while they were in the bathroom re-lighting their sage bundle. Blocked and deleted forever.`
          ]
        }
      ];

      const s = stories[variant % stories.length];
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
            `The sexual tension was volcanic. After a steamy makeout session in the hallway, ${firstName} purred in your ear and invited you down to their "private playroom" for a night of boundary-pushing kinky fun.`,
            `Giggling and thoroughly turned on, you willingly let them strap your wrists and ankles into a plush, leather-padded bondage rack. They stroked your cheek, gave you one last sultry, breathtaking kiss, and stepped backward into the shadows.`,
            `"You look gorgeous like that," they whispered, as the reinforced steel vault door slammed shut and the ceiling vents hissed with mustard gas. You were tragically eliminated from Swipah! You must now spend the rest of the game haunting the lobby as a horny ghost.`
          ]
        },
        // Variant 1: The Midnight Jacuzzi Toast
        {
          title: `Fried in the Jacuzzi with ${name}...`,
          paragraphs: [
            `Dinner led directly to skinny dipping in their secluded backyard hot tub under the stars. The physical chemistry was wild—breathless underwater groping, passionate moans, and endless champagne.`,
            `Straddling their lap with your arms wrapped around their neck, you were having the hookup of your life. ${firstName} smiled tenderly, kissed your collarbone, and purred, "I want to remember this spark forever."`,
            `They reached over to the patio bar, picked up a plugged-in industrial four-slice toaster, and casually dropped it between your legs. A dazzling bolt of 240-volt lightning turned your climax into sudden cardiac arrest! You have been fatally eliminated from Swipah.`
          ]
        },
        // Variant 2: The Secret Cult Climax
        {
          title: `Sacrificed on the Altar of ${name}...`,
          paragraphs: [
            `The bedroom vibes were dark, seductive, and drenched in candlelight. Clothes were torn off with mutual ravenous hunger, leading to an intense, sweat-soaked sexual marathon that blew your mind.`,
            `Right as you both reached a trembling, simultaneous climax, ${firstName} traced their fingernails down your chest and chanted in ancient Latin: "The harvest is ripe! The blood is sweet!"`,
            `Before you could catch your breath, eight hooded cultists filed silently out of the walk-in closet wielding gilded ceremonial daggers. You went out with a bang—literally and spiritually. You are now permanently deceased.`
          ]
        },
        // Variant 3: The Hatchback Taxidermy Tryst
        {
          title: `Turned into a Throw Pillow by ${name}...`,
          paragraphs: [
            `Spicy drinks turned into passionate, frantic heavy petting in the tinted backseat of their SUV. Buttons popped, hands wandered, and you were halfway through unbuckling their jeans when they pulled you close.`,
            `"I like it rough, baby," ${firstName} whispered seductively, nibbling on your earlobe. You eagerly leaned in for a deep makeout, totally oblivious as they smoothly uncoiled a length of piano wire behind your head.`,
            `The child-safety locks clicked, the wire snapped taut, and your romantic evening came to an abrupt, breathless end. Your impeccably stuffed, taxidermied corpse will now spend eternity sitting on their velvet living room armchair. Eliminated!`
          ]
        },
        // Variant 4: The Poisonous Aphrodisiac
        {
          title: `A Lethal Nightcap with ${name}...`,
          paragraphs: [
            `An incredible makeout session on their rug had both of you stripped down to your underwear, breathless and completely intoxicated with mutual lust. ${firstName} offered to pour a special "secret aphrodisiac" to kick things into high gear.`,
            `You happily clinked glasses, downed the sweet cherry concoction, and pulled them back onto the mattress for a fiery round of foreplay. But as your lips met theirs, your limbs suddenly went completely numb.`,
            `"The paralytic works fast, doesn't it?" they giggled affectionately, stroking your paralyzed face before dragging your limp body toward the basement meat grinder. You were thoroughly seduced, and then thoroughly murdered. Eliminated from Swipah!`
          ]
        }
      ];

      const s = stories[variant % stories.length];
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
      body: 'Oof. Tough night on Swipah! You used all 3 of your likes, but not a single profile swiped right back on you. The dating pool can be brutal, but your sweatpants are comfortable and your microwave pizza doesn\'t have red flags.',
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
