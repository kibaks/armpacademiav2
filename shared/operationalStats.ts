import type { CourseModule, TrainingRequest, UserProfile } from '../src/types';
export const privileged = (role?: string) => ['super_admin', 'dfat_admin'].includes(role || '');
export const learner = (p: Partial<UserProfile>) => !['super_admin', 'dfat_admin', 'formateur'].includes(p.role || '');
export function courseActivity(p: Partial<UserProfile>, c: Pick<CourseModule, 'id' | 'code'>) {
  return [c.id, c.code].some(id => (p.registeredCourseIds || []).includes(id) || (p.assignedCourseIds || []).includes(id) || (p.completedCourseIds || []).includes(id) || (p.courseProgress?.[id] || 0) > 0 || (p.completedLessonsByCourse?.[id] || []).length > 0 || typeof p.quizScoresByCourse?.[id] === 'number') || p.certificates?.some(cert => cert.courseId === c.id) || false;
}
export function teaches(p: Partial<UserProfile>, c: Partial<CourseModule>) {
  return privileged(p.role) || p.role === 'formateur' && (c.authorId === p.id || c.trainerId === p.id || c.createdBy === p.id || [c.id, c.code].some(id => !!id && [...(p.registeredCourseIds || []), ...(p.assignedCourseIds || [])].includes(id)));
}
export function learnerCourse(p: UserProfile, c: CourseModule) {
  const certificate = p.certificates?.find(cert => cert.courseId === c.id);
  const completed = (p.completedLessonsByCourse?.[c.id] || []).filter(i => Number.isInteger(i) && i >= 0 && i < c.lessons.length);
  const progressPct = Math.min(100, Math.max(0, p.courseProgress?.[c.id] ?? p.courseProgress?.[c.code] ?? (p.completedCourseIds?.includes(c.id) ? 100 : Math.round(new Set(completed).size / Math.max(1, c.lessons.length) * 100))));
  return { profile: p, course: c, progressPct, completedLessonsCount: new Set(completed).size, quizScore: p.quizScoresByCourse?.[c.id] ?? certificate?.score ?? 0, isCertified: !!certificate, studyTime: `${Math.round(p.studyMinutesByCourse?.[c.id] || 0)} min`, lastActive: p.recentReadings?.find(r => r.courseId === c.id)?.readAt || 'Aucune activité enregistrée', status: certificate ? 'certified' as const : progressPct < 40 ? 'needs_help' as const : 'in_progress' as const };
}
export function periodBounds(period: string, now = new Date()) {
  if (period === 'Toutes les périodes') return { start: 0, end: Infinity };
  const match = period.match(/^(?:Trimestre ([1-4]) - |Année Budgétaire )(\d{4})$/);
  if (!match) throw new Error('Période invalide.');
  const year = +match[2], month = match[1] ? (+match[1] - 1) * 3 : 0;
  return { start: Date.UTC(year, month), end: Date.UTC(year, month + (match[1] ? 3 : 12)) };
}
export function operationalAnalytics(profiles: UserProfile[], courses: CourseModule[], requests: TrainingRequest[], period: string, institution = 'Toutes', now = new Date()) {
  const { start, end } = periodBounds(period, now);
  const within = (v?: string) => { const t = v ? Date.parse(v) : NaN; return Number.isFinite(t) && t >= start && t < end; };
  const scoped = profiles.filter(learner).filter(p => institution === 'Toutes' || p.institution === institution);
  const selected = period === 'Toutes les périodes' ? scoped : scoped.filter(p => within(p.joinDate) || within(p.lastReadAt) || within(p.lastActiveDate) || p.certificates?.some(c => within(c.issuedAt)));
  const certs = scoped.flatMap(p => (p.certificates || []).filter(c => period === 'Toutes les périodes' || within(c.issuedAt)));
  const scores = selected.flatMap(p => Object.values(p.quizScoresByCourse || {})).filter(Number.isFinite);
  const institutional = Array.from(new Set(scoped.map(p => p.institution).filter(Boolean))).sort();
  const breakdownByInstitution = institutional.map(name => { const ps = selected.filter(p => p.institution === name); const completed = ps.filter(p => p.certificates?.some(c => period === 'Toutes les périodes' || within(c.issuedAt))).length; return { name, learners: ps.length, completed, passRate: ps.length ? Math.round(completed / ps.length * 100) : 0 }; });
  // Study timers have dates; legacy totals cannot be attributed to a quarter.
  const minutes = selected.reduce((sum, p) => sum + (period === 'Toutes les périodes' ? Math.max(0, p.totalStudyMinutes || 0) : Object.entries(p.studyMinutesByDay || {}).reduce((s, [day, n]) => s + (within(day) ? Math.max(0, n) : 0), 0)), 0);
  const filteredRequests = requests.filter(r => (institution === 'Toutes' || r.ministereOrEntite === institution) && (period === 'Toutes les périodes' || within(r.createdAt)));
  const base = new Date(Number.isFinite(start) && start > 0 ? start : Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5));
  const count = period.startsWith('Trimestre') ? 3 : period.startsWith('Année') ? 12 : 6;
  const monthlySeries = Array.from({ length: count }, (_, i) => { const a = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + i)), b = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth() + 1)); const inMonth = (d?: string) => !!d && Date.parse(d) >= +a && Date.parse(d) < +b; const learners = scoped.filter(p => inMonth(p.joinDate)).length; const cs = scoped.flatMap(p => p.certificates || []).filter(c => inMonth(c.issuedAt)).length; return { month: a.toLocaleDateString('fr-FR', { month: 'short', timeZone: 'UTC' }), learners, certs: cs, passRate: 0 }; });
  return { totalLearners: selected.length, globalPassRate: scores.length ? Math.round(scores.filter(s => s >= 70).length / scores.length * 100) : 0, activeInstitutions: new Set(selected.map(p => p.institution).filter(Boolean)).size, hoursDelivered: Number((minutes / 60).toFixed(1)), breakdownByInstitution, competencyAxes: Array.from(new Set(courses.map(c => c.category))).map(axis => { const ids = new Set(courses.filter(c => c.category === axis).map(c => c.id)); const values = selected.flatMap(p => Object.entries(p.quizScoresByCourse || {}).filter(([id]) => ids.has(id)).map(([, s]) => s)); return { axis, score: values.length ? Math.round(values.reduce((a,b) => a+b, 0) / values.length) : 0 }; }), monthlySeries, cgpmpStats: { total: filteredRequests.length, approved: filteredRequests.filter(r => r.status === 'Approuvé par DFAT').length, pending: filteredRequests.filter(r => r.status === 'En attente').length, rejected: filteredRequests.filter(r => r.status === 'Rejeté').length, totalParticipants: filteredRequests.reduce((s,r) => s + (Number(r.participantsCount) || 0), 0) }, certifications: certs.length, institutions: institutional, measuredAt: now.toISOString(), period, dataNote: 'Données enregistrées uniquement. Les durées historiques sans date ne sont pas ventilées par trimestre. Le taux de réussite concerne les derniers scores sauvegardés des apprenants actifs de la période.' };
}
export function gradeCourse(course: CourseModule, answers: unknown) {
  if (!course.quiz?.length) throw new Error('Aucune évaluation configurée pour ce module.');
  if (!Array.isArray(answers) || answers.length !== course.quiz.length || !answers.every((v, i) => Number.isInteger(v) && v >= 0 && v < course.quiz[i].options.length)) throw new Error('Répondez à toutes les questions.');
  const correct = course.quiz.filter((q, i) => q.correctIndex === answers[i]).length;
  const score = Math.round(correct / course.quiz.length * 100);
  return { correct, score, passed: score >= 70 };
}
