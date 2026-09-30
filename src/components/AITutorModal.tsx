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
  Sliders
} from 'lucide-react';
import { ChatMessage, UserProfile } from '../types';
import { saveTutorHistoryToFirestore, fetchTutorHistoryFromFirestore } from '../firebase';
import { speechService, VoicePersona } from '../utils/speechService';
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

const VOICE_OPTIONS: Array<{ id: VoicePersona; label: string; desc: string }> = [
  { id: 'denise', label: 'Denise HD • Éloquente', desc: 'Chaleureuse & charismatique' },
  { id: 'charline', label: 'Charline HD • Mélodieuse', desc: 'Veloutée & posée' },
  { id: 'vivienne', label: 'Vivienne HD • Douce', desc: 'Institutionnelle & sereine' },
  { id: 'eloise', label: 'Ariane HD • Cristalline', desc: 'Claire & articulée' }
];

type MediaAttachment = {
  type: 'image' | 'video' | 'audio';
  url: string;
  name?: string;
  duration?: string;
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
  onClearInitialQuestion
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
    '🎓 Éloquence & Sérénité académique'
  );
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaAttachment | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<VoicePersona>(() => speechService.getVoicePersona());
  const [tutorSpeed, setTutorSpeed] = useState<number>(0.9);
  const [showStudioStage, setShowStudioStage] = useState<boolean>(true);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileImageRef = useRef<HTMLInputElement>(null);
  const fileVideoRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
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
        setIsSpeaking(st.isPlaying);
        if (st.currentSentenceText) {
          setSpokenSubtitle(st.currentSentenceText);
        }
        if (st.emotionLabel) {
          setActiveEmotionLabel(st.emotionLabel);
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

    setIsSpeaking(true);
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
    const order = [0.9, 1.0, 0.85];
    const idx = order.indexOf(tutorSpeed);
    const next = order[(idx + 1) % order.length];
    setTutorSpeed(next);
    const lastBotMsg = [...messages].reverse().find((m) => m.sender === 'tuteur');
    if (isSpeaking && lastBotMsg) {
      speak(lastBotMsg.text, lastBotMsg.id, selectedVoice, next);
    }
  };

  const startListening = () => {
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      showNotice('Reconnaissance vocale disponible sur Chrome ou Edge.');
      return;
    }
    stopSpeaking();
    const rec = new SR();
    rec.lang = 'fr-FR';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    setIsListening(true);
    rec.start();
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0]?.transcript || '')
        .join(' ');
      setInputText(transcript);
      if (e.results[0]?.isFinal) {
        setIsListening(false);
      }
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
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

  const startVoiceRecord = async () => {
    try {
      stopSpeaking();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setPreviewMedia({
          type: 'audio',
          url,
          name: `Question vocale (${new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })})`,
          duration: '0:10'
        });
        stream.getTracks().forEach((t) => t.stop());
        setIsRecordingVoice(false);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecordingVoice(true);
      setTimeout(() => {
        if (mr.state === 'recording') mr.stop();
      }, 20000);
    } catch {
      showNotice('Microphone non accessible sur cet appareil.');
    }
  };
  const stopVoiceRecord = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    else setIsRecordingVoice(false);
  };

  const startCall = () => setIsCallActive(true);
  const startVideoCall = async () => {
    setIsVideoCallActive(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = s;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = s;
        await localVideoRef.current.play().catch(() => {});
      }
    } catch {
      // visio sans caméra : on garde l'avatar studio d'Aïsha
    }
  };
  const endCall = () => {
    setIsCallActive(false);
    setIsVideoCallActive(false);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setCallSeconds(0);
  };
  useEffect(() => {
    if (isVideoCallActive && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
  }, [isVideoCallActive]);

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

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if ((!text && !previewMedia) || isLoading) return;

    speechService.unlockAudio();
    stopSpeaking();

    const userMsg: EnhancedMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text:
        text ||
        (previewMedia?.type === 'image'
          ? '📷 Image jointe — analyse juridique du document'
          : previewMedia?.type === 'video'
          ? '🎥 Vidéo jointe'
          : '🎙️ Question vocale'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      media: previewMedia || undefined,
      isVoice: previewMedia?.type === 'audio'
    };
    const nextAfterUser = [...messages, userMsg];
    setMessages(nextAfterUser);
    persistMessages(nextAfterUser);
    if (!textToSend) setInputText('');
    const mediaToSend = previewMedia;
    setPreviewMedia(null);
    setIsLoading(true);

    try {
      const excerptForRag = learningContext?.lastCourseExcerpt
        ? ` | Leçon en cours: ${learningContext.lastCourseExcerpt}`
        : '';
      const lessonsForRag = learningContext?.lastCourseLessons
        ? ` | Leçons du cours: ${learningContext.lastCourseLessons}`
        : '';
      const body: any = {
        message: text || (mediaToSend ? `[${mediaToSend.type} joint: ${mediaToSend.name}] ${text}` : ''),
        history: nextAfterUser.slice(-8),
        context: `Utilisateur: ${currentProfile.name}, Rôle: ${currentProfile.roleTitle}, Institution: ${currentProfile.institution}, Niveau: ${currentProfile.level} | Dernier cours: ${
          learningContext
            ? `${learningContext.lastCourseTitle} (${learningContext.lastCourseCode}) ${learningContext.lastCourseProgress}%`
            : 'aucun'
        }${excerptForRag}${lessonsForRag}`,
        userName: currentProfile.name,
        learningContext: learningContext
          ? `${learningContext.lastCourseTitle} (${learningContext.lastCourseCode}, ${learningContext.lastCourseProgress}% — ${learningContext.lastCourseCategory}) | Récents: ${learningContext.recentTitles} | Global ${learningContext.overallProgress}%${excerptForRag}`
          : null,
        lastCourse: learningContext,
        mediaType: mediaToSend?.type || null,
        hasMedia: !!mediaToSend
      };
      const response = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json().catch(() => ({}));
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
          'Aïsha • Pédagogie humaine',
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
      const updatedConversation = [...nextAfterUser, botMsg];
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
                size={48}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base tracking-tight truncate">
                  Prof. Aïsha • Tuteur Virtuel Questions / Réponses
                </h3>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Sparkles className="w-3 h-3" /> Studio Q/R Interactif • Loi 10/010
                </span>
              </div>
              <p className="text-[11px] text-blue-200/90 flex items-center gap-1.5 truncate">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isSpeaking
                      ? 'bg-cyan-400 animate-ping'
                      : isListening
                      ? 'bg-rose-400 animate-ping'
                      : isLoading
                      ? 'bg-amber-400 animate-bounce'
                      : 'bg-emerald-400'
                  }`}
                />
                {isSpeaking
                  ? 'Aïsha vous répond de vive voix (synchronisation labiale 60 FPS)…'
                  : isListening
                  ? 'Micro ouvert : posez votre question, Aïsha vous écoute…'
                  : isLoading
                  ? 'Aïsha prépare votre réponse juridique sur mesure…'
                  : learningContext
                  ? `Connectée à votre cours : ${learningContext.lastCourseCode} • ${learningContext.lastCourseTitle}`
                  : 'Assistance juridique vocale & écrite • Questions / Réponses & Quiz'}
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
              title="Afficher ou masquer le portrait Studio d'Aïsha"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showStudioStage ? 'Studio Visible' : 'Afficher Studio'}</span>
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
              onClick={startCall}
              className={`hidden sm:flex p-2 rounded-xl ${
                isCallActive ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-white/15 text-white'
              } border border-white/15 transition`}
              title="Entretien vocal direct"
            >
              <Phone className="w-4 h-4" />
            </button>

            <button
              onClick={startVideoCall}
              className={`hidden sm:flex p-2 rounded-xl ${
                isVideoCallActive ? 'bg-blue-600 text-white' : 'bg-white/10 hover:bg-white/15 text-white'
              } border border-white/15 transition`}
              title="Entretien visio plein écran"
            >
              <Video className="w-4 h-4" />
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

        {/* =================================================================== */}
        {/* MAIN BODY — SPLIT STUDIO (LEFT: AÏSHA LIVE STAGE | RIGHT: Q&A CHAT) */}
        {/* =================================================================== */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* LEFT PANEL: PROF. AÏSHA INTERACTIVE STUDIO STAGE */}
          {showStudioStage && (
            <aside className="lg:w-[310px] xl:w-[340px] bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/95 text-white border-b lg:border-b-0 lg:border-r border-slate-800 p-3 sm:p-4 flex flex-row lg:flex-col items-center gap-3.5 shrink-0">
              {/* Portrait Animé Haute Définition 60 FPS */}
              <div className="relative flex flex-col items-center shrink-0">
                <div className="hidden lg:block">
                  <AishaAvatar
                    isSpeaking={isSpeaking}
                    isListening={isListening}
                    isLoading={isLoading}
                    size="xl"
                    className="rounded-3xl shadow-2xl border-2"
                  />
                </div>
                <div className="lg:hidden">
                  <AishaAvatar
                    isSpeaking={isSpeaking}
                    isListening={isListening}
                    isLoading={isLoading}
                    size={76}
                    className="rounded-2xl shadow-xl"
                  />
                </div>

                {/* Badge État Vocal */}
                <div
                  className={`mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border ${
                    isSpeaking
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                      : isListening
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/40 animate-pulse'
                      : isLoading
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSpeaking
                        ? 'bg-cyan-400 animate-ping'
                        : isListening
                        ? 'bg-rose-400'
                        : isLoading
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span>
                    {isSpeaking
                      ? activeEmotionLabel
                      : isListening
                      ? '💛 Vous écoute avec empathie…'
                      : isLoading
                      ? '🤔 Réflexion juridique…'
                      : '😊 Bienveillance & Écoute'}
                  </span>
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

                {/* Sélecteur de Voix Éloquente (Desktop) */}
                <div className="hidden lg:block space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
                    <span>Voix & Éloquence</span>
                    <button
                      onClick={handleCycleSpeed}
                      className="text-amber-300 hover:underline font-mono"
                      title="Changer la cadence de diction"
                    >
                      {tutorSpeed === 0.9
                        ? '0.9x • Posé'
                        : tutorSpeed === 0.85
                        ? '0.85x • Calme'
                        : '1.0x • Naturel'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {VOICE_OPTIONS.map((v) => {
                      const active = selectedVoice === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => handleChangeVoice(v.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl border text-[11px] transition flex items-center justify-between ${
                            active
                              ? 'bg-blue-600/30 border-cyan-400/60 text-white font-bold'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <span className="truncate">{v.label}</span>
                          {active && <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Boutons d'Action Rapide Q/R (Desktop) */}
                <div className="hidden lg:grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      isListening
                        ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                        : 'bg-emerald-600/25 hover:bg-emerald-600/35 border-emerald-400/40 text-emerald-200'
                    }`}
                  >
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isListening ? 'Stop Micro' : 'Parler'}</span>
                  </button>

                  <button
                    onClick={() => handleSendMessage('Donne-moi un cas pratique à résoudre')}
                    className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Cas Pratique</span>
                  </button>
                </div>
              </div>
            </aside>
          )}

          {/* RIGHT PANEL: CATEGORIZED Q&A MATRIX + CONVERSATION STREAM + INPUT */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* 1. Onglets Thématiques Questions / Réponses */}
            <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2 shrink-0 space-y-2">
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
                          size={36}
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
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                      <Volume2 className="w-4 h-4 text-blue-600" /> {previewMedia.name}
                    </div>
                  )}
                  <div className="text-[11px] font-bold truncate mt-1">{previewMedia.name}</div>
                </div>
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
                className="flex items-end gap-2"
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
                        ? 'Parlez maintenant, Aïsha transcrit votre question…'
                        : 'Posez votre question juridique ou demandez un cas pratique à Aïsha…'
                    }
                    className={`w-full bg-white dark:bg-slate-800 border rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isListening
                        ? 'border-rose-400 ring-2 ring-rose-400/30'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
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
                    onClick={startVoiceRecord}
                    className="hidden sm:flex p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300"
                    title="Enregistrer une note vocale"
                  >
                    <Waves className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopVoiceRecord}
                    className="p-2.5 rounded-xl bg-rose-600 text-white animate-pulse"
                    title="Terminer l’enregistrement vocal"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={(!inputText.trim() && !previewMedia) || isLoading}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Demander</span>
                </button>
              </form>

              {/* Barre inférieure d'options rapides */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 text-[11px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
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
                    <span>{autoSpeak ? 'Réponse vocale auto : ON' : 'Réponse vocale : OFF'}</span>
                  </button>

                  <button
                    onClick={() =>
                      handleSendMessage('Lance-moi un Quiz interactif Q/R sur mon cours')
                    }
                    className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1 hover:bg-amber-100 transition"
                  >
                    <Award className="w-3.5 h-3.5" /> Quiz Q/R
                  </button>

                  <button
                    onClick={startVideoCall}
                    className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold flex items-center gap-1 hover:bg-blue-100 transition"
                  >
                    <Video className="w-3.5 h-3.5" /> Mode Visio
                  </button>
                </div>

                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  Voix : {VOICE_OPTIONS.find((v) => v.id === selectedVoice)?.label} ({tutorSpeed}x)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* OVERLAY APPEL VOCAL DIRECT                                          */}
        {/* =================================================================== */}
        {isCallActive && !isVideoCallActive && (
          <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white">
            <div className="relative mb-4">
              <AishaAvatar isSpeaking={isSpeaking} isListening={isListening} size="call" />
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-black shadow-md">
                Entretien Vocal Q/R Actif
              </span>
            </div>
            <h4 className="font-black text-lg mt-2">Prof. Aïsha — Entretien Questions / Réponses</h4>
            <p className="text-sm text-white/70">
              {formatCallTime(callSeconds)} • {isMicMuted ? 'Micro coupé' : 'En ligne'}
            </p>
            {spokenSubtitle && (
              <p className="max-w-lg text-center text-xs text-cyan-200 italic mt-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                « {spokenSubtitle} »
              </p>
            )}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`px-4 py-3 rounded-full border font-bold text-xs flex items-center gap-2 ${
                  isListening
                    ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white/15'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{isListening ? 'Je vous écoute…' : 'Poser une question vocale'}</span>
              </button>
              <button
                onClick={endCall}
                className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg"
                title="Raccrocher"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  endCall();
                  startVideoCall();
                }}
                className="p-3.5 rounded-full bg-white/10 border border-white/20 hover:bg-white/15"
                title="Passer en Visio"
              >
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* OVERLAY VISIO PLEIN ÉCRAN                                           */}
        {/* =================================================================== */}
        {isVideoCallActive && (
          <div className="absolute inset-0 z-40 bg-black flex flex-col">
            <div className="flex-1 relative bg-slate-950 overflow-hidden flex items-center justify-center">
              <AishaAvatar
                isSpeaking={isSpeaking}
                isListening={isListening}
                variant="visio"
                className="w-full h-full max-w-2xl mx-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-xs font-bold flex items-center gap-2 border border-white/15">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Prof. Aïsha •
                  Visio Q/R • {formatCallTime(callSeconds)}
                </div>
                <button
                  onClick={endCall}
                  className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/15"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {spokenSubtitle && (
                <div className="absolute bottom-6 left-4 right-36 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-xl px-4 py-2.5 rounded-2xl bg-slate-950/85 border border-white/15 text-white text-xs text-center shadow-xl">
                  « {spokenSubtitle} »
                </div>
              )}
              <div className="absolute bottom-4 right-4 w-28 h-20 sm:w-36 sm:h-24 rounded-xl overflow-hidden border-2 border-white/80 shadow-xl bg-slate-800">
                {isCameraOff ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/70 bg-slate-800 p-2">
                    <VideoOff className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold">Caméra off</span>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}
                {!isCameraOff && localStreamRef.current === null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                    <Camera className="w-5 h-5 text-white/60" />
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-900 border-t border-white/10 flex items-center justify-center gap-3">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`px-4 py-2.5 rounded-full border font-bold text-xs flex items-center gap-2 ${
                  isListening
                    ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse'
                    : 'bg-white/10 border-white/15 text-white'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{isListening ? 'Écoute en cours…' : 'Poser une question'}</span>
              </button>
              <button
                onClick={() => setIsCameraOff((v) => !v)}
                className={`p-3 rounded-full border ${
                  isCameraOff
                    ? 'bg-rose-600 border-rose-600 text-white'
                    : 'bg-white/10 border-white/15 text-white'
                }`}
              >
                {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </button>
              <button
                onClick={endCall}
                className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-2 shadow-lg"
              >
                <PhoneOff className="w-4 h-4" /> Quitter la Visio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
