import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  FileText, 
  Send, 
  AlertCircle, 
  Users, 
  Calendar,
  Building2,
  Filter,
  Layers,
  Inbox,
  CheckCheck,
  AlertTriangle
} from 'lucide-react';
import { TrainingRequest, CourseModule, UserProfile } from '../types';

interface CgpmpWorkflowBoardProps {
  requests: TrainingRequest[];
  courses: CourseModule[];
  currentProfile: UserProfile;
  onSubmitRequest: (newReq: TrainingRequest) => void;
  onApproveRequest: (reqId: string, note?: string) => void;
  onRejectRequest: (reqId: string, note: string) => void;
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
  preselectedCourse,
  onClearPreselectedCourse,
  onSelectSubCategoryForBreadcrumb
}) => {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'Tous' | 'En attente' | 'Approuvé par DFAT' | 'Rejeté'>('Tous');
  const [filterMinistry, setFilterMinistry] = useState<string>('Tous');

  // Form State
  const [selectedModuleId, setSelectedModuleId] = useState(preselectedCourse?.id || 'MOD-002');
  const [celluleName, setCelluleName] = useState(currentProfile.institution);
  const [participantsCount, setParticipantsCount] = useState(15);
  const [requestedDate, setRequestedDate] = useState('2026-10-20');
  const [justification, setJustification] = useState('');

  // DFAT Review Modal state
  const [reviewingReq, setReviewingReq] = useState<TrainingRequest | null>(null);
  const [dfatDecisionNote, setDfatDecisionNote] = useState('');

  const isDfat = currentProfile.role === 'dfat_admin';
  const isCgpmp = currentProfile.role === 'cgpmp_member';

  // Breadcrumb synchronization
  useEffect(() => {
    if (onSelectSubCategoryForBreadcrumb) {
      if (filterStatus !== 'Tous') {
        onSelectSubCategoryForBreadcrumb(`Statut : ${filterStatus}`);
      } else if (filterMinistry !== 'Tous') {
        onSelectSubCategoryForBreadcrumb(`Entité : ${filterMinistry}`);
      } else {
        onSelectSubCategoryForBreadcrumb(null);
      }
    }
  }, [filterStatus, filterMinistry]);

  // Unique list of ministries
  const ministries = useMemo(() => {
    const list = new Set<string>();
    requests.forEach(r => {
      if (r.ministereOrEntite) list.add(r.ministereOrEntite);
    });
    return ['Tous', ...Array.from(list)];
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchStatus = filterStatus === 'Tous' || r.status === filterStatus;
      const matchMinistry = filterMinistry === 'Tous' || r.ministereOrEntite === filterMinistry;
      return matchStatus && matchMinistry;
    });
  }, [requests, filterStatus, filterMinistry]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const foundModule = courses.find((c) => c.id === selectedModuleId);

    const newReq: TrainingRequest = {
      id: `REQ-2026-${Math.floor(100 + Math.random() * 900)}`,
      cgpmpCellule: `CGPMP - ${celluleName}`,
      ministereOrEntite: celluleName,
      applicantName: currentProfile.name,
      applicantEmail: currentProfile.email,
      moduleId: selectedModuleId,
      moduleTitle: foundModule?.title || 'Module de formation',
      participantsCount,
      justification,
      requestedDate,
      status: 'En attente',
      createdAt: 'À l’instant'
    };

    onSubmitRequest(newReq);
    setShowSubmitModal(false);
    setJustification('');
    if (onClearPreselectedCourse) onClearPreselectedCourse();
  };

  const pendingCount = requests.filter(r => r.status === 'En attente').length;
  const approvedCount = requests.filter(r => r.status === 'Approuvé par DFAT').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejeté').length;

  return (
    <div className="space-y-6">
      
      {/* Workflow Explanation Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-purple-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-purple-400/20 text-purple-300">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
              Workflow Institutionnel • Validation Préalable DFAT
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white">
            Gestion & Visa des Demandes de Modules CGPMP
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Conformément aux directives de l'ARMP, toute session de formation groupée destinée aux Cellules de Gestion des Projets et des Marchés Publics (CGPMP) fait l'objet d'un examen et d'un visa préalable par le <strong>Directeur de la Formation et de l'Appui Technique (DFAT)</strong>.
          </p>
        </div>

        <div className="flex-shrink-0 w-full md:w-auto">
          <button
            onClick={() => setShowSubmitModal(true)}
            className="w-full md:w-auto justify-center flex items-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Soumettre une Demande CGPMP</span>
          </button>
        </div>
      </div>

      {/* Structured Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilterStatus('Tous')}
          className={`p-4 rounded-2xl border cursor-pointer transition shadow-2xs ${
            filterStatus === 'Tous'
              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Demandes</span>
            <Inbox className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{requests.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Toutes institutions confondues</p>
        </div>

        <div 
          onClick={() => setFilterStatus('En attente')}
          className={`p-4 rounded-2xl border cursor-pointer transition shadow-2xs ${
            filterStatus === 'En attente'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">En Instruction DFAT</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">En attente d'arbitrage</p>
        </div>

        <div 
          onClick={() => setFilterStatus('Approuvé par DFAT')}
          className={`p-4 rounded-2xl border cursor-pointer transition shadow-2xs ${
            filterStatus === 'Approuvé par DFAT'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Visas Accordés</span>
            <CheckCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{approvedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Sessions programmées</p>
        </div>

        <div 
          onClick={() => setFilterStatus('Rejeté')}
          className={`p-4 rounded-2xl border cursor-pointer transition shadow-2xs ${
            filterStatus === 'Rejeté'
              ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 dark:text-red-400">Réserves / Rejets</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{rejectedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Nécessite ajustement</p>
        </div>
      </div>

      {/* Filter Tabs & Ministry Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar text-xs pb-1 sm:pb-0">
          {(['Tous', 'En attente', 'Approuvé par DFAT', 'Rejeté'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st} ({
                st === 'Tous'
                  ? requests.length
                  : requests.filter((r) => r.status === st).length
              })
            </button>
          ))}
        </div>

        <div className="flex flex-col xs:flex-row sm:flex-row items-stretch xs:items-center gap-2 text-xs w-full sm:w-auto">
          <span className="text-slate-700 dark:text-slate-400 font-bold shrink-0">Filtrer par entité :</span>
          <select
            value={filterMinistry}
            onChange={(e) => setFilterMinistry(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 sm:py-1.5 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs w-full sm:w-auto"
          >
            {ministries.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests Table / Cards */}
      <div className="space-y-3">
        {filteredRequests.map((req) => {
          let statusBadge = (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              <Clock className="w-3.5 h-3.5" />
              <span>En attente de visa DFAT</span>
            </span>
          );

          if (req.status === 'Approuvé par DFAT') {
            statusBadge = (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Visa DFAT Accordé</span>
              </span>
            );
          } else if (req.status === 'Rejeté') {
            statusBadge = (
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
                <XCircle className="w-3.5 h-3.5" />
                <span>Rejeté avec motif</span>
              </span>
            );
          }

          return (
            <div
              key={req.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-300 dark:hover:border-purple-800 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    {req.id}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {req.cgpmpCellule}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      Demandeur : {req.applicantName} ({req.applicantEmail}) • {req.createdAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {statusBadge}
                </div>
              </div>

              {/* Module & Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 block font-bold text-[11px]">Module Sollicité</span>
                  <span className="font-bold text-slate-900 dark:text-slate-200 mt-0.5 block line-clamp-1">
                    {req.moduleTitle}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 block font-bold text-[11px]">Effectif Prévu</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span>{req.participantsCount} agents et experts</span>
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block font-semibold text-[11px]">Date Souhaitée</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{req.requestedDate}</span>
                  </span>
                </div>
              </div>

              {/* Motivation */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-slate-100 mr-1">Justification :</span>
                {req.justification}
              </div>

              {/* Decision Note if exists */}
              {req.dfatNote && (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 text-xs text-purple-900 dark:text-purple-200 space-y-1">
                  <span className="font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Avis Motivé du DFAT ({req.decidedAt}) :</span>
                  </span>
                  <p className="italic pl-4">"{req.dfatNote}"</p>
                </div>
              )}

              {/* DFAT Review Actions */}
              {isDfat && req.status === 'En attente' && (
                <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setReviewingReq(req);
                      setDfatDecisionNote('Dossier conforme aux priorités nationales du plan de formation ARMP.');
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition"
                  >
                    Instruire & Statuer (DFAT)
                  </button>
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

      {/* DFAT Review Decision Modal */}
      {reviewingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Décision d'Habilitation DFAT • {reviewingReq.id}
                </h3>
              </div>
              <button
                onClick={() => setReviewingReq(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                <strong>Entité :</strong> {reviewingReq.cgpmpCellule}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>Module :</strong> {reviewingReq.moduleTitle}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                <strong>Effectif prévu :</strong> {reviewingReq.participantsCount} auditeurs
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Note de motivation / Recommandations techniques du DFAT :
              </label>
              <textarea
                value={dfatDecisionNote}
                onChange={(e) => setDfatDecisionNote(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  onRejectRequest(reviewingReq.id, dfatDecisionNote || 'Demande rejetée pour non-conformité au plan triennal.');
                  setReviewingReq(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/50 dark:text-red-300 font-bold text-xs transition"
              >
                Refuser le Visa
              </button>

              <button
                onClick={() => {
                  onApproveRequest(reviewingReq.id, dfatDecisionNote || 'Visa formel accordé. Programmation des formateurs ARMP.');
                  setReviewingReq(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
              >
                Délivrer le Visa DFAT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Nouvelle Requête de Formation CGPMP
                </h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Module de Formation Sollicité :
                </label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.code}] {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ministère ou Entité Contractante :
                </label>
                <input
                  type="text"
                  value={celluleName}
                  onChange={(e) => setCelluleName(e.target.value)}
                  required
                  placeholder="Ex: Ministère des Infrastructures et Travaux Publics"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Effectif (Agents CGPMP) :
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={participantsCount}
                    onChange={(e) => setParticipantsCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date Prévisionnelle :
                  </label>
                  <input
                    type="date"
                    value={requestedDate}
                    onChange={(e) => setRequestedDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Justification et Contexte Opérationnel :
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  required
                  rows={3}
                  placeholder="Précisez les projets de marchés concernés, les blocages rencontrés ou les nécessités de mise à niveau..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-[11px] leading-relaxed">
                <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                Votre demande sera immédiatement soumise au Directeur de la Formation et de l'Appui Technique (DFAT) pour arbitrage budgétaire et programmation d'experts certifiés.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmettre au DFAT</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
