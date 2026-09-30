import React from 'react';
import { Award, TrendingUp, BookOpen, CheckCircle2, Star, Target, Zap } from 'lucide-react';
import { UserProfile, CourseModule } from '../types';
import { COURSES_DATA } from '../data/coursesData';

export function getEvolutionMeta(profile: UserProfile, totalCoursesCount?: number) {
  if (!profile) return { completed: 0, certs: 0, total: 0, level: 'Non évalué' as any, nextLevel: 'Débutant', progress: 10, toNext: 1, pctCourses: 0, score: 0 };
  const completed = profile.completedCourseIds ? profile.completedCourseIds.length : (profile.completedModulesCount ?? 0);
  const certs = profile.certificates ? profile.certificates.length : profile.certificationsCount;
  const score = profile.placementScore ?? 0;
  const total = totalCoursesCount || COURSES_DATA.length;

  let level: UserProfile['level'] = profile.level;
  let nextLevel: string = '';
  let progress = 0;
  let toNext = 0;

  // Évolution MasterStudy — paliers
  if (level === 'Non évalué') { nextLevel = 'Débutant'; toNext = 1 - completed; progress = Math.min(20, completed * 20); }
  else if (level === 'Débutant') { nextLevel = 'Intermédiaire'; toNext = Math.max(0, 2 - completed); progress = (completed / 2) * 40; }
  else if (level === 'Intermédiaire') { nextLevel = 'Avancé'; toNext = Math.max(0, 4 - completed); progress = 40 + ((completed - 2) / 2) * 30; }
  else if (level === 'Avancé') { nextLevel = 'Expert'; toNext = Math.max(0, 6 - completed); progress = 70 + ((completed - 4) / 2) * 30; }
  else { nextLevel = 'Expert+'; progress = 100; }

  progress = Math.max(5, Math.min(100, Math.round(progress + (certs * 2) + (score > 80 ? 5 : 0))));

  const pctCourses = Math.round((completed / total) * 100);
  return { completed, certs, total, level, nextLevel, progress, toNext, pctCourses, score };
}

export const LearningEvolution: React.FC<{ profile: UserProfile; compact?: boolean }> = ({ profile, compact }) => {
  const m = getEvolutionMeta(profile);
  const levelColor = (lvl: string) => {
    if (lvl === 'Expert') return 'bg-amber-500 text-white';
    if (lvl === 'Avancé') return 'bg-blue-600 text-white';
    if (lvl === 'Intermédiaire') return 'bg-purple-600 text-white';
    if (lvl === 'Débutant') return 'bg-emerald-600 text-white';
    return 'bg-slate-500 text-white';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-[#E4E6EB] dark:border-slate-800 rounded-full px-2.5 py-1">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${levelColor(m.level)}`}>{m.level}</span>
        <div className="w-16 h-1.5 bg-[#F0F2F5] dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-[#0866FF]" style={{ width: `${m.progress}%` }} /></div>
        <span className="text-[11px] font-bold text-[#050505] dark:text-white">{m.progress}%</span>
        <span className="text-[11px] text-[#65676B] hidden sm:inline">{m.completed}/{m.total} modules</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E4E6EB] dark:border-slate-800 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-black text-sm text-[#050505] dark:text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#0866FF]" /> Niveau d'évolution</h4>
        <span className={`px-2.5 py-1 rounded-full text-xs font-black ${levelColor(m.level)}`}>{m.level}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px]"><span className="text-[#65676B]">Progression vers {m.nextLevel}</span><span className="font-bold text-[#0866FF]">{m.progress}%</span></div>
        <div className="h-2 bg-[#F0F2F5] dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#0866FF] to-indigo-600 transition-all" style={{ width: `${m.progress}%` }} /></div>
        <div className="flex items-center justify-between text-[11px] text-[#65676B]"><span>{m.completed}/{m.total} modules • {m.certs} certifs</span><span>{m.toNext > 0 ? `+${m.toNext} pour ${m.nextLevel}` : 'Niveau max'}</span></div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#F0F2F5] dark:bg-slate-800 rounded-xl p-2.5 text-center"><div className="flex items-center justify-center gap-1 text-[11px] text-[#65676B]"><BookOpen className="w-3.5 h-3.5" /> Modules</div><div className="font-black text-[#050505] dark:text-white">{m.completed}</div><div className="text-[10px] text-[#65676B]">{m.pctCourses}%</div></div>
        <div className="bg-[#F0F2F5] dark:bg-slate-800 rounded-xl p-2.5 text-center"><div className="flex items-center justify-center gap-1 text-[11px] text-[#65676B]"><Award className="w-3.5 h-3.5" /> Certifs</div><div className="font-black text-emerald-600">{m.certs}</div><div className="text-[10px] text-[#65676B]">DFAT</div></div>
        <div className="bg-[#F0F2F5] dark:bg-slate-800 rounded-xl p-2.5 text-center"><div className="flex items-center justify-center gap-1 text-[11px] text-[#65676B]"><Target className="w-3.5 h-3.5" /> Score</div><div className="font-black text-[#0866FF]">{m.score || '—'}%</div><div className="text-[10px] text-[#65676B]">Placement</div></div>
      </div>

      {m.toNext > 0 && (
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 flex items-center gap-2 text-xs">
          <Zap className="w-4 h-4 text-amber-600" /><span className="text-[#050505] dark:text-white"><b>{m.toNext} module{m.toNext>1?'s':''}</b> avant <b>{m.nextLevel}</b> — continuez !</span>
        </div>
      )}
    </div>
  );
};
