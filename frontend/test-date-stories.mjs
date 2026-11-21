import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'vite';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function runTests() {
  console.log('🧪 Validating all 83 persona story modules (664 recaps)...\n');

  const storiesDir = path.resolve(process.cwd(), 'src/stories');
  const files = fs.readdirSync(storiesDir).filter((f) => f.endsWith('.js')).sort();

  assert(files.length === 83, `Expected 83 story files, found ${files.length}`);

  const outcomes = ['great', 'good', 'bad', 'murdered'];
  const orientations = ['straight', 'gay'];

  let totalStories = 0;
  const anatomyWarnings = [];

  for (const file of files) {
    const slug = file.replace(/\.js$/, '');
    const mod = await import(pathToFileURL(path.join(storiesDir, file)).href);
    const data = mod.default;
    assert(data && typeof data === 'object', `${file}: missing default export object`);

    for (const orientation of orientations) {
      assert(data[orientation] && typeof data[orientation] === 'object', `${slug}: missing ${orientation}`);
      for (const outcome of outcomes) {
        const entry = data[orientation][outcome];
        assert(entry && typeof entry === 'object', `${slug}.${orientation}.${outcome}: missing entry`);
        assert(typeof entry.title === 'string' && entry.title.trim().length >= 5, `${slug}.${orientation}.${outcome}: invalid title`);
        assert(Array.isArray(entry.paragraphs) && entry.paragraphs.length === 3, `${slug}.${orientation}.${outcome}: expected 3 paragraphs`);

        for (let i = 0; i < 3; i++) {
          const p = entry.paragraphs[i];
          assert(typeof p === 'string' && p.trim().length >= 40, `${slug}.${orientation}.${outcome}[${i}]: paragraph too short`);
          assert(!p.includes('undefined') && !p.includes('${'), `${slug}.${orientation}.${outcome}[${i}]: contains invalid token`);
        }

        if (outcome === 'murdered') {
          const lastPara = entry.paragraphs[2].toLowerCase();
          assert(
            lastPara.includes('eliminated') || lastPara.includes('deceased') || lastPara.includes('dead'),
            `${slug}.${orientation}.murdered[2]: expected clear elimination line`
          );
        }

        totalStories++;
      }
    }

    // Ensure straight vs gay recaps are genuinely distinct for every outcome
    for (const outcome of outcomes) {
      const sText = data.straight[outcome].paragraphs.join(' ');
      const gText = data.gay[outcome].paragraphs.join(' ');
      assert(sText !== gText, `${slug}.${outcome}: straight and gay recaps are identical!`);
    }

    // Light regex audit for mismatched player anatomy references
    const gayJoined = outcomes.map((o) => data.gay[o].paragraphs.join(' ')).join(' ');
    if (/\byour (pussy|clit)\b/i.test(gayJoined) && /\byour (cock|dick|balls)\b/i.test(gayJoined)) {
      anatomyWarnings.push(`${slug}.gay matched both male and female player anatomy terms`);
    }
  }

  assert(totalStories === 664, `Expected 664 total recaps, validated ${totalStories}`);
  if (anatomyWarnings.length > 0) {
    console.warn('⚠️ Anatomy audit warnings:\n  - ' + anatomyWarnings.join('\n  - '));
  }
  console.log(`✓ Verified ${files.length} persona modules × 8 recaps = ${totalStories} complete stories with zero structural defects!`);

  // Verify dynamic glob loading & straight/gay routing through Vite's module loader
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent'
  });
  try {
    const { getDateStory, getDateOrientation } = await vite.ssrLoadModule('/src/dateStories.js');
    assert(getDateOrientation('man', 'pole') === 'gay', 'pole + man should be gay');
    assert(getDateOrientation('man', 'hole') === 'straight', 'hole + man should be straight');
    assert(getDateOrientation('woman', 'hole') === 'gay', 'hole + woman should be gay');
    assert(getDateOrientation('woman', 'pole') === 'straight', 'pole + woman should be straight');

    const chrisGay = await getDateStory({ slug: 'chris-fegela', name: 'Chris Fegela', gender: 'man' }, 'great', 'pole');
    const chrisStraight = await getDateStory({ slug: 'chris-fegela', name: 'Chris Fegela', gender: 'man' }, 'great', 'hole');
    assert(chrisGay.badgeText.includes('INCREDIBLE DATE') && chrisGay.paragraphs.length === 3, 'Chris gay story failed');
    assert(chrisStraight.paragraphs.length === 3 && chrisGay.title !== chrisStraight.title, 'Chris gay vs straight should differ');

    const lunaGay = await getDateStory({ slug: 'luna-starweaver', name: 'Luna Starweaver', gender: 'woman' }, 'murdered', 'hole');
    const lunaStraight = await getDateStory({ slug: 'luna-starweaver', name: 'Luna Starweaver', gender: 'woman' }, 'murdered', 'pole');
    assert(lunaGay.badgeText === 'YOU WERE MURDERED!' && lunaGay.scoreDeltaText === 'Eliminated', 'Luna gay badge failed');
    assert(lunaGay.title !== lunaStraight.title, 'Luna gay vs straight should differ');

    const kimberGay = await getDateStory({ slug: 'kimber-balsam', name: 'Kimber Balsam', gender: 'woman' }, 'great', 'hole');
    const kimberStraight = await getDateStory({ slug: 'kimber-balsam', name: 'Kimber Balsam', gender: 'woman' }, 'great', 'pole');
    assert(kimberGay.badgeText.includes('INCREDIBLE DATE') && kimberGay.paragraphs.length === 3, 'Kimber gay story failed');
    assert(kimberStraight.paragraphs.length === 3 && kimberGay.title !== kimberStraight.title, 'Kimber gay vs straight should differ');

    const jacqlynGay = await getDateStory({ slug: 'jacqlyn-fern', name: 'Jacqlyn Fern', gender: 'woman' }, 'great', 'hole');
    const jacqlynStraight = await getDateStory({ slug: 'jacqlyn-fern', name: 'Jacqlyn Fern', gender: 'woman' }, 'great', 'pole');
    assert(jacqlynGay.badgeText.includes('INCREDIBLE DATE') && jacqlynGay.paragraphs.length === 3, 'Jacqlyn gay story failed');
    assert(jacqlynStraight.paragraphs.length === 3 && jacqlynGay.title !== jacqlynStraight.title, 'Jacqlyn gay vs straight should differ');

    console.log('✓ Verified Vite import.meta.glob dynamic loader & orientation routing in dateStories.js!');
  } finally {
    await vite.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Story validation failed:', err);
  process.exit(1);
});
