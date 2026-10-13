import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const origin = process.env.VOICE_TEST_ORIGIN || 'https://armpacademiav2.vercel.app';
const accountsFile = process.env.VOICE_TEST_ACCOUNTS_FILE;
if (!accountsFile) throw new Error('Définissez VOICE_TEST_ACCOUNTS_FILE avec le fichier privé des comptes de test.');
const output = process.env.VOICE_TEST_OUTPUT_DIR;
const config = await (await fetch(`${origin}/api/tts/settings`, { signal: AbortSignal.timeout(15000) })).json();
if (!config.availability?.cartesia && !config.availability?.elevenlabs && !config.availability?.gemini) throw new Error('Aucun fournisseur studio configuré sur ce déploiement.');
const { accounts } = JSON.parse(await readFile(accountsFile, 'utf8'));
const account = accounts.find(a => a.role === 'independant') || accounts[0];
const login = await fetch(`${origin}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify({ email: account.email, password: account.password }), signal: AbortSignal.timeout(15000) });
if (!login.ok) throw new Error(`Connexion du compte de test refusée (${login.status}).`);
const cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
const report = { studioMode: config.defaultVoiceMode, providersConfigured: config.availability, voices: [] };
try {
  for (const voice of ['henri', 'vivienne']) {
    const started = performance.now();
    const response = await fetch(`${origin}/api/ai/tts`, { method: 'POST', headers: { 'content-type': 'application/json', cookie, origin }, body: JSON.stringify({ text: 'Bonjour. Examinons votre dossier avec méthode.', voice }), signal: AbortSignal.timeout(40000) });
    const data = await response.json();
    const audio = Buffer.from(data.audioData || data.audioBase64 || '', 'base64');
    if (!response.ok || audio.length < 256) throw new Error(`Synthèse ${voice} indisponible (${response.status}).`);
    const item = { voice, provider: data.provider, mimeType: data.mimeType, bytes: audio.length, boundaries: data.wordBoundaries?.length || 0, phonemes: data.phonemeBoundaries?.length || 0, timingSource: data.timingSource, elapsedMs: Math.round(performance.now() - started) };
    if (output) { await mkdir(output, { recursive: true }); await writeFile(path.join(output, `production-${voice}.${data.mimeType === 'audio/wav' ? 'wav' : 'mp3'}`), audio); }
    report.voices.push(item);
  }
  console.log(JSON.stringify(report));
} finally {
  await fetch(`${origin}/api/auth/logout`, { method: 'POST', headers: { 'content-type': 'application/json', cookie, origin }, signal: AbortSignal.timeout(10000) });
}
