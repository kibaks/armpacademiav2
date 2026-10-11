export const RESULT_FIELDS = ['level', 'levelKey', 'completedModulesCount', 'certificationsCount', 'certificates', 'completedCourseIds', 'quizScoresByCourse', 'placementScore', 'niveauValidation', 'niveauxModules'] as const;
export const emptyResults = () => ({ level: 'Non évalué', completedModulesCount: 0, certificationsCount: 0, certificates: [], completedCourseIds: [], quizScoresByCourse: {} });
export function omitResults(profile: Record<string, any>) {
  return Object.fromEntries(Object.entries(profile).filter(([key]) => !RESULT_FIELDS.includes(key as any)));
}
