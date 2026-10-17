import { CourseModule, UserProfile } from '../types';
import { filterCoursesByProfile } from './profileCoursePersonalization';

export function getLearnerOnboarding(profile: UserProfile, courses: CourseModule[]) {
  const required = !['super_admin', 'dfat_admin', 'formateur'].includes(profile.role) && !['Approfondi', 'Avancé'].includes(profile.niveauValidation || '');
  const revised = courses.filter(course => course.id.startsWith('INIT-'));
  const candidates = revised.length ? revised : courses;
  const scopedModules = filterCoursesByProfile(candidates, profile).filter(course => course.level === 'Fondamental');
  // The common legal foundation also serves profiles without a dedicated initiation module.
  const modules = scopedModules.length ? scopedModules : courses.filter(course => course.id === 'MOD-001' && course.level === 'Fondamental');
  const isRead = (course: CourseModule) => {
    const count = Math.max(1, course.lessons?.length || course.chaptersCount || 1);
    const read = new Set(profile.completedLessonsByCourse?.[course.id] || []);
    return Array.from({ length: count }, (_, index) => index).every(index => read.has(index));
  };
  const remaining = modules.filter(course => !isRead(course));
  return { required, modules, remaining, readyForTest: modules.length > 0 && remaining.length === 0, isRead };
}
