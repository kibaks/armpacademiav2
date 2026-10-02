import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  Users,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  KeyRound,
  Building2,
  Download,
  UserCheck
} from 'lucide-react';
import { CgpmpAccountCreationRequest } from '../types';

interface CgpmpAdminValidationPanelProps {
  requests: CgpmpAccountCreationRequest[];
  onApproveRequest: (req: CgpmpAccountCreationRequest, adminNote?: string) => Promise<void>;
  onRejectRequest: (req: CgpmpAccountCreationRequest, reason: string) => Promise<void>;
  onUseDispatchedCredentialsForLogin?: (email: string, password: string, recipientName: string) => void;
  isProcessingId?: string | null;
}

export const CgpmpAdminValidationPanel: React.FC<CgpmpAdminValidationPanelProps> = ({
  requests,
  onApproveRequest,
  onRejectRequest,
  onUseDispatchedCredentialsForLogin,
  isProcessingId
}) => {
  const [filterStatus, setFilterStatus] = useState<
    'Tous' | 'En attente de validation ARMP' | 'Validé par ARMP — Coordonnées envoyées' | 'Rejeté par ARMP'
  >('Tous');
  const [selectedReqId, setSelectedReqId] = useState<string>(() => requests[0]?.id || '');
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const filtered = requests.filter((r) => filterStatus === 'Tous' || r.status === filterStatus);

  useEffect(() => {
    if (filtered.length > 0 && !filtered.some((r) => r.id === selectedReqId)) {
      setSelectedReqId(filtered[0].id);
    }
  }, [filtered, selectedReqId]);

  const activeReq =
    filtered.find((r) => r.id === selectedReqId) || filtered[0] || requests[0] || null;

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* COLONNE 1 (GAUCHE — 6 COLONNES ÉGALES 50%) : FILTRES & LISTE DES DEMANDES CGPMP */}
      <div className="lg:col-span-6 space-y-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'Tous', label: 'Tous' },
              { id: 'En attente de validation ARMP', label: 'En attente ARMP' },
              { id: 'Validé par ARMP — Coordonnées envoyées', label: 'Validés & Mails envoyés' },
              { id: 'Rejeté par ARMP', label: 'Rejetés' }
            ] as const
          ).map((tab) => {
            const count =
              tab.id === 'Tous'
                ? requests.length
                : requests.filter((r) => r.status === tab.id).length;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  filterStatus === tab.id
                    ? 'bg-[#0C3B7C] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {filtered.map((req) => {
            const isSelected = activeReq?.id === req.id;
            const isPending = req.status === 'En attente de validation ARMP';
            const isApproved = req.status === 'Validé par ARMP — Coordonnées envoyées';

            return (
              <button
                key={req.id}
                type="button"
                onClick={() => setSelectedReqId(req.id)}
                className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer space-y-2.5 ${
                  isSelected
                    ? 'bg-blue-50/90 dark:bg-blue-950/40 border-2 border-blue-600 dark:border-blue-500 shadow-md'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-extrabold text-blue-700 dark:text-blue-400">
                    {req.id}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                      isPending
                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300'
                        : isApproved
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-300'
                    }`}
                  >
                    {isPending && <Clock className="w-3 h-3" />}
                    {isApproved && <CheckCircle2 className="w-3 h-3" />}
                    {!isPending && !isApproved && <XCircle className="w-3 h-3" />}
                    <span>{req.status}</span>
                  </span>
                </div>

                <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate">{req.institution}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="truncate">
                    Sec. Perm. : <strong>{req.permanentSecretaryName}</strong>
                  </div>
                  <div className="text-right font-mono text-blue-700 dark:text-blue-400 truncate">
                    {req.creationDocument.documentRef}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{req.members.length} membre(s) CGPMP inscrits</span>
                  <span>{req.createdAt}</span>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              Aucun dossier de création de compte CGPMP pour ce filtre.
            </div>
          )}
        </div>
      </div>

      {/* COLONNE 2 (DROITE — 6 COLONNES ÉGALES 50%) : INSPECTION DU DOSSIER, ACTE DE CRÉATION, MEMBRES & ENVOI MAIL */}
      <div className="lg:col-span-6">
        {activeReq ? (
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
            {/* Statut et Autorité Contractante */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-blue-700 dark:text-blue-400 font-bold">
                  <span>{activeReq.id}</span>
                  <span>•</span>
                  <span>{activeReq.subCategory}</span>
                  <span>•</span>
                  <span>{activeReq.province}</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {activeReq.institution}
                </h3>
              </div>

              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 shrink-0 ${
                  activeReq.status === 'En attente de validation ARMP'
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300'
                    : activeReq.status === 'Validé par ARMP — Coordonnées envoyées'
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300'
                    : 'bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-300 border border-red-300'
                }`}
              >
                {activeReq.status}
              </span>
            </div>

            {/* Grille 2 colonnes interne : Secrétaire Permanent + Acte de Création */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Secrétaire Permanent */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>1. Demandeur : Secrétaire Permanent</span>
                </div>
                <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                  <div>
                    Nom complet :{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {activeReq.permanentSecretaryName}
                    </strong>
                  </div>
                  {(activeReq.permanentSecretaryNom ||
                    activeReq.permanentSecretaryPostnom ||
                    activeReq.permanentSecretaryPrenom ||
                    activeReq.permanentSecretarySexe) && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      Identité civile :{' '}
                      <span className="font-semibold">
                        {[
                          activeReq.permanentSecretaryNom && `Nom: ${activeReq.permanentSecretaryNom}`,
                          activeReq.permanentSecretaryPostnom && `Post-nom: ${activeReq.permanentSecretaryPostnom}`,
                          activeReq.permanentSecretaryPrenom && `Prénom: ${activeReq.permanentSecretaryPrenom}`,
                          activeReq.permanentSecretarySexe && `Sexe: ${activeReq.permanentSecretarySexe}`
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </div>
                  )}
                  <div>
                    Email officiel :{' '}
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {activeReq.permanentSecretaryEmail}
                    </span>
                  </div>
                  <div>
                    Téléphone RDC :{' '}
                    <span className="font-mono">{activeReq.permanentSecretaryPhone}</span>
                  </div>
                  <div>
                    Matricule SP :{' '}
                    <span className="font-mono font-bold">
                      {activeReq.permanentSecretaryMatricule}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Document portant création de la cellule CGPMP */}
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/25 border border-blue-200 dark:border-blue-900/60 space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>2. Acte portant création de la CGPMP</span>
                </div>
                <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                  <div>
                    Nature : <strong>{activeReq.creationDocument.documentType}</strong>
                  </div>
                  <div>
                    Référence :{' '}
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {activeReq.creationDocument.documentRef}
                    </span>
                  </div>
                  <div>
                    Signataire : <span>{activeReq.creationDocument.signatoryAuthority}</span> (
                    {activeReq.creationDocument.signedDate})
                  </div>
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                      📎 {activeReq.creationDocument.fileName} (
                      {activeReq.creationDocument.fileSizeLabel})
                    </span>
                    {activeReq.creationDocument.fileDataUrl && (
                      <a
                        href={activeReq.creationDocument.fileDataUrl}
                        download={activeReq.creationDocument.fileName}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-blue-300 text-[10px] font-bold text-blue-700 flex items-center gap-1 shrink-0"
                      >
                        <Download className="w-3 h-3" />
                        <span>Ouvrir</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Liste des Membres CGPMP (Noms Complets & Adresses Email) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>
                    3. Liste des Membres de la Cellule ({activeReq.members.length} Membres +
                    Secrétaire Permanent)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  Destinataires des coordonnées par mail
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeReq.members.map((m, idx) => {
                  const isSent =
                    Boolean(m.credentialsSentAt) ||
                    activeReq.status === 'Validé par ARMP — Coordonnées envoyées';
                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900 dark:text-white truncate">
                          {idx + 1}. {m.fullName}
                        </div>
                        <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono truncate flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{m.email}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {m.functionInCell}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                          isSent
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {isSent ? '✉️ Mail envoyé' : '⏳ Attente ARMP'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Action de Validation ARMP ou Journal des Coordonnées Envoyées par Mail */}
            {activeReq.status === 'En attente de validation ARMP' && (
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/70 space-y-3">
                <label className="block text-xs font-extrabold text-amber-900 dark:text-amber-200">
                  Visa / Observation de l’Administration ARMP avant envoi des coordonnées par mail :
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={adminNotes[activeReq.id] || ''}
                    onChange={(e) =>
                      setAdminNotes((prev) => ({ ...prev, [activeReq.id]: e.target.value }))
                    }
                    placeholder="ex: Acte de création CGPMP conforme au Décret 10/32. Envoi des accès autorisé."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    disabled={isProcessingId === activeReq.id}
                    onClick={() => onApproveRequest(activeReq, adminNotes[activeReq.id])}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isProcessingId === activeReq.id
                        ? 'Envoi des mails...'
                        : 'Valider & Envoyer les Coordonnées par Mail'}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingId === activeReq.id}
                    onClick={() =>
                      onRejectRequest(
                        activeReq,
                        adminNotes[activeReq.id] ||
                          'Acte de création incomplet ou non conforme au Décret 10/32.'
                      )
                    }
                    className="px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Rejeter</span>
                  </button>
                </div>
              </div>
            )}

            {activeReq.status === 'Validé par ARMP — Coordonnées envoyées' &&
              activeReq.dispatchedEmails &&
              activeReq.dispatchedEmails.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-800/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>
                        Coordonnées d’authentification envoyées par mail (
                        {activeReq.dispatchedEmails.length} destinataires)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                      Validé le {activeReq.decidedAt}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {activeReq.dispatchedEmails.map((mail) => (
                      <div
                        key={mail.id}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 dark:text-white truncate">
                              {mail.recipientName}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {mail.recipientRoleInCell}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold shrink-0">
                            {mail.matricule}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 font-mono text-[11px] space-y-0.5">
                          <div>
                            Email :{' '}
                            <strong className="text-blue-600 dark:text-blue-400">
                              {mail.loginEmail}
                            </strong>
                          </div>
                          <div>
                            Mot de passe :{' '}
                            <strong className="text-emerald-700 dark:text-emerald-400">
                              {mail.tempPassword}
                            </strong>
                          </div>
                        </div>

                        {onUseDispatchedCredentialsForLogin && (
                          <button
                            type="button"
                            onClick={() =>
                              onUseDispatchedCredentialsForLogin(
                                mail.loginEmail,
                                mail.tempPassword,
                                mail.recipientName
                              )
                            }
                            className="w-full py-1.5 px-3 rounded-lg bg-[#0C3B7C] hover:bg-blue-800 text-white font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <KeyRound className="w-3 h-3 text-amber-300" />
                            <span>Tester la connexion avec ces coordonnées</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
