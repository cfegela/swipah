// dateStories.js - Loads persona-specific R-rated date recaps tailored to outcome and straight/gay pairing

const storyModules = import.meta.glob('./stories/*.js');
const loadedStoriesCache = new Map();

const OUTCOME_META = {
  great: {
    badgeText: '🌟 INCREDIBLE DATE (+1000 PTS)',
    badgeClass: 'date-badge-great',
    scoreDeltaText: '+1,000 pts'
  },
  good: {
    badgeText: '😊 GOOD DATE (+500 PTS)',
    badgeClass: 'date-badge-good',
    scoreDeltaText: '+500 pts'
  },
  bad: {
    badgeText: '🚩 DISASTER DATE (-500 PTS)',
    badgeClass: 'date-badge-bad',
    scoreDeltaText: '-500 pts'
  },
  murdered: {
    badgeText: 'YOU WERE MURDERED!',
    badgeClass: 'date-badge-murdered',
    scoreDeltaText: 'Eliminated'
  }
};

export function cleanLocation(loc) {
  return loc ? loc.replace(/\s*\([^)]*(?:miles?|mi\s*away|online)[^)]*\)/gi, '').trim() : '';
}

/**
 * Resolves whether a date between the player (pole=man, hole=woman) and the profile (man/woman) is 'gay' or 'straight'.
 */
export function getDateOrientation(profileGender, playerSexOrgans) {
  if (
    (playerSexOrgans === 'pole' && profileGender === 'man') ||
    (playerSexOrgans === 'hole' && profileGender === 'woman')
  ) {
    return 'gay';
  }
  return 'straight';
}

/**
 * Lazily loads and caches the story module for a given persona slug.
 */
export async function preloadPersonaStories(slug) {
  if (!slug) return null;
  if (loadedStoriesCache.has(slug)) {
    return loadedStoriesCache.get(slug);
  }

  const moduleKey = `./stories/${slug}.js`;
  const loader = storyModules[moduleKey];
  if (!loader) {
    return null;
  }

  const mod = await loader();
  const data = mod?.default || null;
  if (data) {
    loadedStoriesCache.set(slug, data);
  }
  return data;
}

export async function getDateStory(profile, outcome, playerSexOrgans = null) {
  const name = profile?.name || 'Your Date';
  const meta = OUTCOME_META[outcome] || {
    badgeText: 'DATE RECAP',
    badgeClass: 'date-badge-good',
    scoreDeltaText: '0 pts'
  };

  const orientation = getDateOrientation(profile?.gender, playerSexOrgans);
  const slug = profile?.slug || '';

  let personaStories = null;
  if (slug) {
    try {
      personaStories = await preloadPersonaStories(slug);
    } catch (err) {
      console.warn(`Failed to load story module for ${slug}:`, err);
    }
  }

  const selected =
    personaStories?.[orientation]?.[outcome] ||
    personaStories?.straight?.[outcome] ||
    null;

  if (selected && Array.isArray(selected.paragraphs) && selected.paragraphs.length > 0) {
    return {
      title: selected.title || `Date with ${name}`,
      badgeText: meta.badgeText,
      badgeClass: meta.badgeClass,
      scoreDeltaText: meta.scoreDeltaText,
      paragraphs: selected.paragraphs
    };
  }

  return {
    title: `Date with ${name}`,
    badgeText: meta.badgeText,
    badgeClass: meta.badgeClass,
    scoreDeltaText: meta.scoreDeltaText,
    paragraphs: [`You went out on a date with ${name}.`]
  };
}

/**
 * Returns one of several witty conciliatory messages when a player ends a round with 0 matches.
 */
export function getConciliatoryMessage(roundNumber = 1) {
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
      headline: 'Left Unread by the Universe',
      body: 'Zero sparks, zero matches, zero chemistry. None of the profiles in your deck fancied you back this round! Take a deep breath, refresh your emotional battery, and prepare for the next round.',
      advice: 'Remember: It\'s not you, it\'s the algorithm. (Okay, maybe a little bit you).'
    }
  ];

  const idx = (Math.max(1, roundNumber) - 1) % messages.length;
  return messages[idx];
}
