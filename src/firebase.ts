import { withNativeMfa } from './lib/nativeMfa';
import { scopedStorage } from './lib/scopedStorage';
import { emptyResults, omitResults } from '../shared/results';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth,
  multiFactor,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile as updateAuthProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  deleteDoc,
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  UserProfile,
  TrainingRequest,
  CgpmpAccountCreationRequest,
  DispatchedCredentialEmail,
  UserRole,
  CourseModule,
  SocialPost,
  CourseQAItem,
  StudioVideoItem,
  QuizBankItem,
  SavedAnalyticsReport
} from './types';
import { DEMO_PROFILES, PME_DEMO_ACCOUNTS, INITIAL_CGPMP_ACCOUNT_REQUESTS } from './data/initialData';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// CRITICAL: The app will break without firebaseConfig.firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('email');
googleProvider.addScope('profile');
if (typeof window !== 'undefined') {
  const origin = window.location.hostname;
  if (origin.includes('vercel.app')) {
    console.info('[Firebase Auth] Origin:', window.location.origin, '— doit être dans Firebase Console → Authentication → Settings → Authorized domains. Si “not authorized”, ajoutez', origin);
  }
}

// Error handling as required by Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection validation on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: client is offline or connecting.');
    }
    return false;
  }
}

// Build initial profile helper
export function buildDefaultProfile(uid: string, email: string, name: string, role: UserRole = 'cgpmp_member'): UserProfile {
  const base = DEMO_PROFILES[role] || DEMO_PROFILES['cgpmp_member'];
  return {
    ...base,
    twoFactorEnabled: false,
    id: uid,
    email: email || base.email,
    name: name || base.name,
    role: role,
    roleTitle: base.roleTitle,
    institution: base.institution,
    offlineDownloads: [],
    courseProgress: {},
    completedLessonsByCourse: {},
    notesByCourse: {},
    ...emptyResults(),
    studyHoursHistory: [],
    totalStudyMinutes: 0,
    streakDays: 0,
    galleryPhotos: [],
    certificates: [],
    whatsappNotifications: true,
    tutorReminders: true,
    emailNotifications: true
  };
}

// Fetch all user profiles for institutional analytics & trainer seguimiento
export async function fetchAllUserProfilesFromFirestore(): Promise<UserProfile[]> {
  if (!auth.currentUser) return [];
  const path = 'users';
  try {
    const [snap, records] = await Promise.all([getDocs(collection(db, 'users')), getDocs(collection(db, 'learningRecords'))]);
    const byUid = new Map(records.docs.map(record => [record.id, record.data()]));
    return snap.docs.map(document => ({ ...omitResults(document.data()), ...emptyResults(), ...(byUid.get(document.id) || {}), id: document.id } as unknown as UserProfile));
  } catch (error) {
    console.warn('Could not list all profiles from Firestore:', error);
    return [];
  }
}

// Custom Courses persistence
export async function saveCustomCourseToFirestore(course: CourseModule): Promise<void> {
  if (!auth.currentUser) throw new Error('Connexion requise pour publier un module.');
  const path = `courses/${course.id}`;
  try {
    await setDoc(doc(db, 'courses', course.id), { ...course, authorId: course.authorId || auth.currentUser.uid }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchCustomCoursesFromFirestore(): Promise<CourseModule[]> {
  const path = 'courses';
  try {
    const snap = await getDocs(collection(db, 'courses'));
    const list: CourseModule[] = [];
    snap.forEach(d => list.push(d.data() as CourseModule));
    return list;
  } catch (error) {
    console.warn('Could not fetch custom courses from Firestore:', error);
    throw error;
  }
}

// Social Feed Posts persistence
export async function savePostToFirestore(post: SocialPost): Promise<void> {
  if (!auth.currentUser || post.authorId !== auth.currentUser.uid) throw new Error('Connexion du propriétaire requise pour publier.');
  const path = `posts/${post.id}`;
  try {
    // Strip undefined fields for Firestore compatibility
    const clean = JSON.parse(JSON.stringify(post));
    await setDoc(doc(db, 'posts', post.id), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchPostsFromFirestore(): Promise<SocialPost[]> {
  if (!auth.currentUser) return [];
  const path = 'posts';
  try {
    const snap = await getDocs(collection(db, 'posts'));
    const list: SocialPost[] = [];
    snap.forEach(d => list.push(d.data() as SocialPost));
    return list.sort((a, b) => (b.createdAt || b.id).localeCompare(a.createdAt || a.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deletePostFromFirestore(postId: string): Promise<void> {
  if (!auth.currentUser) return;
  const path = `posts/${postId}`;
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Course Q&A persistence
export async function saveCourseQAToFirestore(item: CourseQAItem): Promise<void> {
  if (!auth.currentUser) return;
  const path = `courseQA/${item.id}`;
  try {
    const clean = JSON.parse(JSON.stringify(item));
    await setDoc(doc(db, 'courseQA', item.id), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchCourseQAFromFirestore(courseId: string): Promise<CourseQAItem[]> {
  if (!auth.currentUser) return [];
  const path = 'courseQA';
  try {
    const q = query(collection(db, 'courseQA'), where('courseId', '==', courseId));
    const snap = await getDocs(q);
    const list: CourseQAItem[] = [];
    snap.forEach(d => list.push(d.data() as CourseQAItem));
    return list.sort((a, b) => (b.createdAt || b.id).localeCompare(a.createdAt || a.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Studio Videos persistence
export async function saveStudioVideoToFirestore(video: StudioVideoItem): Promise<void> {
  if (!auth.currentUser) return;
  const path = `studioVideos/${video.id}`;
  try {
    const clean = JSON.parse(JSON.stringify(video));
    await setDoc(doc(db, 'studioVideos', video.id), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchStudioVideosFromFirestore(): Promise<StudioVideoItem[]> {
  if (!auth.currentUser) return [];
  const path = 'studioVideos';
  try {
    const snap = await getDocs(collection(db, 'studioVideos'));
    const list: StudioVideoItem[] = [];
    snap.forEach(d => list.push(d.data() as StudioVideoItem));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// National Quiz Bank persistence
export async function saveQuizBankItemToFirestore(item: QuizBankItem): Promise<void> {
  if (!auth.currentUser) return;
  const path = `quizBank/${item.id}`;
  try {
    const clean = JSON.parse(JSON.stringify(item));
    await setDoc(doc(db, 'quizBank', item.id), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchQuizBankFromFirestore(): Promise<QuizBankItem[]> {
  if (!auth.currentUser) return [];
  const path = 'quizBank';
  try {
    const snap = await getDocs(collection(db, 'quizBank'));
    const list: QuizBankItem[] = [];
    snap.forEach(d => list.push(d.data() as QuizBankItem));
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Analytics Reports persistence
export async function saveAnalyticsReportToFirestore(report: SavedAnalyticsReport): Promise<void> {
  if (!auth.currentUser) return;
  const path = `analyticsReports/${report.id}`;
  try {
    const clean = JSON.parse(JSON.stringify(report));
    await setDoc(doc(db, 'analyticsReports', report.id), clean, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchAnalyticsReportsFromFirestore(): Promise<SavedAnalyticsReport[]> {
  if (!auth.currentUser) return [];
  const path = 'analyticsReports';
  try {
    const snap = await getDocs(collection(db, 'analyticsReports'));
    const list: SavedAnalyticsReport[] = [];
    snap.forEach(d => list.push(d.data() as SavedAnalyticsReport));
    return list.sort((a, b) => b.id.localeCompare(a.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// Tutor Conversation persistence
export async function saveTutorHistoryToFirestore(userId: string, messages: any[]): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return;
  const path = `tutorConversations/${userId}`;
  try {
    const cleanMsgs = JSON.parse(JSON.stringify(messages.slice(-40)));
    await setDoc(doc(db, 'tutorConversations', userId), {
      userId,
      messages: cleanMsgs,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchTutorHistoryFromFirestore(userId: string): Promise<any[] | null> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) return null;
  const path = `tutorConversations/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'tutorConversations', userId));
    if (snap.exists()) {
      return snap.data()?.messages || null;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Fetch user profile from Firestore with fallback
export async function getOrInitUserProfile(user: FirebaseUser, fallbackRole: UserRole = 'cgpmp_member'): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const profile = snap.data() as UserProfile;
      const token = await user.getIdTokenResult();
      const privileged = ['super_admin', 'dfat_admin', 'formateur', 'armp_agent', 'dgcmp_agent'];
      const record = await getDoc(doc(db, 'learningRecords', user.uid));
      return { ...(omitResults(profile) as unknown as UserProfile), ...emptyResults(), ...(record.exists() ? record.data() : {}), twoFactorEnabled: multiFactor(user).enrolledFactors.length > 0, id: user.uid, role: token.claims.role as UserRole || (privileged.includes(profile.role) ? 'particulier' : profile.role) };
    } else {
      throw new Error('Inscription à compléter avant de charger le profil.');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

const LOCAL_REGISTERED_USERS_KEY = 'academia_registered_users_v1';

export function saveProfileToLocalRegistry(profile: UserProfile): void {
  if (typeof window === 'undefined' || !profile) return;
  try {
    const raw = scopedStorage.getItem(LOCAL_REGISTERED_USERS_KEY);
    const map: Record<string, UserProfile> = raw ? JSON.parse(raw) : {};
    if (profile.id) {
      map[`uid:${profile.id}`] = profile;
    }
    if (profile.email) {
      map[`email:${profile.email.trim().toLowerCase()}`] = profile;
    }
    scopedStorage.setItem(LOCAL_REGISTERED_USERS_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

export async function checkExistingRegisteredUser(params: {
  uid?: string | null;
  email?: string | null;
  knownProfiles?: Record<string, UserProfile>;
}): Promise<{
  exists: boolean;
  profile: UserProfile | null;
  source: 'firestore_uid' | 'firestore_email' | 'local_registry' | 'institutional_directory' | null;
}> {
  const cleanUid = params.uid?.trim() || '';
  const cleanEmail = params.email?.trim().toLowerCase() || '';

  // 1. Check Firestore by UID
  if (cleanUid && !cleanUid.startsWith('GOOGLE-USR-')) {
    try {
      const snap = await getDoc(doc(db, 'users', cleanUid));
      if (snap.exists()) {
        const found = snap.data() as UserProfile;
        saveProfileToLocalRegistry(found);
        return { exists: true, profile: found, source: 'firestore_uid' };
      }
    } catch {
      // Continue to email / local check
    }
  }

  // 2. Check Firestore by Email
  if (cleanEmail && cleanEmail.includes('@')) {
    try {
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const found = qSnap.docs[0].data() as UserProfile;
        saveProfileToLocalRegistry(found);
        return { exists: true, profile: found, source: 'firestore_email' };
      }
    } catch {
      // Continue to local registry check if query is restricted
    }
  }

  // 3. Check Local Registered Users Registry & Active Session
  if (typeof window !== 'undefined') {
    try {
      const raw = scopedStorage.getItem(LOCAL_REGISTERED_USERS_KEY);
      if (raw) {
        const map: Record<string, UserProfile> = JSON.parse(raw);
        if (cleanUid && map[`uid:${cleanUid}`]) {
          return { exists: true, profile: map[`uid:${cleanUid}`], source: 'local_registry' };
        }
        if (cleanEmail && map[`email:${cleanEmail}`]) {
          return { exists: true, profile: map[`email:${cleanEmail}`], source: 'local_registry' };
        }
      }
      const sessionRaw = scopedStorage.getItem('armp_session_profile');
      if (sessionRaw) {
        const sessionProf = JSON.parse(sessionRaw) as UserProfile;
        if (
          (cleanUid && sessionProf?.id === cleanUid) ||
          (cleanEmail && sessionProf?.email?.trim().toLowerCase() === cleanEmail)
        ) {
          return { exists: true, profile: sessionProf, source: 'local_registry' };
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  // 4. Check Known Profiles & Pre-registered PME / Institutional Directory by Email
  if (cleanEmail) {
    if (params.knownProfiles) {
      const matchKnown = Object.values(params.knownProfiles).find(
        (p) => p?.email?.trim().toLowerCase() === cleanEmail
      );
      if (matchKnown) {
        return { exists: true, profile: matchKnown, source: 'institutional_directory' };
      }
    }
    const matchPme = PME_DEMO_ACCOUNTS.find(
      (p) => p.email.trim().toLowerCase() === cleanEmail
    );
    if (matchPme) {
      return { exists: true, profile: matchPme, source: 'institutional_directory' };
    }
    const matchDemo = Object.values(DEMO_PROFILES).find(
      (p) => p.email.trim().toLowerCase() === cleanEmail
    );
    if (matchDemo) {
      return { exists: true, profile: matchDemo, source: 'institutional_directory' };
    }
  }

  return { exists: false, profile: null, source: null };
}

// Update user profile in Firestore
export async function syncUserProfileToFirestore(profile: UserProfile): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== profile.id) {
    throw new Error('Une session Firebase correspondant au profil est requise.');
  }
  const path = `users/${profile.id}`;
  try {
    const userDocRef = doc(db, 'users', profile.id);
    const existing = await getDoc(userDocRef);
    const writable = omitResults(JSON.parse(JSON.stringify(profile)));
    await setDoc(userDocRef, existing.exists() ? writable : { ...writable, ...emptyResults() }, { merge: true });
    saveProfileToLocalRegistry(profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Save training request to Firestore
export async function saveTrainingRequestToFirestore(req: TrainingRequest): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  const path = `trainingRequests/${req.id}`;
  try {
    const docRef = doc(db, 'trainingRequests', req.id);
    await setDoc(docRef, req);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Fetch training requests from Firestore
export async function fetchTrainingRequestsFromFirestore(): Promise<TrainingRequest[]> {
  if (!auth.currentUser) {
    return [];
  }
  const path = 'trainingRequests';
  try {
    const token = await auth.currentUser.getIdTokenResult();
    const q = ['super_admin','dfat_admin'].includes(token.claims.role as string) ? collection(db, 'trainingRequests') : query(collection(db, 'trainingRequests'), where('applicantEmail', '==', auth.currentUser.email));
    const querySnapshot = await getDocs(q);
    const requests: TrainingRequest[] = [];
    querySnapshot.forEach((docSnap) => {
      requests.push(docSnap.data() as TrainingRequest);
    });
    return requests;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ============================================================================
// CGPMP ACCOUNT CREATION REQUESTS (SECRÉTAIRE PERMANENT + ACTE + MEMBRES + ARMP)
// ============================================================================
const LOCAL_CGPMP_ACCOUNT_REQS_KEY = 'academia_cgpmp_account_requests_v1';
const LOCAL_CGPMP_MEMBER_CREDS_KEY = 'academia_cgpmp_member_credentials_v1';

export interface CgpmpMemberStoredCredential {
  email: string;
  password: string;
  requestId: string;
  institution: string;
  fullName: string;
  roleInCell: string;
  matricule: string;
  documentRef: string;
  profile: UserProfile;
}

export function getLocalCgpmpAccountRequests(): CgpmpAccountCreationRequest[] {
  if (typeof window === 'undefined') return INITIAL_CGPMP_ACCOUNT_REQUESTS;
  try {
    const raw = scopedStorage.getItem(LOCAL_CGPMP_ACCOUNT_REQS_KEY);
    const saved: CgpmpAccountCreationRequest[] = raw ? JSON.parse(raw) : [];
    const map = new Map<string, CgpmpAccountCreationRequest>();
    saved.forEach((r) => map.set(r.id, r));
    INITIAL_CGPMP_ACCOUNT_REQUESTS.forEach((r) => {
      if (!map.has(r.id)) map.set(r.id, r);
    });
    return Array.from(map.values());
  } catch {
    return INITIAL_CGPMP_ACCOUNT_REQUESTS;
  }
}

export function saveLocalCgpmpAccountRequestsList(list: CgpmpAccountCreationRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    scopedStorage.setItem(LOCAL_CGPMP_ACCOUNT_REQS_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota warnings
  }
}

export async function saveCgpmpAccountRequestToFirestore(req: CgpmpAccountCreationRequest): Promise<void> {
  if (!auth.currentUser) throw new Error('Connexion Firebase requise pour soumettre la demande.');
  const clean = JSON.parse(JSON.stringify(req));
  if (new TextEncoder().encode(JSON.stringify(clean)).length > 900000) throw new Error('La demande et sa pièce dépassent la capacité de stockage. Réduisez la taille du document.');
  await setDoc(doc(db, 'cgpmpAccountRequests', req.id), clean, { merge: true });
  saveLocalCgpmpAccountRequestsList([req, ...getLocalCgpmpAccountRequests().filter(item => item.id !== req.id)]);
}

export async function fetchCgpmpAccountRequestsFromFirestore(): Promise<CgpmpAccountCreationRequest[]> {
  const localReqs = getLocalCgpmpAccountRequests();
  try {
    if (!auth.currentUser) return [];
    const token = await auth.currentUser.getIdTokenResult();
    const source = ['super_admin','dfat_admin'].includes(token.claims.role as string) ? collection(db, 'cgpmpAccountRequests') : query(collection(db, 'cgpmpAccountRequests'), where('permanentSecretaryEmail', '==', auth.currentUser.email));
    const snap = await getDocs(source);
    const map = new Map<string, CgpmpAccountCreationRequest>();
    snap.forEach((d) => {
      const data = d.data() as CgpmpAccountCreationRequest;
      map.set(data.id, data);
    });
    localReqs.forEach((r) => {
      if (!map.has(r.id)) map.set(r.id, r);
    });
    const merged = Array.from(map.values());
    saveLocalCgpmpAccountRequestsList(merged);
    return merged;
  } catch {
    return localReqs;
  }
}

export async function validateCgpmpAccountRequestByArmp(
  req: CgpmpAccountCreationRequest,
  adminName: string,
  adminNote?: string
): Promise<CgpmpAccountCreationRequest> {
  const { authenticatedFetch } = await import('./lib/adminApi');
  const response = await authenticatedFetch('/api/cgpmp/send-credentials-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: req.id }) });
  const data = await response.json();
  if (!response.ok || !data.success || !data.request) throw new Error(data.error || 'Activation CGPMP incomplète.');
  const updated = data.request as CgpmpAccountCreationRequest;
  saveLocalCgpmpAccountRequestsList([updated, ...getLocalCgpmpAccountRequests().filter(item => item.id !== updated.id)]);
  return updated;
}

export async function rejectCgpmpAccountRequestByArmp(
  req: CgpmpAccountCreationRequest,
  adminName: string,
  reason: string
): Promise<CgpmpAccountCreationRequest> {
  const decidedAt = new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const updatedReq: CgpmpAccountCreationRequest = {
    ...req,
    status: 'Rejeté par ARMP',
    validatedBy: adminName,
    armpAdminNote: reason || 'Document portant création de la cellule incomplet ou non conforme.',
    decidedAt
  };

  await saveCgpmpAccountRequestToFirestore(updatedReq);
  return updatedReq;
}

// Authentication Helpers
export async function firebaseRegisterUser(
  email: string,
  pass: string,
  name: string,
  role: UserRole,
  extraDetails?: Partial<UserProfile>
): Promise<UserProfile> {
  if (['super_admin', 'dfat_admin', 'formateur', 'armp_agent', 'dgcmp_agent'].includes(role)) throw new Error('Ce rôle nécessite une création par le superadministrateur.');
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  if (name) {
    await updateAuthProfile(user, { displayName: name });
  }

  const newProfile: UserProfile = {
    ...buildDefaultProfile(user.uid, email, name, role),
    ...extraDetails,
    id: user.uid,
    email: email,
    name: name,
    role: role
  };

  await syncUserProfileToFirestore(newProfile);
  return newProfile;
}

export async function firebaseLoginUser(email: string, pass: string): Promise<UserProfile> {
  const credential = await withNativeMfa(auth, () => signInWithEmailAndPassword(auth, email.trim().toLowerCase(), pass));
  return getOrInitUserProfile(credential.user);
}

export async function firebaseGoogleLogin(): Promise<UserProfile> {
  const userCredential = await withNativeMfa(auth, () => signInWithPopup(auth, googleProvider));
  return await getOrInitUserProfile(userCredential.user);
}

export async function firebaseGoogleAuthenticate(
  knownProfiles?: Record<string, UserProfile>
): Promise<{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  existingProfile: UserProfile | null;
  isNewAccount: boolean;
  existingSource?: string | null;
}> {
  const userCredential = await withNativeMfa(auth, () => signInWithPopup(auth, googleProvider));
  const user = userCredential.user;
  const check = await checkExistingRegisteredUser({
    uid: user.uid,
    email: user.email,
    knownProfiles
  });
  if (check.exists && check.profile) {
    return {
      uid: user.uid,
      email: user.email || check.profile.email || '',
      displayName: user.displayName || check.profile.name || '',
      photoURL: user.photoURL || check.profile.avatarUrl || null,
      existingProfile: check.profile,
      isNewAccount: false,
      existingSource: check.source
    };
  }
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || '',
    photoURL: user.photoURL || null,
    existingProfile: null,
    isNewAccount: true,
    existingSource: null
  };
}

export async function saveGoogleRegisteredProfile(params: {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  photoURL?: string | null;
  extraDetails?: Partial<UserProfile>;
}): Promise<UserProfile> {
  const base = buildDefaultProfile(params.uid, params.email, params.name, params.role);
  const newProfile: UserProfile = {
    ...base,
    ...params.extraDetails,
    id: params.uid,
    email: params.email,
    name: params.name,
    role: params.role,
    avatarUrl: params.photoURL || base.avatarUrl
  };
  saveProfileToLocalRegistry(newProfile);
  await syncUserProfileToFirestore(newProfile);
  return newProfile;
}

export async function firebaseResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function firebaseLogout(): Promise<void> {
  try { await fetch('/api/storage/session', { method: 'DELETE' }); }
  finally { await signOut(auth); }
}

export async function deleteCustomCourseFromFirestore(id: string): Promise<void> {
  if (!auth.currentUser) throw new Error('Connexion requise.');
  await deleteDoc(doc(db, 'courses', id));
}
