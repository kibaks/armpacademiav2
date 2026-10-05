// Échantillons complémentaires : ElevenLabs direct (vrai Rachel/Sarah du prod)
// + edge Sylvie + Henri (API stream corrigée).
import { Communicate } from 'edge-tts-universal';
import { writeFileSync, mkdirSync } from 'fs';
import { readFileSync } from 'fs';

const OUT = '/home/user/voice_samples';
mkdirSync(OUT, { recursive: true });

const base = (n) =>
  `Échantillon numéro ${n} : Bonjour, je suis votre tuteure. Écoute bien ce rythme : un ton humain, ça se voit aux respirations, à la chaleur, et à la façon d'insister sur les mots importants.`;

const envText = readFileSync('/home/user/armpacademiav2/.env', 'utf8');
const KEY = envText.match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1]?.trim();
const VOICE = envText.match(/^ELEVENLABS_VOICE_ID=(.+)$/m)?.[1]?.trim() || 'EXAVITQu4vr4xnSDxMaL';

// 1. ElevenLabs direct — settings 'smiling' (émotion par défaut du chat)
const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'xi-api-key': KEY },
  body: JSON.stringify({
    text: base(1),
    model_id: 'eleven_multilingual_v2',
    voice_settings: { stability: 0.5, similarity_boost: 0.86, style: 0.62, use_speaker_boost: true },
  }),
});
const dj = await r.json();
if (r.ok && dj.audio_base64) {
  writeFileSync(`${OUT}/01_elevenlabs_direct.mp3`, Buffer.from(dj.audio_base64, 'base64'));
  console.log('écrit 01_elevenlabs_direct.mp3 (HTTP', r.status + ')');
} else {
  console.log('EL direct KO:', r.status, JSON.stringify(dj).slice(0, 200));
}

// 2. Edge — stream API (miroir du serveur)
const edgeSample = async (n, file, voice) => {
  try {
    const comm = new Communicate(base(n), { voice, rate: '+0%', pitch: '+0Hz', volume: '+0%' });
    const chunks = [];
    for await (const chunk of comm.stream()) {
      if (chunk.type === 'audio' && chunk.data) chunks.push(Buffer.from(chunk.data));
    }
    writeFileSync(`${OUT}/${file}`, Buffer.concat(chunks));
    console.log('écrit', file, `(${chunks.length} chunks)`);
  } catch (e) {
    console.log(file, 'KO:', e.message);
  }
};

await edgeSample(5, '05_neural_sylvie_alternative.mp3', 'fr-FR-SylvieNeural');
await edgeSample(6, '06_neural_henri_homme.mp3', 'fr-FR-HenriNeural');
console.log('DONE');
