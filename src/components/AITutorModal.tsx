import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  User,
  Sparkles,
  Copy,
  Check,
  Scale,
  HelpCircle,
  Loader2,
  Mic,
  MicOff,
  Phone,
  Video,
  Image as ImageIcon,
  PhoneOff,
  VideoOff,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Camera,
  Waves,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Award,
  BookOpen,
  MessageSquarePlus,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sliders,
  Settings
} from 'lucide-react';
import { ChatMessage, UserProfile } from '../types';
import { saveTutorHistoryToFirestore, fetchTutorHistoryFromFirestore } from '../firebase';
import { speechService, VoicePersona } from '../utils/speechService';
import { avatarExpressionEngine } from '../utils/avatarExpressionEngine';
import type { AvatarEmotion } from '../workers/avatarExpressionWorker';
import { AishaAvatar } from './AishaAvatar';

// Rendu Markdown enrichi : gras, listes, citations juridiques, tableaux et blocs Question
const renderMarkdown = (text: string) => {
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const renderInline = (t: string): React.ReactNode => {
    const parts = t.split(/(\*\*.*?\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-extrabold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={i} className="italic text-blue-700 dark:text-blue-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('>')) {
        return (
          <em key={i} className="text-slate-600 dark:text-slate-300">
            {part}
          </em>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const header = tableRows[0];
      const body = tableRows.slice(1).filter((r) => !r.every((c) => /^[-:]+$/.test(c.trim())));
      out.push(
        <div
          key={`tbl-${out.length}`}
          className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700"
        >
          <table className="min-w-full text-[12px] border-collapse">
            <thead className="bg-slate-900 text-white">
              <tr>
                {header.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-black whitespace-nowrap">
                    {h.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800">
              {body.map((r, ri) => (
                <tr
                  key={ri}
                  className={
                    ri % 2 === 0
                      ? 'bg-white dark:bg-slate-800'
                      : 'bg-slate-50 dark:bg-slate-800/60'
                  }
                >
                  {r.map((c, ci) => (
                    <td
                      key={ci}
                      className="px-3 py-2 border-t border-slate-100 dark:border-slate-700"
                    >
                      {renderInline(c.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.slice(1, -1).split('|');
      if (cells.every((c) => /^\s*[-:]+\s*$/.test(c))) {
        tableRows.push(cells);
        inTable = true;
        return;
      }
      if (inTable || (tableRows.length === 0 && lines[idx + 1]?.includes('---'))) {
        inTable = true;
        tableRows.push(cells);
        return;
      }
    }
    if (inTable) flushTable();
    if (!trimmed) {
      out.push(<div key={idx} className="h-1.5" />);
      return;
    }
    if (trimmed.startsWith('>')) {
      out.push(
        <blockquote
          key={idx}
          className="border-l-4 border-blue-500 pl-3 py-2 my-2 bg-blue-50/80 dark:bg-blue-950/30 rounded-r-xl text-[13px] leading-relaxed"
        >
          {renderInline(trimmed.replace(/^>\s*/, ''))}
        </blockquote>
      );
      return;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      out.push(
        <div key={idx} className="flex gap-2 ml-2 my-1 text-[13px] leading-relaxed">
          <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
          <span className="flex-1">{renderInline(trimmed.replace(/^[-*]\s+/, ''))}</span>
        </div>
      );
      return;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      const m = trimmed.match(/^(\d+)\.\s+(.*)/);
      out.push(
        <div key={idx} className="flex gap-2 ml-2 my-1 text-[13px] leading-relaxed">
          <span className="font-black text-blue-600 dark:text-blue-400">{m![1]}.</span>
          <span className="flex-1">{renderInline(m![2])}</span>
        </div>
      );
      return;
    }
    if (trimmed.startsWith('**Question')) {
      out.push(
        <div
          key={idx}
          className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 text-[13px] text-amber-950 dark:text-amber-100"
        >
          {renderInline(line)}
        </div>
      );
      return;
    }
    out.push(
      <p key={idx} className="my-1.5 text-[13px] leading-relaxed">
        {renderInline(line)}
      </p>
    );
  });
  if (inTable) flushTable();
  return <>{out}</>;
};

export interface InteractiveQuizData {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  legalRef: string;
}

interface AITutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  learningContext?: {
    lastCourseTitle: string;
    lastCourseCode: string;
    lastCourseCategory: string;
    lastCourseProgress: number;
    recentTitles: string;
    overallProgress: number;
    lastCourseExcerpt?: string;
    lastCourseLessons?: string;
  } | null;
  initialQuestion?: string | null;
  onClearInitialQuestion?: () => void;
  initialAction?: 'chat' | 'call' | 'video' | 'voice' | null;
  initialTutor?: VoicePersona | null;
  onClearInitialAction?: () => void;
}

type QACategoryId =
  | 'essentiels'
  | 'ppm_seuils'
  | 'dao_plis'
  | 'controle_gre'
  | 'recours_crd'
  | 'contenu_local'
  | 'quiz_cas';

const QA_CATEGORIES: Array<{
  id: QACategoryId;
  label: string;
  badge: string;
  questions: string[];
}> = [
  {
    id: 'essentiels',
    label: 'Questions Fréquentes',
    badge: '🔥',
    questions: [
      'Quand dois-je demander une autorisation avant de signer un grand marché ?',
      "Comment contester une décision si je m'estime lésé ?",
      'Que doit contenir le dossier que je donne aux entreprises ?',
      'Quelles sont les 8 étapes clés de la passation d’un marché public ?',
      'Quelle est la différence des rôles entre CGPMP, DGCMP et ARMP ?'
    ]
  },
  {
    id: 'ppm_seuils',
    label: 'PPM & Seuils',
    badge: '📋',
    questions: [
      'Que se passe-t-il si un marché est lancé sans figurer dans le PPM publié (Art. 14) ?',
      'Comment éviter le piège du fractionnement ou saucissonnage (Art. 13) ?',
      'Quelle est la différence entre allotissement régulier et fractionnement illicite ?',
      'Quels sont les 4 grands principes fondamentaux de la Loi n° 10/010 (Art. 5) ?'
    ]
  },
  {
    id: 'dao_plis',
    label: 'DAO & Évaluation',
    badge: '📄',
    questions: [
      'Quelles sont les 5 pièces constitutives d’un Dossier d’Appel d’Offres (DAO Type) ?',
      'Comment se déroule la séance publique d’ouverture des plis (Art. 46) ?',
      'Comment traiter une offre financière jugée anormalement basse (Art. 49) ?',
      'Comment recruter un consultant pour des prestations intellectuelles (TDR et DP) ?'
    ]
  },
  {
    id: 'controle_gre',
    label: 'Contrôle & Gré à gré',
    badge: '🚦',
    questions: [
      'Dans quels cas l’Avis de Non-Objection (ANO) de la DGCMP est-il obligatoire ?',
      'Quelles sont les 3 conditions strictes pour passer un marché de gré à gré (Art. 42) ?',
      'Quelles sont les règles et plafonds à respecter avant de signer un avenant ?',
      'Quelles sont les différentes garanties et cautions bancaires exigées ?'
    ]
  },
  {
    id: 'recours_crd',
    label: 'Recours & Contentieux',
    badge: '⚖️',
    questions: [
      'Quels sont les délais exacts du recours gracieux préalable (Art. 77) ?',
      'Comment saisir le Comité de Règlement des Différends (CRD) et quel est son effet suspensif ?',
      'Quelles sanctions l’ARMP peut-elle infliger en cas de fraude ou conflit d’intérêts (Art. 84 & 88) ?'
    ]
  },
  {
    id: 'contenu_local',
    label: 'Contenu Local & Exécution',
    badge: '🇨🇩',
    questions: [
      'Comment appliquer la préférence nationale (Art. 36) et le contenu local (51% ARSP) ?',
      'Que faire face à un fournisseur en retard ou défaillant pendant l’exécution ?',
      'Comment fonctionnent les pénalités de retard et la réception provisoire/définitive ?'
    ]
  },
  {
    id: 'quiz_cas',
    label: 'Quiz & Cas Pratiques',
    badge: '🎯',
    questions: [
      'Lance-moi un Quiz interactif Q/R sur mon cours',
      'Donne-moi un cas pratique sur le fractionnement et les seuils',
      'Simule un cas pratique de recours devant le CRD de l’ARMP',
      'Teste mes connaissances sur le contrôle a priori DGCMP'
    ]
  }
];

export interface VirtualTutorProfile {
  id: VoicePersona;
  name: string;
  title: string;
  specialty: string;
  badge: string;
  voiceLabel: string;
  desc: string;
  accentColor: string;
  greeting: (firstName: string) => string;
}

export const VIRTUAL_TUTORS: VirtualTutorProfile[] = [
  {
    id: 'vivienne',
    name: 'Prof. Aïsha',
    title: 'Directrice Pédagogique • Loi 10/010 & Passation',
    specialty: 'Procédures globales, PPM, DAO & Seuils',
    badge: '👩‍🏫 Tutrice Principale',
    voiceLabel: 'Aïsha • Voix Éloquente & Humaine (Neural HD)',
    desc: 'Chaleureuse & charismatique',
    accentColor: 'from-blue-600 to-indigo-700',
    greeting: (_firstName: string) =>
      `Bonjour ! Ravie de vous retrouver… Aujourd'hui, nous allons explorer quelques idées ensemble. Regardez bien, écoutez… et n'hésitez jamais à poser vos questions : chaque échange nous aide à mieux comprendre — et à avancer avec confiance !`
  },
  {
    id: 'charline',
    name: 'Me. Charline',
    title: 'Avocate Conseil • Contentieux, CRD & Recours ARMP',
    specialty: 'Recours gracieux, litiges CRD & sanctions',
    badge: '⚖️ Tutrice Contentieux',
    voiceLabel: 'Vivienne HD • Mélodieuse & Souriante',
    desc: 'Veloutée & posée',
    accentColor: 'from-purple-600 to-fuchsia-700',
    greeting: (_firstName: string) =>
      `Bonjour ! Ravie de vous retrouver… Aujourd'hui, nous allons explorer quelques idées ensemble. Regardez bien, écoutez… et n'hésitez jamais à poser vos questions : chaque échange nous aide à mieux comprendre — et à avancer avec confiance !`
  },
  {
    id: 'denise',
    name: 'Dr. Vivienne',
    title: 'Experte Contrôle a priori • DGCMP, ANO & Gré à gré',
    specialty: 'Seuils DGCMP, Avis de Non-Objection & Avenants',
    badge: '🏛️ Tutrice Contrôle DGCMP',
    voiceLabel: 'Vivienne Studio • Douce & Souriante',
    desc: 'Institutionnelle & sereine',
    accentColor: 'from-emerald-600 to-teal-700',
    greeting: (_firstName: string) =>
      `Bonjour ! Ravie de vous retrouver… Aujourd'hui, nous allons explorer quelques idées ensemble. Regardez bien, écoutez… et n'hésitez jamais à poser vos questions : chaque échange nous aide à mieux comprendre — et à avancer avec confiance !`
  },
  {
    id: 'eloise',
    name: 'Insp. Ariane',
    title: 'Inspectrice Audit • Exécution, Garanties & Contenu Local',
    specialty: 'Cautions, pénalités, réception & sous-traitance 51%',
    badge: '🔍 Tutrice Audit & Exécution',
    voiceLabel: 'Vivienne HD • Claire & Souriante',
    desc: 'Claire & articulée',
    accentColor: 'from-amber-500 to-orange-600',
    greeting: (_firstName: string) =>
      `Bonjour ! Ravie de vous retrouver… Aujourd'hui, nous allons explorer quelques idées ensemble. Regardez bien, écoutez… et n'hésitez jamais à poser vos questions : chaque échange nous aide à mieux comprendre — et à avancer avec confiance !`
  }
];

const VOICE_OPTIONS: Array<{ id: VoicePersona; label: string; desc: string }> = VIRTUAL_TUTORS.map((t) => ({
  id: t.id,
  label: `${t.name} (${t.voiceLabel.split('•')[0].trim()})`,
  desc: t.specialty
}));

// Convertit un Blob en data URL base64 pour l'envoi multimodal au serveur
const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// Génère un vrai fichier audio WAV (PCM 16-bit) avec carillon vocal doux pour les appareils sans micro matériel
const createSynthesizedVoiceNoteBlob = (text: string): { blob: Blob; durationLabel: string } => {
  const sampleRate = 22050;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const durationSec = Math.max(2, Math.min(12, Math.ceil(words * 0.42)));
  const numSamples = sampleRate * durationSec;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Enveloppe syllabique douce pour donner un rendu sonore agréable à la lecture du lecteur audio
    const syllableEnv = 0.35 + 0.65 * Math.abs(Math.sin(2 * Math.PI * 3.2 * t));
    const fade = Math.min(1, t / 0.08) * Math.min(1, (durationSec - t) / 0.15);
    const f0 = 195 + 25 * Math.sin(2 * Math.PI * 1.4 * t);
    const wave =
      0.55 * Math.sin(2 * Math.PI * f0 * t) +
      0.28 * Math.sin(2 * Math.PI * (f0 * 2) * t) +
      0.12 * Math.sin(2 * Math.PI * (f0 * 3) * t);
    const sample = Math.max(-1, Math.min(1, wave * syllableEnv * fade * 0.18));
    view.setInt16(44 + i * 2, sample * 32767, true);
  }
  const mm = Math.floor(durationSec / 60);
  const ss = String(durationSec % 60).padStart(2, '0');
  return {
    blob: new Blob([buffer], { type: 'audio/wav' }),
    durationLabel: `${mm}:${ss}`
  };
};

type MediaAttachment = {
  type: 'image' | 'video' | 'audio';
  url: string;
  name?: string;
  duration?: string;
  audioBase64?: string;
  mimeType?: string;
  transcriptText?: string;
};

type EnhancedMessage = ChatMessage & {
  media?: MediaAttachment;
  isVoice?: boolean;
  suggestedFollowUps?: string[];
  interactiveQuiz?: InteractiveQuizData;
  selectedQuizOption?: number;
};

export const AITutorModal: React.FC<AITutorModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  learningContext,
  initialQuestion,
  onClearInitialQuestion,
  initialAction,
  initialTutor,
  onClearInitialAction
}) => {
  const buildWelcomeMessage = (): EnhancedMessage => {
    const firstName = currentProfile.name ? currentProfile.name.split(' ')[0] : 'cher collègue';
    return {
      id: 'init-1',
      sender: 'tuteur',
      text: learningContext
        ? `**Bonjour ${firstName} 🌸 Quelle joie de te retrouver dans notre Studio Questions / Réponses !**\n\nJe vois que tu avances avec cœur sur **${learningContext.lastCourseTitle}** (${learningContext.lastCourseProgress}% complété, progression globale à **${learningContext.overallProgress}%**). Ici, tu peux me poser toutes tes questions par écrit ou à voix haute.\n\nQue ce soit un doute sur ton dossier en cours, une préparation d'examen, une vérification de délai légal ou un **Quiz interactif Q/R**, je te réponds de vive voix et pas à pas.\n\n**Question :** Par quelle question ou mise en situation souhaites-tu commencer aujourd'hui, ${firstName} ?`
        : `**Bonjour ${firstName} 🌸 Bienvenue dans ton Studio Tuteur Virtuel Questions / Réponses !**\n\nJe suis **Aïsha**, ta tutrice dédiée à la commande publique en RDC. Pose-moi librement toutes tes questions sur la Loi n° 10/010, le Plan de Passation (PPM), les Dossiers d'Appel d'Offres (DAO), l'Avis de Non-Objection (DGCMP) ou les recours devant l'ARMP.\n\nJe t'explique chaque règle de vive voix avec des exemples concrets de terrain et des quiz interactifs.\n\n**Question :** Dis-moi tout, ${firstName}, quelle question te préoccupe en ce moment ?`,
      timestamp: 'À l’instant',
      sources: learningContext
        ? [
            `Ton parcours : ${learningContext.lastCourseTitle} (${learningContext.lastCourseProgress}%)`,
            'Aïsha • Tuteur Virtuel Q/R & Loi du 27 avril 2010'
          ]
        : ['Aïsha • Tuteur Virtuel Q/R', 'Loi n° 10/010 du 27 avril 2010'],
      suggestedFollowUps: [
        'Quand dois-je demander une autorisation avant de signer un grand marché ?',
        "Comment contester une décision si je m'estime lésé ?",
        'Lance-moi un Quiz interactif Q/R sur mon cours'
      ]
    };
  };

  const storageKey = `armp_tutor_history_${currentProfile.id || currentProfile.role}`;

  const [messages, setMessages] = useState<EnhancedMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [buildWelcomeMessage()];
  });

  const [activeCategory, setActiveCategory] = useState<QACategoryId>('essentiels');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenSubtitle, setSpokenSubtitle] = useState<string>('');
  const [activeSpeakingMsgId, setActiveSpeakingMsgId] = useState<string | null>(null);
  const [activeEmotionLabel, setActiveEmotionLabel] = useState<string>(
    '😊 Sourire Chaleureux & Bienveillance'
  );
  const [manualTutorEmotion, setManualTutorEmotion] = useState<AvatarEmotion | 'auto'>('smiling');
  const [detectedSpeechEmotion, setDetectedSpeechEmotion] = useState<AvatarEmotion>('smiling');
  const [isListening, setIsListening] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<{
    order: Array<{ id: 'elevenlabs' | 'neural' | 'gemini'; enabled: boolean }>;
    neuralVoice: 'denise' | 'vivienne-multilingual' | 'vivienne';
    browserFallback?: boolean;
    availability?: { elevenlabs?: boolean; neural?: boolean; gemini?: boolean };
    elevenlabsVoiceId?: string;
  } | null>(null);
  const [voiceSettingsMsg, setVoiceSettingsMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [hasCameraStream, setHasCameraStream] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaAttachment | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveVoiceTranscript, setLiveVoiceTranscript] = useState('');
  const [showAssistedVoiceBox, setShowAssistedVoiceBox] = useState(false);
  const [assistedVoiceText, setAssistedVoiceText] = useState('');
  const [inCallQuestionText, setInCallQuestionText] = useState('');
  const [isCallConnecting, setIsCallConnecting] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<VoicePersona>(() => speechService.getVoicePersona());
  const activeTutor = VIRTUAL_TUTORS.find((t) => t.id === selectedVoice) || VIRTUAL_TUTORS[0];
  const [tutorSpeed, setTutorSpeed] = useState<number>(0.95);
  const [showStudioStage, setShowStudioStage] = useState<boolean>(true);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileImageRef = useRef<HTMLInputElement>(null);
  const fileVideoRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const voiceRecordRecognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordActionRef = useRef<'send' | 'preview' | 'cancel'>('send');
  const liveTranscriptRef = useRef<string>('');
  const recordingTimerRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callGreetingTimerRef = useRef<any>(null);
  const handledInitialQuestionRef = useRef<string | null>(null);

  const showNotice = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // Synchronise avec Firestore à l'ouverture ou au changement de profil
  useEffect(() => {
    let mounted = true;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && mounted) {
          setMessages(parsed);
        }
      } else if (mounted) {
        setMessages([buildWelcomeMessage()]);
      }
    } catch {}

    if (currentProfile.id) {
      fetchTutorHistoryFromFirestore(currentProfile.id)
        .then((remoteMsgs) => {
          if (mounted && Array.isArray(remoteMsgs) && remoteMsgs.length > 0) {
            setMessages(remoteMsgs);
            try {
              localStorage.setItem(storageKey, JSON.stringify(remoteMsgs));
            } catch {}
          }
        })
        .catch(() => {});
    }
    return () => {
      mounted = false;
    };
  }, [currentProfile.id, storageKey]);

  const persistMessages = (nextMsgs: EnhancedMessage[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextMsgs.slice(-40)));
    } catch {}
    if (currentProfile.id) {
      saveTutorHistoryToFirestore(currentProfile.id, nextMsgs.slice(-40)).catch(() => {});
    }
  };

  const handleResetConversation = () => {
    stopSpeaking();
    const fresh = [buildWelcomeMessage()];
    setMessages(fresh);
    persistMessages(fresh);
  };

  useEffect(() => {
    if (learningContext) {
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === 'init-1') {
          return [buildWelcomeMessage()];
        }
        return prev;
      });
    }
  }, [learningContext?.lastCourseTitle, learningContext?.lastCourseProgress]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isSpeaking]);

  useEffect(() => {
    const unsub = speechService.subscribe((st) => {
      if (st.currentId && st.currentId.startsWith('tutor-')) {
        setIsSpeaking(Boolean(st.isPlaying && !st.isLoading));
        if (st.currentSentenceText) {
          setSpokenSubtitle(st.currentSentenceText);
        }
        if (st.emotionLabel) {
          setActiveEmotionLabel(st.emotionLabel);
        }
        if (st.emotion) {
          setDetectedSpeechEmotion(st.emotion as AvatarEmotion);
        }
        if (!st.isPlaying) {
          setActiveSpeakingMsgId(null);
        }
      } else if (!st.isPlaying) {
        setIsSpeaking(false);
        setActiveSpeakingMsgId(null);
      }
    });
    return () => {
      unsub();
      speechService.stop();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Si une question initiale est passée depuis un cours ou un texte légal, l'envoyer automatiquement
  useEffect(() => {
    if (
      isOpen &&
      initialQuestion &&
      initialQuestion.trim() &&
      handledInitialQuestionRef.current !== initialQuestion.trim()
    ) {
      handledInitialQuestionRef.current = initialQuestion.trim();
      const qToRun = initialQuestion.trim();
      onClearInitialQuestion?.();
      setTimeout(() => {
        handleSendMessage(qToRun);
      }, 180);
    }
  }, [isOpen, initialQuestion]);

  // Si un appel direct (audio, visio ou voice) est demandé depuis le bouton flottant ou le lecteur de cours
  useEffect(() => {
    if (!isOpen || !initialAction) return;
    const targetTutor = initialTutor || selectedVoice;
    if (initialTutor && initialTutor !== selectedVoice) {
      setSelectedVoice(initialTutor);
      speechService.setVoicePersona(initialTutor);
    }
    const act = initialAction;
    onClearInitialAction?.();
    setTimeout(() => {
      if (act === 'call') startCall(targetTutor);
      else if (act === 'video') startVideoCall(targetTutor);
      else if (act === 'voice') startVoiceRecord();
    }, 150);
  }, [isOpen, initialAction, initialTutor]);

  useEffect(() => {
    let t: any;
    if (isCallActive || isVideoCallActive) {
      t = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    } else setCallSeconds(0);
    return () => clearInterval(t);
  }, [isCallActive, isVideoCallActive]);

  const formatCallTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Nettoyage naturel du texte Markdown pour la synthèse vocale HD d'Aïsha
  const humanizeForSpeech = (raw: string) => {
    return raw
      .replace(/[*#`_>]/g, '')
      .replace(/\|.*\|/g, ' ')
      .replace(/---+/g, ' ')
      .replace(/💡|✨|⚖️|🏛️|📋|👥|🤝|🎓|📄|📢|🛡️|📦|🔄|🌸|🎯|🧩|🚫|🚦|👣|🔒|🗺️|⚠️|🤗|🇨🇩|📐|🧠/g, '')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
      .replace(/\bQ1\b/g, 'Première question')
      .replace(/\bQ2\b/g, 'Deuxième question')
      .replace(/\s+/g, ' ')
      .replace(/\.\.\./g, '…')
      .trim()
      .slice(0, 1800);
  };

  const speak = (text: string, msgId?: string, customVoice?: VoicePersona, customSpeed?: number) => {
    if (!text) return;
    speechService.unlockAudio();

    const clean = humanizeForSpeech(text);
    if (!clean) return;

    const voiceToUse = customVoice || selectedVoice;
    const speedToUse = customSpeed || tutorSpeed;

    if (msgId) setActiveSpeakingMsgId(msgId);
    setSpokenSubtitle(clean.split(/(?<=[.!?…])\s+/)[0] || clean.slice(0, 140));

    speechService.play(clean, msgId ? `tutor-${msgId}` : `tutor-${Date.now()}`, {
      speed: speedToUse,
      voice: voiceToUse
    });
  };

  const stopSpeaking = () => {
    speechService.stop();
    setIsSpeaking(false);
    setActiveSpeakingMsgId(null);
  };

  const handleChangeVoice = (v: VoicePersona) => {
    setSelectedVoice(v);
    speechService.setVoicePersona(v);
    const lastBotMsg = [...messages].reverse().find((m) => m.sender === 'tuteur');
    if (isSpeaking && lastBotMsg) {
      speak(lastBotMsg.text, lastBotMsg.id, v, tutorSpeed);
    }
  };

  const handleCycleSpeed = () => {
    const order = [0.95, 1.0, 0.88];
    const idx = order.indexOf(tutorSpeed);
    const next = order[(idx + 1) % order.length];
    setTutorSpeed(next);
    const lastBotMsg = [...messages].reverse().find((m) => m.sender === 'tuteur');
    if (isSpeaking && lastBotMsg) {
      speak(lastBotMsg.text, lastBotMsg.id, selectedVoice, next);
    }
  };

  const startListening = (autoSendOnFinal = false) => {
    speechService.unlockAudio();
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      // Si SpeechRecognition n'est pas supporté, basculer automatiquement sur l'enregistreur de Note Vocale (transcrit par Gemini côté serveur)
      startVoiceRecord();
      return;
    }
    stopSpeaking();
    try {
      const rec = new SR();
      rec.lang = 'fr-FR';
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      recognitionRef.current = rec;
      setIsListening(true);
      let latestTranscript = '';
      rec.start();
      rec.onresult = (e: any) => {
        const transcript = Array.from(e.results)
          .map((r: any) => r[0]?.transcript || '')
          .join(' ')
          .trim();
        latestTranscript = transcript;
        if (isCallActive || isVideoCallActive) {
          setInCallQuestionText(transcript);
        } else {
          setInputText(transcript);
        }
        const lastResult = e.results[e.results.length - 1];
        if (lastResult?.isFinal) {
          setIsListening(false);
          if ((autoSendOnFinal || isCallActive || isVideoCallActive) && transcript) {
            setInCallQuestionText('');
            handleSendMessage(transcript);
          }
        }
      };
      rec.onerror = () => {
        setIsListening(false);
        if (!latestTranscript) {
          startVoiceRecord();
        }
      };
      rec.onend = () => {
        setIsListening(false);
      };
    } catch {
      setIsListening(false);
      startVoiceRecord();
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsListening(false);
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPreviewMedia({ type: 'image', url, name: f.name });
    e.target.value = '';
  };
  const handleVideoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPreviewMedia({ type: 'video', url, name: f.name });
    e.target.value = '';
  };

  const getSupportedAudioMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];
    for (const c of candidates) {
      try {
        if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(c)) {
          return c;
        }
      } catch {}
    }
    return '';
  };

  const startVoiceRecord = async () => {
    speechService.unlockAudio();
    stopSpeaking();
    setLiveVoiceTranscript('');
    liveTranscriptRef.current = '';
    setRecordingSeconds(0);
    recordActionRef.current = 'send';

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setShowAssistedVoiceBox(true);
      showNotice('Mode Voice Assisté activé : saisissez ou dictez votre message vocal.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMimeType();
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      const startedAt = Date.now();

      // Lance en parallèle la reconnaissance vocale locale si disponible pour afficher la transcription en direct
      const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        try {
          const rec = new SR();
          rec.lang = 'fr-FR';
          rec.continuous = true;
          rec.interimResults = true;
          rec.onresult = (ev: any) => {
            const t = Array.from(ev.results)
              .map((r: any) => r[0]?.transcript || '')
              .join(' ')
              .trim();
            if (t) {
              liveTranscriptRef.current = t;
              setLiveVoiceTranscript(t);
            }
          };
          rec.start();
          voiceRecordRecognitionRef.current = rec;
        } catch {}
      }

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(Math.floor((Date.now() - startedAt) / 1000));
      }, 500);

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mr.onstop = async () => {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        try {
          voiceRecordRecognitionRef.current?.stop();
        } catch {}
        voiceRecordRecognitionRef.current = null;
        stream.getTracks().forEach((t) => t.stop());
        setIsRecordingVoice(false);

        const action = recordActionRef.current;
        if (action === 'cancel') {
          setLiveVoiceTranscript('');
          liveTranscriptRef.current = '';
          return;
        }

        const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
        const mm = Math.floor(elapsed / 60);
        const ss = String(elapsed % 60).padStart(2, '0');
        const finalMime = mr.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: finalMime });
        const url = URL.createObjectURL(blob);
        let audioBase64 = '';
        try {
          audioBase64 = await blobToDataUrl(blob);
        } catch {}

        const capturedTranscript = liveTranscriptRef.current.trim();
        const mediaAttachment: MediaAttachment = {
          type: 'audio',
          url,
          name: `Voice (${mm}:${ss})`,
          duration: `${mm}:${ss}`,
          audioBase64,
          mimeType: finalMime,
          transcriptText: capturedTranscript || undefined
        };

        setLiveVoiceTranscript('');
        liveTranscriptRef.current = '';

        if (action === 'send') {
          await handleSendMessage(capturedTranscript || '', mediaAttachment);
        } else {
          setPreviewMedia(mediaAttachment);
        }
      };

      mediaRecorderRef.current = mr;
      mr.start(250);
      setIsRecordingVoice(true);
      speechService.playTone('chime');

      setTimeout(() => {
        if (mr.state === 'recording') {
          recordActionRef.current = 'send';
          mr.stop();
        }
      }, 45000);
    } catch {
      // Fallback automatique vers le créateur de Voice assisté si le micro est bloqué par le navigateur/iframe
      setShowAssistedVoiceBox(true);
      showNotice('Micro non détecté : utilisez le générateur de Voice ci-dessous.');
    }
  };

  const stopVoiceRecord = (action: 'send' | 'preview' | 'cancel' = 'send') => {
    recordActionRef.current = action;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      setIsRecordingVoice(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const handleSendAssistedVoice = async (textForVoice?: string) => {
    const rawText = (textForVoice ?? assistedVoiceText ?? inputText).trim();
    if (!rawText) {
      showNotice('Écrivez votre question pour générer et envoyer le Voice.');
      return;
    }
    speechService.unlockAudio();
    const { blob, durationLabel } = createSynthesizedVoiceNoteBlob(rawText);
    const url = URL.createObjectURL(blob);
    const mediaAttachment: MediaAttachment = {
      type: 'audio',
      url,
      name: `Voice (${durationLabel})`,
      duration: durationLabel,
      mimeType: 'audio/wav',
      transcriptText: rawText
    };
    setAssistedVoiceText('');
    setShowAssistedVoiceBox(false);
    await handleSendMessage(rawText, mediaAttachment);
  };

  const startCall = (tutorId?: VoicePersona) => {
    speechService.unlockAudio();
    stopSpeaking();
    if (callGreetingTimerRef.current) {
      clearTimeout(callGreetingTimerRef.current);
      callGreetingTimerRef.current = null;
    }
    const targetVoice = tutorId || selectedVoice;
    if (tutorId && tutorId !== selectedVoice) {
      setSelectedVoice(tutorId);
      speechService.setVoicePersona(tutorId);
    }
    const tutorObj = VIRTUAL_TUTORS.find((t) => t.id === targetVoice) || activeTutor;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setHasCameraStream(false);
    setIsVideoCallActive(false);
    setIsCallActive(true);
    setIsCallConnecting(true);
    speechService.playTone('ring');

    const firstName = currentProfile.name ? currentProfile.name.split(' ')[0] : 'cher collègue';
    callGreetingTimerRef.current = setTimeout(() => {
      setIsCallConnecting(false);
      const greetingText = tutorObj.greeting(firstName);
      setSpokenSubtitle(greetingText);
      speak(greetingText, `call-greet-${Date.now()}`, targetVoice, tutorSpeed);
    }, 650);
  };

  const startVideoCall = async (tutorId?: VoicePersona) => {
    speechService.unlockAudio();
    stopSpeaking();
    if (callGreetingTimerRef.current) {
      clearTimeout(callGreetingTimerRef.current);
      callGreetingTimerRef.current = null;
    }
    const targetVoice = tutorId || selectedVoice;
    if (tutorId && tutorId !== selectedVoice) {
      setSelectedVoice(tutorId);
      speechService.setVoicePersona(tutorId);
    }
    const tutorObj = VIRTUAL_TUTORS.find((t) => t.id === targetVoice) || activeTutor;
    setIsCallActive(false);
    setIsVideoCallActive(true);
    setIsCallConnecting(true);
    speechService.playTone('ring');

    // Réutiliser le flux vidéo s'il est déjà actif (ex. changement de tutrice en pleine visio)
    const existingActiveVideo =
      localStreamRef.current &&
      localStreamRef.current.getVideoTracks().some((t) => t.readyState === 'live');

    if (!existingActiveVideo && navigator.mediaDevices?.getUserMedia) {
      try {
        // Demander uniquement la vidéo pour le retour caméra (muet) afin de ne jamais bloquer le micro SpeechRecognition / MediaRecorder
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        localStreamRef.current = s;
        setHasCameraStream(true);
        setIsCameraOff(false);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = s;
          await localVideoRef.current.play().catch(() => {});
        }
      } catch {
        setHasCameraStream(false);
      }
    } else if (existingActiveVideo) {
      setHasCameraStream(true);
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(() => {});
      }
    }

    const firstName = currentProfile.name ? currentProfile.name.split(' ')[0] : 'cher collègue';
    callGreetingTimerRef.current = setTimeout(() => {
      setIsCallConnecting(false);
      const greetingText = tutorObj.greeting(firstName);
      setSpokenSubtitle(greetingText);
      speak(greetingText, `visio-greet-${Date.now()}`, targetVoice, tutorSpeed);
    }, 650);
  };

  const toggleCamera = async () => {
    if (hasCameraStream && localStreamRef.current) {
      const nextOff = !isCameraOff;
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !nextOff;
      });
      setIsCameraOff(nextOff);
      return;
    }
    if (isCameraOff && navigator.mediaDevices?.getUserMedia) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        localStreamRef.current = s;
        setHasCameraStream(true);
        setIsCameraOff(false);
      } catch {
        setIsCameraOff(false);
      }
    } else {
      setIsCameraOff((v) => !v);
    }
  };

  const endCall = () => {
    if (callGreetingTimerRef.current) {
      clearTimeout(callGreetingTimerRef.current);
      callGreetingTimerRef.current = null;
    }
    stopSpeaking();
    stopListening();
    if (isRecordingVoice) stopVoiceRecord('cancel');
    speechService.playTone('hangup');
    setIsCallActive(false);
    setIsVideoCallActive(false);
    setIsCallConnecting(false);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setHasCameraStream(false);
    setCallSeconds(0);
  };

  useEffect(() => {
    if (isVideoCallActive && !isCameraOff && localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      localVideoRef.current.play().catch(() => {});
    }
  }, [isVideoCallActive, isCameraOff, hasCameraStream]);

  // Réponse interactive à une carte Quiz Q/R dans le chat
  const handleSelectQuizAnswer = (msgId: string, optionIdx: number) => {
    setMessages((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== msgId || !m.interactiveQuiz) return m;
        const isCorrect = optionIdx === m.interactiveQuiz.correctIndex;
        const spokenFeedback = isCorrect
          ? `Bravo ${currentProfile.name.split(' ')[0]} ! C'est exactement la bonne réponse. ${m.interactiveQuiz.explanation}`
          : `Pas tout à fait, ${currentProfile.name.split(' ')[0]}. La bonne réponse était l'option ${String.fromCharCode(
              65 + m.interactiveQuiz.correctIndex
            )}. ${m.interactiveQuiz.explanation}`;
        if (autoSpeak) {
          setTimeout(() => speak(spokenFeedback, m.id), 60);
        }
        return {
          ...m,
          selectedQuizOption: optionIdx
        };
      });
      persistMessages(updated);
      return updated;
    });
  };

  const handleSendMessage = async (textToSend?: string, customMedia?: MediaAttachment | null) => {
    const mediaToSend = customMedia !== undefined ? customMedia : previewMedia;
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if ((!text && !mediaToSend) || isLoading) return;

    speechService.unlockAudio();
    stopSpeaking();

    const userMsgId = `user-${Date.now()}`;
    const displayUserText =
      text ||
      mediaToSend?.transcriptText ||
      (mediaToSend?.type === 'image'
        ? '📷 Image jointe — analyse juridique du document'
        : mediaToSend?.type === 'video'
        ? '🎥 Vidéo jointe'
        : `🎙️ Note vocale envoyée à ${activeTutor.name} (${mediaToSend?.duration || '0:05'})`);

    const userMsg: EnhancedMessage = {
      id: userMsgId,
      sender: 'user',
      text: displayUserText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      media: mediaToSend || undefined,
      isVoice: mediaToSend?.type === 'audio'
    };
    const nextAfterUser = [...messages, userMsg];
    setMessages(nextAfterUser);
    persistMessages(nextAfterUser);
    if (textToSend === undefined) setInputText('');
    if (customMedia === undefined) setPreviewMedia(null);
    setIsLoading(true);

    try {
      const excerptForRag = learningContext?.lastCourseExcerpt
        ? ` | Leçon en cours: ${learningContext.lastCourseExcerpt}`
        : '';
      const lessonsForRag = learningContext?.lastCourseLessons
        ? ` | Leçons du cours: ${learningContext.lastCourseLessons}`
        : '';
      const effectiveMessage =
        text ||
        mediaToSend?.transcriptText ||
        (mediaToSend?.type === 'audio'
          ? ''
          : mediaToSend
          ? `[${mediaToSend.type} joint: ${mediaToSend.name}]`
          : '');

      const body: any = {
        message: effectiveMessage,
        history: nextAfterUser.slice(-8),
        context: `Tutrice sélectionnée: ${activeTutor.name} (${activeTutor.title}) | Utilisateur: ${currentProfile.name}, Rôle: ${currentProfile.roleTitle}, Institution: ${currentProfile.institution}, Niveau: ${currentProfile.level} | Dernier cours: ${
          learningContext
            ? `${learningContext.lastCourseTitle} (${learningContext.lastCourseCode}) ${learningContext.lastCourseProgress}%`
            : 'aucun'
        }${excerptForRag}${lessonsForRag}`,
        userName: currentProfile.name,
        tutorPersona: selectedVoice,
        learningContext: learningContext
          ? `${learningContext.lastCourseTitle} (${learningContext.lastCourseCode}, ${learningContext.lastCourseProgress}% — ${learningContext.lastCourseCategory}) | Récents: ${learningContext.recentTitles} | Global ${learningContext.overallProgress}%${excerptForRag}`
          : null,
        lastCourse: learningContext,
        mediaType: mediaToSend?.type || null,
        hasMedia: !!mediaToSend,
        audioBase64: mediaToSend?.type === 'audio' ? mediaToSend.audioBase64 : undefined,
        audioMimeType: mediaToSend?.type === 'audio' ? mediaToSend.mimeType : undefined
      };
      const response = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json().catch(() => ({}));

      // Si le serveur a transcrit la note vocale audio, enrichir le message utilisateur avec la transcription
      const transcribedText = typeof data.transcribedText === 'string' ? data.transcribedText.trim() : '';
      const updatedUserMessages = transcribedText && !text
        ? nextAfterUser.map((m) =>
            m.id === userMsgId
              ? { ...m, text: `🎙️ « ${transcribedText} »` }
              : m
          )
        : nextAfterUser;

      const reply: string =
        data.reply ||
        (response.ok
          ? "Pardonne-moi cette petite seconde d'attente, je suis de tout cœur avec toi — dis-moi comment je peux t'éclairer."
          : "Je reste tout près de toi pour t'expliquer chaque règle de la loi du 27 avril 2010 avec simplicité.");
      const botMsgId = `bot-${Date.now()}`;
      const botMsg: EnhancedMessage = {
        id: botMsgId,
        sender: 'tuteur',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources || [
          `${activeTutor.name} • Pédagogie humaine`,
          'Loi n° 10/010 du 27 avril 2010',
          'Manuel ARMP RDC'
        ],
        suggestedFollowUps: Array.isArray(data.suggestedFollowUps)
          ? data.suggestedFollowUps
          : [
              'Peux-tu me donner un exemple concret ?',
              'Lance-moi un Quiz interactif sur ce sujet',
              'Quelles sont les pièces à vérifier ?'
            ],
        interactiveQuiz: data.interactiveQuiz || undefined
      };
      const updatedConversation = [...updatedUserMessages, botMsg];
      setMessages(updatedConversation);
      persistMessages(updatedConversation);

      if (autoSpeak || mediaToSend?.type === 'audio' || isCallActive || isVideoCallActive) {
        setTimeout(() => speak(reply, botMsgId), 80);
      }
    } catch {
      const fallbackBotMsg: EnhancedMessage = {
        id: `bot-${Date.now()}`,
        sender: 'tuteur',
        text: `Je suis toujours là avec toi, ${
          currentProfile.name.split(' ')[0]
        } 🌸. Même si la connexion hésite une seconde, ne t'inquiète pas : reformule-moi simplement ta question avec tes mots et nous allons la résoudre pas à pas.`,
        timestamp: 'À l’instant',
        sources: ['Aïsha • Présence bienveillante', 'Loi n° 10/010'],
        suggestedFollowUps: [
          'Quelles sont les 8 étapes d’un marché public ?',
          'Lance-moi un Quiz interactif Q/R',
          'Comment fonctionne le recours gracieux ?'
        ]
      };
      const updatedErr = [...nextAfterUser, fallbackBotMsg];
      setMessages(updatedErr);
      persistMessages(updatedErr);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  const activeCategoryObj =
    QA_CATEGORIES.find((c) => c.id === activeCategory) || QA_CATEGORIES[0];

  const effectiveTutorEmotion: AvatarEmotion =
    manualTutorEmotion !== 'auto'
      ? manualTutorEmotion
      : isListening || isRecordingVoice
      ? 'empathetic'
      : isLoading
      ? 'curious'
      : isSpeaking
      ? detectedSpeechEmotion
      : 'smiling';

  const TUTOR_EMOTION_PRESETS: Array<{ id: AvatarEmotion | 'auto'; icon: string; label: string }> = [
    { id: 'smiling', icon: '😊', label: 'Sourire' },
    { id: 'pedagogical', icon: '🎓', label: 'Éloquence' },
    { id: 'empathetic', icon: '💛', label: 'Empathie' },
    { id: 'curious', icon: '🤔', label: 'Réflexion' },
    { id: 'enthusiastic', icon: '🌟', label: 'Joie' },
    { id: 'astonished', icon: '😲', label: 'Alerte' },
    { id: 'solemn', icon: '⚖️', label: 'Rigueur' },
    { id: 'auto', icon: '✨', label: 'Auto Voix' },
  ];

  const handleSelectTutorEmotion = (emo: AvatarEmotion | 'auto') => {
    setManualTutorEmotion(emo);
    if (emo !== 'auto') {
      avatarExpressionEngine.setEmotion(emo);
    }
  };

  // ---- Paramétrage chaîne vocale (GET/POST /api/tts/settings) ----
  const toggleVoiceSettings = async () => {
    const next = !showVoiceSettings;
    setShowVoiceSettings(next);
    setVoiceSettingsMsg('');
    if (next && !voiceSettings) {
      try {
        const res = await fetch('/api/tts/settings');
        if (res.ok) setVoiceSettings(await res.json());
        else setVoiceSettingsMsg('Impossible de charger les réglages');
      } catch {
        setVoiceSettingsMsg('Serveur injoignable');
      }
    }
  };

  const moveVoiceTier = (idx: number, dir: -1 | 1) => {
    setVoiceSettings((s) => {
      if (!s) return s;
      const order = [...s.order];
      const j = idx + dir;
      if (j < 0 || j >= order.length) return s;
      const tmp = order[idx];
      order[idx] = order[j];
      order[j] = tmp;
      return { ...s, order };
    });
  };

  const toggleVoiceTier = (idx: number) => {
    setVoiceSettings((s) => {
      if (!s) return s;
      return { ...s, order: s.order.map((t, i) => (i === idx ? { ...t, enabled: !t.enabled } : t)) };
    });
  };

  const saveVoiceSettings = async () => {
    if (!voiceSettings) return;
    setVoiceSettingsMsg('Enregistrement…');
    try {
      const res = await fetch('/api/tts/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: voiceSettings.order,
          neuralVoice: voiceSettings.neuralVoice,
          browserFallback: !!voiceSettings.browserFallback,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setVoiceSettings((s) => (s ? { ...s, ...data } : s));
        setVoiceSettingsMsg('✓ Enregistré — appliqué à la prochaine synthèse');
      } else {
        setVoiceSettingsMsg(`✗ ${data.error || 'erreur'}`);
      }
    } catch {
      setVoiceSettingsMsg('✗ Serveur injoignable');
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[100dvh] sm:h-[92vh] sm:max-h-[840px] rounded-none sm:rounded-3xl shadow-2xl flex flex-col border-0 sm:border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        {/* Toast Notice interne */}
        {toastNotice && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-white/15">
            {toastNotice}
          </div>
        )}

        {/* =================================================================== */}
        {/* HEADER — STUDIO TUTEUR VIRTUEL QUESTIONS / RÉPONSES                 */}
        {/* =================================================================== */}
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white px-4 py-3 sm:px-6 flex items-center justify-between border-b border-white/10 shrink-0 relative overflow-hidden">
          <div className="flex items-center gap-3 relative min-w-0">
            <div className="relative shrink-0">
              <AishaAvatar
                isSpeaking={isSpeaking}
                isListening={isListening}
                isLoading={isLoading}
                emotion={effectiveTutorEmotion}
                tutorPersona={selectedVoice}
                size={48}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base tracking-tight truncate">
                  {activeTutor.name} • {activeTutor.title}
                </h3>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Sparkles className="w-3 h-3" /> {activeTutor.badge}
                </span>
              </div>
              <p className="text-[11px] text-blue-200/90 flex items-center gap-1.5 truncate">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isSpeaking
                      ? 'bg-cyan-400 animate-ping'
                      : isListening || isRecordingVoice
                      ? 'bg-rose-400 animate-ping'
                      : isLoading
                      ? 'bg-amber-400 animate-bounce'
                      : 'bg-emerald-400'
                  }`}
                />
                {isSpeaking
                  ? `${activeTutor.name} vous répond de vive voix (synchronisation labiale 60 FPS)…`
                  : isRecordingVoice
                  ? `Enregistrement de votre Voice en cours (${recordingSeconds}s)…`
                  : isListening
                  ? `Micro ouvert : posez votre question, ${activeTutor.name} vous écoute…`
                  : isLoading
                  ? `${activeTutor.name} prépare votre réponse juridique sur mesure…`
                  : learningContext
                  ? `Connectée à votre cours : ${learningContext.lastCourseCode} • ${learningContext.lastCourseTitle}`
                  : 'Appels vocaux, Visio & Notes vocales (Voices) • 4 Tutrices Virtuelles'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowStudioStage((v) => !v)}
              className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                showStudioStage
                  ? 'bg-blue-600/30 border-blue-400/50 text-cyan-200'
                  : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/15'
              }`}
              title="Afficher ou masquer le portrait Studio"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showStudioStage ? 'Studio Visible' : 'Afficher Studio'}</span>
            </button>

            <button
              onClick={toggleVoiceSettings}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                showVoiceSettings
                  ? 'bg-amber-400/90 border-amber-300/60 text-slate-950'
                  : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/15'
              }`}
              title="Paramètres Voix — ordre et fournisseurs de synthèse (ElevenLabs / Neural / Gemini)"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Voix</span>
            </button>

            <button
              onClick={() => startCall()}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-xs border transition shadow-sm ${
                isCallActive
                  ? 'bg-emerald-500 border-emerald-300 text-white animate-pulse'
                  : 'bg-emerald-500/90 hover:bg-emerald-500 border-emerald-400/50 text-white'
              }`}
              title={`Appeler ${activeTutor.name} en direct`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Appeler</span>
            </button>

            <button
              onClick={() => startVideoCall()}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-xs border transition shadow-sm ${
                isVideoCallActive
                  ? 'bg-blue-600 border-blue-300 text-white animate-pulse'
                  : 'bg-blue-600/90 hover:bg-blue-500 border-blue-400/50 text-white'
              }`}
              title={`Lancer un appel Visio avec ${activeTutor.name}`}
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Visio</span>
            </button>

            <button
              onClick={() => handleSendMessage('Lance-moi un Quiz interactif Q/R sur mon cours')}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-sm"
              title="Lancer une question de Quiz interactive"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Quiz Q/R</span>
            </button>

            <button
              onClick={handleResetConversation}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 transition"
              title="Nouvelle session Questions / Réponses"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition"
              title="Fermer le Tuteur Virtuel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PANNEAU — PARAMÉTRAGE CHAÎNE VOCALE (ElevenLabs / Neural / Gemini) */}
        {showVoiceSettings && (
          <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-slate-950 via-blue-950/95 to-indigo-950 border-b border-white/10 text-white shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300">
                <Settings className="w-4 h-4" />
                Paramètres Voix — chaîne de synthèse
              </div>
              <button
                onClick={() => setShowVoiceSettings(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70"
                title="Fermer les paramètres"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!voiceSettings ? (
              <p className="text-white/60 text-xs py-2">{voiceSettingsMsg || 'Chargement des réglages…'}</p>
            ) : (
              <>
                <div className="space-y-1.5">
                  {voiceSettings.order.map((tier, idx) => {
                    const meta =
                      tier.id === 'elevenlabs'
                        ? {
                            label: 'ElevenLabs — Rachel (voix humaine)',
                            hint: 'Souffles, émotion, exclamations • garde-mensuel protégé (10k car.)',
                            ok: !!voiceSettings.availability?.elevenlabs,
                            okText: 'clé API ✓',
                            koText: 'clé manquante',
                          }
                        : tier.id === 'neural'
                          ? {
                              label: `Voix Neural Studio (${
                                voiceSettings.neuralVoice === 'denise'
                                  ? 'Denise'
                                  : voiceSettings.neuralVoice === 'vivienne-multilingual'
                                    ? 'Vivienne Multilingue'
                                    : 'Vivienne'
                              })`,
                              hint: 'edge-tts HD — sans clé, repli illimité',
                              ok: true,
                              okText: 'prêt',
                              koText: '',
                            }
                          : {
                              label: 'Gemini TTS (Google)',
                              hint: 'Optionnel — nécessite une clé API Google',
                              ok: !!voiceSettings.availability?.gemini,
                              okText: 'clé ✓',
                              koText: 'aucune clé',
                            };
                    return (
                      <div
                        key={tier.id}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs ${
                          tier.enabled ? 'bg-white/10 border-white/20' : 'bg-black/25 border-white/10 opacity-60'
                        }`}
                      >
                        <span className="w-5 h-5 shrink-0 rounded-md bg-amber-400/90 text-slate-950 font-black flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <label className="flex items-center gap-1.5 shrink-0 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={tier.enabled}
                            onChange={() => toggleVoiceTier(idx)}
                            className="accent-amber-400"
                          />
                          <span className="font-bold text-white/90">Actif</span>
                        </label>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white truncate">{meta.label}</div>
                          <div className="text-white/55 text-[10px] truncate">{meta.hint}</div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                            meta.ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {meta.ok ? meta.okText : meta.koText}
                        </span>
                        <div className="flex flex-col shrink-0 gap-0.5">
                          <button
                            onClick={() => moveVoiceTier(idx, -1)}
                            disabled={idx === 0}
                            className="p-0.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30"
                            title="Monter dans la chaîne"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveVoiceTier(idx, 1)}
                            disabled={idx === voiceSettings.order.length - 1}
                            className="p-0.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30"
                            title="Descendre dans la chaîne"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <label className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/85 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!voiceSettings.browserFallback}
                    onChange={(e) => setVoiceSettings({ ...voiceSettings, browserFallback: e.target.checked })}
                    className="accent-amber-400"
                  />
                  <span className="font-bold text-amber-200">Voix machine de secours (navigateur)</span>
                  <span className="text-white/50">
                    synthèse robotisée si la voix neurale tombe — <strong>désactivée par défaut</strong>
                  </span>
                </label>

                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px]">
                  <label className="flex items-center gap-1.5 text-white/80">
                    <span className="font-bold">Voix Neural préférée :</span>
                    <select
                      value={voiceSettings.neuralVoice}
                      onChange={(e) =>
                        setVoiceSettings({ ...voiceSettings, neuralVoice: e.target.value as typeof voiceSettings.neuralVoice })
                      }
                      className="bg-slate-800 border border-white/15 rounded-lg px-2 py-1 text-white text-[11px]"
                    >
                      <option value="denise">Denise (recommandée)</option>
                      <option value="vivienne-multilingual">Vivienne Multilingue</option>
                      <option value="vivienne">Vivienne</option>
                    </select>
                  </label>
                  <span className="text-white/50">ElevenLabs : {voiceSettings.elevenlabsVoiceId}</span>
                  <button
                    onClick={saveVoiceSettings}
                    className="ml-auto px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition"
                  >
                    Enregistrer
                  </button>
                  {voiceSettingsMsg && <span className="text-cyan-200 font-bold">{voiceSettingsMsg}</span>}
                </div>
              </>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* MAIN BODY — SPLIT STUDIO (LEFT: AÏSHA LIVE STAGE | RIGHT: Q&A CHAT) */}
        {/* =================================================================== */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* LEFT PANEL: PROF. AÏSHA INTERACTIVE WAV2LIP VIDEO STUDIO STAGE */}
          {showStudioStage && (
            <aside className="lg:w-[330px] xl:w-[360px] bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/95 text-white border-b lg:border-b-0 lg:border-r border-slate-800 p-3 sm:p-3.5 flex flex-col justify-between gap-2.5 shrink-0 overflow-y-auto no-scrollbar">
              {/* Scène Vidéo Wav2Lip 60 FPS (Image complète : Tête, Sourire, Émotions, Buste & Mains) */}
              <div className="w-full flex flex-row lg:flex-col items-center gap-3">
                <div className="hidden lg:block w-full h-[235px] xl:h-[250px] relative">
                  <AishaAvatar
                    isSpeaking={isSpeaking}
                    isListening={isListening || isRecordingVoice}
                    isLoading={isLoading}
                    emotion={effectiveTutorEmotion}
                    tutorPersona={selectedVoice}
                    variant="studio"
                    className="shadow-2xl"
                  />
                </div>
                <div className="lg:hidden shrink-0">
                  <AishaAvatar
                    isSpeaking={isSpeaking}
                    isListening={isListening || isRecordingVoice}
                    isLoading={isLoading}
                    emotion={effectiveTutorEmotion}
                    tutorPersona={selectedVoice}
                    size={86}
                    className="rounded-2xl shadow-xl"
                  />
                </div>

                {/* Sélecteur d'Émotions, Sourire & Expressions Faciales en Direct (Wav2Lip) */}
                <div className="flex-1 lg:w-full space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 px-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1 truncate">
                      <span>🌸</span>
                      <span>Port de tête féminin, Sourire &amp; Émotions</span>
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shrink-0">
                      60 FPS
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {TUTOR_EMOTION_PRESETS.map((preset) => {
                      const active = manualTutorEmotion === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectTutorEmotion(preset.id)}
                          className={`px-1.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 truncate cursor-pointer ${
                            active
                              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm font-black'
                              : 'bg-white/5 hover:bg-white/15 text-slate-200 border-white/10'
                          }`}
                          title={`Activer l'expression : ${preset.label}`}
                        >
                          <span>{preset.icon}</span>
                          <span className="truncate">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Téléprompteur & Contrôles Vocaux Studio */}
              <div className="flex-1 w-full flex flex-col justify-between space-y-2.5 min-w-0">
                {/* Téléprompteur en direct */}
                <div className="p-2.5 sm:p-3 rounded-2xl bg-white/5 border border-white/10 text-left">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                      <Volume2 className="w-3 h-3" /> Téléprompteur Aïsha
                    </span>
                    {isSpeaking ? (
                      <button
                        onClick={stopSpeaking}
                        className="px-2 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        <Pause className="w-2.5 h-2.5" /> Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const lastBot = [...messages].reverse().find((m) => m.sender === 'tuteur');
                          if (lastBot) speak(lastBot.text, lastBot.id);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 text-[10px] font-bold flex items-center gap-1 transition"
                      >
                        <Play className="w-2.5 h-2.5" /> Réécouter
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-200 line-clamp-2 lg:line-clamp-3 leading-relaxed italic">
                    {isSpeaking && spokenSubtitle
                      ? `« ${spokenSubtitle} »`
                      : 'Cliquez sur une question ou posez la vôtre au micro : Aïsha vous répond de vive voix.'}
                  </p>
                </div>

                {/* Sélecteur des 4 Tutrices Virtuelles & Appel Direct (Desktop) */}
                <div className="hidden lg:block space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
                    <span>Nos 4 Tutrices Virtuelles</span>
                    <button
                      onClick={handleCycleSpeed}
                      className="text-amber-300 hover:underline font-mono"
                      title="Changer la cadence de diction"
                    >
                      {tutorSpeed >= 1.0
                        ? '1.0x • Dynamique'
                        : tutorSpeed <= 0.90
                        ? '0.88x • Posé'
                        : '0.95x • Équilibré'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {VIRTUAL_TUTORS.map((tutor) => {
                      const active = selectedVoice === tutor.id;
                      return (
                        <div
                          key={tutor.id}
                          className={`w-full rounded-xl border p-2 transition flex items-center justify-between gap-2 ${
                            active
                              ? 'bg-blue-600/30 border-cyan-400/60 text-white'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleChangeVoice(tutor.id)}
                            className="flex-1 text-left min-w-0"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-black truncate">{tutor.name}</span>
                              {active && (
                                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] text-slate-300/80 truncate">
                              {tutor.specialty}
                            </p>
                          </button>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => startCall(tutor.id)}
                              className="p-1.5 rounded-lg bg-emerald-500/25 hover:bg-emerald-500 text-emerald-200 hover:text-white border border-emerald-400/30 transition"
                              title={`Appeler ${tutor.name} en audio`}
                            >
                              <Phone className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => startVideoCall(tutor.id)}
                              className="p-1.5 rounded-lg bg-blue-500/25 hover:bg-blue-500 text-blue-200 hover:text-white border border-blue-400/30 transition"
                              title={`Appeler ${tutor.name} en visio`}
                            >
                              <Video className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Boutons d'Action Rapide Q/R (Desktop) */}
                <div className="hidden lg:grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={() => (isRecordingVoice ? stopVoiceRecord('send') : startVoiceRecord())}
                    className={`p-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                      isRecordingVoice
                        ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                        : 'bg-emerald-600/25 hover:bg-emerald-600/35 border-emerald-400/40 text-emerald-200'
                    }`}
                  >
                    <Waves className="w-3.5 h-3.5" />
                    <span>{isRecordingVoice ? 'Envoyer' : 'Voice'}</span>
                  </button>

                  <button
                    onClick={() => startCall()}
                    className="p-2 rounded-xl bg-blue-600/25 hover:bg-blue-600/40 border border-blue-400/40 text-blue-200 text-[11px] font-bold flex items-center justify-center gap-1 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Appeler</span>
                  </button>

                  <button
                    onClick={() => startVideoCall()}
                    className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[11px] font-bold flex items-center justify-center gap-1 transition"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Visio</span>
                  </button>
                </div>
              </div>
            </aside>
          )}

          {/* RIGHT PANEL: CATEGORIZED Q&A MATRIX + CONVERSATION STREAM + INPUT */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* 1. Barre de sélection rapide des Tutrices Virtuelles (Mobile & Tablette) + Onglets Thématiques */}
            <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2 shrink-0 space-y-2">
              {/* Sélecteur des 4 Tutrices Virtuelles & Appel direct */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1">
                  Tutrices :
                </span>
                {VIRTUAL_TUTORS.map((tutor) => {
                  const active = selectedVoice === tutor.id;
                  return (
                    <div
                      key={tutor.id}
                      className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-[11px] shrink-0 transition ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleChangeVoice(tutor.id)}
                        className="flex items-center gap-1"
                      >
                        <span>{tutor.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => startCall(tutor.id)}
                        className={`p-1 rounded-lg transition ${
                          active
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                        }`}
                        title={`Appeler ${tutor.name}`}
                      >
                        <Phone className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> Thèmes Q/R :
                </span>
                {QA_CATEGORIES.map((cat) => {
                  const isActive = cat.id === activeCategory;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1 shrink-0 border ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      <span>{cat.badge}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Questions rapides de la catégorie active */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {activeCategoryObj.questions.map((qText, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(qText)}
                    disabled={isLoading}
                    className="flex-shrink-0 px-3 py-1 rounded-full bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-medium transition flex items-center gap-1 shadow-2xs"
                  >
                    <span>{qText}</span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Fil de Discussion Questions / Réponses */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 bg-gradient-to-b from-white to-slate-50/70 dark:from-slate-900 dark:to-slate-950">
              {messages.map((msg, msgIdx) => {
                const isThisMsgSpeaking = isSpeaking && activeSpeakingMsgId === msg.id;
                const isLastBotMsg =
                  msg.sender === 'tuteur' && msgIdx === messages.length - 1;

                return (
                  <div key={msg.id} className="space-y-2">
                    <div
                      className={`flex items-start gap-2.5 sm:gap-3 ${
                        msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs">
                          <User className="w-4 h-4" />
                        </div>
                      ) : (
                        <AishaAvatar
                          isSpeaking={isThisMsgSpeaking || (isSpeaking && isLastBotMsg)}
                          isLoading={false}
                          emotion={effectiveTutorEmotion}
                          tutorPersona={selectedVoice}
                          size={38}
                        />
                      )}

                      <div
                        className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3.5 sm:p-4 text-sm leading-relaxed shadow-xs ${
                          msg.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white dark:bg-slate-800/95 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/90 dark:border-slate-700/90'
                        }`}
                      >
                        {/* Médias joints */}
                        {msg.media?.type === 'image' && (
                          <img
                            src={msg.media.url}
                            alt={msg.media.name}
                            className="rounded-xl mb-2.5 max-h-52 w-auto object-contain border border-slate-200 dark:border-slate-700"
                          />
                        )}
                        {msg.media?.type === 'video' && (
                          <video
                            src={msg.media.url}
                            controls
                            className="rounded-xl mb-2.5 max-h-52 w-full bg-black"
                          />
                        )}
                        {msg.media?.type === 'audio' && (
                          <div className="flex items-center gap-2 mb-2.5 p-2 rounded-xl bg-black/10 dark:bg-white/5 border border-white/10">
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                              <Volume2 className="w-4 h-4" />
                            </div>
                            <audio controls src={msg.media.url} className="flex-1 h-8" />
                          </div>
                        )}

                        {/* Contenu formaté */}
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {renderMarkdown(msg.text)}
                        </div>

                        {/* Carte Quiz Interactive Q/R si présente */}
                        {msg.interactiveQuiz && (
                          <div className="mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border-2 border-blue-500/30 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                <Award className="w-4 h-4 text-amber-500" /> Défi Q/R Interactif
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                {msg.interactiveQuiz.legalRef}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {msg.interactiveQuiz.question}
                            </p>

                            <div className="grid grid-cols-1 gap-2">
                              {msg.interactiveQuiz.options.map((opt, optIdx) => {
                                const hasAnswered = msg.selectedQuizOption !== undefined;
                                const isPicked = msg.selectedQuizOption === optIdx;
                                const isRight = optIdx === msg.interactiveQuiz!.correctIndex;

                                let btnStyle =
                                  'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-800 dark:text-slate-200';
                                if (hasAnswered) {
                                  if (isRight) {
                                    btnStyle =
                                      'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                                  } else if (isPicked) {
                                    btnStyle =
                                      'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200';
                                  } else {
                                    btnStyle =
                                      'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400';
                                  }
                                }

                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => handleSelectQuizAnswer(msg.id, optIdx)}
                                    disabled={hasAnswered}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-xs transition flex items-center justify-between gap-2 ${btnStyle}`}
                                  >
                                    <span>
                                      <strong className="mr-1.5">
                                        {String.fromCharCode(65 + optIdx)}.
                                      </strong>
                                      {opt}
                                    </span>
                                    {hasAnswered && isRight && (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    )}
                                    {hasAnswered && isPicked && !isRight && (
                                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {msg.selectedQuizOption !== undefined && (
                              <div
                                className={`p-3 rounded-xl text-xs leading-relaxed border ${
                                  msg.selectedQuizOption === msg.interactiveQuiz.correctIndex
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                                }`}
                              >
                                <div className="font-black mb-0.5">
                                  {msg.selectedQuizOption === msg.interactiveQuiz.correctIndex
                                    ? '✓ Excellente réponse !'
                                    : `✗ La bonne réponse était ${String.fromCharCode(
                                        65 + msg.interactiveQuiz.correctIndex
                                      )}`}
                                </div>
                                <p>{msg.interactiveQuiz.explanation}</p>
                                <button
                                  onClick={() =>
                                    handleSendMessage(
                                      'Donne-moi une autre question de Quiz interactif Q/R'
                                    )
                                  }
                                  className="mt-2 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] inline-flex items-center gap-1"
                                >
                                  <Sparkles className="w-3 h-3" /> Question suivante →
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Sources et fondements légaux */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                              <Scale className="w-3 h-3 text-amber-500" /> Fondement :
                            </span>
                            {msg.sources.map((src, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                              >
                                {src}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Barre d'actions du message (Écouter / Pause / Copier) */}
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{msg.timestamp}</span>
                          {msg.sender === 'tuteur' && (
                            <div className="flex items-center gap-3">
                              {isThisMsgSpeaking ? (
                                <button
                                  onClick={stopSpeaking}
                                  className="flex items-center gap-1 text-rose-500 font-bold hover:underline"
                                >
                                  <Pause className="w-3.5 h-3.5" /> Pause vocale
                                </button>
                              ) : (
                                <button
                                  onClick={() => speak(msg.text, msg.id)}
                                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline"
                                  title="Écouter cette réponse avec la voix d’Aïsha"
                                >
                                  <Volume2 className="w-3.5 h-3.5" /> Écouter Aïsha
                                </button>
                              )}

                              <button
                                onClick={() => copyToClipboard(msg.text, msg.id)}
                                className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition"
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span className="text-emerald-500 font-bold">Copié</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" /> Copier
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Questions de relance suggérées sous la dernière réponse d'Aïsha */}
                    {isLastBotMsg &&
                      !isLoading &&
                      Array.isArray(msg.suggestedFollowUps) &&
                      msg.suggestedFollowUps.length > 0 && (
                        <div className="pl-11 flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                            <MessageSquarePlus className="w-3 h-3 text-blue-500" /> Relances Q/R :
                          </span>
                          {msg.suggestedFollowUps.map((followUp, fIdx) => (
                            <button
                              key={fIdx}
                              onClick={() => handleSendMessage(followUp)}
                              className="px-2.5 py-1 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800/70 text-blue-700 dark:text-blue-300 text-[11px] font-semibold transition flex items-center gap-1"
                            >
                              <span>{followUp}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start gap-3">
                  <AishaAvatar isLoading={true} isSpeaking={false} size={36} />
                  <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2.5 border border-slate-200 dark:border-slate-700 shadow-xs">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span>
                      Aïsha consulte la Loi n° 10/010 et prépare votre explication…
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Barre d'enregistrement de Note Vocale (Voice) en direct */}
            {isRecordingVoice && (
              <div className="mx-3 sm:mx-4 mb-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-lg animate-in fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-black text-rose-800 dark:text-rose-200 flex items-center gap-2">
                      <span>🎙️ Enregistrement Voice pour {activeTutor.name}</span>
                      <span className="font-mono px-2 py-0.5 rounded-md bg-rose-600 text-white text-[11px]">
                        {formatCallTime(recordingSeconds)}
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 truncate mt-0.5">
                      {liveVoiceTranscript
                        ? `Transcription : « ${liveVoiceTranscript} »`
                        : 'Parlez clairement dans votre micro, puis cliquez sur « Envoyer le Voice »…'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => stopVoiceRecord('cancel')}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:text-rose-600"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => stopVoiceRecord('preview')}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs font-bold"
                  >
                    Aperçu
                  </button>
                  <button
                    type="button"
                    onClick={() => stopVoiceRecord('send')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" /> Envoyer le Voice
                  </button>
                </div>
              </div>
            )}

            {/* Générateur de Voice Assisté (si micro bloqué ou sans micro matériel) */}
            {showAssistedVoiceBox && !isRecordingVoice && (
              <div className="mx-3 sm:mx-4 mb-2 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-300 dark:border-indigo-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Waves className="w-4 h-4 text-indigo-600" /> Créer & Envoyer un Voice à {activeTutor.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAssistedVoiceBox(false)}
                    className="text-xs text-slate-500 hover:text-rose-600 font-bold"
                  >
                    Fermer
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={assistedVoiceText}
                    onChange={(e) => setAssistedVoiceText(e.target.value)}
                    placeholder="Saisissez le contenu de votre note vocale (converti en fichier audio .wav)…"
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-xs text-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendAssistedVoice()}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shrink-0"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Envoyer Voice
                  </button>
                </div>
              </div>
            )}

            {/* Preview média avant envoi */}
            {previewMedia && (
              <div className="mx-3 sm:mx-4 mb-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  {previewMedia.type === 'image' && (
                    <img
                      src={previewMedia.url}
                      alt="preview"
                      className="h-14 rounded-lg border object-cover"
                    />
                  )}
                  {previewMedia.type === 'video' && (
                    <video
                      src={previewMedia.url}
                      className="h-14 rounded-lg border bg-black"
                    />
                  )}
                  {previewMedia.type === 'audio' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                        <Volume2 className="w-4 h-4 text-blue-600" /> {previewMedia.name}
                      </div>
                      <audio controls src={previewMedia.url} className="h-8 w-full max-w-xs" />
                    </div>
                  )}
                  <div className="text-[11px] font-bold truncate mt-1">{previewMedia.name}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Envoyer
                </button>
                <button
                  onClick={() => setPreviewMedia(null)}
                  className="p-1.5 rounded-full bg-white dark:bg-slate-800 border text-slate-600 hover:text-rose-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 3. Zone de saisie Question écrite / vocale / média */}
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-end gap-1.5 sm:gap-2"
              >
                <div className="flex items-center gap-1">
                  <input
                    ref={fileImageRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImagePick}
                  />
                  <input
                    ref={fileVideoRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoPick}
                  />
                  <button
                    type="button"
                    onClick={() => fileImageRef.current?.click()}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300"
                    title="Joindre une photo de document (DAO, PPM, PV, garantie)"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      isListening
                        ? `Parlez maintenant, ${activeTutor.name} transcrit votre question…`
                        : `Posez votre question ou envoyez un Voice à ${activeTutor.name}…`
                    }
                    className={`w-full bg-white dark:bg-slate-800 border rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isListening
                        ? 'border-rose-400 ring-2 ring-rose-400/30'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => (isListening ? stopListening() : startListening(false))}
                  className={`p-2.5 rounded-xl border font-bold transition ${
                    isListening
                      ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                  title={isListening ? 'Arrêter la dictée vocale' : 'Dicter ma question au micro'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {!isRecordingVoice ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (inputText.trim()) {
                        handleSendAssistedVoice(inputText.trim());
                        setInputText('');
                      } else {
                        startVoiceRecord();
                      }
                    }}
                    className="flex items-center gap-1 px-2.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                    title="Enregistrer et envoyer une note vocale (Voice)"
                  >
                    <Waves className="w-4 h-4" />
                    <span className="hidden md:inline">Voice</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => stopVoiceRecord('send')}
                    className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-rose-600 text-white font-black text-xs animate-pulse"
                    title="Envoyer le Voice maintenant"
                  >
                    <Send className="w-4 h-4" />
                    <span>Envoyer</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={(!inputText.trim() && !previewMedia) || isLoading}
                  className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Demander</span>
                </button>
              </form>

              {/* Barre inférieure d'options rapides */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 text-[11px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (autoSpeak) stopSpeaking();
                      setAutoSpeak((v) => !v);
                    }}
                    className={`px-2.5 py-1 rounded-full border font-bold flex items-center gap-1 transition ${
                      autoSpeak
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    {autoSpeak ? (
                      <Volume2 className="w-3.5 h-3.5" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5" />
                    )}
                    <span>{autoSpeak ? 'Voix auto : ON' : 'Voix : OFF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => startCall()}
                    className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1 hover:bg-emerald-100 transition"
                  >
                    <Phone className="w-3.5 h-3.5" /> Appeler {activeTutor.name}
                  </button>

                  <button
                    type="button"
                    onClick={() => startVideoCall()}
                    className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1 hover:bg-blue-100 transition"
                  >
                    <Video className="w-3.5 h-3.5" /> Visio
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAssistedVoiceBox((v) => !v)}
                    className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1 hover:bg-indigo-100 transition"
                  >
                    <Waves className="w-3.5 h-3.5" /> Voice Assisté
                  </button>
                </div>

                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  Tutrice : {activeTutor.name} ({tutorSpeed}x)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* OVERLAY APPEL VOCAL DIRECT AUX TUTRICES VIRTUELLES                  */}
        {/* =================================================================== */}
        {isCallActive && !isVideoCallActive && (
          <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 text-white overflow-y-auto">
            {/* Sélecteur de tutrice en haut de l'appel */}
            <div className="w-full max-w-2xl flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {VIRTUAL_TUTORS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => startCall(t.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition shrink-0 ${
                      selectedVoice === t.id
                        ? 'bg-emerald-500 text-white border-emerald-300 shadow-md'
                        : 'bg-white/10 text-white/80 border-white/15 hover:bg-white/20'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={endCall}
                className="px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1"
              >
                <PhoneOff className="w-3.5 h-3.5" /> Raccrocher
              </button>
            </div>

            {/* Centre : Avatar de la Tutrice & Sous-titres temps réel */}
            <div className="flex flex-col items-center my-auto py-4 max-w-xl w-full text-center">
              <div className="relative mb-3">
                <AishaAvatar
                  isSpeaking={isSpeaking}
                  isListening={isListening || isRecordingVoice}
                  isLoading={isLoading}
                  emotion={effectiveTutorEmotion}
                  tutorPersona={selectedVoice}
                  size="call"
                />
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-black shadow-md whitespace-nowrap">
                  {isCallConnecting
                    ? 'Connexion en cours…'
                    : isSpeaking
                    ? `${activeTutor.name} vous parle…`
                    : isRecordingVoice || isListening
                    ? 'À votre écoute…'
                    : 'Appel Vocal Actif'}
                </span>
              </div>

              <h4 className="font-black text-lg sm:text-xl mt-2">{activeTutor.name}</h4>
              <p className="text-xs text-cyan-300 font-semibold">{activeTutor.title}</p>
              <p className="text-xs text-white/70 font-mono mt-1">
                {formatCallTime(callSeconds)} • {isMicMuted ? 'Micro muet' : 'Canal HD sécurisé'}
              </p>

              {/* Réponse vocale en direct ou dernière réponse */}
              <div className="w-full mt-4 p-3.5 rounded-2xl bg-white/10 border border-white/15 text-xs sm:text-sm text-cyan-100 leading-relaxed max-h-36 overflow-y-auto">
                {isLoading ? (
                  <span className="inline-flex items-center gap-2 text-amber-300 font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" /> {activeTutor.name} analyse votre question…
                  </span>
                ) : spokenSubtitle ? (
                  `« ${spokenSubtitle} »`
                ) : (
                  `« Bonjour ! Cliquez sur "Parler à ${activeTutor.name}", choisissez une question rapide ou écrivez votre question ci-dessous. »`
                )}
              </div>

              {/* Questions rapides cliquables pendant l'appel */}
              <div className="w-full mt-3 flex flex-wrap items-center justify-center gap-1.5">
                {activeCategoryObj.questions.slice(0, 3).map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-emerald-500/30 border border-white/20 text-[11px] text-white font-semibold transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Bas de l'appel : Saisie vocale OU écrite directe + contrôles d'appel */}
            <div className="w-full max-w-xl space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inCallQuestionText.trim()) return;
                  const q = inCallQuestionText.trim();
                  setInCallQuestionText('');
                  handleSendMessage(q);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inCallQuestionText}
                  onChange={(e) => setInCallQuestionText(e.target.value)}
                  placeholder={`Parlez au micro ou tapez votre question en direct à ${activeTutor.name}…`}
                  className="flex-1 px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 text-xs sm:text-sm focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="submit"
                  disabled={!inCallQuestionText.trim() || isLoading}
                  className="px-4 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-black text-xs flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" /> Envoyer
                </button>
              </form>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (isRecordingVoice) {
                      stopVoiceRecord('send');
                    } else if (isListening) {
                      stopListening();
                    } else {
                      startListening(true);
                    }
                  }}
                  className={`px-5 py-3 rounded-full border font-black text-xs flex items-center gap-2 shadow-lg transition ${
                    isListening || isRecordingVoice
                      ? 'bg-emerald-500 border-emerald-300 text-white animate-pulse'
                      : 'bg-white text-slate-950 border-white hover:bg-emerald-50'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>
                    {isRecordingVoice
                      ? `Envoyer mon Voice (${recordingSeconds}s)`
                      : isListening
                      ? 'Je vous écoute… (cliquez pour arrêter)'
                      : `Parler à ${activeTutor.name}`}
                  </span>
                </button>

                {isSpeaking && (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="px-4 py-3 rounded-full bg-amber-500/30 border border-amber-400/50 text-amber-200 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Pause className="w-4 h-4" /> Interrompre
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsCallActive(false);
                    startVideoCall(selectedVoice);
                  }}
                  className="px-4 py-3 rounded-full bg-blue-600/80 hover:bg-blue-600 border border-blue-400/40 text-white text-xs font-bold flex items-center gap-1.5"
                  title="Passer en appel Visio"
                >
                  <Video className="w-4 h-4" /> Mode Visio
                </button>

                <button
                  type="button"
                  onClick={endCall}
                  className="px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1.5 shadow-lg"
                  title="Raccrocher"
                >
                  <PhoneOff className="w-4 h-4" /> Raccrocher
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* OVERLAY VISIO PLEIN ÉCRAN AVEC LES TUTRICES VIRTUELLES              */}
        {/* =================================================================== */}
        {isVideoCallActive && (
          <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col min-h-0 overflow-hidden">
            {/* Scène principale Visio HD */}
            <div className="flex-1 min-h-0 relative bg-slate-950 overflow-hidden flex items-center justify-center">
              <AishaAvatar
                isSpeaking={isSpeaking}
                isListening={isListening || isRecordingVoice}
                isLoading={isLoading}
                emotion={effectiveTutorEmotion}
                tutorPersona={selectedVoice}
                variant="visio"
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/60 pointer-events-none z-10" />

              {/* Barre supérieure Visio : Statut + Sélecteur des 4 Tutrices + Quitter */}
              <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-20 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
                  <div className="px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2 border border-white/15 shrink-0 shadow-lg">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isCallConnecting
                          ? 'bg-amber-400 animate-ping'
                          : isSpeaking
                          ? 'bg-cyan-400 animate-pulse'
                          : isListening || isRecordingVoice
                          ? 'bg-rose-400 animate-ping'
                          : 'bg-emerald-400 animate-pulse'
                      }`}
                    />
                    <span>
                      {activeTutor.name} • Visio HD • {formatCallTime(callSeconds)}
                    </span>
                    <span className="hidden md:inline text-[10px] text-cyan-300 font-semibold">
                      ({activeTutor.specialty})
                    </span>
                  </div>

                  {VIRTUAL_TUTORS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => startVideoCall(t.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition shrink-0 ${
                        selectedVoice === t.id
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                          : 'bg-slate-950/70 text-white/80 border-white/15 hover:bg-white/20'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startCall(selectedVoice)}
                    className="px-2.5 py-1.5 rounded-full bg-slate-950/75 hover:bg-slate-900 text-white text-[11px] font-bold border border-white/15 flex items-center gap-1"
                    title="Passer en appel audio uniquement"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Mode Audio</span>
                  </button>
                  <button
                    type="button"
                    onClick={endCall}
                    className="p-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white border border-white/15 shadow-lg"
                    title="Fermer la Visio"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Zone centrale basse : Sous-titres en direct, statut d'écoute/analyse & questions rapides */}
              <div className="absolute bottom-3 left-3 right-32 sm:bottom-4 sm:left-6 sm:right-44 z-20 flex flex-col items-start sm:items-center sm:mx-auto sm:max-w-2xl gap-2">
                <div className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/15 text-white text-xs sm:text-sm leading-relaxed shadow-2xl max-h-28 overflow-y-auto">
                  {isCallConnecting ? (
                    <span className="inline-flex items-center gap-2 text-amber-300 font-bold">
                      <Loader2 className="w-4 h-4 animate-spin" /> Connexion Visio HD avec {activeTutor.name}…
                    </span>
                  ) : isLoading ? (
                    <span className="inline-flex items-center gap-2 text-amber-300 font-bold">
                      <Loader2 className="w-4 h-4 animate-spin" /> {activeTutor.name} analyse votre question et prépare sa réponse…
                    </span>
                  ) : (isListening || isRecordingVoice) && liveVoiceTranscript ? (
                    <span className="text-emerald-300 font-semibold">
                      🎙️ Vous dites : « {liveVoiceTranscript} »
                    </span>
                  ) : spokenSubtitle ? (
                    <span>« {spokenSubtitle} »</span>
                  ) : (
                    <span className="text-slate-300">
                      « Bonjour ! Cliquez sur "Parler", choisissez une question rapide ou écrivez votre question ci-dessous. »
                    </span>
                  )}
                </div>

                {/* Questions rapides cliquables directement en Visio */}
                <div className="hidden sm:flex flex-wrap items-center justify-center gap-1.5 w-full">
                  {activeCategoryObj.questions.slice(0, 3).map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(q)}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-full bg-slate-950/80 hover:bg-blue-600/80 border border-white/20 text-[11px] text-white font-semibold transition truncate max-w-[240px]"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fenêtre Retour Caméra Apprenant (PIP en bas à droite) */}
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 w-24 h-28 sm:w-36 sm:h-28 rounded-2xl overflow-hidden border-2 border-white/40 shadow-2xl bg-slate-900">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={
                    isCameraOff || !hasCameraStream
                      ? 'hidden'
                      : 'w-full h-full object-cover -scale-x-100'
                  }
                />
                {(isCameraOff || !hasCameraStream) && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-950 text-white p-2 text-center">
                    {currentProfile.avatarUrl ? (
                      <img
                        src={currentProfile.avatarUrl}
                        alt={currentProfile.name}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-white/30 mb-1"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-400 mb-1" />
                    )}
                    <span className="text-[10px] font-bold truncate max-w-full">
                      {currentProfile.name ? currentProfile.name.split(' ')[0] : 'Vous'}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {isCameraOff ? 'Caméra coupée' : 'Micro HD actif'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Barre de contrôle inférieure Visio */}
            <div className="shrink-0 p-2.5 sm:p-3.5 bg-slate-900 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-2 z-20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inCallQuestionText.trim()) return;
                  const q = inCallQuestionText.trim();
                  setInCallQuestionText('');
                  handleSendMessage(q);
                }}
                className="flex items-center gap-2 w-full sm:max-w-md"
              >
                <input
                  type="text"
                  value={inCallQuestionText}
                  onChange={(e) => setInCallQuestionText(e.target.value)}
                  placeholder={`Poser une question en direct à ${activeTutor.name}…`}
                  className="flex-1 px-3.5 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 text-xs focus:outline-none focus:border-blue-400"
                />
                <button
                  type="submit"
                  disabled={!inCallQuestionText.trim() || isLoading}
                  className="px-3.5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer</span>
                </button>
              </form>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isRecordingVoice) {
                      stopVoiceRecord('send');
                    } else if (isListening) {
                      stopListening();
                    } else {
                      startListening(true);
                    }
                  }}
                  className={`px-4 py-2 rounded-full border font-bold text-xs flex items-center gap-1.5 transition ${
                    isListening || isRecordingVoice
                      ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse'
                      : 'bg-white text-slate-950 border-white hover:bg-blue-50'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>
                    {isRecordingVoice
                      ? `Envoyer (${recordingSeconds}s)`
                      : isListening
                      ? 'Écoute en cours…'
                      : `Parler à ${activeTutor.name.split(' ').pop()}`}
                  </span>
                </button>

                {isSpeaking && (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="px-3 py-2 rounded-full bg-amber-500/25 border border-amber-400/50 text-amber-200 text-xs font-bold flex items-center gap-1"
                    title="Interrompre la voix de la tutrice"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Stop voix</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`p-2 rounded-full border transition ${
                    isCameraOff
                      ? 'bg-rose-600/80 border-rose-500 text-white'
                      : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                  }`}
                  title={isCameraOff ? 'Activer ma caméra' : 'Désactiver ma caméra'}
                >
                  {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={endCall}
                  className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1.5 shadow-lg"
                >
                  <PhoneOff className="w-4 h-4" /> Quitter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
