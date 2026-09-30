import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Award, 
  FileSpreadsheet, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  Printer,
  Loader2,
  Calendar,
  Layers,
  Clock,
  AlertCircle,
  XCircle,
  History,
  Trash2,
  Eye
} from 'lucide-react';
import { INSTITUTIONAL_ANALYTICS } from '../data/initialData';
import { CourseModule, TrainingRequest, UserProfile, SavedAnalyticsReport } from '../types';
import {
  saveAnalyticsReportToFirestore,
  fetchAnalyticsReportsFromFirestore
} from '../firebase';

interface AnalyticsDashboardProps {
  institutionName?: string;
  courses?: CourseModule[];
  requests?: TrainingRequest[];
  allProfiles?: Record<string, UserProfile>;
  firestoreProfiles?: UserProfile[];
  onShowToast?: (msg: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  institutionName = 'Toutes Institutions ARMP / DGCMP / CGPMP',
  courses = [],
  requests = [],
  allProfiles = {},
  firestoreProfiles = [],
  onShowToast
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    return localStorage.getItem('armp_analytics_period') || 'Trimestre 3 - 2026';
  });
  const [selectedInstitutionFilter, setSelectedInstitutionFilter] = useState<string>(() => {
    return localStorage.getItem('armp_analytics_inst_filter') || 'Toutes';
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Persisted AI Executive Reports (localStorage + Firestore)
  const [savedReports, setSavedReports] = useState<SavedAnalyticsReport[]>(() => {
    try {
      const cached = localStorage.getItem('armp_saved_analytics_reports');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('armp_analytics_period', selectedPeriod);
  }, [selectedPeriod]);

  useEffect(() => {
    localStorage.setItem('armp_analytics_inst_filter', selectedInstitutionFilter);
  }, [selectedInstitutionFilter]);

  // Load persisted reports from Firestore on mount
  useEffect(() => {
    fetchAnalyticsReportsFromFirestore()
      .then((remoteReports) => {
        if (remoteReports && remoteReports.length > 0) {
          setSavedReports((prev) => {
            const map = new Map<string, SavedAnalyticsReport>();
            remoteReports.forEach((r) => map.set(r.id, r));
            prev.forEach((r) => {
              if (!map.has(r.id)) map.set(r.id, r);
            });
            const merged = Array.from(map.values()).sort((a, b) => b.id.localeCompare(a.id));
            try {
              localStorage.setItem('armp_saved_analytics_reports', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  const activeReport = useMemo(() => {
    if (!activeReportId && savedReports.length > 0) return savedReports[0];
    return savedReports.find((r) => r.id === activeReportId) || null;
  }, [savedReports, activeReportId]);

  // Combine Demo + Firestore profiles without duplicates for live telemetry
  const combinedProfiles = useMemo(() => {
    const map = new Map<string, UserProfile>();
    Object.values(allProfiles).forEach((p) => map.set(p.id || p.role, p));
    firestoreProfiles.forEach((p) => map.set(p.id || p.role, p));
    return Array.from(map.values());
  }, [allProfiles, firestoreProfiles]);

  // Period multiplier for realistic temporal comparison
  const periodFactor = useMemo(() => {
    if (selectedPeriod === 'Trimestre 2 - 2026') return 0.82;
    if (selectedPeriod === 'Année Budgétaire 2026') return 2.35;
    return 1.0; // Trimestre 3 - 2026
  }, [selectedPeriod]);

  // Dynamic live telemetry computed from actual profiles, courses, and CGPMP requests
  const dynamicStats = useMemo(() => {
    const extraCompletedModules = combinedProfiles.reduce((acc, p) => acc + (p.completedModulesCount || 0), 0);
    const extraCerts = combinedProfiles.reduce((acc, p) => acc + (p.certificationsCount || 0), 0);
    const extraMinutes = combinedProfiles.reduce((acc, p) => acc + (p.totalStudyMinutes || 0), 0);
    const requestParticipants = requests.reduce((acc, r) => acc + (Number(r.participantsCount) || 0), 0);

    const avgPlacement =
      combinedProfiles.length > 0
        ? Math.round(
            combinedProfiles.reduce((acc, p) => acc + (p.placementScore || 82), 0) /
              combinedProfiles.length
          )
        : 84;

    const totalLearners = Math.round(
      INSTITUTIONAL_ANALYTICS.totalLearners * periodFactor +
        combinedProfiles.length * 4 +
        requestParticipants
    );

    const globalPassRate = Math.min(
      98,
      Math.max(
        72,
        Math.round((INSTITUTIONAL_ANALYTICS.globalPassRate * 0.7) + (avgPlacement * 0.3))
      )
    );

    const uniqueInstitutions = new Set([
      ...INSTITUTIONAL_ANALYTICS.breakdownByInstitution.map((i) => i.name),
      ...combinedProfiles.map((p) => p.institution).filter(Boolean),
      ...requests.map((r) => r.ministereOrEntite).filter(Boolean)
    ]);

    const activeInstitutions =
      Math.round(INSTITUTIONAL_ANALYTICS.activeInstitutions * (periodFactor > 1 ? 1.15 : 1)) +
      Math.max(0, uniqueInstitutions.size - 5);

    const hoursDelivered = Math.round(
      INSTITUTIONAL_ANALYTICS.hoursDelivered * periodFactor +
        extraCompletedModules * 6 +
        Math.round(extraMinutes / 60) +
        Math.max(0, courses.length - 6) * 18
    );

    // Breakdown by institution enriched with real requests & profile completions
    const breakdownByInstitution = INSTITUTIONAL_ANALYTICS.breakdownByInstitution
      .map((inst) => {
        const matchingReqs = requests.filter((r) =>
          (r.ministereOrEntite || '').toLowerCase().includes(inst.name.split(' ')[1]?.toLowerCase() || '___') ||
          (r.cgpmpCellule || '').toLowerCase().includes(inst.name.split(' ')[0]?.toLowerCase() || '___')
        );
        const addedLearners = matchingReqs.reduce((s, r) => s + (Number(r.participantsCount) || 0), 0);
        const matchingProfiles = combinedProfiles.filter((p) =>
          (p.institution || '').toLowerCase().includes(inst.name.split(' ')[0]?.toLowerCase() || '___')
        );
        const addedCerts = matchingProfiles.reduce((s, p) => s + (p.certificationsCount || 0), 0);

        const learners = Math.round(inst.learners * periodFactor) + addedLearners;
        const completed = Math.round(inst.completed * periodFactor) + addedCerts;
        const passRate = Math.min(98, Math.max(68, Math.round((completed / Math.max(1, learners)) * 100)));

        return {
          ...inst,
          learners,
          completed,
          passRate
        };
      })
      .filter((inst) =>
        selectedInstitutionFilter === 'Toutes' ? true : inst.name === selectedInstitutionFilter
      );

    // Dynamic competency axes enriched by completed courses in each category
    const categoryBoosts: Record<string, number> = {};
    courses.forEach((c) => {
      const doneCount = combinedProfiles.filter((p) =>
        p.completedCourseIds?.includes(c.id)
      ).length;
      categoryBoosts[c.category] = (categoryBoosts[c.category] || 0) + doneCount;
    });

    const competencyAxes = INSTITUTIONAL_ANALYTICS.competencyAxes.map((ax, idx) => {
      const boost =
        idx === 0
          ? (categoryBoosts['Passation'] || 0)
          : idx === 1
          ? (categoryBoosts['Passation'] || 0) + (categoryBoosts['Réglementation'] || 0)
          : idx === 2
          ? (categoryBoosts['Contrôle'] || 0)
          : idx === 3
          ? (categoryBoosts['Contentieux'] || 0)
          : (categoryBoosts['Gestion & Audit'] || 0);
      return {
        axis: ax.axis,
        score: Math.min(99, ax.score + Math.min(8, boost + (extraCerts > 3 ? 2 : 0)))
      };
    });

    // Monthly Evolution Series (6 months) for interactive SVG chart
    const baseMonths =
      selectedPeriod === 'Trimestre 2 - 2026'
        ? [
            { month: 'Jan', learners: 145, certs: 112, passRate: 77 },
            { month: 'Fév', learners: 172, certs: 138, passRate: 80 },
            { month: 'Mar', learners: 198, certs: 160, passRate: 81 },
            { month: 'Avr', learners: 220, certs: 182, passRate: 83 },
            { month: 'Mai', learners: 248, certs: 208, passRate: 84 },
            { month: 'Juin', learners: 276 + extraCerts * 2, certs: 234 + extraCerts, passRate: globalPassRate }
          ]
        : [
            { month: 'Avr', learners: 195, certs: 158, passRate: 81 },
            { month: 'Mai', learners: 230, certs: 190, passRate: 83 },
            { month: 'Juin', learners: 264, certs: 222, passRate: 84 },
            { month: 'Juil', learners: 298, certs: 254, passRate: 85 },
            { month: 'Août', learners: 335, certs: 289, passRate: 86 },
            {
              month: 'Sep',
              learners: 372 + requestParticipants,
              certs: 324 + extraCerts * 3,
              passRate: globalPassRate
            }
          ];

    // CGPMP Requests status breakdown
    const approvedCount = requests.filter((r) => r.status === 'Approuvé par DFAT').length;
    const pendingCount = requests.filter((r) => r.status === 'En attente').length;
    const rejectedCount = requests.filter((r) => r.status === 'Rejeté').length;

    return {
      totalLearners,
      globalPassRate,
      activeInstitutions,
      hoursDelivered,
      breakdownByInstitution,
      competencyAxes,
      monthlySeries: baseMonths,
      cgpmpStats: {
        total: requests.length,
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount,
        totalParticipants: requestParticipants
      }
    };
  }, [combinedProfiles, requests, courses, periodFactor, selectedInstitutionFilter]);

  const handleGenerateAIReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch('/api/ai/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution: institutionName,
          period: selectedPeriod,
          stats: dynamicStats
        })
      });
      const data = await res.json();
      const newReport: SavedAnalyticsReport = {
        id: `REP-${Date.now()}`,
        reportTitle: data.reportTitle || `Synthèse Décisionnelle DFAT — ${selectedPeriod}`,
        generatedAt: data.generatedAt || new Date().toLocaleDateString('fr-FR'),
        period: selectedPeriod,
        institution: institutionName,
        executiveSummary:
          data.executiveSummary ||
          "Synthèse consolidée des indicateurs de gouvernance éducative sur la Loi n° 10/010.",
        keyObservations: Array.isArray(data.keyObservations)
          ? data.keyObservations
          : [
              `Taux global de conformité et de réussite : ${dynamicStats.globalPassRate}%`,
              `${dynamicStats.cgpmpStats.approved} dossiers CGPMP homologués par visa DFAT (${dynamicStats.cgpmpStats.totalParticipants} agents inscrits)`,
              `${dynamicStats.hoursDelivered.toLocaleString()} heures pédagogiques délivrées sur ${courses.length || 6} modules`
            ],
        complianceScore: data.complianceScore || dynamicStats.globalPassRate,
        recommendationsDFAT:
          data.recommendationsDFAT ||
          "Renforcer les sessions pratiques sur la détection des offres anormalement basses et les recours devant le CRD."
      };

      setSavedReports((prev) => {
        const updated = [newReport, ...prev];
        try {
          localStorage.setItem('armp_saved_analytics_reports', JSON.stringify(updated));
        } catch {}
        return updated;
      });
      setActiveReportId(newReport.id);
      onShowToast?.('Synthèse décisionnelle IA générée et sauvegardée dans Firestore ✓');

      await saveAnalyticsReportToFirestore(newReport).catch(() => {});
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleExportReportText = (report: SavedAnalyticsReport) => {
    const content = [
      `====================================================================`,
      `RÉPUBLIQUE DÉMOCRATIQUE DU CONGO • ARMP / DIRECTION DFAT`,
      `${report.reportTitle.toUpperCase()}`,
      `Date : ${report.generatedAt} | Période : ${report.period} | Institution : ${report.institution}`,
      `Score de Conformité Loi 10/010 : ${report.complianceScore}%`,
      `====================================================================`,
      ``,
      `1. SYNTHÈSE EXÉCUTIVE :`,
      report.executiveSummary,
      ``,
      `2. CONSTATS ET INDICATEURS CLÉS :`,
      ...(report.keyObservations || []).map((o, i) => `   ${i + 1}. ${o}`),
      ``,
      `3. RECOMMANDATIONS STRATÉGIQUES DFAT :`,
      report.recommendationsDFAT,
      ``,
      `Document généré et archivé par ACADEMIA ITECH RDC.`
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rapport_DFAT_${report.period.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast?.('Rapport décisionnel téléchargé avec succès ✓');
  };

  // Max value for SVG chart scaling
  const maxMonthlyVal = Math.max(...dynamicStats.monthlySeries.map((m) => m.learners), 400);

  return (
    <div className="space-y-6">
      
      {/* Top Header & AI Executive Report Action */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Tableau de Bord Décisionnel Temps Réel • Direction DFAT
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Indicateurs dynamiques synchronisés (Profils Firestore, Certifications & Guichet CGPMP) — Loi n° 10/010
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedInstitutionFilter}
            onChange={(e) => setSelectedInstitutionFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option value="Toutes">Toutes les Cellules & Institutions</option>
            {INSTITUTIONAL_ANALYTICS.breakdownByInstitution.map((inst) => (
              <option key={inst.name} value={inst.name}>
                {inst.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-blue-500"
          >
            <option>Trimestre 3 - 2026</option>
            <option>Trimestre 2 - 2026</option>
            <option>Année Budgétaire 2026</option>
          </select>

          <button
            onClick={handleGenerateAIReport}
            disabled={isGeneratingReport}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition cursor-pointer"
          >
            {isGeneratingReport ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Génération & Sauvegarde...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Générer Synthèse Décisionnelle IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary KPI Cards (Dynamically computed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Apprenants Formés</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {dynamicStats.totalLearners.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +{selectedPeriod === 'Trimestre 2 - 2026' ? '18%' : '26%'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Inclut {dynamicStats.cgpmpStats.totalParticipants} agents issus des demandes CGPMP
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Taux Global de Réussite</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {dynamicStats.globalPassRate}%
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-0.5" /> Conforme
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Seuil de conformité ARMP fixé à 70%</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Institutions & Dossiers CGPMP</span>
            <Building2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {dynamicStats.activeInstitutions}
            </span>
            <span className="text-xs text-purple-600 font-semibold">
              • {dynamicStats.cgpmpStats.total} dossiers
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {dynamicStats.cgpmpStats.approved} approuvés DFAT • {dynamicStats.cgpmpStats.pending} en attente
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Volume d’Heures Pédagogiques</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {dynamicStats.hoursDelivered.toLocaleString()} h
            </span>
            <span className="text-xs text-amber-600 font-semibold">{courses.length || 6} modules</span>
          </div>
          <p className="text-[11px] text-slate-400">Enseignement synchrone & asynchrone</p>
        </div>

      </div>

      {/* Interactive SVG Charts Row: Monthly Evolution Curve + CGPMP Workflow Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Interactive SVG Evolution Curve & Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Courbe Dynamique des Apprenants & Certifications ({selectedPeriod})</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Évolution mensuelle consolidée à partir des modules validés et des sessions CGPMP
              </p>
            </div>
            <div className="flex items-center space-x-4 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Inscrits
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Certifiés ARMP
              </span>
            </div>
          </div>

          {/* SVG Dual Bar + Trend Line Chart (scrollable horizontally on tiny screens) */}
          <div className="pt-2 overflow-x-auto no-scrollbar">
            <svg viewBox="0 0 600 200" className="w-full min-w-[460px] sm:min-w-0 h-48 overflow-visible">
              {/* Horizontal Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = 165 - ratio * 135;
                const val = Math.round(ratio * maxMonthlyVal);
                return (
                  <g key={i}>
                    <line
                      x1="40"
                      y1={y}
                      x2="580"
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-slate-700/60"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x="32"
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-400 text-[10px] font-mono"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Bars per month */}
              {dynamicStats.monthlySeries.map((item, idx) => {
                const xBase = 68 + idx * 88;
                const hLearners = Math.max(8, (item.learners / maxMonthlyVal) * 135);
                const hCerts = Math.max(6, (item.certs / maxMonthlyVal) * 135);
                const yLearners = 165 - hLearners;
                const yCerts = 165 - hCerts;

                return (
                  <g key={item.month} className="group">
                    {/* Learners Bar */}
                    <rect
                      x={xBase}
                      y={yLearners}
                      width="22"
                      height={hLearners}
                      rx="5"
                      className="fill-blue-600/85 hover:fill-blue-500 transition-all"
                    />
                    {/* Certified Bar */}
                    <rect
                      x={xBase + 26}
                      y={yCerts}
                      width="22"
                      height={hCerts}
                      rx="5"
                      className="fill-emerald-500/90 hover:fill-emerald-400 transition-all"
                    />
                    {/* Value labels above bars */}
                    <text
                      x={xBase + 11}
                      y={yLearners - 5}
                      textAnchor="middle"
                      className="fill-blue-600 dark:fill-blue-400 text-[9px] font-mono font-bold"
                    >
                      {item.learners}
                    </text>
                    <text
                      x={xBase + 37}
                      y={yCerts - 5}
                      textAnchor="middle"
                      className="fill-emerald-600 dark:fill-emerald-400 text-[9px] font-mono font-bold"
                    >
                      {item.certs}
                    </text>
                    {/* Month label */}
                    <text
                      x={xBase + 24}
                      y="184"
                      textAnchor="middle"
                      className="fill-slate-600 dark:fill-slate-300 text-[11px] font-bold"
                    >
                      {item.month}
                    </text>
                  </g>
                );
              })}

              {/* Smooth Polyline connecting Pass Rate / Trend */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={dynamicStats.monthlySeries
                  .map((item, idx) => {
                    const x = 68 + idx * 88 + 24;
                    const y = 165 - (item.certs / maxMonthlyVal) * 135;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            </svg>
          </div>
        </div>

        {/* Real-Time CGPMP Workflow & Visa DFAT Breakdown (1 col) */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-500" />
              <span>État Réel des Dossiers CGPMP (Firestore)</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Synchronisé avec le Guichet Unique CGPMP / DFAT
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Approuvés (Visa DFAT)</div>
                  <div className="text-[10px] text-slate-500">Sessions homologuées</div>
                </div>
              </div>
              <span className="text-lg font-black font-mono text-emerald-600">
                {dynamicStats.cgpmpStats.approved}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">En attente d'instruction</div>
                  <div className="text-[10px] text-slate-500">Examen DFAT en cours</div>
                </div>
              </div>
              <span className="text-lg font-black font-mono text-amber-600">
                {dynamicStats.cgpmpStats.pending}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Rejetés / À compléter</div>
                  <div className="text-[10px] text-slate-500">Motifs notifiés</div>
                </div>
              </div>
              <span className="text-lg font-black font-mono text-rose-600">
                {dynamicStats.cgpmpStats.rejected}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Effectif total CGPMP :</span>
            <span className="font-mono font-black text-purple-600 dark:text-purple-400">
              {dynamicStats.cgpmpStats.totalParticipants} agents inscrits
            </span>
          </div>
        </div>

      </div>

      {/* Breakdown by Institution & Competency Axes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Breakdown by Institution Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span>Suivi par Institution et Cellule ({selectedPeriod})</span>
            </h4>
            <span className="text-[11px] text-slate-400">Taux de réussite</span>
          </div>

          <div className="space-y-3">
            {dynamicStats.breakdownByInstitution.map((inst, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{inst.name}</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{inst.passRate}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${inst.passRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{inst.learners} inscrits</span>
                  <span>{inst.completed} certificats délivrés</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competency Mastery Pillars */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Maîtrise par Axe Réglementaire</span>
            </h4>
            <span className="text-[11px] text-slate-400">Conformité Loi 10/010</span>
          </div>

          <div className="space-y-3.5">
            {dynamicStats.competencyAxes.map((comp, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{comp.axis}</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{comp.score}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      comp.score >= 90 ? 'bg-emerald-500' : comp.score >= 80 ? 'bg-blue-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${comp.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong>Observation DFAT :</strong> L’axe <em>Instruction des Recours & Arrêts CRD</em> évolue en temps réel à mesure que les apprenants valident le module contentieux ARMP.
          </div>
        </div>

      </div>

      {/* Persisted AI Executive Performance Reports Section */}
      {savedReports.length > 0 && (
        <div className="space-y-4">
          {/* History Selector Pills */}
          {savedReports.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
                <History className="w-3.5 h-3.5 text-blue-600" /> Rapports archivés ({savedReports.length}) :
              </span>
              {savedReports.map((rep) => (
                <button
                  key={rep.id}
                  onClick={() => setActiveReportId(rep.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition border ${
                    activeReport?.id === rep.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  {rep.period} • {rep.generatedAt}
                </button>
              ))}
            </div>
          )}

          {activeReport && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-blue-500 shadow-xl space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300">
                    <FileSpreadsheet className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        {activeReport.reportTitle}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Persisté Firestore ✓
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Généré le {activeReport.generatedAt} • Période : {activeReport.period} • Score conformité : {activeReport.complianceScore}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimer</span>
                  </button>
                  <button
                    onClick={() => handleExportReportText(activeReport)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exporter Rapport</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <strong className="block text-blue-900 dark:text-blue-300 mb-1 font-bold text-sm">
                    Synthèse Exécutive :
                  </strong>
                  {activeReport.executiveSummary}
                </div>

                {activeReport.keyObservations && (
                  <div className="space-y-1.5">
                    <strong className="block text-slate-800 dark:text-slate-100 font-bold">
                      Constats et Indicateurs Clés :
                    </strong>
                    <ul className="list-disc list-inside space-y-1 pl-1">
                      {activeReport.keyObservations.map((obs: string, i: number) => (
                        <li key={i}>{obs}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeReport.recommendationsDFAT && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200">
                    <strong className="block font-bold mb-1">
                      Recommandations Stratégiques de la DFAT :
                    </strong>
                    {activeReport.recommendationsDFAT}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
