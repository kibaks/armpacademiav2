import { explanationReview, EXPLANATION_REVISION_POLICY } from '../shared/tutorExplanationContract.js';
import { learnerLevelGuidance, type LearningStage } from '../shared/learnerProgression.js';
import { TUTOR_RESPONSE_POLICY } from '../shared/tutorReplyPolicy.js';

export function qwenTutorConfig(env: NodeJS.ProcessEnv = process.env) {
  if (env.TUTOR_LLM_PROVIDER === 'legacy') return null;
  const key = env.QWEN_API_KEY || env.MUSETALK_API_KEY;
  try {
    const url = new URL(env.QWEN_API_URL || `${(env.MUSETALK_API_URL || '').replace(/\/$/, '')}/chat`);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !key) return null;
    return { url: url.href, key };
  } catch { return null; }
}

// The gateway only exposes the fixed local tutor model; credentials stay server-side.
export async function generateQwenTutor(prompt: string, options: { stage?: LearningStage; authoring?: boolean; env?: NodeJS.ProcessEnv; fetcher?: typeof fetch } = {}) {
  const config = qwenTutorConfig(options.env);
  if (!config) throw new Error('QWEN_NOT_CONFIGURED');
  const deadline=AbortSignal.timeout(45000);
  for (let attempt=0;attempt<2;attempt++) {
  const response = await (options.fetcher || fetch)(config.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${config.key}` },
    body: JSON.stringify({ system: options.authoring ? 'Vous êtes un assistant de conception pédagogique pour les formateurs d’ARMP Academia. Respectez exactement le format demandé. Utilisez uniquement le contenu fourni : ne créez aucune loi, aucun seuil, article ou fait absent du contenu. Les sorties sont des brouillons à relire. Restez concis : moins de 450 mots, complétez toujours la structure demandée.' : TUTOR_RESPONSE_POLICY + '\n' + learnerLevelGuidance(options.stage || 'Initiation') + (attempt ? '\n' + EXPLANATION_REVISION_POLICY : ''), prompt: attempt ? prompt + '\n\nRévision de forme demandée : écris une nouvelle réponse avec un exemple entièrement qualitatif. Écris les mots « Exemple fictif : ». Dans cet exemple, décris seulement les usages et les caractéristiques à définir ; aucune quantité, dimension, capacité, somme ou durée ne t’a été donnée. Ne complète pas ces informations. Termine par le point à vérifier.' : prompt }),
    signal: deadline, redirect: 'error',
  });
  if (!response.ok) throw new Error(`QWEN_HTTP_${response.status}`);
  const data = await response.json();
  if (typeof data.reply !== 'string' || !data.reply.trim() || data.reply.length > 12000 || data.model !== 'academia-tuteur') throw new Error('QWEN_INVALID_RESPONSE');
  const reply=data.reply.trim();
  if (!options.authoring && explanationReview(prompt,reply)) {
    if (attempt===0) continue;
    throw new Error('QWEN_INVALID_EXPLANATION');
  }
  return reply;
  }
  throw new Error('QWEN_INVALID_EXPLANATION');
}

export const generateQwenAuthor: typeof generateQwenTutor = (prompt,options={}) => generateQwenTutor(prompt,{...options,authoring:true});
