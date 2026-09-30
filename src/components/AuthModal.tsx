import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  Building2, 
  Scale, 
  X,
  AlertCircle,
  Sparkles,
  UserPlus,
  Phone,
  Shield,
  KeyRound,
  Mail,
  RefreshCw
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { 
  firebaseLoginUser, 
  firebaseRegisterUser, 
  firebaseGoogleLogin, 
  firebaseResetPassword 
} from '../firebase';

export interface RegisterLearnerData {
  name: string;
  email: string;
  role: UserRole;
  institution?: string;
  phone?: string;
  twoFactorEnabled?: boolean;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  allProfiles?: Record<string, UserProfile>;
  onLoginSuccess?: (profile: UserProfile) => void;
  onDemoLogin?: (role: UserRole) => void;
  initialRole?: UserRole;
  initialMode?: 'login' | 'register' | 'forgot_password';
  pendingCourseTitle?: string | null;
  targetCourseTitle?: string | null;
  onShowToast?: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  allProfiles,
  onLoginSuccess,
  onDemoLogin,
  initialRole = 'cgpmp_member',
  initialMode = 'login',
  pendingCourseTitle,
  targetCourseTitle,
  onShowToast
}) => {
  const courseTitle = pendingCourseTitle || targetCourseTitle;
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>(initialMode);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  
  // Registration fields & Steps
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [institutionInput, setInstitutionInput] = useState('');
  const [enable2FAOnRegister, setEnable2FAOnRegister] = useState(false);
  const [acceptEthicsCharter, setAcceptEthicsCharter] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setRegisterStep(1);
      setStepError(null);
      setResetSuccessMessage(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Translate Firebase errors into clean French messages
  const getFriendlyAuthError = (err: unknown): string => {
    const raw = err instanceof Error ? err.message : String(err);
    const message = raw.toLowerCase();
    if (message.includes('auth/unauthorized-domain') || message.includes('is not authorized') || message.includes('unauthorized domain') || raw.includes('armpacademia.vercel.app')) {
      return 'Domaine armpacademia.vercel.app non autorisé côté Firebase. Admin : Firebase Console → Authentication → Settings → Authorized domains → Ajouter « armpacademia.vercel.app » puis réessayez. En attendant, utilisez Email/Mot de passe ou Accès démo ci-dessous.';
    }
    if (message.includes('auth/operation-not-allowed') || message.includes('operation-not-allowed')) {
      return 'Connexion Google désactivée dans ce projet Firebase. Admin : Firebase Console → Authentication → Sign-in method → Google → Activer.';
    }
    if (message.includes('auth/popup-blocked') || message.includes('popup-blocked')) {
      return 'Popup Google bloquée par le navigateur. Autorisez les popups pour armpacademia.vercel.app et réessayez, ou utilisez Email/Mot de passe.';
    }
    if (message.includes('auth/popup-closed-by-user') || message.includes('popup-closed-by-user')) {
      return 'La fenêtre de connexion Google a été fermée avant la fin.';
    }
    if (message.includes('auth/cancelled-popup-request') || message.includes('cancelled-popup')) {
      return 'Requête Google annulée (double-clic). Patientez 2s puis réessayez.';
    }
    if (message.includes('auth/network-request-failed') || message.includes('network-request-failed')) {
      return 'Réseau instable — vérifiez votre connexion et réessayez.';
    }
    if (message.includes('auth/too-many-requests')) {
      return 'Trop de tentatives. Patientez quelques minutes avant de réessayer.';
    }
    if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
      return 'Identifiants invalides. Vérifiez votre email et mot de passe.';
    }
    if (message.includes('auth/user-not-found')) {
      return 'Aucun compte trouvé pour cette adresse email.';
    }
    if (message.includes('auth/email-already-in-use')) {
      return 'Cette adresse email est déjà enregistrée. Veuillez vous connecter.';
    }
    if (message.includes('auth/weak-password')) {
      return 'Le mot de passe doit comporter au moins 6 caractères.';
    }
    if (message.includes('auth/invalid-email')) {
      return 'Le format de l\'adresse email est invalide.';
    }
    // Include raw code for debugging if unknown
    return `Erreur authentification : ${raw.slice(0, 220)}`;
  };

  const handleNextStep = () => {
    setStepError(null);
    if (registerStep === 1) {
      if (!nameInput.trim() || nameInput.trim().length < 2) {
        setStepError('Veuillez saisir votre nom et prénom complets.');
        return;
      }
      if (!emailInput.trim() || !emailInput.includes('@') || !emailInput.includes('.')) {
        setStepError('Veuillez saisir une adresse email valide.');
        return;
      }
      setRegisterStep(2);
    } else if (registerStep === 2) {
      setRegisterStep(3);
    }
  };

  const handlePrevStep = () => {
    setStepError(null);
    if (registerStep > 1) {
      setRegisterStep((prev) => (prev - 1) as 1 | 2);
    }
  };

  // Handle Login or Register with Firebase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);

    // Password Reset Flow
    if (mode === 'forgot_password') {
      if (!emailInput.trim() || !emailInput.includes('@')) {
        setStepError('Veuillez renseigner votre adresse email pour réinitialiser le mot de passe.');
        return;
      }
      setIsSubmitting(true);
      try {
        await firebaseResetPassword(emailInput.trim());
        setResetSuccessMessage(`Un lien de réinitialisation sécurisé a été envoyé à ${emailInput.trim()}. Veuillez vérifier votre boîte de réception.`);
        onShowToast?.('Email de réinitialisation envoyé avec succès.');
      } catch (err) {
        setStepError(getFriendlyAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Registration Flow
    if (mode === 'register') {
      if (registerStep !== 3) {
        handleNextStep();
        return;
      }
      if (!passwordInput || passwordInput.length < 6) {
        setStepError('Le mot de passe doit comporter au moins 6 caractères.');
        return;
      }
      if (confirmPasswordInput && passwordInput !== confirmPasswordInput) {
        setStepError('Les mots de passe saisis ne sont pas identiques.');
        return;
      }
      if (!acceptEthicsCharter) {
        setStepError('Vous devez accepter les principes d\'intégrité de la commande publique.');
        return;
      }

      setIsSubmitting(true);
      try {
        const userProfile = await firebaseRegisterUser(
          emailInput.trim(),
          passwordInput,
          nameInput.trim() || 'Apprenant ARMP',
          selectedRole,
          {
            phone: phoneInput.trim(),
            institution: institutionInput.trim() || (selectedRole === 'cgpmp_member' ? 'Ministère du Budget' : 'Secteur Public RDC'),
            twoFactorEnabled: enable2FAOnRegister
          }
        );
        onShowToast?.(`Compte créé avec succès ! Bienvenue ${userProfile.name}.`);
        onLoginSuccess?.(userProfile);
        onClose();
      } catch (err) {
        setStepError(getFriendlyAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Standard Login Flow
    if (mode === 'login') {
      if (!emailInput.trim() || !emailInput.includes('@')) {
        setStepError('Veuillez saisir votre adresse email.');
        return;
      }
      if (!passwordInput) {
        setStepError('Veuillez saisir votre mot de passe.');
        return;
      }

      setIsSubmitting(true);
      try {
        const userProfile = await firebaseLoginUser(emailInput.trim(), passwordInput);
        onShowToast?.(`Connexion réussie : Bienvenue ${userProfile.name}.`);
        onLoginSuccess?.(userProfile);
        onClose();
      } catch (err) {
        setStepError(getFriendlyAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Google Sign-In with Firebase
  const handleGoogleSignIn = async () => {
    setStepError(null);
    setIsSubmitting(true);
    try {
      const userProfile = await firebaseGoogleLogin();
      onShowToast?.(`Connexion Google réussie : Bienvenue ${userProfile.name}.`);
      onLoginSuccess?.(userProfile);
      onClose();
    } catch (err) {
      setStepError(getFriendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instant demo preset helper
  const handleSelectDemo = (role: UserRole) => {
    setSelectedRole(role);
    if (allProfiles && allProfiles[role]) {
      setEmailInput(allProfiles[role].email);
    }
    if (onDemoLogin) {
      onDemoLogin(role);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-blue-950 via-[#0C3B7C] to-slate-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
              {mode === 'register' ? (
                <UserPlus className="w-5 h-5" />
              ) : mode === 'forgot_password' ? (
                <KeyRound className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">
                {mode === 'register' 
                  ? 'Créer un Compte Apprenant' 
                  : mode === 'forgot_password' 
                  ? 'Réinitialisation du Mot de Passe' 
                  : 'Authentification Institutionnelle'}
              </h3>
              <p className="text-xs text-sky-200 font-medium">
                ACADEMIA ITECH • République Démocratique du Congo
              </p>
            </div>
          </div>

          {courseTitle && (
            <div className="mt-3 p-2.5 rounded-xl bg-blue-950/70 border border-blue-400/30 flex items-center space-x-2 text-xs">
              <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span className="truncate">
                Requis pour accéder à : <strong className="text-white font-bold">{courseTitle}</strong>
              </span>
            </div>
          )}

          {/* Navigation Tabs between Login / Register */}
          {mode !== 'forgot_password' && (
            <div className="mt-4 grid grid-cols-2 p-1 bg-slate-950/40 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setStepError(null);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  mode === 'login'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setRegisterStep(1);
                  setStepError(null);
                }}
                className={`py-1.5 text-xs font-bold rounded-lg transition ${
                  mode === 'register'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Nouvelle inscription
              </button>
            </div>
          )}
        </div>

        {/* Step Indicator (Only in Register Mode) */}
        {mode === 'register' && (
          <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className={`flex items-center space-x-1.5 ${registerStep >= 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${registerStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>1</span>
                <span>Identité</span>
              </div>
              <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />
              <div className={`flex items-center space-x-1.5 ${registerStep >= 2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${registerStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>2</span>
                <span>Profil Métier</span>
              </div>
              <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-700" />
              <div className={`flex items-center space-x-1.5 ${registerStep >= 3 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${registerStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>3</span>
                <span>Sécurité</span>
              </div>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {stepError && (
            <div className={`p-3 rounded-xl border text-xs space-y-2 ${stepError.includes('Authorized domains') ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200' : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'}`}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">{stepError}</span>
              </div>
              {stepError.includes('Authorized domains') && (
                <div className="ml-6 space-y-1.5 pt-1 border-t border-amber-200 dark:border-amber-800/60">
                  <a href="https://console.firebase.google.com/project/gen-lang-client-0775786837/authentication/settings" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 underline hover:text-blue-900">
                    → Ouvrir Firebase Console → Authorized domains ↗
                  </a>
                  <div className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                    Cliquez <strong>+ Add domain</strong> → saisissez <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 font-mono text-[11px]">armpacademia.vercel.app</code> puis aussi <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 font-mono text-[11px]">armpacademia-*.vercel.app</code> pour les previews. Sauvegardez — effet immédiat (30s).<br/>
                    + Vérifiez aussi : <a href="https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0775786837" target="_blank" rel="noreferrer" className="underline font-bold">Google Cloud → Credentials → OAuth 2.0 Client</a> → Authorized JavaScript origins → ajouter <code className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 font-mono">https://armpacademia.vercel.app</code>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400">En attendant, utilisez ci-dessous <strong>Email / Mot de passe</strong> ou <strong>Accès démo</strong> — ils ne nécessitent pas Google.</div>
                </div>
              )}
            </div>
          )}

          {resetSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Email de réinitialisation transmis !</span>
              </div>
              <p>{resetSuccessMessage}</p>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setResetSuccessMessage(null);
                }}
                className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 underline"
              >
                Retourner à la page de connexion
              </button>
            </div>
          )}

          {/* MODE 1: FORGOT PASSWORD */}
          {mode === 'forgot_password' && !resetSuccessMessage && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Indiquez votre adresse email enregistrée. Un lien officiel vous permettant de réinitialiser votre mot de passe en toute sécurité vous sera envoyé via Firebase Auth.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Adresse Email du compte
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ex: jean.kabila@budget.gouv.cd"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setStepError(null);
                  }}
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:underline flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Retour à la connexion</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <span>Envoyer le lien</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: LOGIN */}
          {mode === 'login' && (
            <div className="space-y-4">
              {/* Google One-Click Login Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 font-bold text-xs transition flex items-center justify-center space-x-2 shadow-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continuer avec Google</span>
                </button>

                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-bold">
                      ou avec identifiants officiels
                    </span>
                  </div>
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Adresse Email ou Matricule
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ex: cgpmp.budget@armp-rdc.org"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setStepError(null);
                    }}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connexion à la session Firestore...</span>
                  </>
                ) : (
                  <>
                    <span>Accéder à mon espace sécurisé</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Fast Institutional Demo Access */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                  Accès démo prédéfini par rôle institutionnel :
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectDemo('formateur')}
                    className="p-2 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-left transition flex items-center space-x-2 col-span-2 sm:col-span-1 shadow-xs"
                    title="Connexion démo Formateur Senior ARMP"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[11px] font-extrabold text-amber-900 dark:text-amber-300">🎓 Formateur (Démo)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDemo('cgpmp_member')}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left transition flex items-center space-x-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">CGPMP (Ministères)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDemo('armp_agent')}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-left transition flex items-center space-x-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">ARMP (Régulateur)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDemo('dgcmp_agent')}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition flex items-center space-x-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">DGCMP (Contrôleur)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDemo('particulier')}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition flex items-center space-x-2 col-span-2 sm:col-span-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Secteur Privé / Soumissionnaire (PME & Candidat)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDemo('formateur')}
                    className="p-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-left transition flex items-center space-x-2 ring-1 ring-amber-400/30"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-200">Formateur ⭐</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDemo('dfat_admin')}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700 text-left transition flex items-center space-x-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-700" />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">DFAT Admin</span>
                  </button>
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Accès démo = 1 clic, sans Firebase — fonctionne même si Google est désactivé
                </p>
              </div>
            </div>
          )}

          {/* MODE 3: REGISTER (3-STEP WIZARD) */}
          {mode === 'register' && (
            <div>
              {/* STEP 1: IDENTITÉ */}
              {registerStep === 1 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nom complet & Post-nom *
                    </label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="ex: Dieudonné Bakongo Tshisekedi"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Adresse Email professionnelle ou personnelle *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="ex: dieudonne.bakongo@gmail.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Numéro de téléphone (WhatsApp ou SMS)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="+243 81 234 5678"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
                    >
                      <span>Étape suivante : Profil Métier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PROFIL MÉTIER */}
              {registerStep === 2 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Corps d'activité / Profil de rattachement *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('particulier')}
                        className={`p-3 rounded-xl border text-left transition ${
                          selectedRole === 'particulier'
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="block text-xs font-bold text-slate-900 dark:text-white">Secteur Privé / Soumissionnaire</span>
                        <span className="text-[10px] text-slate-500">Entreprise, consultant, candidat</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole('cgpmp_member')}
                        className={`p-3 rounded-xl border text-left transition ${
                          selectedRole === 'cgpmp_member'
                            ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="block text-xs font-bold text-slate-900 dark:text-white">Cellule CGPMP</span>
                        <span className="text-[10px] text-slate-500">Ministère, Province, Établissement public</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole('armp_agent')}
                        className={`p-3 rounded-xl border text-left transition ${
                          selectedRole === 'armp_agent'
                            ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="block text-xs font-bold text-slate-900 dark:text-white">Régulateur ARMP</span>
                        <span className="text-[10px] text-slate-500">Direction Formation, Contentieux, Audit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole('dgcmp_agent')}
                        className={`p-3 rounded-xl border text-left transition ${
                          selectedRole === 'dgcmp_agent'
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="block text-xs font-bold text-slate-900 dark:text-white">Contrôleur DGCMP</span>
                        <span className="text-[10px] text-slate-500">Contrôle a priori, ANO, Dérogations</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole('formateur')}
                        className={`p-3 rounded-xl border text-left transition col-span-2 ${
                          selectedRole === 'formateur'
                            ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="block text-xs font-extrabold text-amber-900 dark:text-amber-300">🎓 Formateur Certifié / Expert ARMP</span>
                        <span className="text-[10px] text-slate-500">Création de formations, animation d'ateliers, studio vidéo & masterclass</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ministère, Province, Société ou Organisation
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={institutionInput}
                        onChange={(e) => setInstitutionInput(e.target.value)}
                        placeholder="ex: Ministère du Budget / Bureau d'Études Katanga"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Précédent</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
                    >
                      <span>Étape suivante : Sécurité & Mot de passe</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SÉCURITÉ & 2FA */}
              {registerStep === 3 && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Créer un mot de passe sécurisé (min. 6 caractères) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Confirmer le mot de passe *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 2FA Option */}
                  <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="enable2fa"
                      checked={enable2FAOnRegister}
                      onChange={(e) => setEnable2FAOnRegister(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <label htmlFor="enable2fa" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <span className="font-bold flex items-center space-x-1">
                        <Shield className="w-3.5 h-3.5 text-blue-600" />
                        <span>Activer l'Authentification à Double Facteur (2FA)</span>
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                        Exige une confirmation par code SMS ou Email pour les actions critiques.
                      </span>
                    </label>
                  </div>

                  {/* Ethics Charter */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="ethics"
                      checked={acceptEthicsCharter}
                      onChange={(e) => setAcceptEthicsCharter(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <label htmlFor="ethics" className="text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                      Je certifie l'exactitude de mes informations et m'engage à respecter les règles déontologiques prévues par la Loi n° 10/010 du 27 avril 2010.
                    </label>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Précédent</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Création du compte Firebase...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                          <span>Valider mon inscription & Commencer</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Chiffrement TLS & Sauvegarde Firestore RDC</span>
          </div>
          <span className="font-mono text-[10px]">v3.2 • Sécurisé</span>
        </div>
      </div>
    </div>
  );
};
