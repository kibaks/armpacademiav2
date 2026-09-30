import { CourseModule, UserProfile } from '../types';

export interface UserLearningStats {
  courseProgressMap: Record<string, number>;
  completedLessonsMap: Record<string, number[]>;
  completedCoursesCount: number;
  inProgressCoursesCount: number;
  certificationsCount: number;
  totalCourses: number;
  overallProgress: number;
  averageScore: number;
  monthlyDeltaPct: number;
  totalStudyHours: number;
  streakDays: number;
  recentCourses: CourseModule[];
  lastLearningCourse: CourseModule | null;
  lastCourseProgress: number;
  lastCourseCompletedChapters: number;
  lastCourseTotalChapters: number;
  lastCourseNextLessonLabel: string;
  studyHoursHistory: { month: string; hours: number; score: number }[];
}

export function computeUserLearningStats(
  profile: UserProfile,
  courses: CourseModule[]
): UserLearningStats {
  const courseProgressMap: Record<string, number> = {};
  const completedLessonsMap: Record<string, number[]> = {};

  const savedProgress = profile.courseProgress || {};
  const completedIds = new Set(profile.completedCourseIds || []);

  // Ensure baseline completedModulesCount from profile is always reflected in completedIds
  // even after the user starts tracking a new course in courseProgress / completedLessonsByCourse
  const targetBaselineCompleted = Math.min(courses.length, profile.completedModulesCount || 0);
  if (completedIds.size < targetBaselineCompleted) {
    for (let i = 0; i < courses.length && completedIds.size < targetBaselineCompleted; i++) {
      const cid = courses[i].id;
      const hasPartialProgress =
        typeof savedProgress[cid] === 'number' && savedProgress[cid] > 0 && savedProgress[cid] < 100;
      if (!hasPartialProgress && !completedIds.has(cid)) {
        completedIds.add(cid);
      }
    }
  }

  let totalCompletedLessonsCount = 0;

  courses.forEach((c) => {
    const totalLessons = Math.max(1, c.lessons?.length || c.chaptersCount || 1);

    // 1. Resolve completed lesson indices from profile or localStorage
    let lessonIndices: number[] = [];
    const fromProfileLessons = profile.completedLessonsByCourse?.[c.id];
    if (Array.isArray(fromProfileLessons) && fromProfileLessons.length > 0) {
      lessonIndices = Array.from(new Set(fromProfileLessons));
    } else if (typeof window !== 'undefined') {
      try {
        const localRaw = localStorage.getItem(`armp_completed_lessons_${c.id}`);
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed)) {
            lessonIndices = Array.from(new Set(parsed));
          }
        }
      } catch {
        // ignore storage errors
      }
    }

    // 2. Resolve course progress percentage
    let progressPct = 0;
    if (completedIds.has(c.id) || savedProgress[c.id] === 100) {
      progressPct = 100;
      if (lessonIndices.length < totalLessons && c.lessons) {
        lessonIndices = c.lessons.map((_, i) => i);
      }
    } else if (typeof savedProgress[c.id] === 'number' && savedProgress[c.id] > 0) {
      progressPct = Math.min(100, Math.max(0, Math.round(savedProgress[c.id])));
      if (lessonIndices.length > 0) {
        const fromLessonsPct = Math.round((lessonIndices.length / totalLessons) * 100);
        progressPct = Math.max(progressPct, Math.min(95, fromLessonsPct));
      }
    } else if (lessonIndices.length > 0) {
      progressPct = Math.min(95, Math.round((lessonIndices.length / totalLessons) * 100));
    } else {
      progressPct = 0;
    }

    courseProgressMap[c.id] = progressPct;
    completedLessonsMap[c.id] = lessonIndices;
    totalCompletedLessonsCount += lessonIndices.length;
  });

  const totalCourses = Math.max(1, courses.length);
  const completedCoursesFromMap = courses.filter((c) => (courseProgressMap[c.id] ?? 0) >= 100).length;
  const completedCoursesCount = Math.max(
    completedCoursesFromMap,
    Math.min(courses.length, profile.completedModulesCount || 0)
  );

  const inProgressCourses = courses.filter((c) => {
    const p = courseProgressMap[c.id] ?? 0;
    return p > 0 && p < 100;
  });
  const inProgressCoursesCount = inProgressCourses.length;

  const overallProgress =
    courses.length > 0
      ? Math.min(
          100,
          Math.round(
            courses.reduce((sum, c) => sum + (courseProgressMap[c.id] ?? 0), 0) / courses.length
          )
        )
      : 0;

  // Compute average score from placement quiz + completed course quizzes
  const quizScoreValues = Object.values(profile.quizScoresByCourse || {}).filter(
    (v): v is number => typeof v === 'number' && !Number.isNaN(v)
  );
  const basePlacement = profile.placementScore ?? 78;
  const averageScore =
    quizScoreValues.length > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (basePlacement + quizScoreValues.reduce((a, b) => a + b, 0)) /
                (1 + quizScoreValues.length)
            )
          )
        )
      : Math.min(100, Math.max(0, basePlacement));

  // Study hours history (6 months) synchronized with totalStudyMinutes & averageScore
  const defaultHistory = [
    { month: 'Avr', hours: 4.5, score: Math.max(50, averageScore - 18) },
    { month: 'Mai', hours: 6.0, score: Math.max(54, averageScore - 14) },
    { month: 'Juin', hours: 5.8, score: Math.max(58, averageScore - 10) },
    { month: 'Juil', hours: 7.0, score: Math.max(62, averageScore - 7) },
    { month: 'Août', hours: 7.8, score: Math.max(66, averageScore - 3) },
    { month: 'Sep', hours: 6.9, score: averageScore }
  ];

  const rawHistory =
    profile.studyHoursHistory && profile.studyHoursHistory.length === 6
      ? profile.studyHoursHistory
      : defaultHistory;

  const baseHistoryHours = rawHistory.reduce((sum, h) => sum + (Number(h.hours) || 0), 0);
  const extraMinutesFromProfile = Math.max(0, (profile.totalStudyMinutes || 180) - 180);
  const extraHoursFromActivity = Number((extraMinutesFromProfile / 60).toFixed(1));

  const studyHoursHistory = rawHistory.map((item, idx) =>
    idx === rawHistory.length - 1
      ? {
          ...item,
          hours: Number((item.hours + extraHoursFromActivity).toFixed(1)),
          score: averageScore
        }
      : item
  );

  const totalStudyHours = Number(
    Math.max(
      baseHistoryHours + extraHoursFromActivity,
      totalCompletedLessonsCount * 0.4 + completedCoursesCount * 2.5
    ).toFixed(1)
  );

  const firstMonthScore = studyHoursHistory[0]?.score ?? Math.max(50, averageScore - 12);
  const monthlyDeltaPct = Math.max(2, averageScore - firstMonthScore);

  // Recent courses: prioritize courses currently in progress, then completed courses
  const reversed = [...courses].reverse();
  const recentInProgress = reversed.filter((c) => {
    const p = courseProgressMap[c.id] ?? 0;
    return p > 0 && p < 100;
  });
  const recentCompleted = reversed.filter((c) => (courseProgressMap[c.id] ?? 0) >= 100);
  const recentCourses = [...recentInProgress, ...recentCompleted].slice(0, 3);

  // Last learning course: active in-progress course first, otherwise most recent started/completed, otherwise first course
  const lastLearningCourse: CourseModule | null =
    recentInProgress[0] || recentCompleted[0] || courses[0] || null;

  const lastCourseProgress = lastLearningCourse
    ? courseProgressMap[lastLearningCourse.id] ?? 0
    : 0;

  const lastCourseTotalChapters = lastLearningCourse
    ? Math.max(1, lastLearningCourse.lessons?.length || lastLearningCourse.chaptersCount || 1)
    : 1;

  const lastCourseCompletedIndices = lastLearningCourse
    ? completedLessonsMap[lastLearningCourse.id] || []
    : [];

  const lastCourseCompletedChapters =
    lastCourseProgress >= 100
      ? lastCourseTotalChapters
      : Math.max(
          lastCourseCompletedIndices.length,
          Math.floor((lastCourseProgress / 100) * lastCourseTotalChapters)
        );

  let lastCourseNextLessonLabel = '';
  if (lastLearningCourse && lastLearningCourse.lessons && lastLearningCourse.lessons.length > 0) {
    if (lastCourseProgress >= 100) {
      lastCourseNextLessonLabel = `Module validé (${lastCourseTotalChapters}/${lastCourseTotalChapters} chapitres)`;
    } else {
      const doneSet = new Set(lastCourseCompletedIndices);
      let nextIdx = lastLearningCourse.lessons.findIndex((_, i) => !doneSet.has(i));
      if (nextIdx === -1) {
        nextIdx = Math.min(
          lastLearningCourse.lessons.length - 1,
          Math.floor((lastCourseProgress / 100) * lastLearningCourse.lessons.length)
        );
      }
      const nextLesson = lastLearningCourse.lessons[nextIdx];
      lastCourseNextLessonLabel = `Chapitre ${nextIdx + 1}/${lastLearningCourse.lessons.length} • ${
        nextLesson?.title || 'Suite de la formation'
      }`;
    }
  }

  const certificationsCount = Math.max(
    profile.certificationsCount || 0,
    (profile.certificates || []).length
  );

  const streakDays = profile.streakDays ?? Math.max(1, completedCoursesCount * 2 + inProgressCoursesCount);

  return {
    courseProgressMap,
    completedLessonsMap,
    completedCoursesCount,
    inProgressCoursesCount,
    certificationsCount,
    totalCourses,
    overallProgress,
    averageScore,
    monthlyDeltaPct,
    totalStudyHours,
    streakDays,
    recentCourses,
    lastLearningCourse,
    lastCourseProgress,
    lastCourseCompletedChapters,
    lastCourseTotalChapters,
    lastCourseNextLessonLabel,
    studyHoursHistory
  };
}
