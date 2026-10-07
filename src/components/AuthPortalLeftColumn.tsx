import React from 'react';
import {
  FileText,
  Users,
  Mail,
  CheckCircle2,
  Clock,
  Building2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  AlertTriangle,
  UserCheck,
  Lock,
  UserPlus,
  ShieldCheck,
  User,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import {
  UserProfile,
  UserRole,
  CgpmpCellMember,
  CgpmpAccountCreationRequest
} from '../types';
import { PME_DEMO_ACCOUNTS } from '../data/initialData';

interface AuthPortalLeftColumnProps {
  mode: 'login' | 'register' | 'forgot_password' | 'armp_admin';
  onChangeMode?: (nextMode: 'login' | 'register' | 'forgot_password' | 'armp_admin') => void;
  onClose?: () => void;
  selectedRole: UserRole;
  roleLabel: string;
  roleBadgeText: string;
  registerStep: 1 | 2 | 3 | 4 | 5;
  onSelectStep?: (step: 1 | 2 | 3 | 4 | 5) => void;
  isGoogleVerified: boolean;
  nameInput: string;
  nomInput?: string;
  postnomInput?: string;
  prenomInput?: string;
  sexeInput?: 'M' | 'F';
  civiliteInput?: string;
  dateNaissanceInput?: string;
  lieuNaissanceInput?: string;
  nationaliteInput?: string;
  etatCivilInput?: string;
  pieceIdentiteInput?: string;
  emailInput: string;
  institutionInput: string;
  isPermanentSecretary: boolean;
  creationDocRef: string;
  creationDocType: string;
  creationDocDate: string;
  creationDocSignatory: string;
  creationDocFileName: string;
  creationDocFileSize: string;
  cgpmpMembers: CgpmpCellMember[];
  cgpmpAccountRequests: CgpmpAccountCreationRequest[];
  onSelectDemo: (role: UserRole, customProfile?: UserProfile) => void;
  onPrefillLoginFromEmail: (email: string, password: string, name: string) => void;
  onOpenArmpValidationView: () => void;
  /** Entrée distincte : formulaire de création de compte (profils ordinaires, sans CGPMP) */
  onEnterCreation?: () => void;
  /** Entrée distincte : formulaire de demande de création de compte CGPMP (validation ARMP) */
  onEnterDemande?: () => void;
}

export const AuthPortalLeftColumn: React.FC<AuthPortalLeftColumnProps> = ({
  mode,
  onChangeMode,
  onClose,
  selectedRole,
  roleLabel,
  roleBadgeText,
  registerStep,
  onSelectStep,
  isGoogleVerified,
  nameInput,
  nomInput,
  postnomInput,
  prenomInput,
  sexeInput,
  civiliteInput,
  dateNaissanceInput,
  lieuNaissanceInput,
  nationaliteInput,
  pieceIdentiteInput,
  emailInput,
  institutionInput,
  isPermanentSecretary,
  creationDocRef,
  creationDocType,
  creationDocDate,
  creationDocFileName,
  creationDocFileSize,
  cgpmpMembers,
  cgpmpAccountRequests,
  onSelectDemo,
  onPrefillLoginFromEmail,
  onOpenArmpValidationView,
  onEnterCreation,
  onEnterDemande
}) => {
  const isCgpmp = selectedRole === 'cgpmp_member';
  const pendingRequests = cgpmpAccountRequests.filter(
    (r) => r.status === 'En attente de validation ARMP'
  );
  const validatedRequests = cgpmpAccountRequests.filter(
    (r) => r.status === 'Validé par ARMP — Coordonnées envoyées'
  );

  const composedFullName =
    nomInput || postnomInput || prenomInput
      ? `${civiliteInput ? `${civiliteInput} ` : ''}${[
          nomInput?.toUpperCase(),
          postnomInput?.toUpperCase(),
          prenomInput
        ]
          .filter(Boolean)
          .join(' ')}`.trim()
      : nameInput;

  return (
    <div className="space-y-5">
      {/* Compact Inline Mode Switcher (Sans Logo dans cette colonne) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/15">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer"
            title="Retourner au portail principal"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour</span>
          </button>
        )}

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => onChangeMode?.('login')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
              mode === 'login' || mode === 'forgot_password'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Connexion</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onChangeMode?.('register');
              onEnterCreation?.();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
              mode === 'register' && !isCgpmp
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Créer Compte</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onChangeMode?.('register');
              onEnterDemande?.();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
              mode === 'register' && isCgpmp
                ? 'bg-blue-500 text-white shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
            title="Formulaire de demande de création de compte CGPMP — soumis à validation ARMP"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Demande CGPMP</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeMode?.('armp_admin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
              mode === 'armp_admin'
                ? 'bg-emerald-400 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin ARMP</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px]">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* LEFT COLUMN FOR LOGIN / FORGOT PASSWORD / ARMP ADMIN */}
      {(mode === 'login' || mode === 'forgot_password' || mode === 'armp_admin') && (
        <div className="space-y-5">
          {/* CGPMP Email Credentials Dispatch & Status Tracker */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-extrabold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Coordonnées CGPMP envoyées par mail (Après validation ARMP)</span>
              </div>
              {mode !== 'armp_admin' && (
                <button
                  type="button"
                  onClick={onOpenArmpValidationView}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-[11px] font-extrabold hover:bg-amber-300 transition shrink-0 cursor-pointer"
                >
                  Validation ARMP ({pendingRequests.length})
                </button>
              )}
            </div>

            {/* Pending Requests Warning */}
            {pendingRequests.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>{pendingRequests.length} dossier(s) en attente de validation ARMP</span>
                  </span>
                  {mode !== 'armp_admin' && (
                    <button
                      type="button"
                      onClick={onOpenArmpValidationView}
                      className="text-[11px] font-extrabold text-amber-200 underline cursor-pointer"
                    >
                      Valider →
                    </button>
                  )}
                </div>
                {pendingRequests.slice(0, 2).map((pr) => (
                  <div
                    key={pr.id}
                    className="text-[11px] text-slate-200 flex items-center justify-between gap-2"
                  >
                    <span className="truncate">
                      • <strong>{pr.institution}</strong> ({pr.permanentSecretaryName} ·{' '}
                      {pr.members.length} membres)
                    </span>
                    <span className="text-[10px] font-mono text-amber-300 shrink-0">
                      {pr.creationDocument.documentRef}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Validated Requests & Emailed Member Credentials */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {validatedRequests.map((vr) => (
                <div
                  key={vr.id}
                  className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-extrabold text-white truncate">
                      🏛️ {vr.institution}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300 shrink-0">
                      ✓ Validé ARMP ({vr.creationDocument.documentRef})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {(vr.dispatchedEmails || []).map((mail) => (
                      <button
                        key={mail.id}
                        type="button"
                        onClick={() =>
                          onPrefillLoginFromEmail(
                            mail.loginEmail,
                            mail.tempPassword,
                            mail.recipientName
                          )
                        }
                        className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 hover:border-amber-400 text-left transition flex items-center justify-between gap-2 group cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-white truncate">
                            {mail.recipientName}
                          </div>
                          <div className="text-[10px] text-sky-300 font-mono truncate">
                            ✉️ {mail.loginEmail}
                          </div>
                          <div className="text-[9px] text-slate-300 truncate">
                            {mail.recipientRoleInCell} · Pass: <strong>{mail.tempPassword}</strong>
                          </div>
                        </div>
                        <KeyRound className="w-3.5 h-3.5 text-amber-300 shrink-0 group-hover:scale-110 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fast Institutional Demo Access — Regroupé dans un expandable pour éviter la surcharge */}
          <details className="group rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden transition-all">
            <summary className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-white/5 transition list-none">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="text-xs font-extrabold text-slate-200">
                  Comptes de démonstration (6 profils)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">1-Clic</span>
                <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" />
              </div>
            </summary>

            <div className="p-4 pt-0 space-y-3.5 border-t border-white/5 mt-3">

            {/* 1. Autorité Contractante */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wide">
                🏛️ Autorité Contractante
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectDemo('cgpmp_member')}
                  className="p-2.5 rounded-xl border border-white/15 bg-white/5 hover:border-amber-400 text-left transition text-xs font-bold text-white cursor-pointer"
                >
                  <div className="truncate">🏛️ Membre Cellule (CGPMP)</div>
                  <div className="text-[10px] text-slate-400 font-normal truncate">Secrétaire Permanent / CPM</div>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectDemo('ac_agent')}
                  className="p-2.5 rounded-xl border border-white/15 bg-white/5 hover:border-amber-400 text-left transition text-xs font-bold text-white cursor-pointer"
                >
                  <div className="truncate">🏛️ Autre Agent AC</div>
                  <div className="text-[10px] text-slate-400 font-normal truncate">DAF / Contrôle Interne</div>
                </button>
              </div>
            </div>

            {/* 2. Opérateurs Économiques */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wide">
                🏢 Opérateurs Économiques
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectDemo('pme')}
                  className="p-2.5 rounded-xl border border-teal-400/40 bg-teal-950/40 hover:border-teal-300 text-left transition text-xs font-extrabold text-teal-200 cursor-pointer"
                >
                  <div className="truncate">🏢 PME (Loi 17/001)</div>
                  <div className="text-[10px] text-teal-300/80 font-normal truncate">ARSP • Contenu Local 51%</div>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectDemo('grande_entreprise')}
                  className="p-2.5 rounded-xl border border-white/15 bg-white/5 hover:border-amber-400 text-left transition text-xs font-bold text-white cursor-pointer"
                >
                  <div className="truncate">🏢 Grandes Entreprises</div>
                  <div className="text-[10px] text-slate-400 font-normal truncate">Grands Travaux BTP & Industrie</div>
                </button>
              </div>
            </div>

            {/* 3 & 4. Sociétés Civiles & Indépendant */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wide">
                ⚖️ Sociétés Civiles & 👤 Indépendant
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectDemo('societe_civile')}
                  className="p-2.5 rounded-xl border border-emerald-400/30 bg-emerald-950/30 hover:border-emerald-300 text-left transition text-xs font-extrabold text-emerald-200 cursor-pointer"
                >
                  <div className="truncate">⚖️ Sociétés Civiles</div>
                  <div className="text-[10px] text-emerald-300/80 font-normal truncate">Observatoire & Transparence</div>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectDemo('independant')}
                  className="p-2.5 rounded-xl border border-cyan-400/30 bg-cyan-950/30 hover:border-cyan-300 text-left transition text-xs font-extrabold text-cyan-200 cursor-pointer"
                >
                  <div className="truncate">👤 Indépendant</div>
                  <div className="text-[10px] text-cyan-300/80 font-normal truncate">Consultant & Expert Libéral</div>
                </button>
              </div>
            </div>

            {/* Régulateurs & Formateurs (secondaire) */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-slate-400 font-bold">Régulation :</span>
              <button
                type="button"
                onClick={() => onSelectDemo('armp_agent')}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer"
              >
                ⚖️ ARMP
              </button>
              <button
                type="button"
                onClick={() => onSelectDemo('dgcmp_agent')}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer"
              >
                🛡️ DGCMP
              </button>
              <button
                type="button"
                onClick={() => onSelectDemo('formateur')}
                className="px-2 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 font-bold cursor-pointer"
              >
                🎓 Formateur
              </button>
            </div>

            <div className="pt-2 border-t border-white/10">
              <div className="text-[11px] font-bold text-teal-300 mb-1.5">
                Comptes PME & Sous-Traitants (RDC) :
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {PME_DEMO_ACCOUNTS.slice(0, 4).map((pmeAcc) => (
                  <button
                    key={pmeAcc.id}
                    type="button"
                    onClick={() => onSelectDemo('pme', pmeAcc)}
                    className="p-2 rounded-xl bg-slate-900/90 border border-white/10 hover:border-teal-400 text-left transition flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-white truncate">
                        {pmeAcc.name}
                      </div>
                      <div className="text-[10px] text-teal-300 truncate">
                        {pmeAcc.institution.split('(')[0].trim()}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
            </div>
          </details>
        </div>
      )}

      {/* LEFT COLUMN FOR REGISTRATION (ALL STEPS + LIVE DOSSIER SUMMARY) */}
      {mode === 'register' && (
        <div className="space-y-4">
          <div className="space-y-2">
            {(isCgpmp
              ? [
                  {
                    num: 1 as const,
                    title: '01. Choix du Profil & Habilitation CGPMP',
                    desc: 'Sélection du profil et confirmation de la qualité de Secrétaire Permanent.'
                  },
                  {
                    num: 2 as const,
                    title: '02. Identité Civile Complète & Email Officiel',
                    desc: 'Nom, Post-nom, Prénom, Sexe, État civil, Pièce d’identité et Email.'
                  },
                  {
                    num: 3 as const,
                    title: '03. Autorité Contractante & Acte de Création CGPMP',
                    desc: 'Document officiel portant création de la cellule CGPMP (pièce jointe).'
                  },
                  {
                    num: 4 as const,
                    title: '04. Liste des Membres CGPMP (Noms complets & Emails)',
                    desc: 'Enregistrement par le Secrétaire Permanent des membres de la cellule.'
                  },
                  {
                    num: 5 as const,
                    title: '05. Coordonnées RDC (+243) & Validation ARMP',
                    desc: 'Envoi par mail des coordonnées d’accès après validation par l’ARMP.'
                  }
                ]
              : [
                  {
                    num: 1 as const,
                    title: '01. Choix du Profil de Compte',
                    desc: 'Sélection de votre catégorie d’acteur de la commande publique.'
                  },
                  {
                    num: 2 as const,
                    title: '02. Identité Civile Complète & Email Officiel',
                    desc: 'Nom, Post-nom, Prénom, Sexe, Date/Lieu de naissance et Email.'
                  },
                  {
                    num: 3 as const,
                    title: '03. Informations Professionnelles & Institution',
                    desc: roleBadgeText
                  },
                  {
                    num: 4 as const,
                    title: '04. Coordonnées RDC (+243) & Activation',
                    desc: 'Validation des identifiants et ouverture immédiate du compte.'
                  }
                ]
            ).map((st) => {
              const isCurrent = registerStep === st.num;
              const isDone = registerStep > st.num;
              return (
                <div
                  key={st.num}
                  onClick={() => {
                    if (isDone && onSelectStep) onSelectStep(st.num);
                  }}
                  className={`p-3 rounded-2xl border transition ${
                    isCurrent
                      ? 'bg-white/15 border-amber-400 shadow-sm'
                      : isDone
                      ? 'bg-emerald-950/40 border-emerald-500/40 cursor-pointer hover:bg-emerald-950/60'
                      : 'bg-slate-900/50 border-white/10 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${
                        isDone
                          ? 'bg-emerald-400 text-slate-950'
                          : isCurrent
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {isDone ? '✓' : st.num}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-white">{st.title}</div>
                      <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">{st.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {isCgpmp ? (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
              {/* 1. Habilitation & Identité Civile du Secrétaire Permanent */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                    <span>1 & 2. Secrétaire Permanent & Identité Civile</span>
                  </span>
                  {isPermanentSecretary ? (
                    <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Qualité confirmée
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-400">
                      Réservé au Secrétaire Permanent
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300 pt-1">
                  <div className="truncate">
                    Nom : <strong className="text-white">{nomInput || '—'}</strong>
                  </div>
                  <div className="truncate">
                    Post-nom : <strong className="text-white">{postnomInput || '—'}</strong>
                  </div>
                  <div className="truncate">
                    Prénom : <strong className="text-white">{prenomInput || '—'}</strong>
                  </div>
                  <div className="truncate">
                    Sexe :{' '}
                    <strong className="text-amber-300">
                      {sexeInput === 'F' ? 'Féminin (F)' : sexeInput === 'M' ? 'Masculin (M)' : '—'}
                    </strong>
                  </div>
                </div>
                <div className="text-[11px] text-slate-300 truncate pt-0.5">
                  Email : <strong className="text-sky-300 font-mono">{emailInput || 'À renseigner (Étape 2)'}</strong>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Autorité Contractante : {institutionInput || 'Non renseignée'}
                </div>
              </div>

              {/* 3. Document portant création de la cellule */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-sky-300" />
                    <span>3. Document portant création de la cellule</span>
                  </span>
                  {creationDocFileName ? (
                    <span className="text-[10px] font-bold text-emerald-300">
                      ✓ Acte joint ({creationDocFileSize})
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-300">
                      Pièce obligatoire (Étape 3)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-300">
                  Réf :{' '}
                  <strong className="font-mono text-white">
                    {creationDocType} n° {creationDocRef || '—'}
                  </strong>{' '}
                  ({creationDocDate})
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Fichier :{' '}
                  <span className="font-mono">
                    {creationDocFileName || 'Aucun document téléversé'}
                  </span>
                </div>
              </div>

              {/* 4. Liste des Membres CGPMP */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-purple-300" />
                    <span>4. Liste des Membres CGPMP ({cgpmpMembers.length})</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-300">
                    Envoi mail après validation ARMP
                  </span>
                </div>

                {cgpmpMembers.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">
                    Le Secrétaire Permanent ajoute les noms complets et adresses email des membres à l’Étape 4.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {cgpmpMembers.map((m, i) => (
                      <div
                        key={m.id}
                        className="p-2 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-between gap-2 text-[11px]"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate">
                            {i + 1}. {m.fullName}
                          </div>
                          <div className="text-[10px] font-mono text-sky-300 truncate">
                            {m.email}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate max-w-[130px] shrink-0">
                          {m.functionInCell}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Regulatory Notice */}
              <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-[11px] text-amber-200 leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  Les coordonnées d’authentification sont envoyées par mail aux membres{' '}
                  <strong>seulement si l’Administration de l’ARMP valide la demande</strong>.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-extrabold text-white">
                <User className="w-4 h-4 text-amber-300" />
                <span>Synthèse Identité & Profil ({roleLabel})</span>
              </div>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span>Nom complet :</span>
                  <strong className="text-white truncate max-w-[240px]">
                    {composedFullName || 'À renseigner (Étape 2)'}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span>Sexe & Nationalité :</span>
                  <strong className="text-white">
                    {sexeInput === 'F' ? 'Féminin (F)' : 'Masculin (M)'} • {nationaliteInput || 'RDC'}
                  </strong>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span>Email officiel :</span>
                  <strong className="text-sky-300 font-mono truncate max-w-[240px]">
                    {emailInput || (isGoogleVerified ? 'Vérifié Google' : 'Étape 2')}
                  </strong>
                </div>
                { (dateNaissanceInput || pieceIdentiteInput) && (
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span>Pièce / Naissance :</span>
                    <strong className="text-white truncate max-w-[240px]">
                      {[pieceIdentiteInput, lieuNaissanceInput, dateNaissanceInput]
                        .filter(Boolean)
                        .join(' · ')}
                    </strong>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span>Institution :</span>
                  <strong className="text-white truncate max-w-[240px]">
                    {institutionInput || '—'}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
