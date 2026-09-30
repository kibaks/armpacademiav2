import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile as updateAuthProfile,
  onAuthStateChanged,
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
  UserRole,
  CourseModule,
  SocialPost,
  CourseQAItem,
  StudioVideoItem,
  QuizBankItem,
  SavedAnalyticsReport
} from './types';
import { DEMO_PROFILES } from './data/initialData';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

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
    id: uid,
    email: email || base.email,
    name: name || base.name,
    role: role,
    roleTitle: base.roleTitle,
    institution: base.institution,
    completedModulesCount: 0,
    certificationsCount: 0,
    offlineDownloads: [],
    completedCourseIds: [],
    courseProgress: {},
    completedLessonsByCourse: {},
    quizScoresByCourse: {},
    notesByCourse: {},
    studyHoursHistory: [
      { month: 'Avr', hours: 3.5, score: 62 },
      { month: 'Mai', hours: 4.8, score: 68 },
      { month: 'Juin', hours: 5.5, score: 72 },
      { month: 'Juil', hours: 6.4, score: 76 },
      { month: 'Août', hours: 7.2, score: 80 },
      { month: 'Sep', hours: 8.0, score: base.placementScore || 84 }
    ],
    totalStudyMinutes: 180,
    streakDays: 5,
    lastActiveDate: new Date().toISOString().slice(0, 10),
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
    const snap = await getDocs(collection(db, 'users'));
    const list: UserProfile[] = [];
    snap.forEach(d => list.push(d.data() as UserProfile));
    return list;
  } catch (error) {
    console.warn('Could not list all profiles from Firestore:', error);
    return [];
  }
}

// Custom Courses persistence
export async function saveCustomCourseToFirestore(course: CourseModule): Promise<void> {
  if (!auth.currentUser) return;
  const path = `courses/${course.id}`;
  try {
    await setDoc(doc(db, 'courses', course.id), course, { merge: true });
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
    return [];
  }
}

// Social Feed Posts persistence
export async function savePostToFirestore(post: SocialPost): Promise<void> {
  if (!auth.currentUser) return;
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
      return snap.data() as UserProfile;
    } else {
      // Create new profile document in Firestore
      const newProfile = buildDefaultProfile(
        user.uid, 
        user.email || '', 
        user.displayName || user.email?.split('@')[0] || 'Apprenant ARMP', 
        fallbackRole
      );
      await setDoc(userDocRef, newProfile);
      return newProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// Update user profile in Firestore
export async function syncUserProfileToFirestore(profile: UserProfile): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  const path = `users/${profile.id}`;
  try {
    const userDocRef = doc(db, 'users', profile.id);
    await setDoc(userDocRef, profile, { merge: true });
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
    const q = collection(db, 'trainingRequests');
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

// Authentication Helpers
export async function firebaseRegisterUser(
  email: string,
  pass: string,
  name: string,
  role: UserRole,
  extraDetails?: Partial<UserProfile>
): Promise<UserProfile> {
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
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return await getOrInitUserProfile(userCredential.user);
}

export async function firebaseGoogleLogin(): Promise<UserProfile> {
  const userCredential = await signInWithPopup(auth, googleProvider);
  return await getOrInitUserProfile(userCredential.user);
}

export async function firebaseResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function firebaseLogout(): Promise<void> {
  await signOut(auth);
}
