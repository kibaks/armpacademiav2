import { GoogleGenAI } from '@google/genai';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// One explicit submission; subsequent calls only resume the saved operation.
const outputDir = path.resolve('.runtime-tmp/veo-tutor');
await mkdir(outputDir, { recursive: true });
const statePath = path.join(outputDir, 'operation.json');
const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error('GEMINI_API_KEY est requise côté serveur.');
const ai = new GoogleGenAI({ apiKey: key });
const model = 'veo-3.1-lite-generate-preview';
const prompt = 'Single continuous fixed-camera medium portrait shot of the same adult female tutor as the input image. Preserve her identity, cream blazer, hairstyle and blue-gray background. She looks at the viewer and speaks clearly in French: « Bonjour. Pour comparer les offres, appliquons les mêmes critères à tous les candidats. » Natural French female voice, eloquent and warm. Crisp lips, consistent teeth, precise speech articulation, subtle natural blinks and a gentle affirmative head nod. Coherent head, neck and shoulders. Hands remain outside the frame. No camera movement, zoom, cuts, double exposure, text, music or background speech. Start and finish naturally with lips at rest. Eight seconds.';
let operation;
try { operation = JSON.parse(await readFile(statePath, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

if (!operation) {
  if (!process.argv.includes('--submit')) {
    const available = await ai.models.get({ model });
    console.log(JSON.stringify({ model: available.name, ready: true, durationSeconds: 8, resolution: '720p', estimatedUsd: 0.40 }));
    process.exit(0);
  }
  // A marker prevents accidental duplicate billing after an uncertain request.
  const marker = path.join(outputDir, 'submission-started.json');
  await writeFile(marker, JSON.stringify({ model, prompt, startedAt: new Date().toISOString() }, null, 2), { flag: 'wx', mode: 0o600 });
  const portrait = await readFile('public/assets/tutrice-portrait-v1.jpg');
  operation = await ai.models.generateVideos({ model, prompt, image: { imageBytes: portrait.toString('base64'), mimeType: 'image/jpeg' }, config: { numberOfVideos: 1, durationSeconds: 8, resolution: '720p', aspectRatio: '9:16', personGeneration: 'allow_adult' } });
} else if (!operation.done) {
  operation = await ai.operations.getVideosOperation({ operation });
}
await writeFile(statePath, JSON.stringify(operation, null, 2), { mode: 0o600 });
if (operation.error) throw new Error(JSON.stringify(operation.error));
const video = operation.response?.generatedVideos?.[0]?.video;
if (operation.done && video) {
  const destination = path.join(outputDir, 'tutrice-veo-lite.mp4');
  await ai.files.download({ file: video, downloadPath: destination });
  console.log(JSON.stringify({ done: true, destination }));
} else {
  console.log(JSON.stringify({ done: !!operation.done, operation: operation.name, filtered: operation.response?.raiMediaFilteredCount ?? 0 }));
}
