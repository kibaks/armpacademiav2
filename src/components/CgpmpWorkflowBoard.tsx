import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Send,
  AlertCircle,
  Users,
  Calendar,
  Layers
} from 'lucide-react';
import { TrainingRequest, CourseModule, UserProfile, CgpmpAccountCreationRequest } from '../types';
import { CgpmpAdminValidationPanel } from './CgpmpAdminValidationPanel';

interface CgpmpWorkflowBoardProps {
  requests: TrainingRequest[];
  courses: CourseModule[];
  currentProfile: UserProfile;
  onSubmitRequest: (newReq: TrainingRequest) => void;
  onApproveRequest: (reqId: string, note?: string) => void;
  onRejectRequest: (reqId: string, note: string) => void;
  cgpmpAccountRequests?: CgpmpAccountCreationRequest[];
  onApproveCgpmpAccountRequest?: (req: CgpmpAccountCreationRequest, note?: string) => Promise<void>;
  onRejectCgpmpAccountRequest?: (req: CgpmpAccountCreationRequest, reason: string) => Promise<void>;
  onOpenCgpmpRegistrationPage?: () => void;
  preselectedCourse?: CourseModule | null;
  onClearPreselectedCourse?: () => void;
  onSelectSubCategoryForBreadcrumb?: (cat: string | null) => void;
}

export const CgpmpWorkflowBoard: React.FC<CgpmpWorkflowBoardProps> = ({
  requests,
  courses,
  currentProfile,
  onSubmitRequest,
  onApproveRequest,
  onRejectRequest,
  cgpmpAccountRequests = [],
  onApproveCgpmpAccountRequest,
  onRejectCgpmpAccountRequest,
  onOpenCgpmpRegistrationPage,
  preselectedCourse,
  onClearPreselectedCourse,
  onSelectSubCategoryForBreadcrumb
}) => {
  const [activeBoardView, setActiveBoardView] = useState<'training_requests' | 'account_creations'>('account_creations');
  const [processingAccountId, setProcessingAccountId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'Tous' | 'En attente' | 'Approuvé par DFAT' | 'Rejeté'>('Tous');
  const [filterMinistry, setFilterMinistry] = useState<string>('Toutes les entités');
  const [reviewingReqId, setReviewingReqId] = useState<string | null>(null);
  const [dfatDecisionNote, setDfatDecisionNote] = useState('');

  // Form states for new CGPMP request (inline in Left Column, no modal)
  const [selectedModuleId, setSelectedModuleId] = useState(courses[0]?.id || 'mod-1');
  const [celluleName, setCelluleName] = useState(currentProfile.institution || 'Ministère des Infrastructures et Travaux Publics');
  const [participantsCount, setParticipantsCount] = useState(12);
  const [requestedDate, setRequestedDate] = useState('2025-05-15');
  const [justification, setJustification] = useState('');

  useEffect(() => {
    if (preselectedCourse) {
      setSelectedModuleId(preselectedCourse.id);
      setActiveBoardView('training_requests');
      if (onClearPreselectedCourse) {
        onClearPreselectedCourse();
      }
    }
  }, [preselectedCourse, onClearPreselectedCourse]);

  useEffect(() => {
    if (onSelectSubCategoryForBreadcrumb) {
      onSelectSubCategoryForBreadcrumb(filterStatus === 'Tous' ? null : `Statut : ${filterStatus}`);
    }
  }, [filterStatus, onSelectSubCategoryForBreadcrumb]);

  const isDfat = currentProfile.role === 'dfat_admin' || currentProfile.role === 'armp_agent';

  const ministries = useMemo(() => {
    const set = new Set<string>(['Toutes les entités']);
    requests.forEach((r) => set.add(r.ministereOrEntite));
    return Array.from(set);
  }, [requests]);

  const filteredRequests = requests.filter((r) => {
    const matchStatus = filterStatus === 'Tous' || r.status === filterStatus;
    const matchMinistry = filterMinistry === 'Toutes les entités' || r.ministereOrEntite === filterMinistry;
    return matchStatus && matchMinistry;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mod = courses.find((c) => c.id === selectedModuleId) || courses[0];
    if (!mod) return;

    const newReq: TrainingRequest = {
      id: `REQ-2025-0${requests.length + 12}`,
      cgpmpCellule: `CGPMP - ${celluleName}`,
      ministereOrEntite: celluleName,
      applicantName: currentProfile.name,
      applicantEmail: currentProfile.email,
      moduleId: mod.id,
      moduleTitle: mod.title,
      participantsCount: Number(participantsCount),
      justification:
        justification ||
        'Renforcement des capacités techniques des membres de la CGPMP dans le cadre du Plan de Passation des Marchés.',
      requestedDate,
      status: 'En attente',
      createdAt: new Date().toLocaleDateString('fr-FR')
    };

    onSubmitRequest(newReq);
    setJustification('');
  };

  const pendingCount = requests.filter((r) => r.status === 'En attente').length;
  const approvedCount = requests.filter((r) => r.status === 'Approuvé par DFAT').length;
  const rejectedCount = requests.filter((r) => r.status === 'Rejeté').length;
  const pendingAccountsCount = cgpmpAccountRequests.filter(
    (r) => r.status === 'En attente de validation ARMP'
  ).length;

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* =================================================================== */}
      {/* COLUMN 1 (LEFT — 6 COLS ÉGALES 50%): NAVIGATION, COMPTE CGPMP & FORM */}
      {/* =================================================================== */}
      <div className="lg:col-span-6 space-y-5">
        {/* Inline Mode Switcher */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveBoardView('account_creations')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-between gap-2 cursor-pointer ${
              activeBoardView === 'account_creations'
                ? 'bg-[#0C3B7C] text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">Comptes CGPMP & Mails</span>
            </span>
            {pendingAccountsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] shrink-0">
                {pendingAccountsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveBoardView('training_requests')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-between gap-2 cursor-pointer ${
              activeBoardView === 'training_requests'
                ? 'bg-[#0C3B7C] text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-1.5 truncate">
              <Layers className="w-4 h-4 shrink-0" />
              <span className="truncate">Sessions Formation ({requests.length})</span>
            </span>
          </button>
        </div>

        {/* Direct Action: Open Full-Width 2-Column CGPMP Account Creation (Secrétaire Permanent) */}
        {onOpenCgpmpRegistrationPage && (
          <div className="p-5 rounded-2xl bg-[#08244D] text-white border border-blue-900 space-y-3">
            <div className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
              Procédure CGPMP • Décret n° 10/32
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              Seul le <strong>Secrétaire Permanent</strong> peut créer le compte CGPMP en joignant le <strong>document portant création de la cellule</strong> et la <strong>liste des membres (noms complets et emails)</strong>. Les coordonnées d’authentification sont envoyées par mail dès validation par l’Administration ARMP.
            </p>
            <button
              type="button"
              onClick={onOpenCgpmpRegistrationPage}
              className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ouvrir la Fenêtre Création de Compte CGPMP (2 Colonnes)</span>
            </button>
          </div>
        )}

        {/* Inline Form to Submit a CGPMP Training Session Request (Sans Modal) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            Nouvelle Demande de Session de Formation CGPMP
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Module de Formation Sollicité *
              </label>
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ministère ou Entité Contractante *
              </label>
              <input
                type="text"
                value={celluleName}
                onChange={(e) => setCelluleName(e.target.value)}
                required
                placeholder="Ex: Ministère des Infrastructures et Travaux Publics"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Effectif (Membres CGPMP)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={participantsCount}
                  onChange={(e) => setParticipantsCount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Date Souhaitée
                </label>
                <input
                  type="date"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Justification Opérationnelle *
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                required
                rows={3}
                placeholder="Précisez les projets de marchés concernés et les besoins de renforcement..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#0C3B7C] hover:bg-blue-800 text-white font-extrabold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transmettre la Demande à la DFAT</span>
            </button>
          </form>
        </div>

        {/* Status Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setActiveBoardView('training_requests');
              setFilterStatus('Tous');
            }}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left cursor-pointer"
          >
            <span className="text-[11px] font-bold text-slate-500 block">Total</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{requests.length}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveBoardView('training_requests');
              setFilterStatus('En attente');
            }}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left cursor-pointer"
          >
            <span className="text-[11px] font-bold text-amber-600 block">En attente</span>
            <span className="text-lg font-black text-amber-600">{pendingCount}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveBoardView('training_requests');
              setFilterStatus('Approuvé par DFAT');
            }}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left cursor-pointer"
          >
            <span className="text-[11px] font-bold text-emerald-600 block">Approuvés</span>
            <span className="text-lg font-black text-emerald-600">{approvedCount}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveBoardView('training_requests');
              setFilterStatus('Rejeté');
            }}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left cursor-pointer"
          >
            <span className="text-[11px] font-bold text-red-600 block">Rejetés</span>
            <span className="text-lg font-black text-red-600">{rejectedCount}</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* COLUMN 2 (RIGHT — 6 COLS ÉGALES 50%): VALIDATION ARMP OU SESSIONS */}
      {/* =================================================================== */}
      <div className="lg:col-span-6 space-y-4">
        {activeBoardView === 'account_creations' ? (
          <CgpmpAdminValidationPanel
            requests={cgpmpAccountRequests}
            isProcessingId={processingAccountId}
            onApproveRequest={async (req, note) => {
              if (!onApproveCgpmpAccountRequest) return;
              setProcessingAccountId(req.id);
              try {
                await onApproveCgpmpAccountRequest(req, note);
              } finally {
                setProcessingAccountId(null);
              }
            }}
            onRejectRequest={async (req, reason) => {
              if (!onRejectCgpmpAccountRequest) return;
              setProcessingAccountId(req.id);
              try {
                await onRejectCgpmpAccountRequest(req, reason);
              } finally {
                setProcessingAccountId(null);
              }
            }}
          />
        ) : (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                {(['Tous', 'En attente', 'Approuvé par DFAT', 'Rejeté'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                      filterStatus === st
                        ? 'bg-[#0C3B7C] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {st} ({st === 'Tous' ? requests.length : requests.filter((r) => r.status === st).length})
                  </button>
                ))}
              </div>

              <select
                value={filterMinistry}
                onChange={(e) => setFilterMinistry(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 font-bold"
              >
                {ministries.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Training Requests List */}
            <div className="space-y-3">
              {filteredRequests.map((req) => {
                const isReviewing = reviewingReqId === req.id;
                return (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400">
                            {req.id}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">{req.createdAt}</span>
                        </div>
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-0.5">
                          {req.cgpmpCellule}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Demandeur : {req.applicantName} ({req.applicantEmail})
                        </p>
                      </div>

                      <div>
                        {req.status === 'En attente' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                            <Clock className="w-3.5 h-3.5" />
                            <span>En attente DFAT</span>
                          </span>
                        )}
                        {req.status === 'Approuvé par DFAT' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Visa DFAT Accordé</span>
                          </span>
                        )}
                        {req.status === 'Rejeté' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-300">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rejeté</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 block font-bold text-[10px]">Module</span>
                        <span className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {req.moduleTitle}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 block font-bold text-[10px]">Effectif</span>
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          <span>{req.participantsCount} membres</span>
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 block font-bold text-[10px]">Date souhaitée</span>
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          <span>{req.requestedDate}</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">Justification : </strong>
                      {req.justification}
                    </div>

                    {req.dfatNote && (
                      <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200">
                        <strong className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>Décision DFAT ({req.decidedAt}) :</span>
                        </strong>
                        <p className="italic mt-0.5">"{req.dfatNote}"</p>
                      </div>
                    )}

                    {/* Inline DFAT Decision Controls (No Modal) */}
                    {isDfat && req.status === 'En attente' && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        {isReviewing ? (
                          <div className="space-y-2.5">
                            <input
                              type="text"
                              value={dfatDecisionNote}
                              onChange={(e) => setDfatDecisionNote(e.target.value)}
                              placeholder="Note de motivation DFAT..."
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setReviewingReqId(null)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500"
                              >
                                Annuler
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onRejectRequest(
                                    req.id,
                                    dfatDecisionNote || 'Rejeté pour ajustement du plan.'
                                  );
                                  setReviewingReqId(null);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-red-100 text-red-700 font-bold text-xs cursor-pointer"
                              >
                                Refuser
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onApproveRequest(
                                    req.id,
                                    dfatDecisionNote || 'Visa formel accordé par la DFAT.'
                                  );
                                  setReviewingReqId(null);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                              >
                                Délivrer le Visa DFAT
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setReviewingReqId(req.id);
                                setDfatDecisionNote(
                                  'Dossier conforme aux priorités nationales du plan de formation ARMP.'
                                );
                              }}
                              className="px-4 py-2 rounded-xl bg-[#0C3B7C] text-white font-bold text-xs cursor-pointer"
                            >
                              Instruire & Statuer (DFAT)
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredRequests.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  Aucune demande trouvée pour ce statut ou cette entité.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
