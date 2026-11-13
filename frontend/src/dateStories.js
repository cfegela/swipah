// dateStories.js - Generates humorous, personalized date recaps based on persona quirks & outcome

export function cleanLocation(loc) {
  return loc ? loc.replace(/\s*\([^)]*(?:miles?|mi\s*away|online)[^)]*\)/gi, '').trim() : '';
}

export function getDateStory(profile, outcome) {
  const name = profile?.name || 'Your Date';
  const occupation = profile?.occupation || 'their mysterious job';
  const location = cleanLocation(profile?.location) || 'somewhere in town';
  const redFlags = profile?.red_flags || [];
  const greenFlags = profile?.green_flags || [];
  const promptAnswer = profile?.prompt_answer || 'something unforgettable';

  const rf1 = redFlags[0] || 'brought questionable conversation topics';
  const rf2 = redFlags[1] || 'spent too much time on their phone';
  const gf1 = greenFlags[0] || 'had effortless comedic timing';
  const gf2 = greenFlags[1] || 'paid meticulous attention to you';

  let title = '';
  let badgeText = '';
  let badgeClass = '';
  let scoreDeltaText = '';
  let paragraphs = [];

  switch (outcome) {
    case 'great':
      title = `Sparks Flew with ${name}!`;
      badgeText = '🌟 INCREDIBLE DATE (+1000 PTS)';
      badgeClass = 'date-badge-great';
      scoreDeltaText = '+1,000 pts';
      paragraphs = [
        `You met up with ${name} near ${location}. Despite working as a ${occupation}, they showed up looking remarkably put-together and disarmingly charming. The conversation clicked immediately—what began as a quick drink turned into three hours of rapid-fire banter and genuine laughter.`,
        `Sure, there were warning signs: ${name.split(' ')[0]} casually mentioned how they ${rf1.toLowerCase()}, but they completely made up for it because they ${gf1.toLowerCase()} and ${gf2.toLowerCase()}.`,
        `By the time dessert arrived, you were both trading inside jokes about "${promptAnswer}". They insisted on covering the bill, walked you to your ride with a lingering hug, and sent a sweet text before you even made it home. A storybook first date!`
      ];
      break;

    case 'good':
      title = `A Solid Evening with ${name}`;
      badgeText = '😊 GOOD DATE (+500 PTS)';
      badgeClass = 'date-badge-good';
      scoreDeltaText = '+500 pts';
      paragraphs = [
        `You agreed to grab casual drinks with ${name} around ${location}. As a ${occupation}, they certainly had plenty of eccentric work anecdotes to keep the conversation rolling without any awkward pauses.`,
        `The date had a few quirky bumps—at one point, ${name.split(' ')[0]} unabashedly admitted that they ${rf1.toLowerCase()}. You raised an eyebrow, but to their credit, they also ${gf1.toLowerCase()}, which helped balance out the weirdness.`,
        `You parted ways after two drinks on very friendly terms. Maybe it wasn't earth-shattering fireworks, but you had a fun night, shared a laugh, and didn't regret swiping right.`
      ];
      break;

    case 'bad':
      title = `Total Disaster with ${name}!`;
      badgeText = '🚩 DISASTER DATE (-500 PTS)';
      badgeClass = 'date-badge-bad';
      scoreDeltaText = '-500 pts';
      paragraphs = [
        `Things got off to an alarming start when ${name} arrived 25 minutes late to the venue in ${location}, blaming traffic and immediately launching into a monologue about how they ${rf1.toLowerCase()}.`,
        `Throughout dinner, ${name.split(' ')[0]} lived up to their worst reputation. Not only did they ${rf2.toLowerCase()}, but they also started debating the server about "${promptAnswer}" until half the dining room was uncomfortably staring.`,
        `When the check landed on the table, ${name.split(' ')[0]} suddenly claimed their card was "demagnetized" and slipped into the restroom, leaving you to pay the entire bill alone. You blocked their number while waiting on the curb for your ride.`
      ];
      break;

    case 'murdered':
      title = `A Fatal Encounter with ${name}...`;
      badgeText = 'YOU WERE MURDERED!';
      badgeClass = 'date-badge-murdered';
      scoreDeltaText = 'Eliminated (0 pts)';
      paragraphs = [
        `Everything started innocently enough over evening drinks with ${name} in ${location}. They seemed fascinating—after all, how often do you meet a ${occupation}? But as the night wore on, the red flags morphed into flashing crimson sirens.`,
        `"Hey, my apartment is actually a bit noisy," ${name.split(' ')[0]} whispered, flashing a strained smile. "Why don't we head to my secondary location? It's completely soundproof and deep in the woods." Against every true-crime podcast lesson you've ever heard, you actually got into their car.`,
        `As the trunk locked from the outside and the engine sped into the fog, you realized that when they said they ${rf1.toLowerCase()}, it wasn't a metaphor. You have been tragically eliminated from Swipah! You must now spend the rest of the game haunting the lobby as a spectator ghost.`
      ];
      break;

    default:
      title = `Date with ${name}`;
      badgeText = 'DATE RECAP';
      badgeClass = 'date-badge-good';
      scoreDeltaText = '0 pts';
      paragraphs = [`You spent time with ${name} in ${location}.`];
      break;
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
