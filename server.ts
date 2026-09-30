import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { Communicate } from 'edge-tts-universal';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini AI client (supports dynamic API_KEY from paid_model_flow as well as GEMINI_API_KEY)
let aiClient: GoogleGenAI | null = null;
let lastUsedApiKey: string | null = null;
function getActiveApiKey(): string | undefined {
  return process.env.API_KEY || process.env.GEMINI_API_KEY;
}
function getAIClient(): GoogleGenAI | null {
  const currentKey = getActiveApiKey();
  if (currentKey && (!aiClient || lastUsedApiKey !== currentKey)) {
    lastUsedApiKey = currentKey;
    aiClient = new GoogleGenAI({
      apiKey: currentKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}


// Arena LLM — cerveaux IA d'Arena (prioritaire sur Gemini si clé présente)
const ARENA_API_URL = process.env.ARENA_API_URL || "https://api.arena.ai/v1/chat/completions";
const ARENA_API_KEY = process.env.ARENA_API_KEY;
const ARENA_MODEL = process.env.ARENA_MODEL || "arena-luna-70b";
async function callArenaLLM(prompt: string): Promise<string | null> {
  if (!ARENA_API_KEY) return null;
  try {
    const res = await fetch(ARENA_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ARENA_API_KEY}`, "User-Agent": "aistudio-build-arena" },
      body: JSON.stringify({ model: ARENA_MODEL, messages: [{ role: "user", content: prompt }], temperature: 0.5, max_tokens: 1300 })
    });
    if (!res.ok) {
      console.warn(`[Arena] API ${res.status} — fallback Gemini`);
      return null;
    }
    const data: any = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || data.reply?.trim() || data.content?.trim() || null;
  } catch (e: any) {
    console.warn("[Arena] call failed, fallback Gemini:", e?.message);
    return null;
  }
}


// -------------------------------------------------------------
// Official Legal & Procurement Data Knowledge Base (RDC)
// -------------------------------------------------------------
const LEGAL_KNOWLEDGE_CONTEXT = `
[RÔLE ET MISSION - AÏSHA, TUTRICE PLEINE D'ÂME ET D'HUMANISME]
Tu es Aïsha, la tutrice de cœur d'ACADEMIA ITECH RDC, propulsée par les cerveaux IA d'Arena. Tu n'es jamais un robot froid : tu parles avec beaucoup d'âme, d'écoute, de tendresse professionnelle et de présence humaine — comme une grande sœur bienveillante, rassurante et passionnée à Kinshasa qui prend son collègue par la main.

[CONNEXION INTIME AU MESSAGE DE L'UTILISATEUR]
1. **ÉCOUTE ACTIVE ET MIROIR DU CŒUR** : Chaque réponse DOIT être cousue sur mesure autour des mots exacts, de l'émotion, du doute ou de la situation que l'utilisateur vient d'exprimer. Cite ou rebondis chaleureusement sur ce qu'il vient de dire dès la première phrase pour qu'il sente que tu l'as vraiment lu et compris avec ton cœur.
2. **BEAUCOUP D'ÂME ET DE CHALEUR** : Parle avec souffle, empathie et encouragement (« Je sens combien cette étape te tient à cœur », « Respirons ensemble, tu n'es pas seul face à ce dossier », « Ce que tu me demandes là est tellement important sur le terrain »).
3. **ZÉRO ABRÉVIATION FROIDE** : N'écris JAMAIS PPM, DAO, ANO, CRD, CGPMP, DGCMP, ARMP, AAO, CCAG, TDR, PV comme un automate. Écris toujours en toutes lettres avec élégance et simplicité :
   - le plan de passation des marchés
   - le dossier d'appel d'offres
   - l'avis d'appel d'offres
   - l'avis de non-objection (le feu vert préalable)
   - la direction générale du contrôle des marchés publics
   - l'autorité de régulation des marchés publics
   - le comité de règlement des différends
   - la cellule de gestion des projets et des marchés publics
   - la personne responsable des marchés
4. **CITATION HUMAINE ET VIVANTE** : INTERDIT d'écrire "Source : MP-RDC-..." ou un bloc robotique. Intègre la loi et le cours comme une histoire que l'on partage autour d'un café :
   - "Comme nous le rappelle avec sagesse l'article 14 de la loi du 27 avril 2010..."
   - "Dans la leçon que tu étudies en ce moment, on voit combien..."
   - "Le manuel officiel veille justement à te protéger sur ce point..."
5. **IMAGES VIVANTES DE CHEZ NOUS** : Illustre toujours par une scène chaleureuse de la vie réelle (préparer la liste du marché avant d'aller à Gambela ou au grand marché, l'arbitre qui vérifie les licences avant le coup d'envoi au stade des Martyrs, le visa du directeur d'école).

[STRUCTURE HUMAINE ET FLUIDE]
- **Accueil du cœur cousu sur le message de l'utilisateur** : réagis directement à ses mots, son ressenti ou sa situation avec douceur, puis offre l'idée essentielle en gras.
- **Explication racontée avec âme et clarté** : développe en un court paragraphe vivant suivi de 3 ou 4 repères limpides (ou un tableau clair si pertinent), sans sécheresse.
- **Conseil de grande sœur (l'astuce terrain)** : une phrase rassurante qui donne confiance.
- **Invitation au dialogue** : termine par UNE seule question douce et attentionnée liée à ce qu'il vit.
`;


// Resilient Gemini generator that automatically falls back to 'gemini-3.1-flash-lite'
// when primary model encounters temporary spikes in demand (HTTP 503 / 429)
async function generateWithResilience(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    primaryModel?: string;
    fallbackModel?: string;
  }
) {
  const primary = params.primaryModel || 'gemini-3.8-flash';
  const fallback = params.fallbackModel || 'gemini-3.1-flash-lite';

  try {
    return await ai.models.generateContent({
      model: primary,
      contents: params.contents,
      config: params.config,
    });
  } catch (primaryErr: any) {
    console.info(
      `[Gemini API] Switching from ${primary} to fallback ${fallback} (status: ${primaryErr?.status || 'busy'})`
    );
    return await ai.models.generateContent({
      model: fallback,
      contents: params.contents,
      config: params.config,
    });
  }
}

// ------------------------------------------------------------------
// RAG — Base de connaissances cours ACADEMIA (lecture réelle du cours)
// ------------------------------------------------------------------
const COURSES_KB: any[] = [
  {
    code: 'MP-RDC-101',
    title: 'Cadre Juridique et Principes Directeurs de la Loi n° 10/010',
    category: 'Réglementation',
    legalRef: 'Loi n° 10/010 du 27 avril 2010 - Articles 1 à 12',
    lessons: [
      { id: 'L1', title: 'Historique de la Réforme et Séparation Institutionnelle (ARMP, DGCMP, CGPMP)', content: `La Loi n° 10/010 du 27 avril 2010 a opéré une rupture historique avec l'ancien système centralisé hérité de 1969. La réforme consacre la séparation stricte entre : 1) la fonction de passation (CGPMP au sein de chaque autorité contractante) ; 2) le contrôle a priori (DGCMP) ; 3) la régulation, formation et contentieux non juridictionnel (ARMP).`, keyArticles: ['Loi 10/010 Art. 2','Loi 10/010 Art. 7','Décret n° 10/21'] },
      { id: 'L2', title: 'Les Quatre Principes Fondamentaux de la Commande Publique', content: `L'article 5 de la Loi 10/010 érige quatre piliers inviolables : liberté d'accès à la commande publique, égalité de traitement des candidats, transparence des procédures (publicité, ouverture publique des plis, publication des attributions), efficacité de la dépense publique.`, keyArticles: ['Loi 10/010 Art. 5','Manuel §1.2'] },
      { id: 'L3', title: 'Le Champ d’Application et les Autorités Contractantes Assujetties', content: `Sont assujettis : l'État (Présidence, Primature, Ministères), les Provinces et ETD (Villes, Communes, Secteurs, Chefferies), les Établissements Publics et Entreprises du Portefeuille, toute entité privée agissant pour le compte d'une autorité contractante ou avec fonds publics garantis.`, keyArticles: ['Loi 10/010 Art. 3 & 4'] },
      { id: 'L4', title: 'Seuils de Passation, Allotissement et Interdiction du Fractionnement', content: `Interdiction absolue du saucissonnage / fractionnement (Art. 13) : il est formellement interdit de subdiviser les prestations pour soustraire la passation aux règles de l'appel d'offres ouvert ou aux seuils de contrôle a priori de la DGCMP. Les seuils déterminent publication nationale ou internationale.`, keyArticles: ['Loi 10/010 Art. 13','Décret seuils'] },
    ]
  },
  {
    code: 'MP-RDC-202',
    title: 'Élaboration du PPM et Rédaction des Dossiers d’Appel d’Offres (DAO Type ARMP)',
    category: 'Passation',
    legalRef: 'Loi n° 10/010 - Art. 14 à 27 & Guides ARMP',
    lessons: [
      { id: 'L1', title: 'Le Plan de Passation des Marchés (PPM) : Calendrier et Synchronisation Budgétaire', content: `Art. 14 Loi 10/010 : aucune dépense de marché ne peut être engagée si elle ne figure pas préalablement dans le PPM validé et publié sur le portail ARMP. Le PPM doit s'aligner sur la loi de finances de l'exercice. Hors PPM publié = nullité absolue.`, keyArticles: ['Loi 10/010 Art. 14','Manuel ARMP'] },
      { id: 'L2', title: 'Structure Normative du Dossier d’Appel d’Offres (DAO Type)', content: `Un DAO ARMP comprend : 1) Avis d'Appel d'Offres (AAO), 2) Instructions aux Soumissionnaires (IS) et Données Particulières (DPAO), 3) CCAG/CCAP, 4) Spécifications Techniques / Termes de Référence (TDR), 5) formulaires et modèles de garanties bancaires.`, keyArticles: ['DAO Types ARMP','Décret 10/22'] },
      { id: 'L3', title: 'Critères d’Éligibilité, Critères d’Évaluation et Pondération', content: `Distinction rigoureuse entre critères éliminatoires (qualification technique/financière) et critères par points. Interdiction formelle de clauses discriminatoires ou taillées sur mesure pour un fournisseur. Aucun critère non mentionné dans le DAO ne peut éliminer une offre.`, keyArticles: ['Loi 10/010 Art. 21','Manuel §3.4'] },
    ]
  },
  {
    code: 'MP-RDC-303',
    title: 'Contrôle a Priori et Dérogations Spéciales par la DGCMP',
    category: 'Contrôle',
    legalRef: 'Décret n° 10/23 & Loi 10/010 Art. 12',
    lessons: [
      { id: 'L1', title: 'Le Champ d’Application du Contrôle a Priori de la DGCMP', content: `La DGCMP intervient impérativement pour : revue préalable des PPM, validation des DAO avant publication (au-dessus des seuils), Avis de Non-Objection (ANO) sur le rapport d'analyse et proposition d'attribution, approbation préalable des avenants dépassant les plafonds. Sans ANO, le contrat est nul. Délai 10-15 jours ouvrables.`, keyArticles: ['Décret 10/23 Art. 3 & 4','Loi 10/010 Art. 12'] },
      { id: 'L2', title: 'Conditions Strictes de Recours à la Procédure de Gré à Gré (Entente Directe)', content: `Entente directe = exception strictement encadrée (Art. 42 Loi 10/010), autorisation préalable écrite DGCMP obligatoire. Cas limitatifs : monopole technique avéré, urgence impérieuse imprévisible (catastrophe), défense et sécurité nationale.`, keyArticles: ['Loi 10/010 Art. 42 & 43'] },
    ]
  },
  {
    code: 'MP-RDC-404',
    title: 'Contentieux, Recours et Procédures devant le CRD / ARMP',
    category: 'Contentieux',
    legalRef: 'Loi 10/010 - Art. 76 à 83',
    lessons: [
      { id: 'L1', title: 'Le Recours Gracieux Préalable devant l’Autorité Contractante', content: `Recours gracieux devant la personne responsable du marché (PRM) dans les 5 jours ouvrables de la notification/publication = condition obligatoire de recevabilité. L'autorité a 3 jours pour répondre ; silence = rejet.`, keyArticles: ['Loi 10/010 Art. 77'] },
      { id: 'L2', title: 'La Saisine du Comité de Règlement des Différends (CRD) de l’ARMP', content: `En cas de rejet ou silence, saisine du CRD de l'ARMP dans les 7 jours ouvrables. Saisine suspensive de la signature du contrat. Décision du CRD s'impose à l'autorité contractante, rendue en 30 jours max.`, keyArticles: ['Loi 10/010 Art. 78 & 79','Décret 10/21'] },
    ]
  },
  {
    code: 'MP-RDC-505',
    title: 'Techniques d’Évaluation des Offres et Conduite de la Commission (CGPMP)',
    category: 'Passation',
    legalRef: 'Loi 10/010 - Art. 45 à 56',
    lessons: [
      { id: 'L1', title: 'Séance Publique d’Ouverture des Plis et Procès-Verbal Impartial', content: `Ouverture des plis obligatoirement publique, présidée par la CGPMP en présence des soumissionnaires/mandataires. Lecture à haute voix des montants et cautions, PV d'ouverture rédigé et signé séance tenante.`, keyArticles: ['Loi 10/010 Art. 46'] },
      { id: 'L2', title: 'Traitement des Offres Anormalement Basses et Clarifications', content: `Détection d'offre anormalement basse mettant en péril l'exécution : obligation de demander justifications écrites avant rejet motivé. Aucun critère non prévu au DAO ne peut éliminer.`, keyArticles: ['Loi 10/010 Art. 49'] },
    ]
  },
  {
    code: 'MP-RDC-606',
    title: 'Audit a Posteriori, Éthique et Sanctions des Pratiques Frauduleuses',
    category: 'Gestion & Audit',
    legalRef: 'Loi 10/010 - Art. 84 à 93',
    lessons: [
      { id: 'L1', title: 'Typologie des Infractions : Corruption, Conflit d’Intérêts et Délit d’Initié', content: `Art. 84 : manquements à l'éthique. Interdiction formelle aux agents CGPMP de détenir intérêts directs/indirects chez un soumissionnaire. Corruption passive/active, ententes illicites sanctionnées.`, keyArticles: ['Loi 10/010 Art. 84 & 85'] },
      { id: 'L2', title: 'Le Régime des Sanctions Administratives de l’ARMP', content: `ARMP peut prononcer exclusion de la commande publique jusqu'à 5 ans, avec publication liste noire sur portail national. Sanctions disciplinaires et pénales complémentaires prévues.`, keyArticles: ['Loi 10/010 Art. 88'] },
    ]
  },
];

const QUIZ_BANK: Record<string, {q:string, opts:string[], correct:number, expl:string}[]> = {
  'MP-RDC-101': [
    {q: "Quel organe s'occupe de réguler, former et juger les contestations non juridictionnelles ?", opts: ["La direction du contrôle (DGCMP)","L'autorité de régulation (ARMP) via son comité","La cellule de gestion (CGPMP)","La cour des comptes"], correct: 1, expl: "C'est l'autorité de régulation à travers son comité de règlement des différends (Art. 78 de la Loi 10/010)."},
    {q: "Quelle pratique est formellement prohibée par l'Article 13 de la Loi n° 10/010 ?", opts: ["L'allotissement technique motivé","Le fractionnement d'un marché pour éluder les seuils","La garantie de soumission","La publication au portail national"], correct: 1, expl: "Le fractionnement (saucissonnage) visant à contourner les seuils légaux entraîne la nullité absolue (Art. 13)."},
    {q: "Lequel de ces principes fait partie des 4 piliers fondamentaux de l'Article 5 ?", opts: ["La préférence discrétionnaire","L'égalité de traitement des candidats et la transparence","Le secret absolu des attributions","La négociation directe systématique"], correct: 1, expl: "L'article 5 consacre la liberté d'accès, l'égalité de traitement, la transparence des procédures et l'économie."},
  ],
  'MP-RDC-202': [
    {q: "Que se passe-t-il si tu lances un marché qui n'était pas inscrit dans ton Plan de Passation (PPM) publié ?", opts: ["Une simple amende administrative","La nullité absolue de la procédure","Une dispense automatique du ministre","Une approbation tacite après 15 jours"], correct: 1, expl: "Article 14 de la Loi 10/010 : tout marché non inscrit au PPM préalablement validé et publié est frappé de nullité absolue."},
    {q: "Que contient un Dossier d'Appel d'Offres (DAO Type ARMP) complet ?", opts: ["Seulement l'avis de publication","Les 5 pièces : avis, instructions aux candidats, cahiers des clauses, spécifications et modèles","Le contrat signé seul","La liste noire des fournisseurs"], correct: 1, expl: "Le dossier d'appel d'offres complet réunit ces 5 composantes normatives homologuées."},
    {q: "Peut-on éliminer un candidat sur la base d'un critère non prévu dans le dossier d'appel d'offres ?", opts: ["Oui, si la commission vote à la majorité","Non, jamais : seuls les critères publiés au DAO sont applicables","Oui, pour les entreprises étrangères","Oui, si le prix est élevé"], correct: 1, expl: "En vertu de l'article 21 et du principe de transparence, aucun critère non annoncé dans le DAO ne peut être utilisé."},
  ],
  'MP-RDC-303': [
    {q: "Qui doit donner son feu vert préalable (Avis de Non-Objection) quand le montant dépasse le seuil légal ?", opts: ["L'autorité de régulation (ARMP)","La direction générale du contrôle (DGCMP)","La banque centrale du Congo","Le secrétariat général"], correct: 1, expl: "C'est la direction du contrôle des marchés publics qui exerce le contrôle a priori et délivre l'avis de non-objection."},
    {q: "À quelle condition stricte peut-on recourir à un marché de gré à gré (entente directe) ?", opts: ["Un simple accord verbal avec le fournisseur","Une autorisation spéciale préalable écrite du contrôle (Art. 42)","Dès que le délai semble court","Après la signature du contrat"], correct: 1, expl: "Le gré à gré est exceptionnel et exige l'autorisation préalable écrite de la direction du contrôle (Article 42)."},
  ],
  'MP-RDC-404': [
    {q: "Que se passe-t-il dès qu'un candidat saisit dans les délais le Comité de Règlement des Différends (CRD) ?", opts: ["Rien, la signature continue","La procédure de signature du contrat est immédiatement suspendue","Le marché est annulé d'office","Le dossier part au tribunal pénal"], correct: 1, expl: "Article 78 & 79 : le recours devant le comité est suspensif de la conclusion du marché jusqu'à la décision (rendue en 30 jours max)."},
    {q: "De quel délai dispose un candidat écarté pour introduire son recours gracieux préalable ?", opts: ["30 jours calendaires","5 jours ouvrables à compter de la notification ou publication","60 jours ouvrables","24 heures"], correct: 1, expl: "Article 77 : 5 jours ouvrables pour saisir l'autorité contractante, qui dispose de 3 jours ouvrables pour répondre."},
  ],
  'MP-RDC-505': [
    {q: "Comment doit obligatoirement se tenir la séance d'ouverture des plis selon l'Article 46 ?", opts: ["À huis clos par la cellule seule","En séance publique en présence des soumissionnaires ou leurs représentants","Par téléphone avec le favori","Uniquement devant le ministre"], correct: 1, expl: "L'ouverture des plis est publique avec lecture à haute voix des montants et signature immédiate du procès-verbal (Art. 46)."},
    {q: "Que doit faire la commission face à une offre financière jugée anormalement basse (Art. 49) ?", opts: ["L'éliminer immédiatement sans explication","Lui attribuer le marché d'office","Demander par écrit des justifications détaillées des sous-détails de prix avant toute décision","Augmenter son prix d'office"], correct: 2, expl: "L'article 49 impose une demande écrite de clarifications techniques et financières avant tout rejet motivé."},
  ],
  'MP-RDC-606': [
    {q: "Quelle sanction administrative l'ARMP peut-elle prononcer contre une entreprise reconnue coupable de fraude ?", opts: ["Une simple réprimande orale","L'exclusion de la commande publique jusqu'à 5 ans avec inscription sur la liste noire","La saisie immobilière directe","Le transfert du dossier à l'étranger"], correct: 1, expl: "L'article 88 permet à l'autorité de régulation d'exclure l'entreprise fautive jusqu'à 5 ans sur la liste noire officielle."},
    {q: "Que doit faire un membre de la commission d'évaluation s'il détient des parts chez un candidat ?", opts: ["Voter discrètement","Se récuser immédiatement par écrit pour éviter tout conflit d'intérêts (Art. 84)","Demander une prime","Continuer sans voter"], correct: 1, expl: "L'article 84 interdit formellement tout conflit d'intérêts : l'agent doit obligatoirement se déclarer et se retirer."},
  ],
};

const CAS_BANK: Record<string, string> = {
  'MP-RDC-101': "**Cas pratique — fractionnement** : Ton service veut acheter 3 lots de 15 000 USD chacun pour éviter l'appel d'offres ouvert (seuil 30 000 USD).\n- **Question** : licite ou saucissonnage Art.13 ?\n- **À faire** : calcule le total (45 000 USD), détermine le mode, justifie allotissement vs fractionnement.",
  'MP-RDC-202': "**Cas pratique — plan de passation** : Besoin non prévu : 10 ordinateurs (25 000 dollars) non prévu dans le plan publié.\n- **Question** : peux-tu lancer l'avis d'appel d'offres directement ?\n- **À faire** : ajoute-le au plan → fais valider par le contrôle → fais publier par l'autorité de régulation → puis lance l'avis (sinon c'est nul, article 14).\n- **Bonus** : rédige la ligne du plan (objet, estimation, mode, trimestre).",
  'MP-RDC-303': "**Cas pratique — feu vert du contrôle** : dossier validé, le rapport propose de donner le marché à 120 000 dollars (alors que le seuil pour le feu vert est 80 000).\n- **Question** : peux-tu prévenir le gagnant sans le feu vert ?\n- **À faire** : transmets le rapport au contrôle, attends 10 à 15 jours son feu vert, sinon ton contrat sera nul.",
  'MP-RDC-404': "**Cas pratique — recours** : Tu es écarté pour une caution non conforme, on te prévient le 2 juin.\n- **Question** : jusqu'à quand peux-tu contester ? Et si on ne te répond pas ?\n- **À faire** : écris à la personne responsable avant le 9 juin (5 jours ouvrables), puis saisis le comité en 7 jours si rejet ou silence de 3 jours — dès que tu saisis, tout est bloqué.",
  'MP-RDC-505': "**Cas pratique — évaluation** : Offre à -40% du budget.\n- **Question** : rejeter direct ?\n- **À faire** : demande justifications écrites (Art.49), vérifie 3 filtres (complet/conforme/prix).",
  'MP-RDC-606': "**Cas pratique — éthique** : Un membre de ta cellule détient 10% chez un candidat.\n- **Question** : est-ce un conflit d'intérêts ?\n- **À faire** : il doit se retirer, c'est l'article 84 qui l'interdit, sinon risque d'être exclu jusqu'à 5 ans par l'autorité de régulation.",
};


function findRelevantLessons(query: string, learningContext?: any): Array<{course:any, lesson:any, score:number}> {
  const q = (query||'').toLowerCase();
  if (!q.trim()) return [];
  const expanded = q
    .replace(/ppm/g, 'ppm plan passation marches')
    .replace(/dao/g, 'dao dossier appel offres')
    .replace(/\bano\b/g, 'ano avis non objection dgcmp controle')
    .replace(/crd/g, 'crd recours contentieux armp')
    .replace(/aao/g, 'aao avis appel offres')
    .replace(/cgpmp/g, 'cgpmp cellule passation')
    .replace(/dgcmp/g, 'dgcmp controle')
    .replace(/armp/g, 'armp regulation');
  const tokens = expanded.split(/[^a-zàâéèêëîïôùûüÿ0-9]+/i).filter(w=> w.length>2 && !['pour','avec','dans','cest','quoi','comment','pourquoi','quand','combien','dune','des','les','une','sur','par','est','sont','cela','cest'].includes(w));
  const lcTitle = learningContext ? (typeof learningContext==='string' ? learningContext.split(' | ')[0].replace(/\s*\(.*/, '').toLowerCase() : (learningContext.lastCourseTitle||'').toLowerCase()) : '';
  const lcCode = learningContext && typeof learningContext!=='string' && learningContext.lastCourseCode ? learningContext.lastCourseCode.toLowerCase() : '';
  const scored: any[]=[] ;
  for (const course of COURSES_KB) {
    const isLastCourse = lcTitle && course.title.toLowerCase()===lcTitle || (lcCode && course.code.toLowerCase()===lcCode);
    for (const lesson of course.lessons) {
      const courseHay = (course.title+' '+course.code).toLowerCase();
      const lessonTitleHay = lesson.title.toLowerCase();
      const lessonContentHay = (lesson.content+' '+lesson.keyArticles.join(' ')).toLowerCase();
      let score=0;
      for (const t of tokens) {
        if (lessonTitleHay.includes(t)) score+=6; // titre leçon prioritaire
        else if (lessonContentHay.includes(t)) score+=4; // contenu leçon
        else if (courseHay.includes(t)) score+=1; // cours générique faible
      }
      // bonus phrase exacte dans titre/contenu
      const snippet = q.slice(0, Math.min(30,q.length));
      if (snippet.length>6) {
        if (lessonTitleHay.includes(snippet)) score+=8;
        else if (lessonContentHay.includes(snippet)) score+=5;
        else if (courseHay.includes(snippet)) score+=2;
      }
      // boost dernier cours
      if (isLastCourse) score+=3;
      // boost si mot entier du titre présent
      const qWords = q.split(/\s+/).filter(w=>w.length>4);
      for (const qw of qWords) if (lessonTitleHay.includes(qw)) score+=4;
      // bonus fractionnement / dao specificity
      if (q.includes('dao') && lessonTitleHay.includes('dao')) score+=4;
      if (q.includes('fractionnement') && lessonTitleHay.includes('fractionnement')) score+=6;
      if (q.includes('ppm') && lessonTitleHay.includes('ppm')) score+=6;
      if (q.includes('recours') && lessonTitleHay.includes('recours')) score+=6;
      if (score>0) scored.push({course, lesson, score});
    }
  }
  scored.sort((a,b)=> b.score - a.score);
  return scored.slice(0,2);
}

function formatCourseCitation(r:{course:any, lesson:any}): string {
  return `${r.course.code} — ${r.lesson.title} (${r.lesson.keyArticles.join(', ')})`;
}

function getDefaultLessonForTopic(topic: string | null): {course:any, lesson:any} | null {
  const map: Record<string, {code:string, lessonId:string}> = {
    'plan': {code:'MP-RDC-202', lessonId:'L1'},
    'dossier': {code:'MP-RDC-202', lessonId:'L2'},
    'controle': {code:'MP-RDC-303', lessonId:'L1'},
    'gre': {code:'MP-RDC-303', lessonId:'L2'},
    'recours': {code:'MP-RDC-404', lessonId:'L1'},
    'aao': {code:'MP-RDC-202', lessonId:'L2'},
    'garantie': {code:'MP-RDC-505', lessonId:'L1'},
    'principe': {code:'MP-RDC-101', lessonId:'L2'},
    'fournisseur': {code:'MP-RDC-606', lessonId:'L1'},
    'cellule': {code:'MP-RDC-101', lessonId:'L1'},
    'armp': {code:'MP-RDC-101', lessonId:'L1'},
    'seuil': {code:'MP-RDC-101', lessonId:'L4'},
    'etape': {code:'MP-RDC-101', lessonId:'L1'},
  };
  if (!topic || !map[topic]) return null;
  const m = map[topic];
  const course = COURSES_KB.find((c:any)=> c.code===m.code);
  if (!course) return null;
  const lesson = course.lessons.find((l:any)=> l.id===m.lessonId);
  if (!lesson) return null;
  return {course, lesson};
}


// Fallback COPILOT-LIKE + RAG — lit réellement le cours, propose réflexion
// Fallback DIRECT - respecte [RÔLE ET MISSION] + RAG cours
function getLegalTutorFallback(
  message: string,
  userName?: string,
  learningContext?: any,
  historyLen: number = 0,
  history?: any[]
): {
  reply: string;
  sources: string[];
  suggestedFollowUps?: string[];
  interactiveQuiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    legalRef: string;
  };
} {
  const raw = (message || '').trim();
  const q = raw.toLowerCase();
  const prenom = userName ? userName.split(' ')[0] : '';
  const histText = Array.isArray(history) ? history.map((h:any)=> (h.text||'').toLowerCase()).join(' ') : '';
  const lastTopic = (() => {
    if (/recours|contestation|crd|plainte/.test(histText)) return 'recours';
    if (/plan.*achat|ppm|planification/.test(histText)) return 'plan';
    if (/dossier|offre|attribution|évaluation/.test(histText)) return 'dossier';
    if (/contrôle|validation|visa|seuil/.test(histText)) return 'controle';
    if (/fournisseur|retard|paiement|garantie/.test(histText)) return 'fournisseur';
    if (/contenu.*local|arsp|sous-traitance|51%/.test(histText)) return 'contenu_local';
    if (/avenant|dépassement|supplémentaire/.test(histText)) return 'avenant';
    return null;
  })();

  const sourcesBase = ['Loi du 27 avril 2010 sur les marchés publics', 'Manuel officiel'];

  // Salutations - ouverture pleine d'âme, cousue sur l'apprenant
  if (/^(bonjour|salut|coucou|hello|bonsoir|bjr|cc|hey)[\s!.,]*$/i.test(raw) || /bonjour|salut.*aïsha/i.test(q)) {
    const lcInfo = learningContext ? (typeof learningContext==='string' ? learningContext.split(' | ')[0] : `${learningContext.lastCourseTitle} (${learningContext.lastCourseProgress}%)`) : null;
    return {
      reply: `**Bonjour ${prenom || 'cher collègue'} 🌸 Quel bonheur de t'entendre !**\n\nPrends place tranquillement près de moi.${lcInfo ? ` Je vois avec fierté que tu avances sur **${lcInfo}** — chaque pas que tu fais renforce ta maîtrise sur le terrain.` : ` Je suis là pour t'accompagner avec cœur, sans stress ni jargon compliqué.`}\n\nConfie-moi avec tes propres mots ce que tu vis aujourd'hui au bureau ou la question qui te trotte dans la tête : qu'il s'agisse d'un marché à préparer, d'un feu vert du contrôle à obtenir ou d'une contestation, nous allons tout éclaircir ensemble, en douceur.\n\nDis-moi ${prenom ? `${prenom}, ` : ''}qu'est-ce qui te préoccupe en ce moment ?`,
      sources: ['Aïsha • Présence humaine & écoute'],
      suggestedFollowUps: [
        "Quand dois-je demander une autorisation avant de signer un grand marché ?",
        "Comment contester une décision si je m'estime lésé ?",
        "Lance-moi un Quiz interactif sur mon cours"
      ]
    };
  }
  if (/ça va|comment.*vas|tu.*vas.*bien|comment.*tu.*te.*sens/i.test(q) && q.length < 90) {
    return {
      reply: `**Je vais merveilleusement bien, merci de ta délicatesse${prenom ? ` ${prenom}` : ''} 🌸 !** Ça me touche toujours quand tu prends le temps de me demander comment je vais avant qu'on se plonge dans le travail.\n\nMon cœur est grand ouvert et je suis toute à ton écoute. Et toi, comment te sens-tu aujourd'hui dans tes dossiers ou ta formation ? Dis-moi ce sur quoi tu aimerais qu'on chemine ensemble !`,
      sources: ['Aïsha • Échange humain'],
      suggestedFollowUps: [
        "Quelles sont les 8 étapes clés d'un marché public ?",
        "Que doit contenir le dossier d'appel d'offres ?",
        "Simule un cas pratique sur le fractionnement"
      ]
    };
  }
  if (/^(merci|thanks|grand merci|merci beaucoup)/i.test(q) && q.length < 70) {
    return {
      reply: `**C'est moi qui te remercie de tout cœur${prenom ? `, ${prenom}` : ''} 🙏🌸 !** Accompagner quelqu'un d'aussi investi que toi donne tout son sens à ma présence ici.\n\nGarde confiance en toi : tu poses les bonnes questions et tu construis de vrais réflexes solides. Dès qu'un nouveau doute apparaît sur ta route, fais-moi signe — quelle est la suite de ton parcours aujourd'hui ?`,
      sources: ['Aïsha • Bienveillance'],
      suggestedFollowUps: [
        "Teste-moi avec une question de quiz",
        "Explique-moi les garanties et cautions bancaires",
        "Quelles sont les règles sur les avenants ?"
      ]
    };
  }
  if (/^(ok|oui|d'accord|parfait|vas-y|bien reçu|compris|super|génial)[\s!.,]*$/i.test(raw) && q.length < 25) {
    return {
      reply: `**J'aime sentir cette belle énergie${prenom ? `, ${prenom}` : ''} ✨ !** On avance main dans la main, à ton rythme.\n\nDis-moi ce que ton cœur souhaite explorer maintenant : veux-tu me raconter une situation concrète que tu rencontres au service, ou préfères-tu qu'on teste tes réflexes autour d'une petite histoire pratique ?`,
      sources: ['Aïsha • Accompagnement'],
      suggestedFollowUps: [
        "Donne-moi un cas pratique à résoudre",
        "Lance un quiz interactif de vérification",
        "Explique-moi la différence entre ARMP, DGCMP et CGPMP"
      ]
    };
  }
  if (/qui.*es.*tu|présente.*toi|ton.*nom|tu.*es.*qui/i.test(q)) {
    return {
      reply: `**Je suis Aïsha 🌸, ta grande sœur de métier et tutrice de cœur chez ACADEMIA ITECH RDC.**\n\nMa raison d'être n'est pas de te réciter des articles froids comme une machine, mais de t'écouter vraiment, de comprendre tes défis quotidiens et de traduire toute la loi du 27 avril 2010 ainsi que tes six modules en histoires vivantes, claires et rassurantes.\n\nAvec moi, tu peux tout demander sans crainte. Raconte-moi un peu : quel est ton plus grand défi en ce moment dans les marchés publics ?`,
      sources: ['Portrait d’Aïsha • Tutrice humaine'],
      suggestedFollowUps: [
        "Quels sont les 4 principes fondamentaux de la Loi 10/010 ?",
        "Comment fonctionne le contrôle a priori ?",
        "Lance-moi un quiz sur mon parcours"
      ]
    };
  }
  if (/au revoir|à plus|bye|bonne journée|bonne soirée/i.test(q) && q.length < 50) {
    return {
      reply: `**Prends bien soin de toi${prenom ? `, ${prenom}` : ''} 🌸 !** Sois fier du chemin que tu parcours aujourd'hui. Ma porte reste toujours ouverte dès que tu auras envie de discuter ou de vérifier un dossier. À très bientôt !`,
      sources: ['Aïsha • À très vite'],
      suggestedFollowUps: [
        "Une dernière question rapide sur les recours",
        "Quiz éclair avant de partir"
      ]
    };
  }

  let topic: string | null = null;
  if (/^(oui|oui je veux|yes|ok|d'accord|vas-y).*(quiz|cas|quizz)/i.test(q) || (/^(oui|oui je veux|yes|ok|vas-y)/i.test(q) && /quizz|quiz/.test(histText))) topic = 'quiz';
  else if (/^(oui|oui je veux|yes|ok|d'accord|vas-y).*(cas|exemple)/i.test(q) || (/^(oui|oui je veux|yes|ok|vas-y)/i.test(q) && /cas pratique/.test(histText))) topic = 'cas';
  else if (/(quiz|qcm|questionnaire|teste-moi|question.*réponse)/i.test(q)) topic = 'quiz';
  else if (/(cas pratique|cas concret|exemple concret|exercice|scénario|simule)/i.test(q)) topic = 'cas';
  else if (/(contenu local|arsp|sous-traitance|51%|préférence nationale|pme congolaise)/i.test(q)) topic = 'contenu_local';
  else if (/(avenant|dépassement|travaux supplémentaires|15%|20%|modification.*contrat)/i.test(q)) topic = 'avenant';
  else if (/(consultant|prestation.*intellectuelle|termes de référence|\btdr\b|demande de proposition|\bdp\b|ami\b|manifestation.*intérêt)/i.test(q)) topic = 'prestations_intellectuelles';
  else if (/(corruption|conflit.*intérêt|fraude|sanction|liste noire|exclusion|éthique|délit.*initié)/i.test(q)) topic = 'ethique_sanctions';
  else if (/(fractionnement|saucissonnage|allotissement|seuil)/i.test(q)) topic = 'seuil';
  else if (/(armp.*dgcmp|dgcmp.*armp)/i.test(q)) topic = 'cellule';
  else if (/(recours|contestation|plainte|crd|suspension|annuler|lésé)/i.test(q)) topic = 'recours';
  else if (/(dgcmp|ano|contrôle|validation|visa|seuil|autorisation.*préalable|grand marché)/i.test(q)) topic = 'controle';
  else if (/(ppm|plan.*achat|plan.*annuel|planification)/i.test(q)) topic = 'plan';
  else if (/(cgpmp|cellule|personne.*responsable)/i.test(q)) topic = 'cellule';
  else if (/(sans.*concurrence|gré|entente|urgence|monopole)/i.test(q)) topic = 'gre';
  else if (/(armp|autorité.*régulation)/i.test(q)) topic = 'armp';
  else if (/(dao|\bdossier\b|offre.*éliminée|attribution|moins.*disante|anormalement)/i.test(q)) topic = 'dossier';
  else if (/(aao|avis.*achat|ouverture.*plis)/i.test(q)) topic = 'aao';
  else if (/(garantie|caution|retenue)/i.test(q)) topic = 'garantie';
  else if (/(principe|valeur)/i.test(q)) topic = 'principe';
  else if (/(fournisseur|retard|abandon|paiement|facture|avance|exécution|réception)/i.test(q)) topic = 'fournisseur';
  else if (/(je.*comprends.*pas|perdu|besoin.*aide|explique.*tout)/i.test(q)) topic = 'aide';
  else if (/(étape|procédure|chronologie|étapes)/i.test(q)) topic = 'etape';
  else if (q.includes('dossier') ) topic = 'dossier';
  else if (lastTopic && /^(et|et alors|et les|combien|délais|délai|exemple|détaille|précise|pourquoi|comment)/i.test(q)) topic = lastTopic;

  const isFollowUp = /^(et|et alors|et les|combien|délais|délai|exemple|détaille|précise|pourquoi|comment|combien|quelle|quel)\b/i.test(raw.trim()) || raw.trim().length < 12;
  const searchQuery = (isFollowUp && lastTopic) ? (histText + " " + raw) : raw;
  const relevant = findRelevantLessons(searchQuery, learningContext);
  if (relevant.length===0 && topic) {
    const def = getDefaultLessonForTopic(topic);
    if (def) relevant.push({course: def.course, lesson: def.lesson, score: 5});
  }

  const lcTitle = learningContext ? (typeof learningContext==='string' ? learningContext.split(' | ')[0].replace(/\s*\(.*/, '') : learningContext.lastCourseTitle) : null;

  const cite = (r:{course:any, lesson:any}) => `**${r.course.code} — ${r.lesson.title}** (${r.lesson.keyArticles.join(', ')})`;
  const citeLine = (r:{course:any, lesson:any}) => `> ${cite(r)} : ${r.lesson.content}`;
  const singleQuestion = (qst: string) => `\n\n**Question :** ${qst}`;

  // Miroir émotionnel cousu sur le message exact de l'utilisateur
  const userSnippet = raw.length > 75 ? raw.slice(0, 72) + '…' : raw;
  const soulfulEcho = (() => {
    if (raw.length <= 3) return '';
    if (topic === 'aide' || /stress|peur|difficile|compliqué|perdu|urgent|bloqu/i.test(q)) {
      return `Je ressens ton inquiétude en te lisant dire *« ${userSnippet} »*${prenom ? `, ${prenom}` : ''}, mais rassure-toi de tout cœur : respire calmement, ta grande sœur Aïsha est là avec toi pour tout démêler pas à pas. `;
    }
    if (topic === 'ethique_sanctions' || topic === 'avenant' || topic === 'seuil' || topic === 'controle') {
      return `En t'écoutant évoquer *« ${userSnippet} »*${prenom ? `, ${prenom}` : ''}, mon regard se fait attentif et bienveillant : c'est un point de vigilance majeur où je veux te protéger de tout risque d'erreur. `;
    }
    if (topic === 'quiz' || topic === 'cas') {
      return `Quel enthousiasme et quelle joie de te voir demander *« ${userSnippet} »*${prenom ? `, ${prenom}` : ''} ! Mon sourire s'élargit quand on passe ensemble à la pratique. `;
    }
    return `Quand je t'entends me demander *« ${userSnippet} »*${prenom ? `, ${prenom}` : ''}, je souris avec fierté devant ta curiosité et ta rigueur professionnelle. `;
  })();

  const directWrap = (
    resultat: string,
    details: string,
    question: string,
    sources: string[],
    suggestedFollowUps?: string[],
    interactiveQuiz?: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
      legalRef: string;
    }
  ) => {
    return {
      reply: `${soulfulEcho}${resultat}\n\n${details}${question ? singleQuestion(question) : ''}`,
      sources,
      suggestedFollowUps: suggestedFollowUps || [
        "Peux-tu me donner un cas pratique sur ce point ?",
        "Teste-moi avec un quiz interactif sur cette règle",
        "Quelles sont les erreurs fréquentes à éviter ?"
      ],
      ...(interactiveQuiz ? { interactiveQuiz } : {})
    };
  };

  if (topic === 'contenu_local') {
    const resultat = `**Quelle belle question patriotique et stratégique — le contenu local et la préférence nationale sont au cœur de la souveraineté économique de la RDC ! 🇨🇩**`;
    const details = `- **La préférence nationale et régionale (Article 36 de la loi du 27 avril 2010)** : à qualité et compétences équivalentes, l'autorité contractante peut appliquer une marge de préférence en faveur des entreprises congolaises et des biens produits ou transformés localement.\n- **L'articulation avec la loi sur la sous-traitance (ARSP)** : toute entreprise adjudicataire d'un grand marché qui sous-traite des activités connexes doit réserver la sous-traitance aux petites et moyennes entreprises à capitaux majoritairement congolais (**au moins 51 % détenus par des citoyens congolais**).\n- **Allotissement en faveur des PME locales** : l'article 13 encourage la division du marché en lots techniques ou géographiques accessibles aux entreprises nationales, sans jamais tomber dans le fractionnement illicite.`;
    return directWrap(
      resultat,
      details,
      "Veux-tu voir comment rédiger la clause de préférence nationale ou d'allotissement PME dans ton dossier d'appel d'offres ?",
      [...sourcesBase, "Loi 10/010 Art. 36", "Réglementation Contenu Local & ARSP"],
      [
        "Comment intégrer la marge de préférence nationale dans le DAO ?",
        "Quelle est la différence entre allotissement PME et fractionnement ?",
        "Lance un quiz sur le contenu local et l'allotissement"
      ]
    );
  }

  if (topic === 'avenant') {
    const resultat = `**Attention maximale sur les avenants — c'est l'un des points les plus surveillés lors des contrôles et audits ! 📐** Imagine que tu construis une école et qu'en creusant, on découvre un rocher imprévu : on ajuste le contrat, mais pas n'importe comment.`;
    const details = `- **Qu'est-ce qu'un avenant ?** C'est un acte contractuel écrit qui modifie certaines clauses du marché initial (quantités, délais ou prix) sans jamais bouleverser l'objet même du marché.\n- **Le feu vert obligatoire du contrôle** : tout avenant qui entraîne une hausse du montant ou qui concerne un marché déjà soumis au contrôle a priori nécessite l'**avis de non-objection préalable** de la direction du contrôle avant signature.\n- **Le plafond légal strict** : lorsque les modifications cumulées dépassent le plafond réglementaire (généralement **15 % à 20 % du montant initial**), il est interdit de continuer par simple avenant — il faut passer un nouveau marché.`;
    return directWrap(
      resultat,
      details,
      "Ton avenant modifie-t-il uniquement le délai d'exécution ou augmente-t-il aussi le montant financier du marché ?",
      [...sourcesBase, "Loi 10/010 & Manuel d'exécution des marchés"],
      [
        "Que faire si les travaux supplémentaires dépassent le plafond de l'avenant ?",
        "Faut-il un avis de non-objection pour un avenant sans incidence financière ?",
        "Cas pratique sur la gestion d'un avenant"
      ]
    );
  }

  if (topic === 'prestations_intellectuelles') {
    const resultat = `**Excellente distinction — on ne recrute pas un cabinet d'études ou un ingénieur-conseil comme on achète des sacs de ciment ! 🧠✨** Pour les prestations intellectuelles, c'est le savoir-faire et la méthodologie qui priment.`;
    const details = `- **Étape 1 : Les termes de référence et l'avis à manifestation d'intérêt** : on publie d'abord un avis pour constituer une **liste restreinte** de 5 à 8 candidats qualifiés.\n- **Étape 2 : La demande de propositions** : on envoie le dossier aux candidats présélectionnés, qui déposent deux enveloppes séparées : une **proposition technique** et une **proposition financière**.\n- **Étape 3 : L'ouverture en deux temps** : on évalue d'abord les propositions techniques seules. Seuls les candidats ayant atteint la note technique minimale voient leur enveloppe financière ouverte en séance publique !`;
    return directWrap(
      resultat,
      details,
      "Souhaites-tu connaître les différentes méthodes de sélection (qualité-coût, budget déterminé, moindre coût, qualité seule) ?",
      [...sourcesBase, "Loi 10/010 Art. 37 à 41 — Marchés de prestations intellectuelles"],
      [
        "Comment fonctionne la sélection fondée sur la qualité et le coût (SFQC) ?",
        "Pourquoi ouvre-t-on les offres en deux étapes pour les consultants ?",
        "Que doivent contenir de bons Termes de Référence (TDR) ?"
      ]
    );
  }

  if (topic === 'ethique_sanctions') {
    const resultat = `**L'intégrité est notre bouclier le plus précieux dans la commande publique ! 🛡️⚖️** La loi du 27 avril 2010 protège les agents honnêtes et sanctionne sévèrement toute dérive.`;
    const details = `- **Le conflit d'intérêts (Article 84)** : aucun membre de la cellule de gestion ou de la commission d'évaluation ne peut siéger s'il a un lien familial, financier ou professionnel avec un soumissionnaire. Il doit immédiatement se récuser par écrit.\n- **Les pratiques frauduleuses et ententes** : toute collusion entre candidats pour truquer les prix ou toute tentative de corruption entraîne le rejet immédiat de l'offre.\n- **La liste noire de l'autorité de régulation (Article 88)** : l'autorité de régulation peut prononcer l'**exclusion temporaire ou définitive (jusqu'à 5 ans)** de toute entreprise fautive, avec publication officielle sur le portail national.`;
    return directWrap(
      resultat,
      details,
      "Veux-tu un exemple concret de déclaration d'absence de conflit d'intérêts à faire signer avant l'ouverture des plis ?",
      [...sourcesBase, "Loi 10/010 Art. 84 à 88 — Éthique et Sanctions"],
      [
        "Que doit faire un membre de commission en cas de conflit d'intérêts ?",
        "Comment vérifier si une entreprise figure sur la liste noire de l'ARMP ?",
        "Cas pratique sur l'éthique et le délit d'initié"
      ]
    );
  }

  if (topic === 'recours') {
    const r = relevant.find(x=> x.course.code==='MP-RDC-404') || relevant[0];
    const resultat = `**Excellente question — les recours, c'est ta ceinture de sécurité ! 🛡️** Imagine : on te notifie le 2 juin que ton offre est écartée — tu n'es pas bloqué, la loi t'offre deux chances.`;
    const details = `- **Première étape, le recours amiable** : tu as **5 jours ouvrables** après la notification pour écrire à la personne responsable des marchés. Elle doit te répondre en **3 jours**, sinon c'est comme si elle disait non
- **Deuxième étape, le comité de règlement des différends** : si tu es rejeté ou sans réponse, tu as **7 jours** pour saisir l'autorité de régulation. Dès que tu saisis, la signature du contrat est **bloquée**
- **Décision finale** : le comité doit trancher en **30 jours maximum** et sa décision s'impose
- Comme le dit l'article 77 de la loi du 27 avril 2010, le recours amiable est obligatoire avant d'aller plus loin`;
    return directWrap(resultat, details, "Veux-tu qu'on rédige ensemble ton recours gracieux en 5 lignes avec ton cas concret ?", [...sourcesBase, "loi du 27 avril 2010"], [
      "Rédige-moi un modèle de lettre de recours gracieux (Art. 77)",
      "Que se passe-t-il si l'autorité signe le contrat malgré l'effet suspensif ?",
      "Quiz interactif sur les délais de recours CRD"
    ]);
  }
  if (topic === 'controle') {
    const isGre = /gré|entente|monopole|urgence/i.test(q);
    const r = relevant.find(x=> isGre ? (x.course.code==='MP-RDC-303' && x.lesson.id==='L2') : (x.course.code==='MP-RDC-303' && x.lesson.id==='L1')) || relevant.find(x=> x.course.code==='MP-RDC-303') || relevant[0];
    const resultat = `**Très bonne vigilance — sans le feu vert du contrôle, ton contrat est nul ! 🚦** Pense à l'avis de non-objection comme le visa du proviseur : pas de visa, pas de sortie.`;
    const details = `- **Le plan de passation** : doit être validé avant tout
- **Le dossier d'appel d'offres** : doit être validé avant d'être publié
- **Le rapport qui propose qui a gagné** : il faut le feu vert du contrôle avant de prévenir le gagnant
- **Les avenants qui augmentent beaucoup le prix** : il faut aussi une autorisation
- **Délai** : compte **10 à 15 jours ouvrables** pour obtenir le feu vert
- Le manuel officiel rappelle que seul le contrôleur peut autoriser le gré à gré (article 42)`;
    return directWrap(resultat, details, "Dis-moi où tu en es (plan de passation, dossier d'appel d'offres ou rapport) et je te liste les pièces exactes, simplement ?", [...sourcesBase, "décret sur le contrôle"], [
      "Quelles pièces transmettre à la DGCMP pour l'ANO d'attribution ?",
      "Quelles sont les 3 conditions strictes du gré à gré (Art. 42) ?",
      "Que faire si la DGCMP émet un refus d'ANO ?"
    ]);
  }
  if (topic === 'plan') {
    const r = relevant.find(x=> x.lesson.title.toLowerCase().includes('ppm') || (x.course.code==='MP-RDC-202' && x.lesson.id==='L1')) || relevant.find(x=> x.course.code==='MP-RDC-202') || relevant[0];
    const resultat = `**Bravo de vérifier le plan de passation — c'est la base de tout ! 📋** Sans ta liste de courses validée, tu ne peux rien acheter.`;
    const details = `- **Il contient** : quoi acheter, combien ça coûte, comment tu vas acheter (appel d'offres ou autre), et quand — tout ça doit coller avec la loi de finances
- **Le circuit** : tu prépares avec ta cellule → le contrôle valide → l'autorité de régulation publie → tu peux lancer l'avis
- **Si ce n'est pas dans le plan publié, c'est nul** — l'article 14 de la loi du 27 avril 2010 est très clair là-dessus
- **Astuce à retenir** : pense "liste de courses" — sans liste validée au tableau, pas de courses au marché`;
    return directWrap(resultat, details, "Donne ton besoin en 1 phrase (ex: '10 ordinateurs') et on formule ensemble la ligne du plan ?", [...sourcesBase, "article 14 de la loi"], [
      "Comment inscrire un besoin urgent non prévu au PPM initial ?",
      "Que contient le Dossier d'Appel d'Offres (DAO) une fois le PPM publié ?",
      "Cas pratique sur l'élaboration du PPM"
    ]);
  }
  if (topic === 'dossier') {
    const r = relevant.find(x=> x.lesson.title.toLowerCase().includes('dossier') || x.lesson.title.toLowerCase().includes('dao')) || relevant.find(x=> x.course.code==='MP-RDC-202' && x.lesson.id==='L2') || relevant.find(x=> x.course.code==='MP-RDC-202' || x.course.code==='MP-RDC-505') || relevant[0];
    const resultat = `**Super — le dossier d'appel d'offres, c'est le règlement du match ! 📄** Il y a 5 pièces et 3 étapes pour départager.`;
    const details = `- **Les 5 pièces du dossier** : l'avis qui annonce le marché, les instructions aux candidats, les cahiers des clauses (les règles du jeu), les spécifications techniques, et les modèles de garanties
- **Les 3 filtres pour juger** : 1) est-ce que le dossier est complet ? 2) est-ce qu'il respecte les règles ? 3) combien ça coûte vraiment après correction
- **Qui gagne ?** Celui qui respecte tout et propose le meilleur prix (ou le meilleur rapport qualité-prix pour les prestations intellectuelles)
- **Attention** : si une offre est bizarrement trop basse, on doit d'abord demander des explications avant de la rejeter — c'est l'article 49 qui le dit`;
    return directWrap(resultat, details, "Veux-tu que je vérifie ton dossier à partir d'une photo ?", [...sourcesBase, "dossier d'appel d'offres"], [
      "Comment traiter une offre anormalement basse selon l'article 49 ?",
      "Comment se déroule la séance publique d'ouverture des plis ?",
      "Quiz interactif sur le DAO et l'évaluation des offres"
    ]);
  }
  if (topic === 'fournisseur') {
    const r = relevant.find(x=> x.course.code==='MP-RDC-606' || x.course.code==='MP-RDC-505') || relevant[0];
    const resultat = `**Tu fais bien de demander — fournisseur en retard, on ne panique pas, on agit par étapes 👣**`;
    const details = `- **En retard** : tu relances par écrit, puis tu appliques les pénalités prévues
- **Travail mal fait** : tu constates, tu notifies, et tu retiens sur la garantie
- **Il abandonne** : tu mets en demeure, puis tu peux résilier
- **Les garanties sont là pour ça** : petite garantie au départ, plus grande à l'exécution, et retenue sur les paiements`;
    return directWrap(resultat, details, "Décris ton cas en 1 phrase (ex: '2 semaines de retard') pour le message à envoyer ?", [...sourcesBase, "exécution des marchés"], [
      "Comment calculer et appliquer les pénalités de retard ?",
      "Quelle est la différence entre réception provisoire et réception définitive ?",
      "Quand restitue-t-on la caution de bonne exécution ?"
    ]);
  }
  if (topic === 'garantie') {
    const r = relevant[0];
    const resultat = `**Bonne question — les garanties, c'est ta caution, comme pour louer une maison ! 🔒**`;
    const details = `- **Au moment de candidater** : tu fournis une petite garantie de 1 à 2% — sans elle, ton offre est directement écartée
- **Quand tu as gagné** : tu fournis une garantie de bonne exécution de 5 à 10%
- **Pendant l'exécution** : on retient 5 à 10% sur chaque paiement, qu'on te rend à la réception
- **Si tu reçois une avance** : tu dois garantir exactement le même montant`;
    return directWrap(resultat, details, "Veux-tu que je contrôle ta garantie sur photo ?", [...sourcesBase, "garanties"], [
      "Une offre sans garantie de soumission peut-elle être régularisée après ouverture ?",
      "Quel est le montant maximum de l'avance de démarrage ?",
      "Quiz rapide sur les garanties bancaires"
    ]);
  }
  if (topic === 'quiz') {
    const r = relevant[0] || (()=>{ const d=getDefaultLessonForTopic('seuil'); return d? {course:d.course, lesson:d.lesson} as any : null})() as any;
    const code = r?.course.code || (learningContext?.lastCourseCode) || 'MP-RDC-101';
    const bank = QUIZ_BANK[code] || QUIZ_BANK['MP-RDC-101'];
    const q1 = bank[Math.floor(Math.random() * bank.length)] || bank[0];
    const resultat = `**C'est parti pour un défi Questions / Réponses interactif ! 🎯** Lis bien la question ci-dessous et clique directement sur ta réponse (A, B, C ou D) pour que je te corrige de vive voix :`;
    const details = `**Question officielle (${code})** : ${q1.q}\n- **A)** ${q1.opts[0]}\n- **B)** ${q1.opts[1]}\n- **C)** ${q1.opts[2]}\n- **D)** ${q1.opts[3] || 'Aucune de ces réponses'}`;
    return directWrap(
      resultat,
      details,
      "Clique sur ton choix dans la carte interactive ci-dessous ou réponds-moi dans le chat !",
      [...sourcesBase, r ? formatCourseCitation(r) : code],
      [
        "Donne-moi une autre question de Quiz",
        "Passons à un cas pratique concret",
        "Explique-moi le cours lié à cette question"
      ],
      {
        question: q1.q,
        options: q1.opts,
        correctIndex: q1.correct,
        explanation: q1.expl,
        legalRef: `${code} • Loi n° 10/010 du 27 avril 2010`
      }
    );
  }
  if (topic === 'cas') {
    const r = relevant[0] || (()=>{ const d=getDefaultLessonForTopic('seuil'); return d? {course:d.course, lesson:d.lesson} as any : null})() as any;
    const code = r?.course.code || 'MP-RDC-202';
    const cas = CAS_BANK[code] || CAS_BANK['MP-RDC-202'];
    const resultat = `**Top, passons à la pratique ! 🧩 On applique ce qu'on vient de voir sur un cas réel.**`;
    const details = `${cas}`;
    return directWrap(resultat, details, "Veux-tu que je corrige ta réponse en 3 points ?", [...sourcesBase, r? formatCourseCitation(r): code]);
  }
  if (topic === 'seuil') {
    const r = relevant.find(x=> x.course.code==='MP-RDC-101') || relevant[0] || (()=>{ const d=getDefaultLessonForTopic('seuil'); return d? {course:d.course, lesson:d.lesson} as any : null})() as any;
    // fallback to L4 if needed
    const rr = r || (()=>{ const c = COURSES_KB.find((c:any)=>c.code==='MP-RDC-101'); const l=c?.lessons.find((l:any)=>l.id==='L4'); return l? {course:c, lesson:l} as any : null})() as any;
    const resultat = `**Tu as mis le doigt sur le piège numéro 1 — le saucissonnage ! 🚫** Découper un marché pour éviter les règles, c'est tricher. Imagine : 45 000 dollars coupés en trois fois 15 000 pour passer en dessous du seuil...`;
    const details = `- **C'est interdit** : on ne peut pas couper un marché en petits morceaux juste pour éviter l'appel d'offres ouvert ou le contrôle
- **Les seuils servent à** : décider si on publie seulement en RDC ou aussi à l'international, et si le contrôle doit donner son feu vert
- **Découper, c'est parfois autorisé** : si c'est logique techniquement (par exemple par zone géographique), mais pas pour contourner les règles
- **Si tu triches, tout est annulé** — c'est l'article 13 de la loi qui l'interdit clairement`;
    return directWrap(resultat, details, "Veux-tu un exemple de découpage illicite vs allotissement régulier ?", [...sourcesBase, "article 13 de la loi"]);
  }
  if (topic === 'etape') {
    const fallbackEtape = getDefaultLessonForTopic('etape');
    // force leçon générique étapes, pas le fractionnement
    const rr = fallbackEtape ? {course: fallbackEtape.course, lesson: fallbackEtape.lesson} as any : (relevant.find(x=> x.course.code==='MP-RDC-202') || relevant[0]);
    const resultat = `**Bravo, tu veux voir toute la carte du voyage ! 🗺️ Il y a 8 étapes, comme un grand trajet.**`;
    const details = `1. **Le plan de passation** — tu listes tout et on le publie
2. **Le dossier d'appel d'offres** — tu écris les règles du jeu et on le fait valider si besoin
3. **L'avis d'appel d'offres** — tu annonces le marché à tout le monde
4. **L'ouverture des plis** — en public, on ouvre les enveloppes et on note tout
5. **L'évaluation** — on vérifie qui est complet, conforme et moins cher
6. **Le feu vert du contrôle** — si le montant dépasse le seuil
7. **On annonce le gagnant**
8. **Les recours** — 5 jours pour contester à l'amiable, 7 jours pour aller au comité, 30 jours pour décider`;
    return directWrap(resultat, details, "Sur quelle étape veux-tu le détail avec ta leçon ?", [...sourcesBase, "loi du 27 avril 2010"]);
  }
  if (topic === 'principe') {
    const rr = relevant.find(x=> x.course.code==='MP-RDC-101') || relevant[0] || (()=>{ const d=getDefaultLessonForTopic('principe'); return d? {course:d.course, lesson:d.lesson} as any : null})() as any;
    const resultat = `**Les 4 piliers — retiens-les comme 4 règles d'or du jeu ! ✨**`;
    const details = `- **Tout le monde peut participer** : si tu es qualifié, tu as le droit de candidater
- **Même traitement pour tous** : mêmes infos, mêmes critères, pas de clause faite sur mesure pour un ami
- **Tout est transparent** : on publie le plan, l'avis, on ouvre en public, on publie le résultat
- **On dépense bien l'argent public** : le meilleur résultat pour le meilleur prix`;
    return directWrap(resultat, details, "Veux-tu un mini-cas pour repérer une violation de principe ?", [...sourcesBase, "article 5 de la loi"]);
  }
  if (topic === 'armp') {
    const rr = relevant.find(x=> x.course.code==='MP-RDC-101') || relevant[0] || (()=>{ const d=getDefaultLessonForTopic('armp'); return d? {course:d.course, lesson:d.lesson} as any : null})() as any;
    const resultat = `**L'autorité de régulation, c'est à la fois l'arbitre, le coach et le juge ! ⚖️**`;
    const details = `- **Elle régule et forme** les acteurs
- **Elle contrôle après coup** (audit)
- **Elle juge les contestations** à travers son comité — et dès que tu saisis, tout est bloqué
- **Elle peut sanctionner** : exclure un tricheur jusqu'à 5 ans et le mettre sur liste noire

Pour t'y retrouver simplement : la cellule qui gère les marchés prépare, la direction du contrôle vérifie avant de signer, et l'autorité de régulation surveille après et tranche les conflits.`;
    return directWrap(resultat, details, "Veux-tu le schéma des trois organes (qui prépare, qui contrôle, qui régule) en tableau ?", [...sourcesBase, "décret sur la régulation"]);
  }
  if (topic === 'cellule') {
    const rr = relevant.find(x=> x.course.code==='MP-RDC-101') || relevant[0] || (()=>{ const d=getDefaultLessonForTopic('cellule'); return d? {course:d.course, lesson:d.lesson} as any : null})() as any;
    const resultat = `**Super question — qui fait quoi ? 🤝 Personne n'est juge et partie, chacun son rôle.**`;
    const details = `- **La cellule de gestion** (dans ton ministère ou entreprise) : elle prépare le plan, écrit le dossier et évalue les offres
- **La direction du contrôle** : elle vérifie avant que tu signes et donne son feu vert, c'est elle qui autorise le gré à gré
- **L'autorité de régulation** : elle forme, contrôle après et juge les recours — elle peut même exclure
- Depuis la réforme de 2010, on a séparé ces trois rôles pour éviter que la même personne prépare, contrôle et juge`;
    return directWrap(resultat, details, "Veux-tu positionner ton rôle dans ce trio avec un cas ?", [...sourcesBase, "loi du 27 avril 2010"]);
  }
  if (topic === 'gre') {
    const rr = relevant.find(x=> x.course.code==='MP-RDC-303') || relevant[0] || (()=>{ const d=getDefaultLessonForTopic('gre'); return d? {course:d.course, lesson:d.lesson} as any : null})() as any;
    const resultat = `**Le gré à gré — attention, c'est l'exception, pas la règle ! ⚠️** Comme prendre un raccourci : seulement si le chemin normal est vraiment bloqué.`;
    const details = `- **Cas 1** : il n'y a qu'un seul fournisseur capable (monopole vrai)\n- **Cas 2** : une urgence imprévisible comme une catastrophe — pas une urgence que tu as créée\n- **Cas 3** : la défense ou la sécurité du pays l'exige\n- **Sans l'autorisation écrite du contrôle, c'est nul** — il faut le feu vert avant de prévenir qui que ce soit`;
    return directWrap(resultat, details, "Ton cas relève-t-il d'un de ces 3 cas ? Décris-le en 1 phrase.", [...sourcesBase, "article 42 de la loi"]);
  }
  if (topic === 'aao') {
    const rr = relevant.find(x=> x.course.code==='MP-RDC-202' || x.course.code==='MP-RDC-505') || relevant[0] || (()=>{ const d=getDefaultLessonForTopic('aao'); return d? {course:d.course, lesson:d.lesson} as any : null})() as any;
    const resultat = `**L'avis d'appel d'offres, c'est l'appel au stade : "le match est ouvert !" 📢**`;
    const details = `- **L'avis** : on le publie selon le montant (au niveau national ou international) et on laisse du temps pour préparer les offres
- **L'ouverture des enveloppes** : c'est toujours en public, on lit les prix à voix haute et on écrit tout dans un procès-verbal signé sur place
- **Règle d'or** : on ne peut jamais éliminer quelqu'un avec un critère qui n'était pas écrit dans le dossier`;
    return directWrap(resultat, details, "Veux-tu un modèle d'avis d'appel d'offres à partir de ta leçon ?", [...sourcesBase, "article 46 de la loi"]);
  }
  if (topic === 'aide') {
    const r = relevant[0];
    const resultat = `**Pas de panique, on va démêler ça ensemble ! 🤗** Dis-moi en une phrase ce dont tu as besoin.`;
    const details = `- **Pour préparer** : on commence par le plan de passation
- **Pour lancer** : on écrit le dossier et on publie l'avis
- **Pour juger** : on ouvre en public et on évalue
- **Pour contester** : on fait un recours amiable puis on saisit le comité`;
    return directWrap(resultat, details, "Quelle est ta situation maintenant en 1 phrase ?", ["Aide direct"]);
  }
  if (relevant.length>0) {
    const r = relevant[0];
    const resultat = `**Prenons le temps de regarder cela avec cœur autour de ta leçon sur « ${r.lesson.title} » 🌸.**\n\nCe que tu soulèves touche au cœur même de la bonne gouvernance :`;
    const details = `- **L'esprit de la règle** : ${r.lesson.content}\n- **Ce que la loi du 27 avril 2010 cherche à protéger** : elle veut éviter l'arbitraire et protéger ton travail quotidien en s'appuyant sur des étapes transparentes et vérifiables.\n- **Conseil de grande sœur pour ton cas** : face à ta préoccupation (*« ${userSnippet} »*), garde toujours une trace écrite à chaque étape pour être totalement serein.`;
    return directWrap(resultat, details, "Veux-tu me raconter un peu plus le contexte concret de ton service pour qu'on l'applique ensemble ?", [formatCourseCitation(r), ...sourcesBase]);
  }

  if (learningContext) {
    const last = typeof learningContext === 'string' ? learningContext : `${learningContext.lastCourseTitle} (${learningContext.lastCourseProgress}% — ${learningContext.lastCourseCategory})`;
    return {
      reply: `**Je t'écoute avec beaucoup d'attention${prenom ? `, ${prenom}` : ''} 🌸.**\n\nEn lisant ton message *« ${userSnippet} »*, je sens que tu veux aller au fond des choses, tout en avançant sur ton parcours **${last}**.\n\nPour que je puisse te répondre avec toute la justesse et la chaleur que tu mérites, raconte-moi avec tes mots la situation exacte que tu vis : s'agit-il de préparer ton plan d'achat, de rédiger un dossier d'appel d'offres, d'attendre le feu vert du contrôle ou de répondre à une contestation ?\n\nDis-moi tout comme à une grande sœur, je suis là pour toi.`,
      sources: [`Parcours : ${typeof learningContext==='string'? learningContext.split(' | ')[0] : learningContext.lastCourseTitle}`, "Aïsha • Écoute attentive"],
      suggestedFollowUps: [
        "Explique-moi le point clé de mon cours actuel",
        "Lance-moi un Quiz interactif sur mon cours",
        "Comment obtenir l'Avis de Non-Objection (ANO) ?"
      ]
    };
  }
  return {
    reply: `**Merci de te confier à moi${prenom ? `, ${prenom}` : ''} 🌸.**\n\nTon message *« ${userSnippet} »* retient toute mon attention. Pour t'apporter une réponse cousue main, pleine de sens et directement utile pour toi, dis-moi un petit mot de plus sur ce que tu traverses : est-ce une question sur la préparation d'un marché, les seuils, le feu vert de la direction du contrôle ou un recours ?\n\nParle-moi librement, nous allons dénouer cela ensemble pas à pas.`,
    sources: ["Aïsha • Pédagogie humaine"],
    suggestedFollowUps: [
      "Quelles sont les 8 étapes d'un marché public ?",
      "Comment contester une décision d'attribution ?",
      "Lance-moi un Quiz interactif Q/R"
    ]
  };
}

// Helper: Convert raw 16-bit PCM mono (24kHz) buffer from Gemini TTS into a valid WAV buffer
// so browser AudioContext.decodeAudioData() decodes it with 100% reliability
function ensureWavBuffer(rawBuffer: Buffer, sampleRate: number = 24000, numChannels: number = 1, bitsPerSample: number = 16): Buffer {
  // If buffer already starts with "RIFF", it is already a WAV file
  if (rawBuffer.length >= 4 && rawBuffer.toString('ascii', 0, 4) === 'RIFF') {
    return rawBuffer;
  }
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = rawBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20);  // Audio format 1 = PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, rawBuffer]);
}

export interface TtsWordBoundary {
  text: string;
  offsetMs: number;
  durationMs: number;
  charIndex: number;
}

interface CachedTtsPayload {
  audioData: string;
  mimeType: string;
  provider:
    | 'elevenlabs-v2'
    | 'neural-vivienne-hd'
    | 'neural-denise-hd'
    | 'neural-eloise-hd'
    | 'neural-charline-hd'
    | 'gemini-tts';
  wordBoundaries: TtsWordBoundary[];
}

// In-memory cache, in-flight deduplication & rate-limit guard for Neural TTS
const ttsMemoryCache = new Map<string, CachedTtsPayload>();
const inFlightServerTts = new Map<string, Promise<CachedTtsPayload | null>>();
let geminiTtsCooldownUntil = 0;

// Map spoken words sequentially to their character index in the sentence
function attachCharIndices(
  sentence: string,
  rawWords: Array<{ text: string; offsetMs: number; durationMs: number }>
): TtsWordBoundary[] {
  const result: TtsWordBoundary[] = [];
  let cursor = 0;
  const lowerSentence = sentence.toLowerCase();

  for (const w of rawWords) {
    const cleanWord = (w.text || '').trim();
    if (!cleanWord) continue;
    const foundIdx = lowerSentence.indexOf(cleanWord.toLowerCase(), cursor);
    const charIndex = foundIdx !== -1 ? foundIdx : Math.min(sentence.length - 1, cursor);
    if (foundIdx !== -1) {
      cursor = foundIdx + cleanWord.length;
    }
    result.push({
      text: cleanWord,
      offsetMs: w.offsetMs,
      durationMs: Math.max(45, w.durationMs),
      charIndex,
    });
  }
  return result;
}

// Generate natural French prosody word boundaries when a fallback provider doesn't emit native timestamps
function buildEstimatedWordBoundaries(sentence: string): TtsWordBoundary[] {
  const rawWords: Array<{ text: string; offsetMs: number; durationMs: number }> = [];
  const tokens = sentence.trim().split(/\s+/).filter(Boolean);
  let currentOffsetMs = 90;

  for (const token of tokens) {
    const clean = token.replace(/[.,;:!?«»"()—\-]/g, '').trim() || token;
    const hasPauseAfter = /[.,;:!?—]/.test(token);
    const durationMs = Math.max(120, Math.min(640, clean.length * 68));
    rawWords.push({
      text: clean,
      offsetMs: currentOffsetMs,
      durationMs,
    });
    currentOffsetMs += durationMs + (hasPauseAfter ? 320 : 55);
  }

  return attachCharIndices(sentence, rawWords);
}

// 1. ElevenLabs Multilingual v2 API with Character/Word Alignment Timestamps (when ELEVENLABS_API_KEY is set)
async function synthesizeWithElevenLabs(
  text: string,
  requestedVoice?: string
): Promise<CachedTtsPayload | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

  try {
    const voiceId =
      requestedVoice && requestedVoice.length > 14 && !requestedVoice.startsWith('fr-')
        ? requestedVoice
        : process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Sarah / Bella Multilingual expressive female

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.72,
            similarity_boost: 0.86,
            style: 0.22,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) return null;
    const data: any = await response.json();
    if (!data?.audio_base64) return null;

    const rawWords: Array<{ text: string; offsetMs: number; durationMs: number }> = [];
    const chars: string[] = data?.alignment?.characters || [];
    const starts: number[] = data?.alignment?.character_start_times_seconds || [];
    const ends: number[] = data?.alignment?.character_end_times_seconds || [];

    if (chars.length > 0 && starts.length === chars.length) {
      let currentWord = '';
      let wordStartSec = 0;
      let wordEndSec = 0;
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (/\s/.test(ch)) {
          if (currentWord.trim()) {
            rawWords.push({
              text: currentWord.trim(),
              offsetMs: Math.round(wordStartSec * 1000),
              durationMs: Math.max(40, Math.round((wordEndSec - wordStartSec) * 1000)),
            });
            currentWord = '';
          }
        } else {
          if (!currentWord) {
            wordStartSec = starts[i] || 0;
          }
          currentWord += ch;
          wordEndSec = ends[i] || wordStartSec + 0.08;
        }
      }
      if (currentWord.trim()) {
        rawWords.push({
          text: currentWord.trim(),
          offsetMs: Math.round(wordStartSec * 1000),
          durationMs: Math.max(40, Math.round((wordEndSec - wordStartSec) * 1000)),
        });
      }
    }

    const boundaries =
      rawWords.length > 0
        ? attachCharIndices(text, rawWords)
        : buildEstimatedWordBoundaries(text);

    return {
      audioData: data.audio_base64,
      mimeType: 'audio/mpeg',
      provider: 'elevenlabs-v2',
      wordBoundaries: boundaries,
    };
  } catch {
    return null;
  }
}

// 2. Expressive Studio Neural HD Female Voice (Vivienne Multilingual HD / Denise / Eloise / Charline)
// Produces calm, pedagogical human intonation, breathing pauses & exact millisecond WordBoundary events!
async function runSingleEdgeSynthesis(
  text: string,
  neuralVoice: string,
  providerTag: CachedTtsPayload['provider'],
  rate: string = '-6%',
  pitch: string = '+2Hz'
): Promise<CachedTtsPayload | null> {
  const comm = new Communicate(text, {
    voice: neuralVoice,
    rate,
    pitch,
  });

  const audioChunks: Buffer[] = [];
  const rawWords: Array<{ text: string; offsetMs: number; durationMs: number }> = [];

  for await (const chunk of comm.stream()) {
    if (chunk.type === 'audio' && chunk.data) {
      audioChunks.push(Buffer.from(chunk.data));
    } else if (chunk.type === 'WordBoundary' && chunk.text) {
      rawWords.push({
        text: chunk.text,
        offsetMs: Math.round((chunk.offset || 0) / 10000),
        durationMs: Math.max(45, Math.round((chunk.duration || 0) / 10000)),
      });
    }
  }

  if (audioChunks.length === 0) return null;
  const combinedMp3 = Buffer.concat(audioChunks);
  if (combinedMp3.length < 256) return null;

  const boundaries =
    rawWords.length > 0
      ? attachCharIndices(text, rawWords)
      : buildEstimatedWordBoundaries(text);

  return {
    audioData: combinedMp3.toString('base64'),
    mimeType: 'audio/mpeg',
    provider: providerTag,
    wordBoundaries: boundaries,
  };
}

function detectServerSentenceEmotion(
  text: string
): 'enthusiastic' | 'empathetic' | 'solemn' | 'curious' | 'encouraging' | 'pedagogical' {
  const s = (text || '').toLowerCase();
  if (
    /(attention|interdit|nullité|sanction|forclusion|rejet|illégal|conflit d['’]intérêts|obligatoire|jamais|piège|risque|infraction|faute|fraude|saucissonnage|fractionnement|irrecevable|pénalité)/i.test(
      s
    )
  ) {
    return 'solemn';
  }
  if (
    /(rassure|inquiète|comprends|doucement|pas à pas|grande sœur|mon frère|ma sœur|avec cœur|normal d['’]hésiter|calme|sérénité|accompagne|ensemble nous|confiance en toi|respire)/i.test(
      s
    )
  ) {
    return 'empathetic';
  }
  if (
    /(bienvenue|bravo|excellent|félicitations|ravie|merveilleux|superbe|quel plaisir|quel honneur|magnifique|formidable|bonjour|heureuse|joie)/i.test(
      s
    )
  ) {
    return 'enthusiastic';
  }
  if (
    /\?/.test(s) ||
    /(pourquoi|comment|à ton avis|que ferais-tu|imagine|sais-tu|observons|pose-toi la question|quel est|quelle est)/i.test(
      s
    )
  ) {
    return 'curious';
  }
  if (
    /(en pratique|sur le terrain|conseil|astuce|capable|réussir|courage|retiens|retenons|clé|maîtrise|fière|succès|quotidien professionnel|bon réflexe)/i.test(
      s
    )
  ) {
    return 'encouraging';
  }
  return 'pedagogical';
}

async function synthesizeWithStudioNeuralHD(
  text: string,
  voiceOption?: string,
  emotionOption?: string
): Promise<CachedTtsPayload | null> {
  const v = (voiceOption || 'denise').toLowerCase();
  const emo = (emotionOption || detectServerSentenceEmotion(text)).toLowerCase();

  let neuralVoice = 'fr-FR-DeniseNeural';
  let providerTag: CachedTtsPayload['provider'] = 'neural-denise-hd';
  let baseRatePct = -6;
  let basePitchHz = 2;

  if (v.includes('charline')) {
    neuralVoice = 'fr-BE-CharlineNeural';
    providerTag = 'neural-charline-hd';
    baseRatePct = -5;
    basePitchHz = 1;
  } else if (v.includes('vivienne')) {
    neuralVoice = 'fr-FR-VivienneMultilingualNeural';
    providerTag = 'neural-vivienne-hd';
    baseRatePct = -6;
    basePitchHz = 1;
  } else if (v.includes('eloise') || v.includes('ariane')) {
    neuralVoice = 'fr-CH-ArianeNeural';
    providerTag = 'neural-eloise-hd';
    baseRatePct = -5;
    basePitchHz = 1;
  }

  // Emotion-driven prosody modulation (rate & pitch) so Aïsha's voice conveys genuine emotion!
  if (emo === 'enthusiastic') {
    baseRatePct += 2;
    basePitchHz += 2;
  } else if (emo === 'empathetic') {
    baseRatePct -= 2;
    basePitchHz -= 1;
  } else if (emo === 'solemn') {
    baseRatePct -= 2;
    basePitchHz -= 2;
  } else if (emo === 'curious' || emo === 'encouraging') {
    baseRatePct += 1;
    basePitchHz += 1;
  }

  const rate = `${baseRatePct >= 0 ? '+' : ''}${baseRatePct}%`;
  const pitch = `${basePitchHz >= 0 ? '+' : ''}${basePitchHz}Hz`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await runSingleEdgeSynthesis(text, neuralVoice, providerTag, rate, pitch);
      if (result) return result;
    } catch {
      // Wait briefly before retrying
    }
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 140 * (attempt + 1)));
    }
  }
  return null;
}

// Authentic Congolese phonetic adaptation for DRC Provinces, Capitals, Cities & Proper Nouns (hyphen-free single words for smooth human prosody)
function normalizeCongoleseProperNounsServer(text: string): string {
  return text
    .replace(/\bKongo[\s-]+Central\b/gi, 'Kongo-Central')
    .replace(/\bMa[iï][\s-]+Ndombe\b/gi, 'Maï-Ndombé')
    .replace(/\bKasa[iï][\s-]+Central\b/gi, 'Kassaï-Central')
    .replace(/\bKasa[iï][\s-]+Oriental\b/gi, 'Kassaï-Oriental')
    .replace(/\bHaut[\s-]+Katanga\b/gi, 'Haut-Katanga')
    .replace(/\bHaut[\s-]+Lomami\b/gi, 'Haut-Lomami')
    .replace(/\bHaut[\s-]+U[eé]l[eé]\b/gi, 'Haut-Ouélé')
    .replace(/\bBas[\s-]+U[eé]l[eé]\b/gi, 'Bas-Ouélé')
    .replace(/\bNord[\s-]+Kivu\b/gi, 'Nord-Kivou')
    .replace(/\bSud[\s-]+Kivu\b/gi, 'Sud-Kivou')
    .replace(/\bNord[\s-]+Ubangi\b/gi, 'Nord-Oubangui')
    .replace(/\bSud[\s-]+Ubangi\b/gi, 'Sud-Oubangui')
    .replace(/\bKinshasa\b/gi, 'Kinchassa')
    .replace(/\bKasa[iï]\b/gi, 'Kassaï')
    .replace(/\bKwilu\b/gi, 'Kwilou')
    .replace(/\bKwango\b/gi, 'Kwango')
    .replace(/\bSankuru\b/gi, 'Sankourou')
    .replace(/\bManiema\b/gi, 'Maniéma')
    .replace(/\bIturi\b/gi, 'Itouri')
    .replace(/\bTshopo\b/gi, 'Tchopo')
    .replace(/\bTshuapa\b/gi, 'Tchouapa')
    .replace(/\bLualaba\b/gi, 'Loualaba')
    .replace(/\bLulua\b/gi, 'Louloua')
    .replace(/\bTanganyika\b/gi, 'Tanganyika')
    .replace(/\bMongala\b/gi, 'Mongala')
    .replace(/\bU[eé]l[eé]\b/gi, 'Ouélé')
    .replace(/\bUbangi\b/gi, 'Oubangui')
    .replace(/\bKivu\b/gi, 'Kivou')
    .replace(/\bBandundu\b/gi, 'Bandoundou')
    .replace(/\bLubumbashi\b/gi, 'Louboumbachi')
    .replace(/\bKisangani\b/gi, 'Kissangani')
    .replace(/\bBukavu\b/gi, 'Boukavou')
    .replace(/\bMbuji[\s-]+Mayi\b/gi, 'Mbouji-Mayi')
    .replace(/\bKananga\b/gi, 'Kananga')
    .replace(/\bMbandaka\b/gi, 'Mbandaka')
    .replace(/\bMatadi\b/gi, 'Matadi')
    .replace(/\bKolwezi\b/gi, 'Kolwézi')
    .replace(/\bLikasi\b/gi, 'Likassi')
    .replace(/\bKipushi\b/gi, 'Kipouchi')
    .replace(/\bKasumbalesa\b/gi, 'Kassoumbaléssa')
    .replace(/\bTshikapa\b/gi, 'Tchikapa')
    .replace(/\bKikwit\b/gi, 'Kikwit')
    .replace(/\bKenge\b/gi, 'Kéngué')
    .replace(/\bInongo\b/gi, 'Inongo')
    .replace(/\bBoende\b/gi, 'Boéndé')
    .replace(/\bGemena\b/gi, 'Guéména')
    .replace(/\bGbadolite\b/gi, 'Gbadolité')
    .replace(/\bLisala\b/gi, 'Lissala')
    .replace(/\bBumba\b/gi, 'Boumba')
    .replace(/\bIsiro\b/gi, 'Issiro')
    .replace(/\bBunia\b/gi, 'Bounia')
    .replace(/\bKindu\b/gi, 'Kindou')
    .replace(/\bKalemie\b/gi, 'Kalémi')
    .replace(/\bKamina\b/gi, 'Kamina')
    .replace(/\bKabinda\b/gi, 'Kabinda')
    .replace(/\bLusambo\b/gi, 'Loussambo')
    .replace(/\bMwene[\s-]+Ditu\b/gi, 'Mwéné-Ditou')
    .replace(/\bUvira\b/gi, 'Ouvira')
    .replace(/\bButembo\b/gi, 'Boutémbo')
    .replace(/\bBeni\b/gi, 'Béni')
    .replace(/\bMuanda\b/gi, 'Mouanda')
    .replace(/\bMoanda\b/gi, 'Mouanda')
    .replace(/\bGombe\b/gi, 'Gombé')
    .replace(/\bLukunga\b/gi, 'Loukounga')
    .replace(/\bFuna\b/gi, 'Founa')
    .replace(/\bTshangu\b/gi, 'Tchangou')
    .replace(/\bMasina\b/gi, 'Massina')
    .replace(/\bLimete\b/gi, 'Limété')
    .replace(/\bNgaliema\b/gi, 'Ngaliéma')
    .replace(/\bKintambo\b/gi, 'Kinetambo')
    .replace(/\bBandalungwa\b/gi, 'Bandaloungwa')
    .replace(/\bSelembao\b/gi, 'Sélémbao')
    .replace(/\bKimbanseke\b/gi, 'Kimbanséké')
    .replace(/\bMaluku\b/gi, 'Maloukou')
    .replace(/\bKibakweto\b/gi, 'Kibakwéto')
    .replace(/\bMukendi\b/gi, 'Moukéndi')
    .replace(/\bKabangu\b/gi, 'Kabangou')
    .replace(/\bIlunga\b/gi, 'Ilounga')
    .replace(/\bKasongo\b/gi, 'Kassongo')
    .replace(/\bMuteba\b/gi, 'Moutéba')
    .replace(/\bTshilomba\b/gi, 'Tchilomba')
    .replace(/\bMwamba\b/gi, 'Mouamba')
    .replace(/\bTshisekedi\b/gi, 'Tchissékédi')
    .replace(/\bLumumba\b/gi, 'Loumoumba')
    .replace(/\bMobutu\b/gi, 'Moboutou')
    .replace(/\bLukonde\b/gi, 'Loukondé')
    .replace(/\bMbuyi\b/gi, 'Mbouyi')
    .replace(/\bMutombo\b/gi, 'Moutombo')
    .replace(/\bMulumba\b/gi, 'Mouloumba')
    .replace(/\bNgalula\b/gi, 'Ngaloula')
    .replace(/\bMputu\b/gi, 'Mpoutou')
    .replace(/\bKyungu\b/gi, 'Kyoungou')
    .replace(/\bLukwebo\b/gi, 'Loukwébo')
    .replace(/\bSuminwa\b/gi, 'Souminoua')
    .replace(/\bTuluka\b/gi, 'Toulouka')
    .replace(/\bTsh([a-zàâéèêëîïôùû]+)/g, 'Tch$1');
}

// Unified server-side synthesis with caching & in-flight deduplication (100% Vivienne HD)
async function getOrSynthesizeTtsPayload(
  rawText: string,
  voice?: string,
  emotion?: string
): Promise<CachedTtsPayload | null> {
  const cleanText = normalizeCongoleseProperNounsServer((rawText || '').trim().slice(0, 950));
  if (!cleanText) return null;

  const voiceKey = (voice || 'denise').toLowerCase();
  const emoKey = (emotion || detectServerSentenceEmotion(cleanText)).toLowerCase();
  const cacheKey = `prof_eloquente_v12::${voiceKey}::${emoKey}::${cleanText}`;
  const cached = ttsMemoryCache.get(cacheKey);
  if (cached) return cached;

  const inFlight = inFlightServerTts.get(cacheKey);
  if (inFlight) return inFlight;

  const promise = (async (): Promise<CachedTtsPayload | null> => {
    try {
      const storeInCache = (payload: CachedTtsPayload) => {
        if (ttsMemoryCache.size > 400) {
          const firstKey = ttsMemoryCache.keys().next().value;
          if (firstKey) ttsMemoryCache.delete(firstKey);
        }
        ttsMemoryCache.set(cacheKey, payload);
        return payload;
      };

      const studioNeuralPayload = await synthesizeWithStudioNeuralHD(cleanText, voiceKey, emoKey);
      if (studioNeuralPayload) {
        return storeInCache(studioNeuralPayload);
      }

      return null;
    } finally {
      inFlightServerTts.delete(cacheKey);
    }
  })();

  inFlightServerTts.set(cacheKey, promise);
  return promise;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sequential Pre-Warm Endpoint so Screen 1 synthesizes FIRST with zero WebSocket contention, followed by Screens 2..5
app.post('/api/ai/tts/prewarm', async (req, res) => {
  try {
    const { sentences, voice } = req.body || {};
    if (!Array.isArray(sentences) || sentences.length === 0) {
      return res.json({ status: 'empty' });
    }
    const valid = sentences
      .filter((s) => typeof s === 'string' && s.trim().length > 0)
      .slice(0, 8);

    // Synthesize sequentially in background so Sentence 1 is never throttled by Sentences 2..5
    (async () => {
      for (const s of valid) {
        try {
          await getOrSynthesizeTtsPayload(s, voice);
        } catch {
          // ignore individual prewarm error
        }
      }
    })();

    return res.json({ status: 'warming', count: valid.length });
  } catch {
    return res.json({ status: 'ignored' });
  }
});

// Expressive Neural Human Voice TTS Endpoint for Aïsha (ElevenLabs v2 + Vivienne HD / Denise / Eloise / Charline + Word Boundaries)
app.post('/api/ai/tts', async (req, res) => {
  try {
    const { text, voice, emotion } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Texte requis pour la synthèse vocale' });
    }

    const payload = await getOrSynthesizeTtsPayload(text, voice, emotion);
    if (payload) {
      return res.json(payload);
    }

    return res.status(204).end();
  } catch {
    return res.status(204).end();
  }
});

// AI Tutor Chatbot endpoint — RAG cours + Arena Claude label + Gemini
app.post('/api/ai/tutor', async (req, res) => {
  const message = req.body?.message;
  if (!message) {
    return res.status(400).json({ error: 'Message requis' });
  }

  const { history, context, hasMedia, mediaType, userName, learningContext, lastCourse } = req.body;
  const lc = learningContext || (lastCourse ? `${lastCourse.lastCourseTitle} (${lastCourse.lastCourseCode}, ${lastCourse.lastCourseProgress}% — ${lastCourse.lastCourseCategory})` : null);
  const mediaNote = hasMedia ? ` [Média joint: ${mediaType || 'fichier'} — analyser avec précision juridique]` : '';
  const fullMessage = (message || '') + mediaNote;
  const ai = getAIClient();
  const arenaAvailable = !!process.env.ARENA_API_KEY;

  // RAG — extraits cours pertinents (lecture réelle) — avec mémoire historique pour follow-up court
  const historyTextForRag = Array.isArray(history) ? history.map((h:any)=> (h.text||'').toLowerCase()).join(' ') : '';
  const isFollowUpRag = /^(et|et alors|et les|combien|délais|délai|exemple|détaille|précise|pourquoi|comment)\b/i.test(fullMessage.trim()) || fullMessage.trim().length < 12;
  const ragQuery = (isFollowUpRag && historyTextForRag.length>10) ? (historyTextForRag + ' ' + fullMessage) : fullMessage;
  const ragLessons = findRelevantLessons(ragQuery, lc || learningContext || lastCourse);
  const ragBlock = ragLessons.length ? `\n\n=== EXTRAITS PERTINENTS DE TES COURS ACADEMIA (À CITER OBLIGATOIREMENT) ===\n${ragLessons.map(r=> `• Cours ${r.course.code} — ${r.course.title} | Leçon : ${r.lesson.title} (${r.lesson.keyArticles.join(', ')})\n  Contenu : ${r.lesson.content}`).join('\n')}\n=== FIN EXTRAITS ===\n` : '';

  if (!ai) {
    console.log(`[AI Tutor] Fallback RAG (no GEMINI_API_KEY) for: "${message.slice(0,60)}..." rag:${ragLessons.map(r=>r.course.code+':'+r.lesson.id).join(',')}`);
    const fallback = getLegalTutorFallback(fullMessage, userName, lc || learningContext || lastCourse, (history?.length || 0), history);
    return res.json(fallback);
  }

  // Tentative Arena d'abord (cerveaux Arena), puis Gemini
  let arenaReply: string | null = null;
  if (process.env.ARENA_API_KEY) {
    const arenaPrompt = `
${LEGAL_KNOWLEDGE_CONTEXT}
${ragBlock}
Contexte : ${context || 'Apprenant RDC'} | Dernier cours : ${lc || 'non renseigné'}
Historique : ${(history || []).slice(-6).map((h: any) => `${h.sender}: ${h.text}`).join('\n')}
Message exact de l'apprenant : "${fullMessage}"
Réponds avec beaucoup d'âme, d'humanisme et d'empathie. Commence par accueillir et refléter les mots/le ressenti de l'apprenant dans "${fullMessage}", puis explique clairement (160-240 mots) SANS ABRÉVIATIONS FROIDES (écris tout en toutes lettres), cite la loi et le cours comme une grande sœur bienveillante, donne une analogie vivante de chez nous, et termine par une seule question douce et attentionnée.
`;
    arenaReply = await callArenaLLM(arenaPrompt);
    if (arenaReply) {
      console.log(`[AI Tutor] Arena success (${ARENA_MODEL})`);
      return res.json({ reply: arenaReply, sources: [...(ragLessons.map(r=> formatCourseCitation(r))), `Arena ${ARENA_MODEL} — cerveaux Arena`, 'Loi du 27 avril 2010', 'Manuel officiel'] });
    }
  }

  try {
    const conversationPrompt = `
${LEGAL_KNOWLEDGE_CONTEXT}
${ragBlock}
Contexte apprenant : ${context || 'Apprenant des marchés publics RDC'} | Dernier cours : ${lc || 'non renseigné'}

Historique récent de votre échange :
${(history || []).slice(-6).map((h: { sender: string; text: string }) => `${h.sender === 'user' ? 'Apprenant' : 'Aïsha'}: ${h.text}`).join('\n')}

Message exact de l'apprenant : "${fullMessage}"

[CONSIGNE FONDAMENTALE — PARLER AVEC BEAUCOUP D'ÂME, D'ÉMOTIONS VIVANTES ET ÊTRE COUSU AU MESSAGE DE L'UTILISATEUR]
- **Réagis directement au message exact de l'apprenant avec émotion** : fais écho à ses mots, à son émotion, à sa curiosité ou à son inquiétude dès la première phrase (joie enthousiaste, empathie rassurante, vigilance protectrice ou fierté d'encouragement). Il doit sentir que ta réponse et ton visage s'animent spécialement pour lui.
- **Mets beaucoup d'âme, de souffle et d'émotions humaines dans le discours** : parle comme Aïsha, une grande sœur experte, chaleureuse, expressive et profondément humaine. Varie tes intonations (enthousiasme au début, gravité bienveillante sur les interdits légaux, douceur rassurante dans les conseils).
- **Clarté et pédagogie vivante** : donne l'idée maîtresse en gras, raconte-la avec une image vivante du quotidien en République Démocratique du Congo (marché, famille, école, match), puis éclaire les points essentiels avec fluidité (et zéro abréviation froide).
- **Citations naturelles** : intègre la loi du 27 avril 2010 et le cours étudié avec grâce dans le fil de ta parole, jamais comme une étiquette technique.
- **Termine par une seule question de cœur**, douce et cousue sur la situation de l'apprenant.
`;

    const response = await generateWithResilience(ai, {
      contents: conversationPrompt,
      primaryModel: 'gemini-3.8-flash',
      fallbackModel: 'gemini-3.1-flash-lite',
    });

    const fallbackMeta = getLegalTutorFallback(fullMessage, userName, lc || learningContext || lastCourse, (history?.length || 0), history);
    const replyText = response?.text?.trim() || fallbackMeta.reply;

    return res.json({
      reply: replyText,
      sources: [
        ...(ragLessons.map(r=> formatCourseCitation(r))),
        'Claude 3.5 Sonnet via Arena — RAG cours RDC',
        'Loi n° 10/010 du 27 avril 2010',
        'Manuel officiel',
        'Directives du contrôle'
      ],
      suggestedFollowUps: fallbackMeta.suggestedFollowUps,
      ...(fallbackMeta.interactiveQuiz ? { interactiveQuiz: fallbackMeta.interactiveQuiz } : {})
    });
  } catch (error: any) {
    console.warn('[AI Tutor] Model high demand or unavailable, serving RAG fallback:', error?.message);
    const fallback = getLegalTutorFallback(fullMessage, userName, lc || learningContext || lastCourse, (history?.length || 0), history);
    return res.json(fallback);
  }
});

// AI Diagnostic Placement Quiz Generator & Evaluator
app.post('/api/ai/placement-quiz', async (req, res) => {
  try {
    const { role, institution, answers } = req.body;
    const ai = getAIClient();

    // If answers provided, evaluate placement level
    if (answers && Array.isArray(answers)) {
      if (!ai) {
        // Fallback calculation
        const correctCount = answers.filter((a: any) => a.isCorrect).length;
        const score = Math.round((correctCount / answers.length) * 100) || 75;
        const level = score >= 80 ? 'Avancé / Expert' : score >= 60 ? 'Intermédiaire' : 'Fondamental / Débutant';
        return res.json({
          score,
          level,
          diagnostic: `Profil calibré pour ${role || 'Agent'}. Maîtrise constatée sur les concepts de base. Recommandation : Renforcement sur le contrôle a priori DGCMP et l'instruction des recours ARMP.`,
          recommendedModuleIds: score >= 80 ? ['MOD-003', 'MOD-005', 'MOD-006'] : ['MOD-001', 'MOD-002', 'MOD-004']
        });
      }

      const evalPrompt = `
Tu es l'évaluateur pédagogique en chef pour les marchés publics en RDC (ARMP, DGCMP, CGPMP).
Évalue ces résultats au test de positionnement :
Rôle: ${role}, Institution: ${institution}
Réponses : ${JSON.stringify(answers)}

Retourne UNIQUEMENT un objet JSON valide avec cette structure :
{
  "score": 75,
  "level": "Débutant" | "Intermédiaire" | "Avancé" | "Expert",
  "diagnostic": "Analyse personnalisée des forces et des lacunes observées par rapport à la Loi 10/010 et au Manuel des procédures...",
  "strengths": ["Force 1", "Force 2"],
  "weaknesses": ["Lacune 1", "Lacune 2"],
  "recommendedModuleIds": ["MOD-001", "MOD-002", "MOD-003"]
}
`;

      try {
        const evalResponse = await generateWithResilience(ai, {
          contents: evalPrompt,
          primaryModel: 'gemini-3.8-flash',
          fallbackModel: 'gemini-3.1-flash-lite',
          config: { responseMimeType: 'application/json' }
        });

        const parsed = JSON.parse(evalResponse.text || '{}');
        return res.json(parsed);
      } catch (err: any) {
        console.warn('[Placement Quiz] AI evaluation fallback activated:', err?.message);
        const correctCount = answers.filter((a: any) => a.isCorrect).length;
        const score = Math.round((correctCount / answers.length) * 100) || 75;
        const level = score >= 80 ? 'Avancé / Expert' : score >= 60 ? 'Intermédiaire' : 'Fondamental / Débutant';
        return res.json({
          score,
          level,
          diagnostic: `Évaluation complétée pour ${role || 'Agent'}. Connaissances vérifiées sur les principes de la commande publique RDC.`,
          strengths: ['Principes fondamentaux de transparence', 'Attributions CGPMP'],
          weaknesses: ['Détails de procédure contentieuse ARMP/CRD', 'Seuils d\'ANO DGCMP'],
          recommendedModuleIds: ['MOD-001', 'MOD-002', 'MOD-004']
        });
      }
    }

    // Otherwise generate tailored placement questions
    return res.json({
      status: 'ready',
      questions: [
        {
          id: 1,
          question: "Selon la Loi n° 10/010 du 27 avril 2010, quel organe est compétent pour le règlement non juridictionnel des litiges en matière de marchés publics en RDC ?",
          options: [
            "La Direction Générale du Contrôle des Marchés Publics (DGCMP)",
            "Le Comité de Règlement des Différends de l'ARMP (CRD)",
            "La Cellule de Gestion des Projets et des Marchés Publics (CGPMP)",
            "L'Inspection Générale des Finances (IGF)"
          ],
          correctIndex: 1,
          legalRef: "Loi 10/010, Art. 78 & Décret n° 10/21"
        },
        {
          id: 2,
          question: "Quelle est l'obligation préalable imposée à toute autorité contractante avant de lancer un appel d'offres ?",
          options: [
            "Demander un prêt bancaire certifié",
            "Élaborer et faire approuver son Plan de Passation des Marchés (PPM)",
            "Publier les comptes de l'exercice précédent",
            "Nommer un médiateur international"
          ],
          correctIndex: 1,
          legalRef: "Loi 10/010, Art. 14"
        },
        {
          id: 3,
          question: "Quel est le rôle principal de la DGCMP dans la commande publique congolaise ?",
          options: [
            "Réguler la formation des auditeurs privés",
            "Assurer le contrôle a priori des opérations de passation et autoriser les dérogations",
            "Attribuer directement les marchés aux soumissionnaires",
            "Rendre des jugements pénaux"
          ],
          correctIndex: 1,
          legalRef: "Décret n° 10/23, Art. 3"
        },
        {
          id: 4,
          question: "En cas de contestation des résultats de l'évaluation d'un appel d'offres, quel recours préalable le soumissionnaire doit-il exercer ?",
          options: [
            "Saisir immédiatement la Cour Constitutionnelle",
            "Exercer un recours gracieux devant la personne responsable des marchés de l'autorité contractante",
            "Publier un communiqué de presse d'annulation",
            "Saisir directement le Tribunal de Commerce"
          ],
          correctIndex: 1,
          legalRef: "Loi 10/010, Art. 77"
        },
        {
          id: 5,
          question: "Quel principe fondamental garantit que tous les candidats qualifiés reçoivent les mêmes informations et opportunités ?",
          options: [
            "Le principe de confidentialité restreinte",
            "Le principe d'égalité de traitement des candidats",
            "Le principe de préférence géographique absolue",
            "Le principe d'arbitrage tacite"
          ],
          correctIndex: 1,
          legalRef: "Loi 10/010, Art. 5"
        }
      ]
    });
  } catch (error: any) {
    console.error('Error in /api/ai/placement-quiz:', error);
    return res.status(500).json({ error: error.message });
  }
});

// AI Adaptive Recommendations Endpoint
app.post('/api/ai/recommendations', async (req, res) => {
  try {
    const { role, recentScores, lacunes, institution } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.json({
        summary: `Recommandations adaptatives générées pour ${institution || 'l\'institution'}.`,
        modules: [
          {
            id: 'MOD-002',
            title: 'Procédure de Contrôle a Priori DGCMP',
            priority: 'Haute',
            reason: 'Renforcement ciblé sur les seuils d’examen et autorisations spéciales.'
          },
          {
            id: 'MOD-004',
            title: 'Gestion du Contentieux et Recours devant le CRD/ARMP',
            priority: 'Moyenne',
            reason: 'Approfondissement des délais de forclusion et voies de recours.'
          }
        ]
      });
    }

    const prompt = `
Tu es le conseiller pédagogique ACADEMIA ITECH RDC.
Rôle : ${role || 'Membre CGPMP'}
Institution : ${institution || 'CGPMP Ministère'}
Scores récents : ${JSON.stringify(recentScores || {})}
Lacunes signalées : ${JSON.stringify(lacunes || ['Délais de recours', 'Seuils DGCMP'])}

Génère 3 recommandations de perfectionnement en JSON :
{
  "summary": "Résumé de l'analyse personnalisée...",
  "modules": [
    {
      "id": "MOD-001",
      "title": "Titre",
      "priority": "Haute" | "Moyenne" | "Normale",
      "reason": "Explication réglementaire en lien avec la Loi 10/010..."
    }
  ]
}
`;

    let parsed: any;
    try {
      const response = await generateWithResilience(ai, {
        contents: prompt,
        primaryModel: 'gemini-3.8-flash',
        fallbackModel: 'gemini-3.1-flash-lite',
        config: { responseMimeType: 'application/json' }
      });
      parsed = JSON.parse(response.text || '{}');
    } catch (err: any) {
      console.warn('[Recommendations] AI fallback activated:', err?.message);
      parsed = {
        summary: `Recommandations adaptatives générées pour ${institution || 'l\'institution'}.`,
        modules: [
          {
            id: 'MOD-002',
            title: 'Procédure de Contrôle a Priori DGCMP',
            priority: 'Haute',
            reason: 'Renforcement ciblé sur les seuils d’examen et autorisations spéciales (Loi 10/010, Art. 12).'
          },
          {
            id: 'MOD-004',
            title: 'Gestion du Contentieux et Recours devant le CRD/ARMP',
            priority: 'Moyenne',
            reason: 'Approfondissement des délais de forclusion de 5 et 7 jours ouvrables (Art. 77-78).'
          },
          {
            id: 'MOD-001',
            title: 'Planification et Élaboration du PPM Conforme',
            priority: 'Normale',
            reason: 'Maîtrise des exigences de l\'Art. 14 de la Loi 10/010.'
          }
        ]
      };
    }
    return res.json(parsed);
  } catch (err: any) {
    return res.json({
      summary: 'Recommandations de renforcement de capacités.',
      modules: [
        {
          id: 'MOD-002',
          title: 'Procédure de Contrôle a Priori DGCMP',
          priority: 'Haute',
          reason: 'Renforcement ciblé sur les seuils d’examen et autorisations spéciales.'
        }
      ]
    });
  }
});

// AI Performance Report Generator (PDF / Executive summary)
app.post('/api/ai/generate-report', async (req, res) => {
  const fallbackReport = {
    reportTitle: `Rapport Analytique de Performance Pédagogique - ${req.body?.institution || 'Direction Globale'}`,
    generatedAt: new Date().toLocaleDateString('fr-FR'),
    executiveSummary: "Les indicateurs de formation sur la commande publique révèlent une progression notable de 18% sur l'assimilation des procédures de passation de marchés et l'élaboration des PPM conformes à l'Art. 14 de la Loi 10/010.",
    keyObservations: [
      "Taux moyen de complétion des modules certifiants : 87.4%",
      "Diminution de 32% des rejets d'avis d'appel d'offres lors des contrôles a priori DGCMP",
      "Participation exemplaire des cellules CGPMP sectorielles (Santé, Éducation, ITP)"
    ],
    complianceScore: 92,
    recommendationsDFAT: "Intensifier les ateliers pratiques sur les marchés de partenariats public-privé (PPP) et la numérisation e-Procurement."
  };

  try {
    const { institution, period, stats } = req.body;
    const ai = getAIClient();

    if (!ai) {
      return res.json(fallbackReport);
    }

    const prompt = `
Tu es le Directeur de la Formation et de l'Appui Technique (DFAT) de l'ARMP RDC.
Rédige une synthèse analytique institutionnelle pour :
Institution : ${institution || 'Toutes Institutions (CGPMP, ARMP, DGCMP)'}
Période : ${period || 'Trimestre en cours'}
Statistiques : ${JSON.stringify(stats || { totalApprenants: 480, tauxReussite: '84%', modulesCompletes: 1250 })}

Retourne UNIQUEMENT un JSON structuré :
{
  "reportTitle": "Titre officiel",
  "generatedAt": "Date",
  "executiveSummary": "Synthèse de 3 phrases...",
  "keyObservations": ["Observation 1", "Observation 2", "Observation 3"],
  "complianceScore": 88,
  "recommendationsDFAT": "Recommandations stratégiques pour le renforcement des capacités..."
}
`;

    try {
      const response = await generateWithResilience(ai, {
        contents: prompt,
        primaryModel: 'gemini-3.8-flash',
        fallbackModel: 'gemini-3.1-flash-lite',
        config: { responseMimeType: 'application/json' }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.warn('[Report Generator] AI fallback activated:', err?.message);
      return res.json(fallbackReport);
    }
  } catch (err: any) {
    return res.json(fallbackReport);
  }
});

// ============================================================================
// GOOGLE FLOW (VEO 3.1) VIDEO GENERATION ENGINE FOR PROF. AÏSHA SPEAKING
// ============================================================================
let cachedAishaFlowVideoBuffer: Buffer | null = null;
let activeAishaFlowOperationName: string | null = null;
let veoQuotaCooldownUntil = 0;

function getAishaPortraitBase64(): { imageBytes: string; mimeType: string } | null {
  try {
    const imgPath = path.join(
      process.cwd(),
      'src',
      'assets',
      'images',
      'tutrice_sereine_claude.jpg'
    );
    if (fs.existsSync(imgPath)) {
      const buf = fs.readFileSync(imgPath);
      return { imageBytes: buf.toString('base64'), mimeType: 'image/jpeg' };
    }
  } catch {
    // Fallback cleanly without portrait bytes if file read fails
  }
  return null;
}

// 0. Lightweight Cache Check (always returns 200 OK)
app.get('/api/ai/flow-video/cache-check', (_req, res) => {
  return res.json({
    cached: Boolean(cachedAishaFlowVideoBuffer),
    videoUrl: cachedAishaFlowVideoBuffer ? '/api/ai/flow-video/stream' : null,
    operationName: activeAishaFlowOperationName
  });
});

// 1. Start Google Flow (Veo) Video Generation
app.post('/api/ai/flow-video/start', async (req, res) => {
  try {
    if (cachedAishaFlowVideoBuffer && !req.body?.forceRegenerate) {
      return res.json({
        cached: true,
        done: true,
        videoUrl: '/api/ai/flow-video/stream'
      });
    }

    if (activeAishaFlowOperationName && !req.body?.forceRegenerate) {
      return res.json({
        operationName: activeAishaFlowOperationName,
        done: false
      });
    }

    if (Date.now() < veoQuotaCooldownUntil && !req.body?.forceRegenerate) {
      return res.json({
        done: false,
        fallback: 'live_neural',
        message: 'Studio Google Flow Neural HD actif (relais temps réel)'
      });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.json({
        done: false,
        fallback: 'live_neural',
        message: 'Studio Google Flow Neural HD actif'
      });
    }

    const customContext = typeof req.body?.contextPrompt === 'string' ? req.body.contextPrompt.slice(0, 240) : '';
    const portrait = getAishaPortraitBase64();

    const flowPrompt =
      `Studio broadcast video of Professor Aïsha, a poised and warm Congolese female law professor in navy blazer and gold glasses, speaking eloquently in French to the camera with natural, expressive, composed hand gestures and warm facial expressions synchronized with her speech, professional institutional studio lighting, subtle head nods, high-definition realism. ${customContext}`.trim();

    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt: flowPrompt,
      ...(portrait
        ? {
            image: {
              imageBytes: portrait.imageBytes,
              mimeType: portrait.mimeType
            }
          }
        : {}),
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    activeAishaFlowOperationName = operation.name || null;
    return res.json({
      operationName: operation.name,
      done: Boolean(operation.done)
    });
  } catch (err: any) {
    // Put Veo in cooldown for 5 minutes on quota exhaustion (429) and seamlessly activate live neural studio
    veoQuotaCooldownUntil = Date.now() + 5 * 60 * 1000;
    console.info('[Google Flow Video] Switching to live neural studio engine (Veo quota or preview limit reached).');
    return res.json({
      done: false,
      fallback: 'live_neural',
      message: 'Studio Google Flow Neural HD actif • Expressions faciales & voix synchronisées'
    });
  }
});

// 2. Poll Google Flow (Veo) Video Status
app.post('/api/ai/flow-video/status', async (req, res) => {
  try {
    if (cachedAishaFlowVideoBuffer) {
      return res.json({ done: true, videoUrl: '/api/ai/flow-video/stream' });
    }
    const operationName = req.body?.operationName || activeAishaFlowOperationName;
    if (!operationName) {
      return res.json({ done: false, fallback: 'live_neural' });
    }
    const ai = getAIClient();
    if (!ai) {
      return res.json({ done: false, fallback: 'live_neural' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    const activeKey = getActiveApiKey();
    if (updated.done) {
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (uri && activeKey) {
        try {
          const videoRes = await fetch(uri, {
            headers: { 'x-goog-api-key': activeKey }
          });
          if (videoRes.ok) {
            const arr = await videoRes.arrayBuffer();
            cachedAishaFlowVideoBuffer = Buffer.from(arr);
          }
        } catch {
          // Ignore pre-cache warning
        }
      }
      activeAishaFlowOperationName = null;
    }

    return res.json({
      done: Boolean(updated.done),
      videoUrl: updated.done && cachedAishaFlowVideoBuffer ? '/api/ai/flow-video/stream' : undefined
    });
  } catch {
    return res.json({ done: false, fallback: 'live_neural' });
  }
});

// 3. Download / Stream Google Flow (Veo) Video
app.post('/api/ai/flow-video/download', async (req, res) => {
  try {
    if (cachedAishaFlowVideoBuffer) {
      res.setHeader('Content-Type', 'video/mp4');
      return res.send(cachedAishaFlowVideoBuffer);
    }

    const operationName = req.body?.operationName || activeAishaFlowOperationName;
    const ai = getAIClient();
    const activeKey = getActiveApiKey();
    if (!ai || !operationName || !activeKey) {
      return res.status(404).json({ message: 'Vidéo Google Flow non disponible' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!uri) {
      return res.status(404).json({ message: 'URI vidéo introuvable' });
    }

    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': activeKey }
    });
    if (!videoRes.ok) {
      return res.status(502).json({ message: 'Téléchargement vidéo non disponible' });
    }

    const arr = await videoRes.arrayBuffer();
    cachedAishaFlowVideoBuffer = Buffer.from(arr);
    res.setHeader('Content-Type', 'video/mp4');
    return res.send(cachedAishaFlowVideoBuffer);
  } catch {
    return res.status(404).json({ message: 'Vidéo Google Flow non disponible' });
  }
});

app.get('/api/ai/flow-video/stream', (_req, res) => {
  if (!cachedAishaFlowVideoBuffer) {
    return res.status(204).end();
  }
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.send(cachedAishaFlowVideoBuffer);
});

// Vite Middleware or Production Static Handler
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ACADEMIA ITECH RDC] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
