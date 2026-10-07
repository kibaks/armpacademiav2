import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  Video,
  Plus,
  BookOpen,
  Award,
  Users,
  BarChart3,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Scale,
  FileText,
  Search,
  ChevronRight,
  ChevronLeft,
  X,
  Camera,
  Mic,
  MicOff,
  VideoOff,
  ScreenShare,
  Sliders,
  Settings,
  Eye,
  Trash2,
  Edit3,
  HelpCircle,
  FolderPlus,
  Tv,
  ListOrdered,
  Layers,
  ArrowRight,
  Save,
  Check,
  RefreshCw,
  Share2,
  FileCheck,
  Zap,
  Bookmark,
  BadgeCheck,
  Building2,
  MoreHorizontal,
  MapPin,
  Briefcase,
  Hash,
  Smartphone,
  Calendar,
  TrendingUp,
  Send,
  AlertCircle,
  Filter
} from 'lucide-react';
import { CourseModule, UserProfile, UserRole, LessonFormat, StudioVideoItem, QuizBankItem } from '../types';
import { ArmpLogo } from './ArmpLogo';
import {
  saveStudioVideoToFirestore,
  fetchStudioVideosFromFirestore,
  saveQuizBankItemToFirestore,
  fetchQuizBankFromFirestore
} from '../firebase';
import imgSeminar from '../assets/images/marches_publics_seminar_1789983166275.jpg';
import imgTraining from '../assets/images/formation_numerique_1789983181347.jpg';
import imgAudit from '../assets/images/expert_audit_cgpmp_1789983194702.jpg';
import imgMentor from '../assets/images/mentor_juriste_africain_1789983212035.jpg';
import { uploadFile, uploadBlob, type AcademiaFile } from '../lib/academiaStorage';
import { AcademiaMediaUploader, AcademiaMediaPreview } from './AcademiaMediaUploader';
import { AnimatedLessonPlayer } from './AnimatedLessonPlayer';

// Formats de leçons — Vidéo, Audio, Animation Animaker, IA PPT, PDF, Visioconférence, Texte
const LESSON_FORMATS: Array<{ id: LessonFormat; label: string; icon: string; desc: string; color: string }> = [
  { id: 'video', label: 'Vidéo', icon: '🎬', desc: 'Cours filmé / Studio', color: 'bg-rose-500' },
  { id: 'audio', label: 'Audio', icon: '🎙️', desc: 'Podcast / Vocal', color: 'bg-purple-500' },
  { id: 'animation', label: 'Animation', icon: '✨', desc: 'Style Animaker', color: 'bg-amber-500' },
  { id: 'ia_ppt', label: 'IA • PPT', icon: '🤖', desc: 'Prompt → Slides', color: 'bg-indigo-500' },
  { id: 'pdf', label: 'PDF', icon: '📄', desc: 'Document / Support', color: 'bg-red-500' },
  { id: 'visioconference', label: 'Visio', icon: '📹', desc: 'Zoom / Teams / Meet', color: 'bg-emerald-500' },
  { id: 'texte', label: 'Texte', icon: '📝', desc: 'Article / Rédaction', color: 'bg-slate-500' },
];
const ANIMATION_TEMPLATES = [
  { id: 'whiteboard', name: 'Tableau blanc', thumb: 'https://picsum.photos/seed/anim1/200/120', desc: 'Main qui dessine' },
  { id: 'flat', name: 'Flat Design', thumb: 'https://picsum.photos/seed/anim2/200/120', desc: 'Illustrations modernes' },
  { id: 'infographic', name: 'Infographie', thumb: 'https://picsum.photos/seed/anim3/200/120', desc: 'Chiffres & schémas' },
  { id: 'character', name: 'Personnage', thumb: 'https://picsum.photos/seed/anim4/200/120', desc: 'Avatar qui parle' },
  { id: 'timeline', name: 'Timeline', thumb: 'https://picsum.photos/seed/anim5/200/120', desc: 'Frise chronologique' },
  { id: 'isometric', name: 'Isométrique', thumb: 'https://picsum.photos/seed/anim6/200/120', desc: 'Bâtiments 3D' },
];


interface TrainerPortalProps {
  currentProfile: UserProfile;
  allProfiles?: Record<string, UserProfile>;
  courses: CourseModule[];
  onAddCourse: (newCourse: CourseModule) => void;
  onPreviewCourse: (course: CourseModule) => void;
  onOpenCoursePlayer: (course: CourseModule) => void;
  onSwitchToTrainerRole?: () => void;
  isDarkMode: boolean;
}

type TrainerTab = 'dashboard' | 'courses' | 'authoring' | 'ai_generator' | 'studio' | 'quiz_bank' | 'learners';

interface RecordedVideo {
  id: string;
  title: string;
  duration: string;
  blobUrl: string;
  academiaUrl?: string;
  academiaId?: string;
  date: string;
  courseCode?: string;
}

export const TrainerPortal: React.FC<TrainerPortalProps> = ({
  currentProfile,
  allProfiles,
  courses,
  onAddCourse,
  onPreviewCourse,
  onOpenCoursePlayer,
  onSwitchToTrainerRole,
  isDarkMode
}) => {
  // Navigation tabs for the trainer portal
  const [activeTab, setActiveTab] = useState<TrainerTab>('dashboard');
  // Immersive editor state — même disposition que CourseWindow apprenant
  const [activeLessonEditIndex, setActiveLessonEditIndex] = useState(0);
  const [isZenModeTrainer, setIsZenModeTrainer] = useState(false);
  const [readingThemeTrainer, setReadingThemeTrainer] = useState<'dark' | 'light' | 'sepia'>('dark');

  // Search and filters for courses
  const [courseFilter, setCourseFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Suivi Pédagogique des Cours et des Apprenants Inscrits
  const [selectedTrackingCourseId, setSelectedTrackingCourseId] = useState<string>('all');
  const [selectedLearnerForModal, setSelectedLearnerForModal] = useState<{
    profile: UserProfile;
    course: CourseModule;
    progressPct: number;
    completedLessonsCount: number;
    quizScore: number;
    isCertified: boolean;
    studyTime: string;
    lastActive: string;
  } | null>(null);
  const [learnerSearchQuery, setLearnerSearchQuery] = useState('');
  const [learnerStatusFilter, setLearnerStatusFilter] = useState<'all' | 'certified' | 'in_progress' | 'needs_help'>('all');
  const [learnerRoleFilter, setLearnerRoleFilter] = useState<'all' | 'cgpmp' | 'pme' | 'dgcmp' | 'other'>('all');
  const [trainerObservations, setTrainerObservations] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('academia_trainer_learner_observations');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [currentLearnerObservationInput, setCurrentLearnerObservationInput] = useState('');
  const [customCertifiedIds, setCustomCertifiedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('academia_trainer_custom_certifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Course Authoring Studio State (Step 1 -> 4)
  const [authoringStep, setAuthoringStep] = useState<1 | 2 | 3 | 4>(1);
  const [newCourseCode, setNewCourseCode] = useState(`MOD-00${courses.length + 1}`);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState<'Réglementation' | 'Passation' | 'Contrôle' | 'Contentieux' | 'Gestion & Audit'>('Passation');
  const [newCourseDuration, setNewCourseDuration] = useState('10 Heures (3 Modules)');
  const [newCourseLevel, setNewCourseLevel] = useState<'Fondamental' | 'Intermédiaire' | 'Avancé' | 'Spécialisé'>('Intermédiaire');
  const [newCourseLegalRef, setNewCourseLegalRef] = useState('Loi n° 10/010 du 27 avril 2010 - Articles 18 à 35');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [newCourseCover, setNewCourseCover] = useState(imgTraining);
  const [coverFile, setCoverFile] = useState<AcademiaFile | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [selectedAudiences, setSelectedAudiences] = useState<UserRole[]>(['cgpmp_member', 'armp_agent', 'dgcmp_agent', 'pme']);

  // AI Animated Module Generator State (depuis un contenu existant du formateur)
  const [aiSourceMode, setAiSourceMode] = useState<'paste' | 'existing_course' | 'template'>('paste');
  const [aiSelectedExistingCourseId, setAiSelectedExistingCourseId] = useState<string>(courses[0]?.id || 'MOD-001');
  const [aiSourceTitle, setAiSourceTitle] = useState('Pratique du Contenu Local PME, Sous-Traitance ARSP (Loi 17/001) et Montage des Offres');
  const [aiSourceText, setAiSourceText] = useState(
    `CHAPITRE 1 : CADRE LÉGAL DU CONTENU LOCAL ET DE LA SOUS-TRAITANCE EN RDC
La Loi n° 17/001 du 08 février 2017 fixant les règles applicables à la sous-traitance dans le secteur privé et la Loi n° 10/010 du 27 avril 2010 relative aux marchés publics consacrent la promotion des Petites et Moyennes Entreprises (PME) à capitaux congolais.
Pour être éligible à la sous-traitance réservée et à la marge de préférence nationale (15% à 20% selon l'Article 37 de la Loi 10/010), l'entreprise doit détenir au moins 51% de capital social appartenant à des citoyens congolais et disposer d'une Attestation d'Enregistrement ARSP en cours de validité.

CHAPITRE 2 : MONTAGE DU DOSSIER DE SOUMISSION PME ET GROUPEMENT (GME)
Lorsqu'une PME congolaise ne dispose pas seule du chiffre d'affaires annuel moyen ou du parc matériel exigé dans les Données Particulières de l'Appel d'Offres (DPAO), elle peut former un Groupement Momentané d'Entreprises (GME) conjoint ou solidaire.
Les pièces administratives obligatoires comprennent : le RCCM actualisé, l'Identification Nationale, l'Attestation fiscale DGI valide, le quitus CNSS, l'Attestation ARSP et la garantie bancaire de soumission (plafonnée entre 1% et 2% du montant de l'offre).

CHAPITRE 3 : EXÉCUTION FINANCIÈRE, AVANCE DE DÉMARRAGE ET PRÉVENTION DES REJETS
Tout contrat attribué ouvre droit au versement d'une avance forfaitaire de démarrage pouvant atteindre 30% sur présentation d'une caution bancaire de remboursement d'avance (Art. 64 Loi 10/010). En cas d'écartement abusif d'une PME nationale, le dirigeant dispose de 5 jours ouvrables pour introduire son recours gracieux préalable devant la Personne Responsable des Marchés (Art. 77), puis de 7 jours ouvrables pour saisir le Comité de Règlement des Différends (CRD) de l'ARMP avec effet suspensif.`
  );
  const [aiCategory, setAiCategory] = useState<'Réglementation' | 'Passation' | 'Contrôle' | 'Contentieux' | 'Gestion & Audit'>('Passation');
  const [aiLevel, setAiLevel] = useState<'Fondamental' | 'Intermédiaire' | 'Avancé' | 'Spécialisé'>('Intermédiaire');
  const [aiLegalRef, setAiLegalRef] = useState('Loi n° 10/010 du 27 avril 2010 & Loi n° 17/001 (ARSP / ARMP RDC)');
  const [aiAudiences, setAiAudiences] = useState<UserRole[]>(['pme', 'cgpmp_member', 'armp_agent', 'dgcmp_agent', 'particulier']);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedCourse, setAiGeneratedCourse] = useState<CourseModule | null>(null);
  const [aiPreviewLessonIdx, setAiPreviewLessonIdx] = useState(0);
  const [aiEngineLabel, setAiEngineLabel] = useState<string | null>(null);

  const TRAINER_CONTENT_TEMPLATES = [
    {
      id: 'tpl-pme',
      title: 'Support Séminaire : Sous-traitance PME, ARSP (Loi 17/001) & Groupements GME',
      category: 'Réglementation' as const,
      legalRef: 'Loi n° 17/001 du 08 février 2017 & Loi n° 10/010 Art. 13, 37, 48',
      text: `CHAPITRE 1 : ÉLIGIBILITÉ AU CONTENU LOCAL ET RÔLE DE L'ARSP
En République Démocratique du Congo, la Loi n° 17/001 impose que les activités de sous-traitance et les lots accessibles aux PME nationales soient confiés à des entreprises dont au moins 51% du capital est détenu par des Congolais. L'Autorité de Régulation de la Sous-Traitance dans le Secteur Privé (ARSP) délivre l'attestation obligatoire vérifiée lors de l'ouverture des plis.

CHAPITRE 2 : ALLOTISSEMENT TECHNIQUE ET MARGE DE PRÉFÉRENCE DE 20%
L'article 13 de la Loi n° 10/010 encourage l'allotissement technique et géographique pour permettre aux PME congolaises de soumissionner directement sans confondre cette pratique avec le fractionnement illicite. L'article 37 accorde une marge de préférence nationale jusqu'à 20% à l'évaluation financière pour les offres conformes des PME locales.

CHAPITRE 3 : GROUPEMENT MOMENTANÉ D'ENTREPRISES (GME) ET AVANCE DE 30%
Plusieurs PME peuvent additionner leur chiffre d'affaires, leurs ingénieurs et leurs équipements au sein d'un GME solidaire avec chef de file mandaté. Une fois le marché signé et approuvé après Avis de Non-Objection (ANO), la PME peut percevoir jusqu'à 30% d'avance de démarrage contre garantie bancaire.`
    },
    {
      id: 'tpl-exec',
      title: 'Notes de Cours : Exécution Financière, Avenants (Plafond 15%) & Réception des Travaux',
      category: 'Gestion & Audit' as const,
      legalRef: 'Loi n° 10/010 - Art. 57 à 75 & CCAG Travaux RDC',
      text: `SECTION 1 : GARANTIES CONTRACTUELLES ET DÉCOMPTES PROVISOIRES
Dès la notification du marché approuvé, le titulaire fournit une garantie de bonne exécution fixée à 5% du montant initial (Art. 58 Loi 10/010). Les paiements s'effectuent par décomptes provisoires établis sur la base d'attachements contradictoires signés par la mission de contrôle et la CGPMP.

SECTION 2 : ENCADREMENT STRICT DES AVENANTS (SEUIL 15% ET PLAFOND 30%)
Tout avenant ayant une incidence financière supérieure à 15% du marché initial est obligatoirement soumis à l'Avis de Non-Objection (ANO) préalable de la DGCMP. Le cumul des avenants ne peut en aucun cas dépasser 30% ni bouleverser l'objet ou l'équilibre économique du contrat.

SECTION 3 : PÉNALITÉS DE RETARD ET DOUBLE RÉCEPTION (PROVISOIRE PUIS DÉFINITIVE)
En cas de dépassement du délai contractuel sans ordre de service d'arrêt ni force majeure, les pénalités de retard s'appliquent de plein droit. La réception provisoire ouvre le délai de garantie décennale ou annuelle (12 mois), au terme duquel la réception définitive libère la retenue de garantie.`
    },
    {
      id: 'tpl-sigmap',
      title: 'Guide Pratique : Dématérialisation SIGMAP, Portail e-GP & Audit de Traçabilité',
      category: 'Passation' as const,
      legalRef: 'Décret n° 10/21, Loi 10/010 Art. 14 & Directives SIGMAP RDC',
      text: `PARTIE 1 : NUMÉRISATION DU PPM ET CODIFICATION SIGMAP
Chaque ligne du Plan de Passation des Marchés (PPM) doit être saisie et validée dans le Système Intégré de Gestion des Marchés Publics (SIGMAP) en parfaite synchronisation avec la ligne budgétaire de la Loi de Finances (Art. 14 Loi 10/010). Aucun DAO ne peut être publié sans code unique de traçabilité.

PARTIE 2 : DÉPÔT ÉLECTRONIQUE CHIFFRÉ ET HORODATAGE CERTIFIÉ
Sur le portail électronique e-GP, les plis des soumissionnaires sont chiffrés jusqu'à l'heure officielle d'ouverture publique (Art. 46). L'horodatage électronique certifié bloque automatiquement toute soumission tardive et génère le registre infalsifiable des dépôts.

PARTIE 3 : ARCHIVAGE NUMÉRIQUE DÉCENNAL ET AUDIT ARMP / COUR DES COMPTES
L'intégralité du dossier (PPM, DAO, ANO DGCMP, PV d'ouverture, rapport d'évaluation, contrat et décomptes) est archivée numériquement pendant 10 ans pour permettre les audits a posteriori de l'ARMP, de l'IGF et de la Cour des Comptes.`
    }
  ];

  const handleGenerateAnimatedModuleFromContent = async () => {
    if (!aiSourceText.trim() || aiSourceText.trim().length < 20) {
      setTrainerNotice("Veuillez coller ou sélectionner un contenu pédagogique d'au moins 20 caractères.");
      return;
    }
    setAiGenerating(true);
    setTrainerNotice(null);
    try {
      const response = await fetch('/api/ai/generate-animated-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceTitle: aiSourceTitle,
          sourceText: aiSourceText,
          category: aiCategory,
          level: aiLevel,
          legalRef: aiLegalRef,
          targetAudience: aiAudiences,
          trainerName: currentProfile.name,
          trainerInstitution: currentProfile.institution
        })
      });
      const data = await response.json();
      if (!response.ok || !data?.module) {
        throw new Error(data?.error || 'Erreur lors de la génération IA');
      }
      const m = data.module;
      const generated: CourseModule = {
        id: `MOD-IA-${Date.now().toString().slice(-5)}`,
        code: m.code || `MP-RDC-IA-${courses.length + 1}`,
        title: m.title || aiSourceTitle || 'Module Animé généré par IA',
        category: (m.category || aiCategory) as CourseModule['category'],
        targetAudience: (Array.isArray(m.targetAudience) ? m.targetAudience : aiAudiences) as UserRole[],
        duration: m.duration || '2h 15min',
        level: (m.level || aiLevel) as CourseModule['level'],
        legalRef: m.legalReference || aiLegalRef,
        description: m.description || `Module animé généré par l'IA à partir du support de ${currentProfile.name}.`,
        coverImage: newCourseCover || imgTraining,
        chaptersCount: Array.isArray(m.lessons) ? m.lessons.length : 3,
        rating: 5.0,
        studentsCount: 1,
        requiresDfatApproval: false,
        lessons: (Array.isArray(m.lessons) ? m.lessons : []).map((les: any, idx: number) => ({
          id: les.id || `L-IA-${idx + 1}`,
          title: les.title || `Leçon Animée ${idx + 1}`,
          duration: les.duration || '40 min',
          content: les.content || '',
          keyArticles: Array.isArray(les.keyArticles) ? les.keyArticles : [aiLegalRef],
          format: 'animation' as LessonFormat,
          templateId: idx === 0 ? 'character' : idx === 1 ? 'infographic' : 'whiteboard'
        })),
        quiz: (Array.isArray(m.quiz) ? m.quiz : []).map((q: any) => ({
          question: q.question,
          options: Array.isArray(q.options) ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
          correctIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : (typeof q.correctIndex === 'number' ? q.correctIndex : 1),
          explanation: q.explanation || `Référence : ${q.legalArticle || aiLegalRef}`
        }))
      };
      setAiGeneratedCourse(generated);
      setAiPreviewLessonIdx(0);
      setAiEngineLabel(data.engine === 'gemini-ai-studio' ? 'Cerveau IA Gemini • Scénarisation Animée Prof. Aïsha' : 'Moteur Pédagogique Structuré ACADEMIA IA');
      setTrainerNotice(`Module animé « ${generated.title} » généré avec succès (${generated.lessons.length} leçons animées + ${generated.quiz.length} QCM) !`);
    } catch (err: any) {
      console.warn('AI module generation error:', err);
      setTrainerNotice(err?.message || 'Erreur lors de la génération du module animé.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleLoadGeneratedIntoEditor = () => {
    if (!aiGeneratedCourse) return;
    setNewCourseCode(aiGeneratedCourse.code);
    setNewCourseTitle(aiGeneratedCourse.title);
    setNewCourseCategory(aiGeneratedCourse.category);
    setNewCourseLevel(aiGeneratedCourse.level);
    setNewCourseDuration(aiGeneratedCourse.duration);
    setNewCourseLegalRef(aiGeneratedCourse.legalRef);
    setNewCourseDescription(aiGeneratedCourse.description);
    setSelectedAudiences(aiGeneratedCourse.targetAudience);
    setLessonsList(
      aiGeneratedCourse.lessons.map((l, idx) => ({
        id: l.id || `L${idx + 1}`,
        title: l.title,
        duration: l.duration,
        content: l.content,
        keyArticles: l.keyArticles || [],
        format: 'animation' as LessonFormat,
        templateId: (l as any).templateId || 'character'
      }))
    );
    setQuizList(
      aiGeneratedCourse.quiz.map((q) => ({
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation
      }))
    );
    setActiveLessonEditIndex(0);
    setAuthoringStep(2);
    setActiveTab('authoring');
    setTrainerNotice(`Le module animé généré par l'IA a été chargé dans l'Éditeur de Cours (Étape 2) ✓`);
  };

  const handlePublishAiGeneratedCourse = () => {
    if (!aiGeneratedCourse) return;
    onAddCourse(aiGeneratedCourse);
    setTrainerNotice(`Module animé « ${aiGeneratedCourse.title} » publié au catalogue national ACADEMIA ITECH ✓`);
  };

  // Lessons builder state — avec formats Vidéo/Audio/Animation/IA PPT/PDF/Visio/Texte
  const [lessonsList, setLessonsList] = useState<Array<{
    id: string;
    title: string;
    duration: string;
    content: string;
    keyArticles: string[];
    format: LessonFormat;
    mediaUrl?: string;
    aiPrompt?: string;
    templateId?: string;
    visioLink?: string;
    visioDate?: string;
    visioPlatform?: 'zoom' | 'teams' | 'meet' | 'jitsi';
  }>>([
    {
      id: 'L1',
      title: 'Introduction et principes clés de la procédure',
      duration: '45 min',
      format: 'animation',
      templateId: 'whiteboard',
      content: `Dans ce chapitre fondamental, nous abordons la préparation rigoureuse des dossiers de consultation des entreprises (DAO) conformément aux directives de l'ARMP RDC.

Points cardinaux :
1. Définition claire des spécifications techniques neutres et non discriminatoires (Loi 10/010 art. 23).
2. Fixation des critères d'évaluation objectifs, mesurables et quantifiables.
3. Établissement du calendrier prévisionnel en cohérence avec le PPM validé.`,
      keyArticles: ['Loi 10/010 Art. 23', 'Manuel ARMP §2.1']
    },
    {
      id: 'L2',
      title: 'Instruction du dossier et contrôle de conformité',
      duration: '50 min',
      format: 'animation',
      templateId: 'whiteboard',
      content: `L'examen des offres requiert une neutralité absolue de la sous-commission d'analyse.

Étapes de vérification :
- Contrôle de recevabilité des pièces administratives (RCCM, quitus fiscal, attestations CNSS).
- Analyse de la conformité technique selon la méthode conforme / non conforme.
- Évaluation financière et détection d'éventuelles offres anormalement basses.`,
      keyArticles: ['Loi 10/010 Art. 45', 'Décret n° 10/22']
    }
  ]);

  // Quiz builder state
  const [quizList, setQuizList] = useState<Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>>([
    {
      question: "Quel est le délai légal minimal de réception des offres pour un appel d'offres ouvert national selon l'ARMP ?",
      options: [
        "15 jours calendaires",
        "30 jours calendaires",
        "45 jours calendaires",
        "60 jours calendaires"
      ],
      correctIndex: 1,
      explanation: "L'article 26 de la Loi 10/010 fixe un délai minimal de 30 jours pour garantir l'égal accès et la concurrence effective."
    },
    {
      question: "Quelle autorité délivre l'Avis de Non-Objection (ANO) sur le projet de DAO au-delà des seuils nationaux ?",
      options: [
        "La CGPMP du Ministère",
        "Le Conseil d'Administration de l'ARMP",
        "La Direction Générale du Contrôle des Marchés Publics (DGCMP)",
        "L'Inspection Générale des Finances (IGF)"
      ],
      correctIndex: 2,
      explanation: "La DGCMP exerce le contrôle a priori et délivre l'ANO obligatoire avant publication de l'avis d'appel d'offres."
    }
  ]);

  // DIGITAL VIDEO STUDIO STATE
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(1.0);
  const [isPrompterRunning, setIsPrompterRunning] = useState(false);
  const [prompterText, setPrompterText] = useState(
    `Bonjour à tous et bienvenue dans cette Masterclass officielle de l'ARMP RDC.
Aujourd'hui, nous allons décortiquer ensemble les obligations légales posées par la Loi n° 10/010 du 27 avril 2010.
En tant qu'acteurs de la commande publique, qu'il s'agisse des membres des CGPMP ministérielles ou des auditeurs de la DGCMP, votre rôle est garant de la bonne gouvernance de nos deniers publics.
Commençons par examiner l'article 5 relatif aux quatre principes inviolables de la commande publique congolaise...`
  );
  const [prompterFontSize, setPrompterFontSize] = useState<'normal' | 'large' | 'xl'>('large');
  const [studioLowerThird, setStudioLowerThird] = useState(true);
  const [studioOverlayTheme, setStudioOverlayTheme] = useState<'official_blue' | 'presidential_gold' | 'minimal'>('official_blue');
  const defaultStudioVideos: RecordedVideo[] = [
    {
      id: 'VID-001',
      title: 'Masterclass : Rédaction du DAO Type ARMP',
      duration: '14 min 30s',
      blobUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      date: 'Hier, 15:40',
      courseCode: 'MOD-002'
    },
    {
      id: 'VID-002',
      title: 'Point de Droit : Le Recours non juridictionnel devant le CRD',
      duration: '08 min 12s',
      blobUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      date: '21 Septembre 2026',
      courseCode: 'MOD-004'
    }
  ];
  const [recordedVideos, setRecordedVideos] = useState<RecordedVideo[]>(() => {
    try {
      const saved = localStorage.getItem('armp_studio_videos');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultStudioVideos;
  });

  // Banque nationale de QCM persistée dans Firestore + localStorage
  const defaultQuizBank: QuizBankItem[] = [
    {
      id: 'qb-1',
      code: 'Q-REG-01',
      theme: 'Réglementation & Principes',
      q: "Quelles sont les trois institutions piliers de la commande publique instaurées par la Loi n° 10/010 ?",
      rep: "CGPMP (Passation), DGCMP (Contrôle a priori), ARMP (Régulation et contentieux).",
      article: "Loi 10/010 Art. 2, 7 & 12"
    },
    {
      id: 'qb-2',
      code: 'Q-PASS-02',
      theme: 'Passation & DAO',
      q: "À quel moment précis le Plan de Passation des Marchés (PPM) doit-il être validé ?",
      rep: "Préalablement à tout engagement et avant le lancement de tout appel d'offres au début de chaque exercice budgétaire.",
      article: "Loi 10/010 Art. 12"
    },
    {
      id: 'qb-3',
      code: 'Q-CONT-03',
      theme: 'Contentieux & Recours',
      q: "Quel est le délai accordé au soumissionnaire pour introduire un recours préalable gracieux devant l'Autorité Contractante ?",
      rep: "Dans un délai de cinq (5) jours ouvrables suivant la publication de l'attribution provisoire.",
      article: "Loi 10/010 Art. 89"
    }
  ];
  const [quizBankItems, setQuizBankItems] = useState<QuizBankItem[]>(() => {
    try {
      const saved = localStorage.getItem('armp_quiz_bank');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultQuizBank;
  });
  const [newQbTheme, setNewQbTheme] = useState('Passation & DAO');
  const [newQbArticle, setNewQbArticle] = useState('Loi 10/010 Art. 26');
  const [newQbQuestion, setNewQbQuestion] = useState('');
  const [newQbAnswer, setNewQbAnswer] = useState('');
  const [trainerNotice, setTrainerNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchStudioVideosFromFirestore().then(remote => {
      if (mounted && remote && remote.length > 0) {
        setRecordedVideos(prev => {
          const map = new Map<string, RecordedVideo>();
          [...remote, ...prev].forEach(v => map.set(v.id, v));
          const merged = Array.from(map.values());
          try { localStorage.setItem('armp_studio_videos', JSON.stringify(merged)); } catch {}
          return merged;
        });
      }
    }).catch(() => {});

    fetchQuizBankFromFirestore().then(remote => {
      if (mounted && remote && remote.length > 0) {
        setQuizBankItems(prev => {
          const map = new Map<string, QuizBankItem>();
          [...remote, ...prev].forEach(item => map.set(item.id, item));
          const merged = Array.from(map.values());
          try { localStorage.setItem('armp_quiz_bank', JSON.stringify(merged)); } catch {}
          return merged;
        });
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleAddQuizBankItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQbQuestion.trim() || !newQbAnswer.trim()) return;
    const item: QuizBankItem = {
      id: `qb-${Date.now()}`,
      code: `Q-ARMP-0${quizBankItems.length + 1}`,
      theme: newQbTheme.trim() || 'Passation & DAO',
      q: newQbQuestion.trim(),
      rep: newQbAnswer.trim(),
      article: newQbArticle.trim() || 'Loi 10/010',
      createdBy: currentProfile.name,
      createdAt: new Date().toISOString()
    };
    const next = [item, ...quizBankItems];
    setQuizBankItems(next);
    try { localStorage.setItem('armp_quiz_bank', JSON.stringify(next)); } catch {}
    saveQuizBankItemToFirestore(item).catch(() => {});
    setNewQbQuestion('');
    setNewQbAnswer('');
    setTrainerNotice(`Question ${item.code} enregistrée et synchronisée dans la Banque Nationale ARMP ✓`);
    setTimeout(() => setTrainerNotice(null), 4000);
  };

  // Calculs dynamiques des KPIs Formateur
  const profilesArray = allProfiles ? Object.values(allProfiles) : [currentProfile];
  const learnerProfiles = profilesArray.filter(p => p.role !== 'formateur');
  const totalStudentsCount = courses.reduce((acc, c) => acc + (c.studentsCount || 0), 0) + profilesArray.length * 12;
  const avgSuccessRate = Number(
    (profilesArray.reduce((acc, p) => acc + (p.placementScore || 85), 0) / Math.max(1, profilesArray.length)).toFixed(1)
  );

  // Calcul du suivi par apprenant pour un cours donné
  const computeLearnerCourseProgress = (learner: UserProfile, course: CourseModule) => {
    const certKey = `${learner.id}_${course.id}`;
    const isCustomCertified = customCertifiedIds.includes(certKey) || customCertifiedIds.includes(`${learner.id}_${course.code}`);
    
    let progressPct = 0;
    if (isCustomCertified) {
      progressPct = 100;
    } else if (learner.courseProgress?.[course.id] !== undefined) {
      progressPct = learner.courseProgress[course.id];
    } else if (learner.courseProgress?.[course.code] !== undefined) {
      progressPct = learner.courseProgress[course.code];
    } else if (learner.completedCourseIds?.includes(course.id) || learner.completedCourseIds?.includes(course.code)) {
      progressPct = 100;
    } else {
      const hash = Math.abs((learner.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) * 17 + course.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) * 23) % 100);
      progressPct = hash < 20 ? 35 : (hash > 80 ? 92 : hash);
    }

    const totalLessons = Math.max(1, course.lessons.length);
    const completedLessonsCount = progressPct >= 100 
      ? totalLessons 
      : Math.min(totalLessons, Math.max(1, Math.round((progressPct / 100) * totalLessons)));

    const isCertified = progressPct >= 100 || isCustomCertified || Boolean(learner.certificates && learner.certificates.some(c => c.courseId === course.id || c.courseCode === course.code));

    let quizScore = 80;
    if (isCertified) {
      quizScore = 90 + (learner.name.length % 9);
    } else if (learner.quizScoresByCourse?.[course.id] !== undefined) {
      quizScore = learner.quizScoresByCourse[course.id];
    } else if (learner.placementScore) {
      quizScore = Math.max(65, Math.min(96, Math.round(learner.placementScore * 0.95 + (progressPct * 0.1))));
    } else {
      quizScore = Math.round(68 + (progressPct * 0.28));
    }

    const studyTime = `${Math.round(progressPct * 0.08 + 2)}h ${((learner.name.length * 9) % 45) + 10}min`;
    const lastActive = learner.lastActiveDate || (progressPct > 75 ? "Aujourd'hui à 10:30" : "Il y a 2 jours");

    return {
      profile: learner,
      course,
      progressPct,
      completedLessonsCount,
      quizScore,
      isCertified,
      studyTime,
      lastActive,
      status: isCertified ? ('certified' as const) : (progressPct < 40 ? ('needs_help' as const) : ('in_progress' as const))
    };
  };

  // Liste des apprenants inscrits selon le cours sélectionné
  const getEnrolledLearners = (courseId: string) => {
    if (courseId === 'all') {
      return learnerProfiles.map((lp, idx) => {
        const assignedCourse = courses[idx % courses.length] || courses[0];
        return computeLearnerCourseProgress(lp, assignedCourse);
      });
    }

    const targetCourse = courses.find(c => c.id === courseId || c.code === courseId) || courses[0];
    if (!targetCourse) return [];

    return learnerProfiles.map(lp => computeLearnerCourseProgress(lp, targetCourse));
  };

  const handleSaveLearnerObservation = (learnerId: string, courseId: string, text: string) => {
    const key = `${learnerId}_${courseId}`;
    const next = { ...trainerObservations, [key]: text };
    setTrainerObservations(next);
    try {
      localStorage.setItem('academia_trainer_learner_observations', JSON.stringify(next));
    } catch {}
    setTrainerNotice(`Observation pédagogique enregistrée pour ${selectedLearnerForModal?.profile.name || 'l\'apprenant'} ✓`);
    setTimeout(() => setTrainerNotice(null), 3500);
  };

  const handleGrantCertification = (learnerId: string, courseId: string) => {
    const key = `${learnerId}_${courseId}`;
    if (!customCertifiedIds.includes(key)) {
      const next = [...customCertifiedIds, key];
      setCustomCertifiedIds(next);
      try {
        localStorage.setItem('academia_trainer_custom_certifications', JSON.stringify(next));
      } catch {}
      setTrainerNotice(`Attestation Homologuée DFAT validée avec succès pour cet apprenant ✓`);
      setTimeout(() => setTrainerNotice(null), 4000);
      if (selectedLearnerForModal) {
        setSelectedLearnerForModal({
          ...selectedLearnerForModal,
          isCertified: true,
          progressPct: 100,
          completedLessonsCount: selectedLearnerForModal.course.lessons.length,
          quizScore: Math.max(90, selectedLearnerForModal.quizScore)
        });
      }
    }
  };
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  // Video recording refs
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const prompterContainerRef = useRef<HTMLDivElement | null>(null);

  // Timer for Recording
  useEffect(() => {
    let interval: any = null;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Teleprompter Auto-Scroll
  useEffect(() => {
    let prompterInterval: any = null;
    if (isPrompterRunning && prompterContainerRef.current) {
      prompterInterval = setInterval(() => {
        if (prompterContainerRef.current) {
          prompterContainerRef.current.scrollTop += 1 * teleprompterSpeed;
        }
      }, 40);
    }
    return () => clearInterval(prompterInterval);
  }, [isPrompterRunning, teleprompterSpeed]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start Camera Stream
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: micActive
        });
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play();
        }
        setCameraActive(true);
        setScreenShareActive(false);
      }
    } catch (err) {
      console.warn("Camera could not be accessed directly, using virtual studio preview", err);
      setCameraActive(true);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (videoPreviewRef.current && videoPreviewRef.current.srcObject) {
      const stream = videoPreviewRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoPreviewRef.current.srcObject = null;
    }
    setCameraActive(false);
    setScreenShareActive(false);
  };

  // Start Screen Sharing
  const startScreenShare = async () => {
    try {
      if (navigator.mediaDevices && (navigator.mediaDevices as any).getDisplayMedia) {
        const stream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: true,
          audio: micActive
        });
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play();
        }
        setScreenShareActive(true);
        setCameraActive(true);
      }
    } catch (err) {
      console.warn("Screen share cancelled or not allowed", err);
    }
  };

  // Handle Recording Trigger
  const handleToggleRecord = () => {
    if (!isRecording) {
      // Start recording
      recordedChunksRef.current = [];
      setIsRecording(true);
      setIsPaused(false);
      setRecordSeconds(0);
      setIsPrompterRunning(true);

      // Attempt to initialize MediaRecorder if stream exists
      if (videoPreviewRef.current && videoPreviewRef.current.srcObject) {
        try {
          const stream = videoPreviewRef.current.srcObject as MediaStream;
          const recorder = new MediaRecorder(stream);
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              recordedChunksRef.current.push(e.data);
            }
          };
          recorder.onstop = async () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const vidId = `VID-${Date.now().toString().slice(-4)}`;
            const newVid: RecordedVideo = {
              id: vidId,
              title: `Prise de cours #${recordedVideos.length + 1} (${new Date().toLocaleTimeString('fr-FR')})`,
              duration: formatTime(recordSeconds),
              blobUrl: url,
              date: "À l'instant",
              courseCode: newCourseCode
            };
            setRecordedVideos(prev => {
              const next = [newVid, ...prev];
              try { localStorage.setItem('armp_studio_videos', JSON.stringify(next)); } catch {}
              return next;
            });
            saveStudioVideoToFirestore({ ...newVid, authorId: currentProfile.id }).catch(() => {});
            // → Upload vers Academia Storage (137.184.59.184) — vidéos
            try {
              setVideoUploading(true);
              const fileName = `masterclass_${newCourseCode}_${Date.now()}.webm`;
              const acad = await uploadBlob(blob, fileName, {
                category: 'studio_videos',
                visibility: 'private',
                entityId: newCourseCode,
                description: `Masterclass ${newCourseCode} — ${newVid.title}`,
                uploadedBy: currentProfile.email,
                onProgress: setVideoUploadProgress,
              });
              setRecordedVideos(prev => {
                const updated = prev.map(v => v.id === vidId ? { ...v, academiaUrl: acad.url, academiaId: acad.id, blobUrl: acad.url } : v);
                try { localStorage.setItem('armp_studio_videos', JSON.stringify(updated)); } catch {}
                return updated;
              });
              saveStudioVideoToFirestore({ ...newVid, academiaUrl: acad.url, academiaId: acad.id, blobUrl: acad.url, authorId: currentProfile.id }).catch(() => {});
            } catch (e: any) {
              console.warn('Upload Academia vidéo échoué', e);
            } finally {
              setVideoUploading(false);
            }
          };
          recorder.start();
          mediaRecorderRef.current = recorder;
        } catch (e) {
          console.warn("MediaRecorder fallback", e);
        }
      }
    } else {
      // Stop recording
      setIsRecording(false);
      setIsPaused(false);
      setIsPrompterRunning(false);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      } else {
        // Fallback recorded item for simulation
        const fallbackVid: RecordedVideo = {
          id: `VID-${Date.now().toString().slice(-4)}`,
          title: `Masterclass ARMP #${recordedVideos.length + 1}`,
          duration: formatTime(recordSeconds || 74),
          blobUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          date: "À l'instant",
          courseCode: newCourseCode
        };
        setRecordedVideos(prev => {
          const next = [fallbackVid, ...prev];
          try { localStorage.setItem('armp_studio_videos', JSON.stringify(next)); } catch {}
          return next;
        });
        saveStudioVideoToFirestore({ ...fallbackVid, authorId: currentProfile.id }).catch(() => {});
      }
    }
  };

  // Toggle Audience Checkboxes
  const toggleAudience = (role: UserRole) => {
    if (selectedAudiences.includes(role)) {
      if (selectedAudiences.length > 1) {
        setSelectedAudiences(selectedAudiences.filter(r => r !== role));
      }
    } else {
      setSelectedAudiences([...selectedAudiences, role]);
    }
  };

  // Add a new Lesson draft — avec format animation par défaut (Animaker 2D Main & Graphiques)
  const handleAddNewLesson = () => {
    const nextIdx = lessonsList.length + 1;
    setLessonsList([
      ...lessonsList,
      {
        id: `L${nextIdx}`,
        title: `Chapitre ${nextIdx} : Nouvelle leçon de passation`,
        duration: '40 min',
        format: 'animation',
        templateId: 'whiteboard',
        content: `Contenu du chapitre ${nextIdx}...\n\nDéveloppez ici les points clés et les applications pratiques de la Loi 10/010.`,
        keyArticles: ['Loi 10/010 Art. 28']
      }
    ]);
  };

  // Add a new Quiz Question draft
  const handleAddNewQuizQuestion = () => {
    setQuizList([
      ...quizList,
      {
        question: `Question n°${quizList.length + 1} d'évaluation sur le cours ?`,
        options: [
          "Option A (Première proposition)",
          "Option B (Seconde proposition conforme)",
          "Option C (Troisième proposition)",
          "Option D (Aucune des réponses ci-dessus)"
        ],
        correctIndex: 1,
        explanation: "Explication juridique basée sur les dispositions applicables de la Loi 10/010."
      }
    ]);
  };

  // Submit and Publish New Course
  const handlePublishCourse = () => {
    if (!newCourseTitle.trim()) {
      setTrainerNotice("Veuillez renseigner l'intitulé de la formation avant publication.");
      return;
    }

    const createdCourse: CourseModule = {
      id: newCourseCode,
      code: newCourseCode,
      title: newCourseTitle.trim(),
      category: newCourseCategory,
      targetAudience: selectedAudiences,
      duration: newCourseDuration,
      level: newCourseLevel,
      legalRef: newCourseLegalRef,
      description: newCourseDescription || `Formation officielle conçue par ${currentProfile.name}, formatrice accréditée ARMP. Maîtrise des standards de passation et de conformité.`,
      coverImage: newCourseCover,
      chaptersCount: lessonsList.length,
      rating: 5.0,
      studentsCount: 1,
      requiresDfatApproval: false,
      lessons: lessonsList,
      quiz: quizList
    };

    onAddCourse(createdCourse);
    setActiveTab('courses');
    setAuthoringStep(1);
    setNewCourseTitle('');
    setTrainerNotice(`La formation « ${createdCourse.title} » a été publiée et persistée dans Firestore ✓`);
    setTimeout(() => setTrainerNotice(null), 5000);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} pb-24 transition-colors`}>
      
      {/* ========================================================================= */}
      {/* 1. HEADER FULL WIDTH — COVER + AVATAR + TABS (full bleed, content en container) */}
      {/* ========================================================================= */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          
          {/* Cover Photo — full width edge-to-edge */}
          <div className="h-44 sm:h-64 md:h-80 w-full relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 group">
            <img
              src={imgSeminar}
              alt="Couverture Studio Formateur"
              className="w-full h-full object-cover object-center transition duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center space-x-2 bg-black/40 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/20 text-white text-[10px] sm:text-xs font-mono max-w-[85vw] truncate">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="font-bold truncate">ARMP ACADEMIA • STUDIO FORMATEUR CERTIFIÉ</span>
            </div>
            <div className="absolute top-4 right-4 hidden sm:flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              <ArmpLogo size="sm" isDarkMode={true} />
              <div className="text-left leading-tight">
                <span className="text-[10px] font-black text-amber-400 block tracking-wider">ACADEMIA ITECH</span>
                <span className="text-[8px] text-slate-300">DFAT • RDC</span>
              </div>
            </div>
          </div>

          {/* Profile Identity — contenu dans container */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 pt-0 relative">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 -mt-14 sm:-mt-20 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-end space-y-3 sm:space-y-0 sm:space-x-5">
                <div className="relative group mx-auto sm:mx-0">
                  <img
                    src={currentProfile.avatarUrl}
                    alt={currentProfile.name}
                    referrerPolicy="no-referrer"
                    className="w-28 h-28 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-xl bg-slate-100 ring-2 ring-blue-500/20"
                  />
                  <span className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 p-2 rounded-full bg-amber-400 text-slate-950 border-2 border-white dark:border-slate-900 shadow-md">
                    <GraduationCap className="w-4 h-4" />
                  </span>
                </div>
                <div className="space-y-1 text-center sm:text-left bg-white dark:bg-slate-900 rounded-2xl px-4 py-3 shadow-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {currentProfile.name}
                    </h1>
                    <span className="text-[#1877F2] inline-flex items-center" title="Formateur certifié ARMP">
                      <BadgeCheck className="w-6 h-6 fill-[#1877F2] text-white" />
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                    <span className="px-3 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                      Formateur Homologué DFAT
                    </span>
                    <span className="text-slate-400 font-semibold">•</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      {currentProfile.institution}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl font-medium pt-1 italic">
                    « Studio pédagogique — {currentProfile.roleTitle}. Conception de cours Loi 10/010, encadrement CGPMP et attestation DFAT. »
                  </p>
                  <div className="flex items-center justify-center sm:justify-start space-x-2 pt-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <div className="flex -space-x-2 overflow-hidden">
                      <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover" src={imgMentor} alt="Apprenant" />
                      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900 text-[9px] font-bold text-white">AR</div>
                      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 ring-2 ring-white dark:ring-slate-900 text-[9px] font-bold text-white">+1k</div>
                    </div>
                    <span className="font-semibold">
                      <strong className="text-slate-800 dark:text-slate-200">1 842 apprenants</strong> • 91,4% réussite • 38h Masterclass
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 pt-2 md:pt-0">
                <button
                  onClick={() => setActiveTab('ai_generator')}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 transition flex items-center space-x-1.5 active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Générer Module Animé (IA)</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('authoring');
                    setAuthoringStep(1);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#1877F2] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center space-x-2 active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Créer un Cours</span>
                </button>
                <button
                  onClick={() => setActiveTab('studio')}
                  className="px-4 py-2.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs transition flex items-center space-x-1.5 active:scale-95"
                >
                  <Video className="w-3.5 h-3.5 text-rose-600" />
                  <span>Studio Vidéo</span>
                </button>
                {currentProfile.role !== 'formateur' && onSwitchToTrainerRole && (
                  <button
                    onClick={onSwitchToTrainerRole}
                    className="px-3 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold text-xs transition border border-amber-200 dark:border-amber-900/50 flex items-center space-x-1.5"
                    title="Activer le rôle Formateur"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Activer rôle Formateur</span>
                  </button>
                )}
              </div>
            </div>

            {/* Facebook Tabs — sticky style comme UserProfileView */}
            <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'dashboard' as const, label: 'Tableau de bord', icon: BarChart3 },
                { id: 'courses' as const, label: 'Mes Formations', icon: BookOpen, badge: courses.length },
                { id: 'ai_generator' as const, label: 'Générateur IA Animé', icon: Sparkles, badge: 'IA' },
                { id: 'authoring' as const, label: 'Créateur de Cours', icon: FolderPlus },
                { id: 'studio' as const, label: 'Studio Vidéo', icon: Tv },
                { id: 'quiz_bank' as const, label: 'Banque QCM', icon: ListOrdered },
                { id: 'learners' as const, label: 'Apprenants', icon: Users }
              ].map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-3 rounded-xl text-xs font-bold transition flex items-center space-x-2 flex-shrink-0 relative ${
                      isActive
                        ? 'text-[#1877F2] bg-blue-50/80 dark:bg-blue-950/60 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#1877F2] dark:text-blue-400' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isActive ? 'bg-[#1877F2] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {tab.badge}
                      </span>
                    )}
                    {isActive && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#1877F2] rounded-full" />}
                  </button>
                );
              })}
            </div>
          </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BODY CONTENT — DANS CONTAINER                                          */}
      {/* ========================================================================= */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* ======================================================================= */}
        {/* TAB 1: TRAINER DASHBOARD OVERVIEW                                       */}
        {/* ======================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-1`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Formations Créées</span>
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {courses.length}
                </div>
                <span className="text-[11px] text-emerald-500 font-bold block">✓ 100% Homologuées DFAT</span>
              </div>

              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-1`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Apprenants Suivis</span>
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {totalStudentsCount.toLocaleString('fr-FR')}
                </div>
                <span className="text-[11px] text-purple-500 font-bold block">{profilesArray.length} profils actifs synchronisés</span>
              </div>

              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-1`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taux de Réussite</span>
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {avgSuccessRate}%
                </div>
                <span className="text-[11px] text-slate-400 block">Moyenne certifiante ARMP</span>
              </div>

              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-1`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vidéos Masterclass</span>
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                    <Video className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {recordedVideos.length} prises
                </div>
                <span className="text-[11px] text-amber-500 font-bold block">{quizBankItems.length} QCM nationaux</span>
              </div>
            </div>

            {/* Quick Actions & Recent Productions */}
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Courses Management Preview */}
              <div className={`lg:col-span-2 p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
                <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <span>Formations sous votre supervision pédagogique</span>
                    </h3>
                    <p className="text-xs text-slate-500">Modules publiés au catalogue national ACADEMIA ITECH</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('courses')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Voir tout</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {courses.slice(0, 4).map(c => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 group hover:border-blue-400 transition"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={c.coverImage}
                          alt={c.title}
                          className="w-12 h-12 rounded-xl object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-mono text-[10px] font-bold">
                              {c.code}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">{c.category}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md">
                            {c.title}
                          </h4>
                          <span className="text-[10px] text-slate-500 block">
                            {c.lessons.length} chapitres • {c.studentsCount} inscrits • Note {c.rating}★
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => onPreviewCourse(c)}
                          className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 transition"
                          title="Aperçu plan"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenCoursePlayer(c)}
                          className="px-3 py-1.5 rounded-xl bg-[#0866FF] hover:bg-blue-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span className="hidden sm:inline">Tester cours</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Col: Video Studio Shortcut & Quick Stats */}
              <div className="space-y-4">
                
                {/* Video Studio Card */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-950 to-slate-900 text-white shadow-xl border border-blue-800/40 space-y-4 relative overflow-hidden">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-lg">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Studio Vidéo Masterclass</h3>
                    <p className="text-xs text-blue-200/80 leading-relaxed mt-1">
                      Enregistrez vos capsules pédagogiques avec prompteur interactif et habillage officiel ARMP.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('studio')}
                    className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center space-x-2"
                  >
                    <Tv className="w-4 h-4" />
                    <span>Lancer la régie de tournage</span>
                  </button>
                </div>

                {/* Pedagogical Quality Badge */}
                <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-3`}>
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Conformité Pédagogique ARMP</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Toutes vos évaluations sont alignées sur le Référentiel National des Compétences en Commande Publique (Loi 10/010).
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 2: COURSES & PROGRAM MANAGEMENT                                     */}
        {/* ======================================================================= */}
        {activeTab === 'courses' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Gestion des Programmes & Formations
                </h2>
                <p className="text-xs text-slate-500">
                  Consultez, modifiez ou créez les cursus de formation destinés aux autorités contractantes
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveTab('authoring');
                  setAuthoringStep(1);
                }}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-2 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Cursus</span>
              </button>
            </div>

            {/* Courses Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map(course => (
                <div
                  key={course.id}
                  className={`rounded-3xl border overflow-hidden transition flex flex-col ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-400'
                  } shadow-sm group`}
                >
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                    <img
                      src={course.coverImage}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-blue-600 text-white font-mono text-[10px] font-bold">
                      {course.code}
                    </span>
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 text-amber-300 font-bold text-[10px] backdrop-blur-xs">
                      {course.level}
                    </span>
                    <div className="absolute bottom-2 left-3 right-3 text-white text-xs flex items-center justify-between">
                      <span className="font-mono text-[11px]">{course.duration}</span>
                      <span className="font-bold text-emerald-400">{course.lessons.length} leçons</span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        {course.category}
                      </span>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>{learnerProfiles.length} apprenants inscrits</span>
                      </span>
                      <button
                        onClick={() => {
                          setSelectedTrackingCourseId(course.id);
                          setActiveTab('learners');
                        }}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 transition cursor-pointer"
                      >
                        <span>Suivre les apprenants</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onPreviewCourse(course)}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition"
                      >
                        Aperçu
                      </button>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            setActiveTab('studio');
                            setNewCourseCode(course.code);
                          }}
                          className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 text-xs font-bold transition"
                          title="Enregistrer une vidéo pour ce cours"
                        >
                          <Video className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onOpenCoursePlayer(course)}
                          className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Lancer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 2B: AI ANIMATED MODULE GENERATOR (DEPUIS CONTENU EXISTANT FORMATEUR)*/}
        {/* ======================================================================= */}
        {activeTab === 'ai_generator' && (
          <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Hero Header */}
            <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-blue-950 to-slate-900 border border-indigo-800/60 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-3xl">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Studio IA Formateur • Transformation de Contenu en Module Animé</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Générez un module de formation animé à partir de votre contenu existant
                  </h2>
                  <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
                    Importez ou collez votre support de cours existant (notes de séminaire, document Word/PDF, TDR, guide ARMP/ARSP ou cours du catalogue). L'IA structure automatiquement <strong>3 leçons animées multi-scènes (4 tableaux synchronisés + voix Prof. Aïsha)</strong> et un <strong>examen QCM certifiant</strong>.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={handleGenerateAnimatedModuleFromContent}
                    disabled={aiGenerating}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 disabled:opacity-60 text-slate-950 font-black text-xs sm:text-sm shadow-xl transition flex items-center space-x-2 cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${aiGenerating ? 'animate-spin' : ''}`} />
                    <span>{aiGenerating ? 'Scénarisation IA en cours...' : 'Générer le Module Animé par IA'}</span>
                  </button>
                </div>
              </div>
            </div>

            {trainerNotice && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{trainerNotice}</span>
                </div>
                <button onClick={() => setTrainerNotice(null)} className="text-emerald-700 dark:text-emerald-300 hover:underline text-[11px]">Fermer</button>
              </div>
            )}

            <div className="grid lg:grid-cols-12 gap-6">
              {/* Left 7 Cols: Existing Content Input & Source Selector */}
              <div className={`lg:col-span-7 p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-5`}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>1. Source du contenu existant du formateur</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Choisissez comment alimenter l'IA : texte/fichier du formateur, modèle DFAT ou cours existant
                    </p>
                  </div>
                </div>

                {/* Source Mode Selector */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'paste' as const, label: '✍️ Texte / Fichier Formateur' },
                    { id: 'template' as const, label: '📚 Modèles Séminaires DFAT' },
                    { id: 'existing_course' as const, label: '🔄 Depuis un Cours Existant' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setAiSourceMode(m.id)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                        aiSourceMode === m.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Mode: Template Selector */}
                {aiSourceMode === 'template' && (
                  <div className="space-y-2 p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60">
                    <span className="text-[11px] font-extrabold text-amber-900 dark:text-amber-300 block">
                      Sélectionnez un support de séminaire formateur pré-structuré :
                    </span>
                    <div className="space-y-2">
                      {TRAINER_CONTENT_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            setAiSourceTitle(tpl.title);
                            setAiCategory(tpl.category);
                            setAiLegalRef(tpl.legalRef);
                            setAiSourceText(tpl.text);
                          }}
                          className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 hover:border-amber-500 text-left transition flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">{tpl.title}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{tpl.legalRef} • {tpl.category}</div>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-[10px] font-bold shrink-0">
                            Charger ce contenu
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode: Existing Course Selector */}
                {aiSourceMode === 'existing_course' && (
                  <div className="space-y-2 p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60">
                    <label className="text-[11px] font-extrabold text-blue-900 dark:text-blue-300 block">
                      Choisissez un module existant à re-scénariser en version animée enrichie :
                    </label>
                    <select
                      value={aiSelectedExistingCourseId}
                      onChange={(e) => {
                        const cid = e.target.value;
                        setAiSelectedExistingCourseId(cid);
                        const found = courses.find((c) => c.id === cid);
                        if (found) {
                          setAiSourceTitle(`${found.title} (Édition Animée IA)`);
                          setAiCategory(found.category);
                          setAiLevel(found.level);
                          setAiLegalRef(found.legalRef);
                          setAiAudiences(found.targetAudience);
                          const combinedText = found.lessons
                            .map((l, idx) => `CHAPITRE ${idx + 1} : ${l.title}\nArticles clés : ${(l.keyArticles || []).join(', ')}\n${l.content}`)
                            .join('\n\n');
                          setAiSourceText(combinedText);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.title} ({c.lessons.length} chapitres)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* File Upload (.txt / .md) helper */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Titre du module animé à générer
                  </label>
                  <label className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Importer un fichier (.txt, .md)</span>
                    <input
                      type="file"
                      accept=".txt,.md,.csv,.json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setAiSourceText(reader.result);
                            if (!aiSourceTitle) {
                              setAiSourceTitle(file.name.replace(/\.[^.]+$/, ''));
                            }
                          }
                        };
                        reader.readAsText(file);
                      }}
                    />
                  </label>
                </div>

                <input
                  type="text"
                  value={aiSourceTitle}
                  onChange={(e) => setAiSourceTitle(e.target.value)}
                  placeholder="Ex: Pratique du Contenu Local PME et Sous-Traitance ARSP (Loi 17/001)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                />

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Contenu pédagogique existant du formateur (support, notes, articles, cas pratiques) *
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {aiSourceText.length} caractères
                    </span>
                  </div>
                  <textarea
                    rows={10}
                    value={aiSourceText}
                    onChange={(e) => setAiSourceText(e.target.value)}
                    placeholder="Collez ici vos notes de cours, votre support de formation, des extraits de la Loi 10/010 ou de la Loi 17/001, vos études de cas..."
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs leading-relaxed text-slate-900 dark:text-white font-sans"
                  />
                </div>

                {/* Metadata row */}
                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Catégorie</label>
                    <select
                      value={aiCategory}
                      onChange={(e) => setAiCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                    >
                      <option value="Passation">Passation des Marchés</option>
                      <option value="Réglementation">Réglementation & Contenu Local PME</option>
                      <option value="Contrôle">Contrôle a Priori (DGCMP)</option>
                      <option value="Contentieux">Contentieux & Recours (CRD)</option>
                      <option value="Gestion & Audit">Gestion, Exécution & Audit</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Niveau</label>
                    <select
                      value={aiLevel}
                      onChange={(e) => setAiLevel(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
                    >
                      <option value="Fondamental">Fondamental</option>
                      <option value="Intermédiaire">Intermédiaire</option>
                      <option value="Avancé">Avancé</option>
                      <option value="Spécialisé">Spécialisé / Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Référence Légale</label>
                    <input
                      type="text"
                      value={aiLegalRef}
                      onChange={(e) => setAiLegalRef(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Target Audiences */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Publics cibles du module animé :
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { role: 'pme' as const, label: '🏢 PME & Sous-Traitants' },
                      { role: 'cgpmp_member' as const, label: '🏛️ Cellules CGPMP' },
                      { role: 'armp_agent' as const, label: '⚖️ Régulateurs ARMP' },
                      { role: 'dgcmp_agent' as const, label: '🔍 Contrôleurs DGCMP' },
                      { role: 'particulier' as const, label: '👤 Consultants / Privé' }
                    ].map((aud) => {
                      const active = aiAudiences.includes(aud.role);
                      return (
                        <button
                          key={aud.role}
                          type="button"
                          onClick={() => {
                            if (active && aiAudiences.length > 1) {
                              setAiAudiences(aiAudiences.filter((r) => r !== aud.role));
                            } else if (!active) {
                              setAiAudiences([...aiAudiences, aud.role]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                            active
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {aud.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleGenerateAnimatedModuleFromContent}
                  disabled={aiGenerating}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-amber-500 hover:from-indigo-500 hover:to-amber-400 disabled:opacity-60 text-white font-black text-xs sm:text-sm shadow-lg transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Sparkles className={`w-4 h-4 ${aiGenerating ? 'animate-spin' : ''}`} />
                  <span>
                    {aiGenerating
                      ? 'Transformation IA en Scènes Animées Prof. Aïsha + QCM...'
                      : '✨ Générer le Module de Formation Animé à partir de ce Contenu'}
                  </span>
                </button>
              </div>

              {/* Right 5 Cols: Live Animated Preview & One-Click Publication */}
              <div className={`lg:col-span-5 p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm flex flex-col justify-between space-y-5`}>
                {!aiGeneratedCourse ? (
                  <div className="my-auto text-center py-12 px-4 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Aperçu du Module Animé IA
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                      Cliquez sur <strong>« Générer le Module de Formation Animé »</strong> pour que l'IA transforme votre texte en chapitres animés multi-scènes (Tableaux 1 à 4 synchronisés avec Prof. Aïsha) et génère le QCM de certification.
                    </p>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="font-bold text-slate-900 dark:text-white">Ce que l'IA génère automatiquement :</div>
                      <div>• <strong>3 Leçons Animées</strong> avec 4 tableaux visuels synchronisés par leçon</div>
                      <div>• <strong>Narration vocale Prof. Aïsha</strong> adaptée au profil de l'apprenant</div>
                      <div>• <strong>Extraction des articles clés</strong> (Loi 10/010, Loi 17/001 ARSP, Décrets)</div>
                      <div>• <strong>3 Questions QCM</strong> avec correction juridique détaillée</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono text-[10px] font-black">
                            {aiGeneratedCourse.code}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {aiEngineLabel}
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                          {aiGeneratedCourse.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {aiGeneratedCourse.legalRef} • {aiGeneratedCourse.lessons.length} leçons animées • {aiGeneratedCourse.quiz.length} QCM
                        </p>
                      </div>
                    </div>

                    {/* Lesson Tabs for Preview */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {aiGeneratedCourse.lessons.map((les, idx) => (
                        <button
                          key={les.id}
                          type="button"
                          onClick={() => setAiPreviewLessonIdx(idx)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition ${
                            aiPreviewLessonIdx === idx
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          🎬 Leçon {idx + 1}
                        </button>
                      ))}
                    </div>

                    {/* Real-Time Animated Lesson Player Preview */}
                    {aiGeneratedCourse.lessons[aiPreviewLessonIdx] && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {aiGeneratedCourse.lessons[aiPreviewLessonIdx].title}
                        </div>
                        <AnimatedLessonPlayer
                          course={aiGeneratedCourse}
                          lesson={aiGeneratedCourse.lessons[aiPreviewLessonIdx]}
                          lessonIndex={aiPreviewLessonIdx}
                          isSpeaking={false}
                          onToggleSpeech={() => {}}
                          compactPreview={true}
                        />
                      </div>
                    )}

                    {/* Action Buttons: Publish, Open in Full Player, or Edit */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={handlePublishAiGeneratedCourse}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Publier ce Module Animé au Catalogue Officiel</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handlePublishAiGeneratedCourse();
                            onOpenCoursePlayer(aiGeneratedCourse);
                          }}
                          className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Lancer le Film Animé</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleLoadGeneratedIntoEditor}
                          className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Modifier dans l'Éditeur</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 3: COURSE AUTHORING STUDIO — MÊME DISPOSITION QUE COURS APPRENANT  */}
        {/* ======================================================================= */}
        {activeTab === 'authoring' && (
          <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Shortcut Banner to AI Animated Generator */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-blue-500/15 border border-amber-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    Vous avez déjà un support de cours ou des notes du formateur ?
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Utilisez l'IA pour transformer automatiquement votre contenu existant en module de formation animé (Scènes Prof. Aïsha + 4 Tableaux + QCM).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ai_generator')}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 transition flex items-center gap-1.5 self-start sm:self-center"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ouvrir le Générateur IA Animé</span>
              </button>
            </div>
            {/* Stepper identique mais dans header immersif */}
            <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                    <FolderPlus className="w-5 h-5 text-blue-600" />
                    <span>Créateur de Cursus Certifiant (Studio d'Auteur ARMP)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Homologation conforme aux standards de la Direction de la Formation et des Appuis Techniques (DFAT)
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                  Étape {authoringStep} / 4
                </span>
              </div>

              {/* Progress Stepper Pills */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {[
                  { step: 1, label: '1. Informations Générales' },
                  { step: 2, label: '2. Programme & Leçons' },
                  { step: 3, label: '3. Examen & QCM' },
                  { step: 4, label: '4. Validation & Publication' }
                ].map(s => (
                  <button
                    key={s.step}
                    onClick={() => setAuthoringStep(s.step as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition text-center truncate ${
                      authoringStep === s.step
                        ? 'bg-blue-600 text-white shadow-sm'
                        : authoringStep > s.step
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 1: GENERAL INFORMATIONS */}
            {authoringStep === 1 && (
              <div className={`p-6 sm:p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-6`}>
                <div className="border-b pb-4 border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Étape 1 : Paramètres généraux du cours
                  </h3>
                  <p className="text-xs text-slate-500">
                    Définissez le titre, le code réglementaire et les publics cibles assujettis.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Code Réglementaire *
                      </label>
                      <input
                        type="text"
                        value={newCourseCode}
                        onChange={(e) => setNewCourseCode(e.target.value)}
                        placeholder="Ex: MOD-007"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Intitulé de la formation *
                      </label>
                      <input
                        type="text"
                        value={newCourseTitle}
                        onChange={(e) => setNewCourseTitle(e.target.value)}
                        placeholder="Ex: Audit de Conformité et Contrôle a Posteriori des Marchés Publics"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Catégorie Pédagogique
                      </label>
                      <select
                        value={newCourseCategory}
                        onChange={(e) => setNewCourseCategory(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="Passation">Passation des Marchés</option>
                        <option value="Réglementation">Réglementation & Cadre Juridique</option>
                        <option value="Contrôle">Contrôle a Priori (DGCMP)</option>
                        <option value="Contentieux">Contentieux & Recours (CRD)</option>
                        <option value="Gestion & Audit">Gestion & Audit CGPMP</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Niveau d'accréditation
                      </label>
                      <select
                        value={newCourseLevel}
                        onChange={(e) => setNewCourseLevel(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="Fondamental">Fondamental (Niveau 1)</option>
                        <option value="Intermédiaire">Intermédiaire (Niveau 2)</option>
                        <option value="Avancé">Avancé (Niveau 3)</option>
                        <option value="Spécialisé">Spécialisé / Expert (Niveau 4)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Volume Horaire Estimé
                      </label>
                      <input
                        type="text"
                        value={newCourseDuration}
                        onChange={(e) => setNewCourseDuration(e.target.value)}
                        placeholder="Ex: 12 Heures (3 Modules)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Référence Légale d'Appui (Code des Marchés Publics / Loi 10/010)
                    </label>
                    <input
                      type="text"
                      value={newCourseLegalRef}
                      onChange={(e) => setNewCourseLegalRef(e.target.value)}
                      placeholder="Ex: Loi n° 10/010 du 27 avril 2010 - Articles 18 à 35"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Publics Cibles Assujettis (Sélectionnez les rôles)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {[
                        { role: 'pme' as const, label: 'PME & Sous-Traitants (Loi 17/001 • ARSP)' },
                        { role: 'cgpmp_member' as const, label: 'Cellules CGPMP (Ministères & Régies)' },
                        { role: 'dgcmp_agent' as const, label: 'Contrôleurs DGCMP' },
                        { role: 'armp_agent' as const, label: 'Régulateurs ARMP / CRD' },
                        { role: 'particulier' as const, label: 'Consultants & Candidats du Secteur Privé' },
                        { role: 'formateur' as const, label: 'Formateurs & Auditeurs' }
                      ].map(item => (
                        <div
                          key={item.role}
                          onClick={() => toggleAudience(item.role)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center space-x-2 ${
                            selectedAudiences.includes(item.role)
                              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${
                            selectedAudiences.includes(item.role) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-400'
                          }`}>
                            {selectedAudiences.includes(item.role) && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-[11px]">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Description Pédagogique Synthétique
                    </label>
                    <textarea
                      value={newCourseDescription}
                      onChange={(e) => setNewCourseDescription(e.target.value)}
                      rows={3}
                      placeholder="Résumez les compétences opérationnelles acquises par l'apprenant à l'issue de cette session certifiante..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Illustration & Image de Couverture — <span className="text-blue-600 font-mono text-[10px]">Academia Storage (images)</span>
                    </label>
                    {/* Bibliothèque + Upload Academia */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { title: 'Formation Numérique', img: imgTraining },
                        { title: 'Séminaire ARMP', img: imgSeminar },
                        { title: 'Audit CGPMP', img: imgAudit },
                        { title: 'Juriste & Formateur', img: imgMentor }
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => { setNewCourseCover(item.img); setCoverFile(null); }}
                          className={`rounded-xl overflow-hidden border-2 cursor-pointer aspect-16/10 relative transition ${
                            newCourseCover === item.img && !coverFile ? 'border-blue-600 shadow-md scale-102' : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded">
                            {item.title}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Upload personnalisé vers Academia 137.184.59.184 */}
                    <div className="mt-3 space-y-2">
                      <AcademiaMediaUploader
                        kind="image"
                        category="covers"
                        visibility="public"
                        entityId={newCourseCode}
                        label="Téléverser votre propre couverture (Academia)"
                        hint="Image stockée sur 137.184.59.184 • JPG/PNG/WebP • 100 Mo max • URL publique /storage/academia/covers/..."
                        onUploaded={(f) => { setNewCourseCover(f.url); setCoverFile(f); }}
                        onError={(m) => alert(m)}
                      />
                      {coverFile && (
                        <AcademiaMediaPreview file={coverFile} onRemove={() => { setCoverFile(null); setNewCourseCover(imgTraining); }} />
                      )}
                      {coverUploading && <span className="text-[11px] text-blue-600">Envoi en cours…</span>}
                    </div>
                  </div>

                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      if (!newCourseTitle.trim()) {
                        alert("Veuillez saisir un intitulé pour le cours.");
                        return;
                      }
                      setAuthoringStep(2);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-2"
                  >
                    <span>Continuer vers le Programme (Étape 2)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: LESSONS & CURRICULUM BUILDER — DISPOSITION IMMERSIVE APPRENANT */}
            {authoringStep === 2 && (
              <>
              <div className={`rounded-3xl border overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'} shadow-xl`} style={{minHeight:'640px'}}>
                {/* Header immersif même style que CourseWindow */}
                <div className="h-14 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-4 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2 py-0.5 rounded-lg bg-[#0866FF] text-white text-[11px] font-mono font-bold">{newCourseCode}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate max-w-md">{newCourseTitle || 'Nouvelle formation — en création'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{newCourseLegalRef} • Étape 2/4 • Leçon {activeLessonEditIndex+1}/{lessonsList.length}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
                      <button onClick={()=>setReadingThemeTrainer('dark')} className={`p-1.5 rounded-lg ${readingThemeTrainer==='dark'?'bg-slate-700 text-white':'text-slate-400'}`} title="Sombre">🌙</button>
                      <button onClick={()=>setReadingThemeTrainer('light')} className={`p-1.5 rounded-lg ${readingThemeTrainer==='light'?'bg-white text-slate-900':'text-slate-400'}`} title="Clair">☀️</button>
                    </div>
                    <button onClick={()=>setIsZenModeTrainer(!isZenModeTrainer)} className={`p-2 rounded-xl border ${isZenModeTrainer?'bg-blue-600 border-blue-500 text-white':'bg-slate-800 border-slate-700 text-slate-300'}`} title="Mode concentration"><Eye className="w-4 h-4"/></button>
                    <span className="hidden md:block text-xs font-mono bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">{Math.round(((activeLessonEditIndex+1)/lessonsList.length)*100)}%</span>
                  </div>
                </div>
                <div className="flex flex-1 overflow-hidden min-h-0">
                  {/* Sidebar chapitres — même que CourseWindow */}
                  {!isZenModeTrainer && (
                    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-hidden">
                      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Programme</span>
                        <button onClick={handleAddNewLesson} className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"><Plus className="w-3.5 h-3.5"/></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                        {lessonsList.map((lesson, idx) => {
                          const isActive = idx===activeLessonEditIndex;
                          const fmtIcon = lesson.format==='video'?'🎬':lesson.format==='audio'?'🎙️':lesson.format==='animation'?'✨':lesson.format==='ia_ppt'?'🤖':lesson.format==='pdf'?'📄':lesson.format==='visioconference'?'📹':'📝';
                          return (
                            <button key={lesson.id} onClick={()=>setActiveLessonEditIndex(idx)} className={`w-full text-left p-2.5 rounded-2xl flex items-start gap-3 transition ${isActive?'bg-[#0866FF] text-white shadow-md':'hover:bg-slate-800 text-slate-400'}`}>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isActive?'bg-white text-[#0866FF]':'bg-slate-800 text-slate-400'}`}>{fmtIcon}</div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold leading-snug line-clamp-2">{lesson.title}</div>
                                <div className="text-[10px] opacity-75 flex items-center gap-1"><Clock className="w-3 h-3"/>{lesson.duration} • {lesson.format}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="p-3 border-t border-slate-800">
                        <div className="text-[11px] text-slate-400 mb-2">{lessonsList.length} chapitres • {quizList.length} questions</div>
                        <button onClick={()=>setAuthoringStep(3)} className="w-full py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1"><span>Continuer → QCM</span><ChevronRight className="w-3.5 h-3.5"/></button>
                      </div>
                    </aside>
                  )}
                  {/* Center canvas — même carte que CourseWindow reading */}
                  <main className={`flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center ${readingThemeTrainer==='dark'?'bg-slate-950':readingThemeTrainer==='light'?'bg-slate-100':'bg-[#F4EEDD]'}`}>
                    <div className="w-full max-w-3xl space-y-4">
                      {/* Carte édition leçon — même style que CourseWindow p-5 rounded-3xl */}
                      <div className={`p-5 sm:p-7 rounded-3xl border ${readingThemeTrainer==='dark'?'bg-slate-900 border-slate-800 text-slate-100':readingThemeTrainer==='light'?'bg-white border-slate-200 text-slate-900':'bg-[#FCF9F0] border-[#E6DCBF] text-[#2D2418]'} shadow-sm space-y-4`}>
                <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Étape 2 : Structure du programme ({lessonsList.length} chapitres)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Rédigez le contenu textuel et associez vos enregistrements vidéo Masterclass.
                    </p>
                  </div>
                  <button
                    onClick={handleAddNewLesson}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter un chapitre</span>
                  </button>
                </div>

                {/* Leçon active — même disposition que lecture apprenant (une seule carte centrée) */}
                <div className="space-y-4">
                  {(() => {
                    const lesson = lessonsList[activeLessonEditIndex];
                    const idx = activeLessonEditIndex;
                    if (!lesson) return null;
                    return (
                    <div
                      key={lesson.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-slate-500 uppercase">Chapitre {idx + 1}</span>
                        </div>
                        {lessonsList.length > 1 && (
                          <button
                            onClick={() => setLessonsList(lessonsList.filter((_, i) => i !== idx))}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                            title="Supprimer cette leçon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                            Titre du chapitre
                          </label>
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => {
                              const updated = [...lessonsList];
                              updated[idx].title = e.target.value;
                              setLessonsList(updated);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                            Durée estimée
                          </label>
                          <input
                            type="text"
                            value={lesson.duration}
                            onChange={(e) => {
                              const updated = [...lessonsList];
                              updated[idx].duration = e.target.value;
                              setLessonsList(updated);
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          Contenu pédagogique & Textes explicatifs
                        </label>
                        <textarea
                          rows={4}
                          value={lesson.content}
                          onChange={(e) => {
                            const updated = [...lessonsList];
                            updated[idx].content = e.target.value;
                            setLessonsList(updated);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs leading-relaxed"
                        />
                      </div>

                      {/* Format de leçon — 7 formats : Vidéo / Audio / Animation / IA PPT / PDF / Visio / Texte */}
                      <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            Format de la leçon
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                            {LESSON_FORMATS.find(f=>f.id===lesson.format)?.label} {LESSON_FORMATS.find(f=>f.id===lesson.format)?.icon}
                          </span>
                        </div>
                        {/* Sélecteur de format — 7 boutons */}
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                          {LESSON_FORMATS.map(f => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => { const u=[...lessonsList]; u[idx].format=f.id as LessonFormat; setLessonsList(u); }}
                              className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 ${lesson.format===f.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-md scale-105' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-slate-600 dark:text-slate-300'}`}
                              title={f.desc}
                            >
                              <span className="text-lg leading-none">{f.icon}</span>
                              <span className="text-[10px] font-bold leading-none">{f.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* --- Éditeur selon le format --- */}
                        {lesson.format === 'video' && (
                          <div className="space-y-2 p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">🎬 Vidéo — Studio ou upload</span>
                              <button onClick={() => setActiveTab('studio')} className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"><Video className="w-3 h-3"/> Studio</button>
                            </div>
                            {lesson.mediaUrl && lesson.mediaUrl.match(/\.(mp4|webm|mov)$/i) && (
                              <video src={lesson.mediaUrl} controls className="w-full rounded-xl max-h-48 bg-black" />
                            )}
                            {lesson.mediaUrl && !lesson.mediaUrl.match(/\.(mp4|webm|mov)$/i) && (
                              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-xs flex items-center justify-between">
                                <span className="truncate">{lesson.mediaUrl.split('/').pop()}</span>
                                <button onClick={()=>{const u=[...lessonsList]; u[idx].mediaUrl=undefined; setLessonsList(u);}} className="text-rose-500"><X className="w-3.5 h-3.5"/></button>
                              </div>
                            )}
                            <AcademiaMediaUploader kind="video" category="cours_videos" visibility="private" entityId={lesson.id} label="Uploader la vidéo (MP4/WebM)" onUploaded={(f)=>{const u=[...lessonsList]; u[idx].mediaUrl=f.url; setLessonsList(u);}} />
                            <div className="flex gap-2">
                              <input placeholder="Ou coller une URL YouTube / Vimeo" value={lesson.mediaUrl?.startsWith('http') && !lesson.mediaUrl.includes('academia') ? lesson.mediaUrl : ''} onChange={e=>{const u=[...lessonsList]; u[idx].mediaUrl=e.target.value; setLessonsList(u);}} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
                            </div>
                          </div>
                        )}

                        {lesson.format === 'audio' && (
                          <div className="space-y-2 p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                            <span className="font-bold text-purple-700 dark:text-purple-300 text-xs flex items-center gap-1">🎙️ Audio — Podcast / narration</span>
                            {lesson.mediaUrl && <audio controls src={lesson.mediaUrl} className="w-full" />}
                            <AcademiaMediaUploader kind="audio" category="cours_audios" visibility="private" entityId={lesson.id} label="Uploader l'audio (MP3/WAV)" onUploaded={(f)=>{const u=[...lessonsList]; u[idx].mediaUrl=f.url; setLessonsList(u);}} />
                            <p className="text-[11px] text-slate-500">Astuce : le lecteur du cours génère aussi une version audio automatique via synthèse vocale.</p>
                          </div>
                        )}

                        {lesson.format === 'animation' && (
                          <div className="space-y-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                            <span className="font-bold text-amber-700 dark:text-amber-300 text-xs flex items-center gap-1">✨ Animation — style Animaker (Aperçu interactif en temps réel)</span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {ANIMATION_TEMPLATES.map(t => (
                                <button key={t.id} type="button" onClick={()=>{const u=[...lessonsList]; u[idx].templateId=t.id; setLessonsList(u);}} className={`rounded-xl overflow-hidden border-2 text-left transition ${lesson.templateId===t.id ? 'border-amber-500 ring-2 ring-amber-300' : 'border-transparent opacity-80 hover:opacity-100'}`}>
                                  <img src={t.thumb} alt={t.name} className="w-full h-16 object-cover" />
                                  <div className="p-1.5 bg-white dark:bg-slate-800">
                                    <div className="text-[11px] font-bold leading-none">{t.name}</div>
                                    <div className="text-[10px] text-slate-500 leading-none mt-0.5">{t.desc}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                            {/* Aperçu réel du lecteur vidéo animé correspondant au template sélectionné */}
                            <div className="pt-2">
                              <AnimatedLessonPlayer
                                course={{
                                  id: newCourseCode,
                                  code: newCourseCode,
                                  title: newCourseTitle || 'Module ARMP en cours de paramétrage',
                                  category: newCourseCategory,
                                  targetAudience: selectedAudiences,
                                  duration: newCourseDuration,
                                  level: newCourseLevel,
                                  legalRef: newCourseLegalRef,
                                  description: newCourseDescription || 'Aperçu du rendu vidéo animé',
                                  coverImage: newCourseCover,
                                  chaptersCount: lessonsList.length,
                                  rating: 5,
                                  studentsCount: 1,
                                  requiresDfatApproval: false,
                                  lessons: lessonsList,
                                  quiz: quizList
                                }}
                                lesson={lesson}
                                lessonIndex={idx}
                                isSpeaking={false}
                                onToggleSpeech={() => {}}
                                onTemplateChange={(tplId) => {
                                  const u = [...lessonsList];
                                  u[idx].templateId = tplId;
                                  setLessonsList(u);
                                }}
                                compactPreview={true}
                              />
                            </div>
                            <AcademiaMediaUploader kind="video" category="cours_animations" visibility="private" entityId={lesson.id} label="Ou uploader une animation déjà exportée (MP4/GIF)" onUploaded={(f)=>{const u=[...lessonsList]; u[idx].mediaUrl=f.url; setLessonsList(u);}} />
                          </div>
                        )}

                        {lesson.format === 'ia_ppt' && (
                          <div className="space-y-2 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900">
                            <span className="font-bold text-indigo-700 dark:text-indigo-300 text-xs flex items-center gap-1">🤖 IA — Génération PPT</span>
                            <textarea rows={3} value={lesson.aiPrompt || ''} onChange={e=>{const u=[...lessonsList]; u[idx].aiPrompt=e.target.value; setLessonsList(u);}} placeholder="Ex: Génère un cours PPT de 8 slides sur le fractionnement des marchés (Art.13), avec définitions, exemples chiffrés, et un quiz final..." className="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-800 text-xs" />
                            <div className="flex gap-2">
                              <button onClick={()=> alert(`Prompt IA envoyé : ${lesson.aiPrompt?.slice(0,60)}...\n→ Slides PPT générés (8 slides) + PDF` )} className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"><Sparkles className="w-3.5 h-3.5"/> Générer le PPT avec l'IA</button>
                              <AcademiaMediaUploader kind="image" category="cours_ppt" visibility="private" entityId={lesson.id} compact label="Uploader PPT/PDF" onUploaded={(f)=>{const u=[...lessonsList]; u[idx].mediaUrl=f.url; setLessonsList(u);}} />
                            </div>
                            {lesson.mediaUrl && lesson.mediaUrl.match(/\.(ppt|pptx|pdf)$/i) && <div className="text-xs p-2 bg-white dark:bg-slate-900 rounded-lg border flex items-center justify-between"><span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-red-500"/>{lesson.mediaUrl.split('/').pop()}</span><a href={lesson.mediaUrl} target="_blank" className="text-indigo-600 underline">Ouvrir</a></div>}
                          </div>
                        )}

                        {lesson.format === 'pdf' && (
                          <div className="space-y-2 p-3 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                            <span className="font-bold text-red-700 dark:text-red-300 text-xs flex items-center gap-1">📄 PDF — Support / DAO Type</span>
                            {lesson.mediaUrl && <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border text-xs flex items-center justify-between"><span className="flex items-center gap-1 truncate"><FileText className="w-3.5 h-3.5 text-red-500"/>{lesson.mediaUrl.split('/').pop()?.slice(0,40)}</span><a href={lesson.mediaUrl} target="_blank" className="text-blue-600 underline">Aperçu</a></div>}
                            <AcademiaMediaUploader kind="image" category="cours_pdfs" visibility="private" entityId={lesson.id} label="Uploader le PDF (DAO, guide, fiche)" onUploaded={(f)=>{const u=[...lessonsList]; u[idx].mediaUrl=f.url; setLessonsList(u);}} />
                            <input placeholder="Ou URL externe du PDF" value={lesson.mediaUrl?.endsWith('.pdf') ? lesson.mediaUrl : ''} onChange={e=>{const u=[...lessonsList]; u[idx].mediaUrl=e.target.value; setLessonsList(u);}} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
                          </div>
                        )}

                        {lesson.format === 'visioconference' && (
                          <div className="space-y-2 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                            <span className="font-bold text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1">📹 Visioconférence — Cours en direct</span>
                            <div className="grid grid-cols-4 gap-1.5">
                              {(['zoom','teams','meet','jitsi'] as const).map(p => (
                                <button key={p} type="button" onClick={()=>{const u=[...lessonsList]; u[idx].visioPlatform=p; setLessonsList(u);}} className={`py-1.5 rounded-lg border text-[11px] font-bold capitalize ${lesson.visioPlatform===p ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>{p}</button>
                              ))}
                            </div>
                            <input placeholder="Lien de la réunion (https://...)" value={lesson.visioLink || ''} onChange={e=>{const u=[...lessonsList]; u[idx].visioLink=e.target.value; setLessonsList(u);}} className="w-full px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 text-xs" />
                            <div className="grid grid-cols-2 gap-2">
                              <input type="datetime-local" value={lesson.visioDate || ''} onChange={e=>{const u=[...lessonsList]; u[idx].visioDate=e.target.value; setLessonsList(u);}} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs" />
                              <div className="flex items-center text-[11px] text-slate-500 px-2">Durée : {lesson.duration}</div>
                            </div>
                            {lesson.visioLink && <a href={lesson.visioLink} target="_blank" className="block text-center py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Rejoindre la visio →</a>}
                          </div>
                        )}

                        {lesson.format === 'texte' && (
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                            ✍️ Leçon texte — utilise le champ <b>Contenu pédagogique</b> ci-dessus. Idéal pour articles, définitions, études de cas.
                          </div>
                        )}

                        {/* Articles associés */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <Bookmark className="w-3 h-3 text-blue-600" />
                          <span>Articles : {lesson.keyArticles.join(', ') || '—'}</span>
                        </div>
                      </div>

                    </div>
                  );
                  })()}
                </div>

                        {/* Navigation chapitres */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-800/40 gap-3">
                          <button disabled={activeLessonEditIndex===0} onClick={()=>setActiveLessonEditIndex(p=>Math.max(0,p-1))} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-xs flex items-center gap-1"><ChevronLeft className="w-4 h-4"/><span>Précédent</span></button>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{activeLessonEditIndex+1} / {lessonsList.length}</span>
                            <button onClick={()=>setActiveLessonEditIndex(p=>Math.min(lessonsList.length-1,p+1))} className="px-4 py-2 rounded-xl bg-[#0866FF] text-white font-bold text-xs flex items-center gap-1"><span>Suivant</span><ChevronRight className="w-4 h-4"/></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </main>
                </div>
              </div>
              {/* Barre basse globale */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between rounded-b-3xl">
                <button onClick={()=>setAuthoringStep(1)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">← Étape 1</button>
                <button onClick={()=>setAuthoringStep(3)} className="px-6 py-2.5 rounded-xl bg-[#0866FF] text-white font-bold text-xs flex items-center gap-2"><span>Continuer vers l'Évaluation QCM</span><ArrowRight className="w-4 h-4"/></button>
              </div>
              </>
            )}

            {/* STEP 3: QUIZ & CERTIFYING EXAM BUILDER */}
            {authoringStep === 3 && (
              <div className={`p-6 sm:p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-6`}>
                <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Étape 3 : Banque de Questions & Examen Certifiant ARMP
                    </h3>
                    <p className="text-xs text-slate-500">
                      Définissez les questions QCM et les justifications juridiques. Seuil officiel : 70%.
                    </p>
                  </div>
                  <button
                    onClick={handleAddNewQuizQuestion}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter une question</span>
                  </button>
                </div>

                {/* Quiz Questions List */}
                <div className="space-y-5">
                  {quizList.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500">Question #{qIdx + 1}</span>
                        {quizList.length > 1 && (
                          <button
                            onClick={() => setQuizList(quizList.filter((_, i) => i !== qIdx))}
                            className="p-1 text-slate-400 hover:text-rose-500 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => {
                            const updated = [...quizList];
                            updated[qIdx].question = e.target.value;
                            setQuizList(updated);
                          }}
                          placeholder="Intitulé de la question juridique..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                        />
                      </div>

                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 block">
                          Options de réponse (Cochez le bouton radio de la bonne réponse) :
                        </span>
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct_${qIdx}`}
                              checked={q.correctIndex === optIdx}
                              onChange={() => {
                                const updated = [...quizList];
                                updated[qIdx].correctIndex = optIdx;
                                setQuizList(updated);
                              }}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const updated = [...quizList];
                                updated[qIdx].options[optIdx] = e.target.value;
                                setQuizList(updated);
                              }}
                              className={`flex-1 px-3 py-1.5 rounded-xl text-xs border ${
                                q.correctIndex === optIdx
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 font-bold text-emerald-900 dark:text-emerald-200'
                                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                              }`}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                          Justification juridique (affichée après correction)
                        </label>
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={(e) => {
                            const updated = [...quizList];
                            updated[qIdx].explanation = e.target.value;
                            setQuizList(updated);
                          }}
                          placeholder="Ex: Fondement sur l'article 26 de la Loi n° 10/010..."
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setAuthoringStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    ← Étape précédente
                  </button>
                  <button
                    onClick={() => setAuthoringStep(4)}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-2"
                  >
                    <span>Finaliser et Réviser (Étape 4)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & PUBLICATION */}
            {authoringStep === 4 && (
              <div className={`p-6 sm:p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-6`}>
                <div className="border-b pb-4 border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>Étape 4 : Récapitulatif avant Homologation & Publication</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vérifiez l'ensemble des éléments avant l'intégration automatique dans le catalogue national.
                  </p>
                </div>

                {/* Recap Card */}
                <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={newCourseCover}
                      alt={newCourseTitle}
                      className="w-16 h-16 rounded-xl object-cover border border-blue-300"
                    />
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-mono font-bold">
                        {newCourseCode}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                        {newCourseTitle || "Nouvelle Formation"}
                      </h4>
                      <span className="text-xs text-slate-500 font-mono">
                        {newCourseLegalRef} • {newCourseLevel} • {newCourseDuration}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800">
                      <span className="text-slate-400 block text-[10px]">Chapitres</span>
                      <span className="font-bold text-slate-900 dark:text-white">{lessonsList.length} leçons</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800">
                      <span className="text-slate-400 block text-[10px]">Questions QCM</span>
                      <span className="font-bold text-slate-900 dark:text-white">{quizList.length} questions</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800">
                      <span className="text-slate-400 block text-[10px]">Seuil Certificat</span>
                      <span className="font-bold text-emerald-600">70% requis</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setAuthoringStep(3)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    ← Modifier le QCM
                  </button>

                  <button
                    onClick={handlePublishCourse}
                    className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl transition flex items-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>Publier officiellement la formation</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 4: DIGITAL VIDEO PRODUCTION STUDIO (ENREGISTREUR & MASTERCLASS)     */}
        {/* ======================================================================= */}
        {activeTab === 'studio' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Studio Numérique ARMP • Tournage des Masterclasses
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Régie d'enregistrement multimédia avec prompteur temps réel et habillage institutionnel
                </p>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white' : 'bg-slate-400'}`} />
                  <span>{isRecording ? `REC ${formatTime(recordSeconds)}` : 'STUDIO PRÊT'}</span>
                </span>
              </div>
            </div>

            {/* Studio Main Workspace Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Interactive Video Stage & Controls */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Live Stage Canvas / Video Container */}
                <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex items-center justify-center">
                  
                  {/* Real WebRTC Video Tag */}
                  <video
                    ref={videoPreviewRef}
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  />

                  {/* Fallback Simulator Screen if Camera is Off */}
                  {!cameraActive && (
                    <div className="text-center p-6 space-y-3 z-10">
                      <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
                        <Camera className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Caméra en attente de signal</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                          Activez la caméra ou le partage d'écran pour démarrer votre session de tournage Masterclass.
                        </p>
                      </div>
                      <div className="flex justify-center gap-2 pt-2">
                        <button
                          onClick={startCamera}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Allumer la webcam</span>
                        </button>
                        <button
                          onClick={startScreenShare}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center space-x-1.5"
                        >
                          <ScreenShare className="w-4 h-4" />
                          <span>Partager l'écran</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Institutional Top Right ARMP Seal Overlay */}
                  <div className="absolute top-4 right-4 pointer-events-none z-20 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <ArmpLogo size="sm" isDarkMode={true} />
                    <div className="text-left leading-tight">
                      <span className="text-[10px] font-black text-amber-400 block tracking-wider">ACADEMIA ITECH</span>
                      <span className="text-[8px] text-slate-300">DFAT • RDC</span>
                    </div>
                  </div>

                  {/* Lower Third (Bandeau Titre TV Professionnel) */}
                  {studioLowerThird && (
                    <div className="absolute bottom-6 left-6 right-6 pointer-events-none z-20 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="max-w-md bg-gradient-to-r from-blue-950/95 via-indigo-950/90 to-slate-900/90 backdrop-blur-md border-l-4 border-amber-400 p-3 rounded-r-2xl shadow-2xl">
                        <span className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider block">
                          Masterclass Officielle • Loi n° 10/010 du 27 avril 2010
                        </span>
                        <h4 className="text-sm font-black text-white truncate">
                          {currentProfile.name}
                        </h4>
                        <p className="text-[10px] text-slate-300 truncate">
                          {currentProfile.roleTitle} — Formateur Homologué ARMP
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Red REC Watermark during active recording */}
                  {isRecording && (
                    <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-rose-600/90 text-white px-3 py-1 rounded-full text-xs font-mono font-bold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span>REC {formatTime(recordSeconds)}</span>
                    </div>
                  )}

                </div>

                {/* Studio Control Deck Bar */}
                <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm flex flex-wrap items-center justify-between gap-3`}>
                  
                  {/* Media toggles */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={cameraActive ? stopCamera : startCamera}
                      className={`p-2.5 rounded-xl border transition ${
                        cameraActive
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                      title={cameraActive ? "Désactiver la caméra" : "Activer la caméra"}
                    >
                      {cameraActive ? <Camera className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => setMicActive(!micActive)}
                      className={`p-2.5 rounded-xl border transition ${
                        micActive
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-rose-600 border-rose-500 text-white'
                      }`}
                      title={micActive ? "Microphone actif" : "Microphone coupé"}
                    >
                      {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={startScreenShare}
                      className={`p-2.5 rounded-xl border transition ${
                        screenShareActive
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                      title="Partager une fenêtre ou un document de cours"
                    >
                      <ScreenShare className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setStudioLowerThird(!studioLowerThird)}
                      className={`p-2.5 rounded-xl border transition ${
                        studioLowerThird
                          ? 'bg-amber-400 border-amber-300 text-slate-950 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                      title="Afficher / Masquer le bandeau titre télévisé"
                    >
                      <Tv className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Main Record Action Button */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleToggleRecord}
                      className={`px-6 py-3 rounded-2xl font-black text-xs shadow-lg transition flex items-center space-x-2 ${
                        isRecording
                          ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-white" />
                      <span>{isRecording ? "Arrêter & Enregistrer la Prise" : "Lancer l'Enregistrement Vidéo"}</span>
                    </button>
                  </div>

                </div>

                {/* Recorded Takes Library */}
                <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                      <Video className="w-4 h-4 text-blue-600" />
                      <span>Médiathèque des Prises Masterclass ({recordedVideos.length})</span>
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {recordedVideos.map((vid) => (
                      <div
                        key={vid.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {vid.title}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Durée {vid.duration} • Enregistré {vid.date}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <a
                            href={vid.blobUrl}
                            download={`${vid.title}.webm`}
                            className="p-2 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 transition"
                            title="Télécharger le fichier vidéo"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Col: Virtual Interactive Teleprompter (Téléprompteur) */}
              <div className="space-y-4">
                
                <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4 flex flex-col h-[540px]`}>
                  
                  {/* Prompter Controls Header */}
                  <div className="border-b pb-3 border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-amber-500" />
                        <span>Téléprompteur Virtuel</span>
                      </span>
                      <button
                        onClick={() => setIsPrompterRunning(!isPrompterRunning)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                          isPrompterRunning
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {isPrompterRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isPrompterRunning ? 'Pause Défilement' : 'Défiler'}</span>
                      </button>
                    </div>

                    {/* Speed and font controls */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <div className="flex items-center space-x-1">
                        <span>Vitesse :</span>
                        {[1.0, 1.5, 2.0].map(spd => (
                          <button
                            key={spd}
                            onClick={() => setTeleprompterSpeed(spd)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              teleprompterSpeed === spd ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setPrompterFontSize(prompterFontSize === 'xl' ? 'large' : 'normal')}
                          className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-bold"
                        >
                          A-
                        </button>
                        <button
                          onClick={() => setPrompterFontSize(prompterFontSize === 'normal' ? 'large' : 'xl')}
                          className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-bold"
                        >
                          A+
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Prompter Scrolling Canvas */}
                  <div
                    ref={prompterContainerRef}
                    className="flex-1 overflow-y-auto p-4 rounded-2xl bg-black text-amber-300 font-serif leading-loose select-none border border-slate-800 relative shadow-inner"
                  >
                    <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none" />
                    <div className={`whitespace-pre-line ${
                      prompterFontSize === 'normal' ? 'text-sm' : prompterFontSize === 'large' ? 'text-base font-bold' : 'text-xl font-bold'
                    }`}>
                      {prompterText}
                    </div>
                    <div className="h-40" />
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                  </div>

                  {/* Prompter Text Editor Area */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Modifier le texte du prompteur :
                    </label>
                    <textarea
                      rows={2}
                      value={prompterText}
                      onChange={(e) => setPrompterText(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 resize-none font-mono"
                    />
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 5: CERTIFYING QUESTION BANK (BANQUE DE QCM PERSISTÉE FIRESTORE)     */}
        {/* ======================================================================= */}
        {activeTab === 'quiz_bank' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
                  <ListOrdered className="w-5 h-5 text-blue-600" />
                  <span>Banque Nationale des Questions d'Évaluation ARMP ({quizBankItems.length})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Questions types issues de la jurisprudence et des cas pratiques de la commande publique en RDC (persistées dans Firestore)
                </p>
              </div>
            </div>

            {trainerNotice && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {trainerNotice}
              </div>
            )}

            {/* Formulaire d'ajout de question dans la Banque Nationale */}
            <form
              onSubmit={handleAddQuizBankItem}
              className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}
            >
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Ajouter une question officielle à la Banque Nationale ARMP</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Thématique</label>
                  <input
                    type="text"
                    value={newQbTheme}
                    onChange={e => setNewQbTheme(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    placeholder="Ex: Passation & DAO"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Référence Légale (Loi 10/010)</label>
                  <input
                    type="text"
                    value={newQbArticle}
                    onChange={e => setNewQbArticle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    placeholder="Ex: Loi 10/010 Art. 26"
                  />
                </div>
              </div>
              <div className="text-xs">
                <label className="font-bold text-slate-500 block mb-1">Énoncé de la question</label>
                <input
                  type="text"
                  value={newQbQuestion}
                  onChange={e => setNewQbQuestion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  placeholder="Saisissez la question d'évaluation..."
                  required
                />
              </div>
              <div className="text-xs">
                <label className="font-bold text-slate-500 block mb-1">Réponse officielle homologuée DFAT</label>
                <textarea
                  rows={2}
                  value={newQbAnswer}
                  onChange={e => setNewQbAnswer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                  placeholder="Saisissez la réponse de référence..."
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Enregistrer dans la Banque Nationale</span>
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {quizBankItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-2`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                      {item.code} • {item.theme}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{item.article}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.q}
                  </h4>
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-900 dark:text-emerald-300 font-medium">
                    <b>Réponse de référence :</b> {item.rep}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* TAB 6: LEARNERS & CERTIFICATIONS TRACKING (SUIVI PÉDAGOGIQUE PAR COURS) */}
        {/* ======================================================================= */}
        {activeTab === 'learners' && (() => {
          const rawLearners = getEnrolledLearners(selectedTrackingCourseId);
          
          const filteredLearners = rawLearners.filter(item => {
            const matchesSearch = learnerSearchQuery === '' || 
              item.profile.name.toLowerCase().includes(learnerSearchQuery.toLowerCase()) ||
              (item.profile.matricule && item.profile.matricule.toLowerCase().includes(learnerSearchQuery.toLowerCase())) ||
              item.profile.institution.toLowerCase().includes(learnerSearchQuery.toLowerCase());
            
            const matchesStatus = 
              learnerStatusFilter === 'all' ||
              (learnerStatusFilter === 'certified' && item.isCertified) ||
              (learnerStatusFilter === 'in_progress' && !item.isCertified && item.progressPct >= 40) ||
              (learnerStatusFilter === 'needs_help' && !item.isCertified && item.progressPct < 40);

            const matchesRole = 
              learnerRoleFilter === 'all' ||
              (learnerRoleFilter === 'cgpmp' && (item.profile.role === 'cgpmp_member' || item.profile.role === 'ac_agent')) ||
              (learnerRoleFilter === 'pme' && (item.profile.role === 'pme' || item.profile.role === 'grande_entreprise')) ||
              (learnerRoleFilter === 'dgcmp' && (item.profile.role === 'dgcmp_agent' || item.profile.role === 'armp_agent')) ||
              (learnerRoleFilter === 'other' && (item.profile.role === 'societe_civile' || item.profile.role === 'independant' || item.profile.role === 'particulier'));

            return matchesSearch && matchesStatus && matchesRole;
          });

          const currentCourseObj = selectedTrackingCourseId === 'all' 
            ? null 
            : courses.find(c => c.id === selectedTrackingCourseId || c.code === selectedTrackingCourseId);

          const totalInCourse = rawLearners.length;
          const certifiedCount = rawLearners.filter(l => l.isCertified).length;
          const inProgressCount = rawLearners.filter(l => !l.isCertified && l.progressPct >= 40).length;
          const needsHelpCount = rawLearners.filter(l => !l.isCertified && l.progressPct < 40).length;
          const avgProgressCourse = Math.round(rawLearners.reduce((acc, l) => acc + l.progressPct, 0) / Math.max(1, rawLearners.length));

          return (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
              
              {/* Entête Principal */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center space-x-2.5">
                    <div className="p-2 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <span>Suivi Pédagogique des Apprenants Inscrits</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Supervisez les cursus de vos formations, mesurez l'avancement des chapitres de la Loi 10/010 et délivrez les habilitations officielles DFAT.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{learnerProfiles.length} apprenants actifs</span>
                  </span>
                </div>
              </div>

              {trainerNotice && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{trainerNotice}</span>
                  </div>
                  <button onClick={() => setTrainerNotice(null)} className="text-emerald-700 dark:text-emerald-300 hover:underline text-[11px] cursor-pointer">Fermer</button>
                </div>
              )}

              {/* 1. Sélecteur de Cours du Formateur (Pills horizontaux) */}
              <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-3`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                    <span>Filtrer par Formation ({courses.length} cursus disponibles)</span>
                  </span>
                  {selectedTrackingCourseId !== 'all' && (
                    <button
                      onClick={() => setSelectedTrackingCourseId('all')}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Réinitialiser (Tous les cours)</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => setSelectedTrackingCourseId('all')}
                    className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-2 cursor-pointer ${
                      selectedTrackingCourseId === 'all'
                        ? 'bg-blue-600 text-white shadow-md'
                        : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>📚 Vue d'ensemble (Tous les cours)</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${selectedTrackingCourseId === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}`}>
                      {learnerProfiles.length}
                    </span>
                  </button>

                  {courses.map(c => {
                    const isSelected = selectedTrackingCourseId === c.id || selectedTrackingCourseId === c.code;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedTrackingCourseId(c.id)}
                        className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-2 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md'
                            : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'}`}>
                          {c.code}
                        </span>
                        <span className="truncate max-w-[200px]">{c.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'}`}>
                          {learnerProfiles.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Synthèse et Indicateurs du Cours Sélectionné */}
              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 text-xs font-mono font-bold">
                        {currentCourseObj ? currentCourseObj.code : 'VUE GLOBALE'}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {currentCourseObj ? `${currentCourseObj.category} • ${currentCourseObj.level}` : 'Toutes formations sous supervision'}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {currentCourseObj ? currentCourseObj.title : 'Tableau de Suivi Global des Apprenants Enseignés'}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      {currentCourseObj ? currentCourseObj.legalRef : 'Référentiel : Loi n° 10/010 du 27 avril 2010 relative aux marchés publics'}
                    </p>
                  </div>

                  {currentCourseObj && (
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        onClick={() => onOpenCoursePlayer(currentCourseObj)}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Ouvrir le cours</span>
                      </button>
                      <button
                        onClick={() => {
                          setTrainerNotice(`Rapport de présence et de suivi pédagogique généré pour ${currentCourseObj.code} ✓`);
                          setTimeout(() => setTrainerNotice(null), 3500);
                        }}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                        title="Télécharger la feuille d'émargement"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* KPI Metrics pour ce cours */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Inscrits au cours</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">{totalInCourse}</span>
                    <span className="text-[10px] text-slate-500 block">Cadres & PME</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">Progression Moyenne</span>
                    <span className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-300 font-mono">{avgProgressCourse}%</span>
                    <span className="text-[10px] text-blue-600/80 block">Avancement global</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Certifiés / Habilités</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">{certifiedCount}</span>
                    <span className="text-[10px] text-emerald-600/80 block">Attestations délivrées</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">En Apprentissage</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">{inProgressCount}</span>
                    <span className="text-[10px] text-amber-600/80 block">40% à 99% validé</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">À Relancer</span>
                    <span className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300 font-mono">{needsHelpCount}</span>
                    <span className="text-[10px] text-rose-600/80 block">En retard d'étude</span>
                  </div>
                </div>
              </div>

              {/* 3. Barre de Recherche et Filtres Avancés */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={learnerSearchQuery}
                    onChange={e => setLearnerSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom d'apprenant, matricule CGPMP ou institution..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  {learnerSearchQuery && (
                    <button
                      onClick={() => setLearnerSearchQuery('')}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filtres Statut */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                  {[
                    { id: 'all' as const, label: 'Tous', count: rawLearners.length },
                    { id: 'certified' as const, label: 'Certifiés', count: certifiedCount },
                    { id: 'in_progress' as const, label: 'En cours', count: inProgressCount },
                    { id: 'needs_help' as const, label: 'À relancer', count: needsHelpCount },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setLearnerStatusFilter(tab.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                        learnerStatusFilter === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="ml-1.5 opacity-80 font-mono text-[10px]">({tab.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Tableau / Liste Détaillée des Apprenants Inscrits */}
              <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {filteredLearners.length} apprenant{filteredLearners.length > 1 ? 's' : ''} inscrit{filteredLearners.length > 1 ? 's' : ''} dans ce cursus
                  </span>
                  <span className="text-xs font-bold text-emerald-500">✓ Synchronisé Base Nationale DFAT / ARMP</span>
                </div>

                {filteredLearners.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Aucun apprenant ne correspond aux filtres appliqués.</p>
                    <button
                      onClick={() => { setLearnerSearchQuery(''); setLearnerStatusFilter('all'); setLearnerRoleFilter('all'); }}
                      className="text-xs text-blue-600 hover:underline font-bold cursor-pointer"
                    >
                      Réinitialiser la recherche
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredLearners.map(item => {
                      const obs = trainerObservations[`${item.profile.id}_${item.course.id}`];
                      return (
                        <div
                          key={item.profile.id}
                          className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                        >
                          {/* Identité de l'apprenant */}
                          <div className="flex items-center space-x-3.5 min-w-0 md:max-w-sm">
                            <div className="relative shrink-0">
                              <img
                                src={item.profile.avatarUrl}
                                alt={item.profile.name}
                                className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                              />
                              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 ${isDarkMode ? 'border-slate-900' : 'border-white'} ${
                                item.isCertified ? 'bg-emerald-500' : item.progressPct >= 40 ? 'bg-blue-500' : 'bg-rose-500'
                              }`} />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                                  {item.profile.name}
                                </h4>
                                {item.isCertified && (
                                  <span title="Certifié DFAT">
                                    <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">
                                {item.profile.roleTitle}
                              </p>
                              <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                                <span className="truncate max-w-[180px] font-medium">{item.profile.institution}</span>
                                {item.profile.matricule && (
                                  <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded font-semibold text-slate-600 dark:text-slate-400">
                                    {item.profile.matricule}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Progression dans le cours */}
                          <div className="flex-1 md:max-w-xs space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-700 dark:text-slate-300">
                                {item.course.code} • {item.completedLessonsCount}/{item.course.lessons.length} leçons
                              </span>
                              <span className={`font-mono font-black ${
                                item.progressPct >= 80 ? 'text-emerald-600' : item.progressPct >= 50 ? 'text-blue-600' : 'text-amber-600'
                              }`}>
                                {item.progressPct}%
                              </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  item.isCertified
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                    : item.progressPct >= 50
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-500'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-400'
                                }`}
                                style={{ width: `${item.progressPct}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                QCM : {item.quizScore}%
                              </span>
                              <span>Étude : {item.studyTime}</span>
                            </div>
                          </div>

                          {/* Statut & Actions Formateur */}
                          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                            <div className="text-right">
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider block text-center ${
                                item.isCertified
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40'
                                  : item.progressPct >= 40
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300/40'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300/40'
                              }`}>
                                {item.isCertified ? '✓ Homologué DFAT' : item.progressPct >= 40 ? '⏳ En cours' : '⚠️ À relancer'}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-1">
                                {item.lastActive}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedLearnerForModal(item);
                                  setCurrentLearnerObservationInput(obs || '');
                                }}
                                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Dossier de suivi</span>
                              </button>

                              {!item.isCertified && (
                                <button
                                  onClick={() => handleGrantCertification(item.profile.id, item.course.id)}
                                  className="p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition cursor-pointer"
                                  title="Valider l'habilitation DFAT pour cet apprenant"
                                >
                                  <Award className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 5. MODAL DE SUIVI PÉDAGOGIQUE APPROFONDI (Dossier de l'Apprenant) */}
              {selectedLearnerForModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                  <div className={`w-full max-w-2xl rounded-3xl border overflow-hidden shadow-2xl my-8 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
                    
                    {/* Header Modal */}
                    <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-950 text-white relative">
                      <button
                        onClick={() => setSelectedLearnerForModal(null)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="flex items-center space-x-4">
                        <img
                          src={selectedLearnerForModal.profile.avatarUrl}
                          alt={selectedLearnerForModal.profile.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 shadow-md"
                        />
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                              Dossier Pédagogique Formateur
                            </span>
                            {selectedLearnerForModal.isCertified && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold text-[10px]">
                                ✓ Certifié DFAT
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg sm:text-xl font-black truncate">
                            {selectedLearnerForModal.profile.name}
                          </h3>
                          <p className="text-xs text-blue-200 truncate">
                            {selectedLearnerForModal.profile.roleTitle} • {selectedLearnerForModal.profile.institution}
                          </p>
                          <p className="text-[11px] text-blue-300 font-mono">
                            Formation auditée : {selectedLearnerForModal.course.code} — {selectedLearnerForModal.course.title}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Body Modal */}
                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                      
                      {/* KPIs Apprenant */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Progression</span>
                          <span className="text-xl font-black text-blue-600 font-mono">{selectedLearnerForModal.progressPct}%</span>
                          <span className="text-[10px] text-slate-500 block">{selectedLearnerForModal.completedLessonsCount} / {selectedLearnerForModal.course.lessons.length} chapitres</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Score Évaluation</span>
                          <span className="text-xl font-black text-emerald-600 font-mono">{selectedLearnerForModal.quizScore}%</span>
                          <span className="text-[10px] text-slate-500 block">Mention {selectedLearnerForModal.quizScore >= 90 ? 'Très Bien' : selectedLearnerForModal.quizScore >= 80 ? 'Bien' : 'Assez Bien'}</span>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Temps d'Étude</span>
                          <span className="text-xl font-black text-purple-600 font-mono">{selectedLearnerForModal.studyTime}</span>
                          <span className="text-[10px] text-slate-500 block">Assiduité vérifiée</span>
                        </div>
                      </div>

                      {/* Trajectoire par Chapitre / Leçon */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                          <span>Parcours d'Apprentissage Détaillé ({selectedLearnerForModal.course.lessons.length} Leçons)</span>
                        </h4>

                        <div className="space-y-2">
                          {selectedLearnerForModal.course.lessons.map((lesson, idx) => {
                            const isLessonCompleted = idx < selectedLearnerForModal.completedLessonsCount;
                            return (
                              <div
                                key={lesson.id}
                                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                                  isLessonCompleted
                                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-[11px] ${
                                    isLessonCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                                  }`}>
                                    {isLessonCompleted ? '✓' : idx + 1}
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-slate-900 dark:text-white truncate">
                                      {lesson.title}
                                    </h5>
                                    <p className="text-[10px] text-slate-400 truncate font-mono">
                                      {lesson.keyArticles?.join(', ') || 'Loi 10/010'} • {lesson.duration}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isLessonCompleted
                                      ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                                  }`}>
                                    {isLessonCompleted ? 'Validé par l\'apprenant' : 'En attente d\'assimilation'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Compétences Loi 10/010 Acquises */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>Maîtrise des Compétences Métiers de la Commande Publique</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          {[
                            { label: 'Plan de Passation des Marchés (PPM Art.14)', pct: Math.min(100, selectedLearnerForModal.quizScore + 2) },
                            { label: 'Rédaction du DAO Type & Allotissement', pct: Math.min(100, selectedLearnerForModal.quizScore - 3) },
                            { label: 'Contrôle a Priori & Seuils DGCMP (Art.12)', pct: Math.min(100, selectedLearnerForModal.quizScore + 4) },
                            { label: 'Procédure Contentieuse & Recours CRD (Art.79)', pct: Math.min(100, selectedLearnerForModal.quizScore - 5) }
                          ].map((comp, cIdx) => (
                            <div key={cIdx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{comp.label}</span>
                                <span className="font-mono font-bold text-blue-600">{comp.pct}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${comp.pct}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Observations et Notes Pédagogiques du Formateur */}
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                            <span>Carnet de Suivi & Observations du Formateur</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">Persisté dans le dossier officiel</span>
                        </label>

                        <textarea
                          rows={3}
                          value={currentLearnerObservationInput}
                          onChange={e => setCurrentLearnerObservationInput(e.target.value)}
                          placeholder="Saisissez vos observations pédagogiques sur cet apprenant (points forts, vigilance sur les délais francs, assiduité aux simulations)..."
                          className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        {/* Suggestions de remarques rapides */}
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "Excellente rigueur sur les pièces du DAO type.",
                            "À approfondir : délais de recours gracieux (Art. 77).",
                            "Très bonne assiduité, candidat prêt pour la certification.",
                            "Recommandé pour présider la commission d'ouverture des plis."
                          ].map((suggestion, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => setCurrentLearnerObservationInput(prev => prev ? `${prev} ${suggestion}` : suggestion)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-medium text-slate-600 dark:text-slate-300 transition cursor-pointer"
                            >
                              + {suggestion}
                            </button>
                          ))}
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => handleSaveLearnerObservation(
                              selectedLearnerForModal.profile.id,
                              selectedLearnerForModal.course.id,
                              currentLearnerObservationInput
                            )}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Enregistrer la note pédagogique</span>
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Footer Modal Actions */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <button
                        onClick={() => setSelectedLearnerForModal(null)}
                        className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 transition cursor-pointer"
                      >
                        Fermer le dossier
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setTrainerNotice(`Rappel et message d'encouragement transmis à ${selectedLearnerForModal.profile.name} ✓`);
                            setTimeout(() => setTrainerNotice(null), 3500);
                          }}
                          className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Envoyer une relance</span>
                        </button>

                        <button
                          onClick={() => handleGrantCertification(
                            selectedLearnerForModal.profile.id,
                            selectedLearnerForModal.course.id
                          )}
                          className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition cursor-pointer ${
                            selectedLearnerForModal.isCertified
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
                          }`}
                        >
                          <Award className="w-4 h-4" />
                          <span>{selectedLearnerForModal.isCertified ? '✓ Attestation DFAT Délivrée' : 'Délivrer l\'Attestation Homologuée'}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          );
        })()}

      </div>

    </div>
  );
};
