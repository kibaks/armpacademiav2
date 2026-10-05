// Échantillons de voix — même phrase, chaîne de prod, 5 voix candidates.
import { Communicate } from 'edge-tts-universal';
import { writeFileSync, mkdirSync } from 'fs';

const BASE = 'http://localhost:3000';
const OUT = '/home/user/voice_samples';
mkdirSync(OUT, { recursive: true });

const base = (n) =>
  `Échantillon numéro ${n} : Bonjour, je suis votre tuteure. Écoute bien ce rythme : un ton humain, ça se voit aux respirations, à la chaleur, et à la façon d'insister sur les mots importants.`;

const j = async (url, opts) => {
  const r = await fetch(url, opts);
  const d = await r.json().catch(() => ({}));
  return { status: r.status, data: d };
};
const post = (p, body) =>
  j(`${BASE}${p}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const save = (name, audioData) => {
  writeFileSync(`${OUT}/${name}`, Buffer.from(audioData, 'base64'));
  console.log('écrit', name);
};

// 1. Réglages initiaux
const { data: initial } = await j(`${BASE}/api/tts/settings`);
console.log('réglages initiaux: browserFallback =', initial.browserFallback, '| ordre =', initial.order.map((o) => o.id + (o.enabled ? '✓' : '✗')).join(' '));

// 2. Échantillon 1 — ElevenLabs (chaîne actuelle, texte vierge)
const s1 = await post('/api/ai/tts', { text: base(1), voice: 'prof_aisha' });
console.log('sample1 provider =', s1.data.provider, 'status', s1.status);
if (s1.data.audioData) save('01_elevenlabs_rachel_actuel.mp3', s1.data.audioData);

// 3. Échantillons 2-4 — Neural edge seuls, une préférence de voix chacun
const neurs = [
  ['02_neural_vivienne_multilingual.mp3', 'vivienne-multilingual'],
  ['03_neural_denise.mp3', 'denise'],
  ['04_neural_vivienne_classique.mp3', 'vivienne'],
];
let i = 2;
for (const [file, pref] of neurs) {
  const st = await post('/api/tts/settings', {
    order: [
      { id: 'elevenlabs', enabled: false },
      { id: 'neural', enabled: true },
      { id: 'gemini', enabled: false },
    ],
    neuralVoice: pref,
    browserFallback: initial.browserFallback,
  });
  console.log('settings →', pref, 'ok =', st.data.ok);
  const s = await post('/api/ai/tts', { text: base(i), voice: 'prof_aisha' });
  console.log(`sample${i} provider =`, s.data.provider, 'status', s.status);
  if (s.data.audioData) save(file, s.data.audioData);
  i++;
}

// 4. Restauration des réglages initiaux
const restore = await post('/api/tts/settings', initial);
console.log('réglages restaurés ok =', restore.data.ok, '| browserFallback =', restore.data.browserFallback);

// 5. Échantillon 5 — fr-FR-SylvieNeural (edge direct, voix non référencée dans le schéma)
try {
  const text5 = base(5);
  const comm = new Communicate(text5, 'fr-FR-SylvieNeural');
  await comm.toFile(`${OUT}/05_neural_sylvie_alternative.mp3`);
  console.log('écrit 05_neural_sylvie_alternative.mp3');
} catch (e) {
  console.log('sylvie KO:', e.message);
}

// 6. Échantillon 6 — fr-FR-HenriNeural (voix homme, contrôle)
try {
  const comm = new Communicate(base(6), 'fr-FR-HenriNeural');
  await comm.toFile(`${OUT}/06_neural_henri_homme.mp3`);
  console.log('écrit 06_neural_henri_homme.mp3');
} catch (e) {
  console.log('henri KO:', e.message);
}
console.log('DONE');
