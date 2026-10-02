import React, { useState } from 'react';
import {
  Upload,
  CheckCircle2,
  Plus,
  Trash2,
  Mail,
  User,
  Briefcase,
  AlertCircle,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { CgpmpCellMember, CgpmpCreationDocumentInfo, CgpmpAccountCreationRequest } from '../types';
import { filterPersonNameMask, filterEmailMask } from '../utils/inputMasks';

interface CgpmpDocSectionProps {
  creationDocType: CgpmpCreationDocumentInfo['documentType'];
  setCreationDocType: (val: CgpmpCreationDocumentInfo['documentType']) => void;
  creationDocRef: string;
  setCreationDocRef: (val: string) => void;
  creationDocDate: string;
  setCreationDocDate: (val: string) => void;
  creationDocSignatory: string;
  setCreationDocSignatory: (val: string) => void;
  creationDocFileName: string;
  creationDocFileSize: string;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAttachSpecimenDocument: () => void;
}

export const CgpmpCreationDocumentSection: React.FC<CgpmpDocSectionProps> = ({
  creationDocType,
  setCreationDocType,
  creationDocRef,
  setCreationDocRef,
  creationDocDate,
  setCreationDocDate,
  creationDocSignatory,
  setCreationDocSignatory,
  creationDocFileName,
  creationDocFileSize,
  onFileUpload,
  onAttachSpecimenDocument
}) => {
  return (
    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-blue-400/70 dark:border-blue-700 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Nature du Document portant création de la Cellule *
          </label>
          <select
            value={creationDocType}
            onChange={(e) =>
              setCreationDocType(e.target.value as CgpmpCreationDocumentInfo['documentType'])
            }
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
          >
            <option value="Arrêté Ministériel">Arrêté Ministériel</option>
            <option value="Arrêté Provincial">Arrêté Provincial (Gouvernorat)</option>
            <option value="Décret">Décret</option>
            <option value="Décision Administrative">Décision Administrative (DG / ETD)</option>
            <option value="Note de Service">Note de Service d’Installation</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Référence Officielle de l’Acte de Création *
          </label>
          <input
            type="text"
            required
            value={creationDocRef}
            onChange={(e) => setCreationDocRef(e.target.value.toUpperCase())}
            placeholder="ex: ARR-CAB-MIN/ITPR/2026/019"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Date de Signature de l’Acte *
          </label>
          <input
            type="date"
            required
            value={creationDocDate}
            onChange={(e) => setCreationDocDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Autorité Signataire de l’Acte *
          </label>
          <input
            type="text"
            required
            value={creationDocSignatory}
            onChange={(e) => setCreationDocSignatory(e.target.value)}
            placeholder="ex: Ministre d'État, Ministre du Budget"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* File Upload Area */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
            Pièce Jointe : Document portant création de la Cellule CGPMP (PDF/Image) *
          </label>
          <button
            type="button"
            onClick={onAttachSpecimenDocument}
            className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
          >
            + Charger un spécimen d’Arrêté CGPMP officiel (PDF)
          </button>
        </div>

        <label className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border-2 border-dashed border-blue-400 dark:border-blue-700 bg-white dark:bg-slate-900 hover:bg-blue-50/50 transition cursor-pointer">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                creationDocFileName
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              }`}
            >
              {creationDocFileName ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              {creationDocFileName ? (
                <>
                  <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 truncate">
                    ✓ Document attaché : {creationDocFileName}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Taille : {creationDocFileSize} · Prêt pour validation ARMP
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Téléverser l’Acte / Arrêté portant création de la Cellule CGPMP
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Formats : PDF, JPG, PNG, DOCX (Obligatoire pour poursuivre)
                  </div>
                </>
              )}
            </div>
          </div>

          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={onFileUpload}
            className="hidden"
          />
          <span className="px-3.5 py-2 rounded-xl bg-[#0C3B7C] text-white text-xs font-bold shrink-0">
            {creationDocFileName ? 'Remplacer' : 'Sélectionner'}
          </span>
        </label>
      </div>
    </div>
  );
};

interface CgpmpMembersStepProps {
  permanentSecretaryName: string;
  permanentSecretaryEmail: string;
  institutionName: string;
  members: CgpmpCellMember[];
  onAddMember: (member: Omit<CgpmpCellMember, 'id'>) => void;
  onRemoveMember: (id: string) => void;
  onLoadDefaultMembers: () => void;
}

const CGPMP_MEMBER_FUNCTIONS = [
  'Président de la Commission de Passation des Marchés (CPM)',
  'Expert en Passation des Marchés & Montage DAO',
  'Expert Technique & Analyse des Offres',
  'Expert Juridique & Suivi de l’Exécution Contractuelle',
  'Chargé de la Planification (PPM), Statistiques & Archivage',
  'Membre de la Sous-Commission Technique d’Analyse'
];

export const CgpmpMembersRosterStep: React.FC<CgpmpMembersStepProps> = ({
  permanentSecretaryName,
  permanentSecretaryEmail,
  institutionName,
  members,
  onAddMember,
  onRemoveMember,
  onLoadDefaultMembers
}) => {
  const [nom, setNom] = useState('');
  const [postnom, setPostnom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [sexe, setSexe] = useState<'M' | 'F'>('M');
  const [email, setEmail] = useState('');
  const [functionInCell, setFunctionInCell] = useState(CGPMP_MEMBER_FUNCTIONS[0]);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleAddClick = () => {
    setLocalError(null);
    const cleanNom = filterPersonNameMask(nom).trim().toUpperCase();
    const cleanPostnom = filterPersonNameMask(postnom).trim().toUpperCase();
    const cleanPrenom = filterPersonNameMask(prenom).trim();
    const composedName = [cleanPrenom, cleanNom, cleanPostnom].filter(Boolean).join(' ').trim();
    const cleanEmail = filterEmailMask(email).trim().toLowerCase();

    if (cleanNom.length < 2 || cleanPrenom.length < 2) {
      setLocalError('Veuillez saisir au minimum le Nom et le Prénom du membre (min. 2 lettres).');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setLocalError('Veuillez saisir une adresse email valide pour l’envoi des coordonnées.');
      return;
    }
    if (
      cleanEmail === permanentSecretaryEmail.trim().toLowerCase() ||
      members.some((m) => m.email.trim().toLowerCase() === cleanEmail)
    ) {
      setLocalError('Cette adresse email figure déjà dans la liste de la Cellule CGPMP.');
      return;
    }

    onAddMember({
      fullName: composedName,
      nom: cleanNom,
      postnom: cleanPostnom,
      prenom: cleanPrenom,
      sexe,
      email: cleanEmail,
      functionInCell
    });
    setNom('');
    setPostnom('');
    setPrenom('');
    setEmail('');
  };

  return (
    <div className="space-y-4">
      {localError && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{localError}</span>
        </div>
      )}

      {/* Add Member Form (Equal 2 Columns) */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
            Ajout des Membres par le Secrétaire Permanent ({permanentSecretaryName})
          </span>
          <button
            type="button"
            onClick={onLoadDefaultMembers}
            className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
          >
            + Pré-remplir 3 membres types CGPMP
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nom du Membre *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(filterPersonNameMask(e.target.value))}
                placeholder="ex: KABUYA"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Post-nom du Membre
            </label>
            <input
              type="text"
              value={postnom}
              onChange={(e) => setPostnom(filterPersonNameMask(e.target.value))}
              placeholder="ex: MUTOMBO"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Prénom du Membre *
            </label>
            <input
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(filterPersonNameMask(e.target.value))}
              placeholder="ex: Célestin"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Sexe *
            </label>
            <select
              value={sexe}
              onChange={(e) => setSexe(e.target.value as 'M' | 'F')}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="M">Masculin (M)</option>
              <option value="F">Féminin (F)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Adresse Email du Membre (envoi des coordonnées) *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(filterEmailMask(e.target.value))}
                placeholder="ex: c.kabuya@infrastructures.gouv.cd"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Qualité / Fonction au sein de la CGPMP
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={functionInCell}
                onChange={(e) => setFunctionInCell(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
              >
                {CGPMP_MEMBER_FUNCTIONS.map((fn) => (
                  <option key={fn} value={fn}>
                    {fn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAddClick}
            className="px-5 py-2.5 rounded-xl bg-[#0C3B7C] hover:bg-blue-800 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter le membre à la liste CGPMP</span>
          </button>
        </div>
      </div>

      {/* Members Roster Grid (2 Columns) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 dark:text-slate-300 px-1">
          <span>
            Membres enregistrés ({members.length} membre(s) + Secrétaire Permanent)
          </span>
          <span className="font-mono text-blue-700 dark:text-blue-400 truncate max-w-[260px]">
            {institutionName}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Permanent Secretary Card */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <div className="font-extrabold text-slate-900 dark:text-white truncate">
                👑 {permanentSecretaryName}
              </div>
              <div className="text-[11px] font-mono text-blue-700 dark:text-blue-400 truncate">
                {permanentSecretaryEmail}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Secrétaire Permanent (Créateur du compte)
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold shrink-0">
              Mail après visa ARMP
            </span>
          </div>

          {members.map((m, idx) => (
            <div
              key={m.id}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0">
                <div className="font-bold text-slate-900 dark:text-white truncate">
                  {idx + 1}. {m.fullName}
                </div>
                <div className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 truncate">
                  {m.email}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {m.functionInCell}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveMember(m.id)}
                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition shrink-0 cursor-pointer"
                title="Retirer ce membre"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {members.length === 0 && (
          <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
            Ajoutez au moins un membre de la Cellule CGPMP (Nom complet + Adresse email) pour poursuivre.
          </div>
        )}
      </div>
    </div>
  );
};

export const CgpmpSubmittedConfirmationCard: React.FC<{
  request: CgpmpAccountCreationRequest;
  onOpenArmpAdminConsole: () => void;
  onBackToLogin: () => void;
}> = ({ request, onOpenArmpAdminConsole, onBackToLogin }) => {
  return (
    <div className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-400 dark:border-emerald-700 space-y-5 animate-in fade-in duration-200">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
          <Clock className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
            Dossier Transmis à l’Administration ARMP • Réf. {request.id}
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Demande enregistrée — En attente de validation ARMP
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            Le système enverra automatiquement par mail les coordonnées d’authentification au Secrétaire Permanent (<strong>{request.permanentSecretaryName}</strong>) et aux <strong>{request.members.length} membres inscrits</strong> uniquement lorsque l’Administration de l’ARMP aura validé votre demande et l’acte <strong>{request.creationDocument.documentRef}</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="font-bold text-slate-900 dark:text-white">
            👑 {request.permanentSecretaryName}
          </div>
          <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
            {request.permanentSecretaryEmail}
          </div>
          <div className="text-[10px] text-slate-500">Secrétaire Permanent</div>
        </div>
        {request.members.map((m) => (
          <div
            key={m.id}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
          >
            <div className="font-bold text-slate-900 dark:text-white">{m.fullName}</div>
            <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400">{m.email}</div>
            <div className="text-[10px] text-slate-500 truncate">{m.functionInCell}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onOpenArmpAdminConsole}
          className="px-5 py-3 rounded-xl bg-[#0C3B7C] hover:bg-blue-800 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-amber-300" />
          <span>Valider dans l’Administration ARMP & envoyer les mails →</span>
        </button>

        <button
          type="button"
          onClick={onBackToLogin}
          className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
        >
          Aller à l’authentification
        </button>
      </div>
    </div>
  );
};
