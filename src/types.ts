export type UserRole = 
  | 'cgpmp_member' 
  | 'armp_agent' 
  | 'dgcmp_agent' 
  | 'pme'
  | 'particulier' 
  | 'dfat_admin' 
  | 'formateur';

export interface RecentReadingItem {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  category: string;
  lessonIndex: number;
  lessonTitle: string;
  progressPct: number;
  readAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  nom?: string;
  postnom?: string;
  prenom?: string;
  sexe?: 'M' | 'F';
  civilite?: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  nationalite?: string;
  etatCivil?: string;
  pieceIdentite?: string;
  adressePhysique?: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  institution: string;
  avatarUrl: string;
  coverUrl?: string;
  level: 'Non évalué' | 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Expert';
  placementScore?: number;
  completedModulesCount: number;
  certificationsCount: number;
  offlineDownloads: string[]; // module ids stored offline
  // Paramètres étendus inspirés de Facebook
  phone?: string;
  whatsapp?: string;
  whatsappLinked?: boolean;
  whatsappNotifications?: boolean;
  forumNotifications?: boolean;
  pushNotifications?: boolean;
  matricule?: string;
  secondaryIdNumber?: string;
  subCategory?: string;
  specialty?: string;
  legalForm?: string;
  localContentShare?: string;
  bio?: string;
  coverBio?: string;
  location?: string;
  province?: string;
  website?: string;
  joinDate?: string;
  twoFactorEnabled?: boolean;
  passwordLastChanged?: string;
  privacyCertificates?: 'public' | 'institutions' | 'private';
  showInDirectory?: boolean;
  shareWithHierarchy?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  tutorReminders?: boolean;
  language?: string;
  timezone?: string;
  // Données d'apprentissage, statistiques, dernière lecture et récentes lectures persistées
  lastReadCourseId?: string;
  lastReadLessonIndex?: number;
  lastReadAt?: string;
  recentReadings?: RecentReadingItem[];
  completedCourseIds?: string[];
  courseProgress?: Record<string, number>;
  completedLessonsByCourse?: Record<string, number[]>;
  quizScoresByCourse?: Record<string, number>;
  notesByCourse?: Record<string, string>;
  studyHoursHistory?: { month: string; hours: number; score: number }[];
  totalStudyMinutes?: number;
  streakDays?: number;
  lastActiveDate?: string;
  galleryPhotos?: { id: string; url: string; label: string; createdAt: string }[];
  certificates?: {
    id: string;
    courseId: string;
    courseCode: string;
    courseTitle: string;
    score: number;
    issuedAt: string;
    sealNumber: string;
  }[];
}

export interface SocialPost {
  id: string;
  authorId?: string;
  author: string;
  roleTitle: string;
  avatar: string;
  timeAgo: string;
  createdAt?: string;
  content: string;
  badgeTag?: string;
  certificateData?: {
    title: string;
    code: string;
    score: number;
    sealText: string;
  };
  image?: string;
  video?: string;
  videoTitle?: string;
  audio?: string;
  audioTitle?: string;
  likes: number;
  userLiked: boolean;
  likedBy?: string[];
  comments: {
    id: string;
    author: string;
    avatar: string;
    text: string;
    timeAgo: string;
  }[];
}

export interface CourseQAItem {
  id: string;
  courseId: string;
  authorId?: string;
  author: string;
  avatar: string;
  question: string;
  answer?: string;
  likes: number;
  likedBy?: string[];
  time: string;
  createdAt?: string;
}

export interface StudioVideoItem {
  id: string;
  title: string;
  duration: string;
  blobUrl: string;
  academiaUrl?: string;
  academiaId?: string;
  date: string;
  courseCode?: string;
  authorId?: string;
}

export interface QuizBankItem {
  id: string;
  code: string;
  theme: string;
  q: string;
  rep: string;
  article: string;
  createdBy?: string;
  createdAt?: string;
}

export interface SavedAnalyticsReport {
  id: string;
  reportTitle: string;
  generatedAt: string;
  period: string;
  institution: string;
  executiveSummary: string;
  keyObservations: string[];
  complianceScore: number;
  recommendationsDFAT: string;
}

export type LessonFormat = 'video' | 'audio' | 'animation' | 'ia_ppt' | 'pdf' | 'visioconference' | 'texte' | 'autre';

export interface CourseModule {
  id: string;
  code: string;
  title: string;
  category: 'Réglementation' | 'Passation' | 'Contrôle' | 'Contentieux' | 'Gestion & Audit';
  targetAudience: UserRole[];
  duration: string;
  level: 'Fondamental' | 'Intermédiaire' | 'Avancé' | 'Spécialisé';
  legalRef: string;
  description: string;
  coverImage: string;
  chaptersCount: number;
  rating: number;
  studentsCount: number;
  requiresDfatApproval: boolean;
  lessons: {
    id: string;
    title: string;
    duration: string;
    content: string;
    keyArticles: string[];
    format?: LessonFormat;
    mediaUrl?: string;
    aiPrompt?: string;
    templateId?: string;
    visioLink?: string;
    visioDate?: string;
    visioPlatform?: 'zoom' | 'teams' | 'meet' | 'jitsi';
  }[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface TrainingRequest {
  id: string;
  cgpmpCellule: string;
  ministereOrEntite: string;
  applicantName: string;
  applicantEmail: string;
  moduleId: string;
  moduleTitle: string;
  participantsCount: number;
  justification: string;
  requestedDate: string;
  status: 'En attente' | 'Approuvé par DFAT' | 'Rejeté';
  dfatNote?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface CgpmpCellMember {
  id: string;
  fullName: string;
  nom?: string;
  postnom?: string;
  prenom?: string;
  sexe?: 'M' | 'F';
  email: string;
  functionInCell: string;
  phone?: string;
  matricule?: string;
  generatedPassword?: string;
  credentialsSentAt?: string;
  accountActivated?: boolean;
}

export interface CgpmpCreationDocumentInfo {
  documentRef: string;
  documentType: 'Arrêté Ministériel' | 'Arrêté Provincial' | 'Décret' | 'Décision Administrative' | 'Note de Service';
  signedDate: string;
  signatoryAuthority: string;
  fileName: string;
  fileSizeLabel: string;
  fileMimeType: string;
  uploadedAt: string;
  verificationHash: string;
  fileDataUrl?: string;
}

export interface DispatchedCredentialEmail {
  id: string;
  recipientName: string;
  recipientEmail: string;
  recipientRoleInCell: string;
  loginEmail: string;
  tempPassword: string;
  matricule: string;
  subject: string;
  bodyPreview: string;
  sentAt: string;
  validatedByAdmin: string;
}

export interface CgpmpAccountCreationRequest {
  id: string;
  institution: string;
  subCategory: string;
  province: string;
  permanentSecretaryName: string;
  permanentSecretaryNom?: string;
  permanentSecretaryPostnom?: string;
  permanentSecretaryPrenom?: string;
  permanentSecretarySexe?: 'M' | 'F';
  permanentSecretaryCivilite?: string;
  permanentSecretaryDateNaissance?: string;
  permanentSecretaryLieuNaissance?: string;
  permanentSecretaryNationalite?: string;
  permanentSecretaryEtatCivil?: string;
  permanentSecretaryPieceIdentite?: string;
  permanentSecretaryEmail: string;
  permanentSecretaryPhone: string;
  permanentSecretaryMatricule: string;
  creationDocument: CgpmpCreationDocumentInfo;
  members: CgpmpCellMember[];
  status: 'En attente de validation ARMP' | 'Validé par ARMP — Coordonnées envoyées' | 'Rejeté par ARMP';
  armpAdminNote?: string;
  validatedBy?: string;
  createdAt: string;
  decidedAt?: string;
  dispatchedEmails?: DispatchedCredentialEmail[];
}

export interface LegalArticle {
  number: string;
  title: string;
  content: string;
}

export interface LegalDocument {
  id: string;
  title: string;
  type: 'Loi' | 'Décret' | 'Arrêté' | 'Guide Pratique' | 'DAO Type' | 'Canevas';
  reference: string;
  promulgationDate: string;
  publicationDate?: string;
  source: string;
  summary: string;
  articlesCount?: number;
  downloadUrl?: string;
  tags: string[];
  category?: string;
  articles?: LegalArticle[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tuteur' | 'system';
  text: string;
  timestamp: string;
  sources?: string[];
}

export interface DiagnosticResult {
  score: number;
  level: string;
  diagnostic: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendedModuleIds: string[];
}
