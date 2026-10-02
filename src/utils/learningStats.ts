import { CourseModule, RecentReadingItem, UserProfile } from '../types';

export interface CourseChapterGraphPoint {
  index: number;
  shortLabel: string;
  title: string;
  duration: string;
  progressPct: number;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface ReadCourseEntry {
  course: CourseModule;
  courseId: string;
  code: string;
  title: string;
  category: string;
  progressPct: number;
  completedChapters: number;
  totalChapters: number;
  lessonIndex: number;
  lastLessonTitle: string;
  readAtLabel: string;
  isLastRead: boolean;
  status: 'completed' | 'in_progress';
  chapterGraph: CourseChapterGraphPoint[];
}

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
  lastCourseReadAtLabel: string;
  lastCourseChapterGraph: CourseChapterGraphPoint[];
  recentReadEntries: ReadCourseEntry[];
  studyHoursHistory: { month: string; hours: number; score: number }[];
}

export function formatReadTimestamp(isoOrLabel?: string): string {
  if (!isoOrLabel) return "Récemment";
  try {
    const d = new Date(isoOrLabel);
    if (Number.isNaN(d.getTime())) return isoOrLabel;
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 2) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Aujourd'hui (${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  } catch {
    return isoOrLabel;
  }
}

export function buildChapterGraphForCourse(
  course: CourseModule,
  completedIndices: number[],
  courseProgressPct: number,
  activeLessonIdx?: number
): CourseChapterGraphPoint[] {
  const lessons =
    Array.isArray(course.lessons) && course.lessons.length > 0
      ? course.lessons
      : [
          {
            id: `${course.id}-l1`,
            title: course.title,
            duration: course.duration || '30 min',
            content: course.description || '',
            keyArticles: [course.legalRef || 'Loi 10/010']
          }
        ];

  const doneSet = new Set(completedIndices);
  const isAllDone = courseProgressPct >= 100;

  let currentIdx =
    typeof activeLessonIdx === 'number' && activeLessonIdx >= 0 && activeLessonIdx < lessons.length
      ? activeLessonIdx
      : lessons.findIndex((_, i) => !doneSet.has(i));
  if (currentIdx === -1) {
    currentIdx = lessons.length - 1;
  }

  return lessons.map((lesson, idx) => {
    const isCompleted = isAllDone || doneSet.has(idx);
    const isCurrent = !isAllDone && idx === currentIdx;
    const progressPct = isCompleted
      ? 100
      : isCurrent
      ? Math.max(35, Math.min(85, courseProgressPct || 45))
      : 0;

    return {
      index: idx,
      shortLabel: `Ch. ${idx + 1}`,
      title: lesson.title || `Chapitre ${idx + 1}`,
      duration: lesson.duration || '20 min',
      progressPct,
      isCompleted,
      isCurrent
    };
  });
}

/**
 * Met à jour le profil utilisateur lorsqu'il ouvre ou lit un cours / chapitre
 */
export function recordCourseReadingInProfile(
  profile: UserProfile,
  course: CourseModule,
  lessonIndex = 0,
  overrideProgressPct?: number
): UserProfile {
  const nowIso = new Date().toISOString();
  const totalLessons = Math.max(1, course.lessons?.length || course.chaptersCount || 1);
  const existingLessons = profile.completedLessonsByCourse?.[course.id] || [];
  const nextLessons = Array.from(new Set([...existingLessons, lessonIndex]));

  const currentSavedPct = profile.courseProgress?.[course.id] ?? 0;
  const computedPct =
    overrideProgressPct !== undefined
      ? overrideProgressPct
      : Math.max(
          currentSavedPct,
          Math.min(95, Math.max(15, Math.round((nextLessons.length / totalLessons) * 100)))
        );

  const lessonObj = course.lessons?.[lessonIndex] || course.lessons?.[0];
  const lessonTitle = lessonObj?.title || `Chapitre ${lessonIndex + 1}`;

  const newEntry: RecentReadingItem = {
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    category: course.category,
    lessonIndex,
    lessonTitle,
    progressPct: computedPct,
    readAt: nowIso
  };

  const prevRecent = Array.isArray(profile.recentReadings) ? profile.recentReadings : [];
  const filteredRecent = prevRecent.filter((r) => r.courseId !== course.id);
  const nextRecent = [newEntry, ...filteredRecent].slice(0, 8);

  return {
    ...profile,
    lastReadCourseId: course.id,
    lastReadLessonIndex: lessonIndex,
    lastReadAt: nowIso,
    recentReadings: nextRecent,
    courseProgress: {
      ...(profile.courseProgress || {}),
      [course.id]: computedPct
    },
    completedLessonsByCourse: {
      ...(profile.completedLessonsByCourse || {}),
      [course.id]: nextLessons
    },
    lastActiveDate: nowIso.slice(0, 10)
  };
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

  // Recent courses: prioritize explicit recentReadings, then in-progress, then completed
  const courseById = new Map<string, CourseModule>();
  courses.forEach((c) => courseById.set(c.id, c));

  const reversed = [...courses].reverse();
  const recentInProgress = reversed.filter((c) => {
    const p = courseProgressMap[c.id] ?? 0;
    return p > 0 && p < 100;
  });
  const recentCompleted = reversed.filter((c) => (courseProgressMap[c.id] ?? 0) >= 100);

  // Resolve lastLearningCourse: explicit lastReadCourseId first!
  const explicitLastCourse = profile.lastReadCourseId
    ? courseById.get(profile.lastReadCourseId) || null
    : null;

  const lastLearningCourse: CourseModule | null =
    explicitLastCourse || recentInProgress[0] || recentCompleted[0] || courses[0] || null;

  const lastCourseProgress = lastLearningCourse
    ? Math.max(
        courseProgressMap[lastLearningCourse.id] ?? 0,
        explicitLastCourse ? 15 : 0
      )
    : 0;

  if (lastLearningCourse && (courseProgressMap[lastLearningCourse.id] ?? 0) === 0 && explicitLastCourse) {
    courseProgressMap[lastLearningCourse.id] = lastCourseProgress;
  }

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
          Math.max(1, Math.floor((lastCourseProgress / 100) * lastCourseTotalChapters))
        );

  let lastCourseNextLessonLabel = '';
  if (lastLearningCourse && lastLearningCourse.lessons && lastLearningCourse.lessons.length > 0) {
    if (lastCourseProgress >= 100) {
      lastCourseNextLessonLabel = `Module lu & validé (${lastCourseTotalChapters}/${lastCourseTotalChapters} chapitres)`;
    } else {
      const doneSet = new Set(lastCourseCompletedIndices);
      let nextIdx =
        typeof profile.lastReadLessonIndex === 'number' &&
        profile.lastReadCourseId === lastLearningCourse.id &&
        profile.lastReadLessonIndex < lastLearningCourse.lessons.length
          ? profile.lastReadLessonIndex
          : lastLearningCourse.lessons.findIndex((_, i) => !doneSet.has(i));
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

  const lastCourseReadAtLabel = formatReadTimestamp(profile.lastReadAt || profile.lastActiveDate);

  const lastCourseChapterGraph = lastLearningCourse
    ? buildChapterGraphForCourse(
        lastLearningCourse,
        lastCourseCompletedIndices,
        lastCourseProgress,
        profile.lastReadCourseId === lastLearningCourse.id ? profile.lastReadLessonIndex : undefined
      )
    : [];

  // Build ordered list of Recent Read Entries (Dernière lecture + Récentes lectures)
  const seenCourseIds = new Set<string>();
  const recentReadEntries: ReadCourseEntry[] = [];

  const addCourseEntry = (
    c: CourseModule,
    readAtIso?: string,
    explicitLessonIdx?: number,
    explicitLessonTitle?: string
  ) => {
    if (!c || seenCourseIds.has(c.id)) return;
    seenCourseIds.add(c.id);

    const pct = Math.max(
      courseProgressMap[c.id] ?? 0,
      c.id === lastLearningCourse?.id ? lastCourseProgress : 15
    );
    const totalCh = Math.max(1, c.lessons?.length || c.chaptersCount || 1);
    const doneIndices = completedLessonsMap[c.id] || [];
    const completedCh =
      pct >= 100
        ? totalCh
        : Math.max(doneIndices.length, Math.max(1, Math.floor((pct / 100) * totalCh)));

    const resolvedLessonIdx =
      typeof explicitLessonIdx === 'number'
        ? explicitLessonIdx
        : Math.min(totalCh - 1, Math.max(0, completedCh - 1));
    const resolvedLessonTitle =
      explicitLessonTitle ||
      c.lessons?.[resolvedLessonIdx]?.title ||
      `Chapitre ${resolvedLessonIdx + 1}`;

    recentReadEntries.push({
      course: c,
      courseId: c.id,
      code: c.code,
      title: c.title,
      category: c.category,
      progressPct: pct,
      completedChapters: completedCh,
      totalChapters: totalCh,
      lessonIndex: resolvedLessonIdx,
      lastLessonTitle: resolvedLessonTitle,
      readAtLabel: formatReadTimestamp(readAtIso),
      isLastRead: recentReadEntries.length === 0,
      status: pct >= 100 ? 'completed' : 'in_progress',
      chapterGraph: buildChapterGraphForCourse(c, doneIndices, pct, resolvedLessonIdx)
    });
  };

  // 1. First add explicit lastLearningCourse
  if (lastLearningCourse) {
    const matchRecent = (profile.recentReadings || []).find(
      (r) => r.courseId === lastLearningCourse.id
    );
    addCourseEntry(
      lastLearningCourse,
      matchRecent?.readAt || profile.lastReadAt || profile.lastActiveDate,
      matchRecent?.lessonIndex ?? profile.lastReadLessonIndex,
      matchRecent?.lessonTitle
    );
  }

  // 2. Then add from profile.recentReadings
  (profile.recentReadings || []).forEach((item) => {
    const found = courseById.get(item.courseId);
    if (found) {
      addCourseEntry(found, item.readAt, item.lessonIndex, item.lessonTitle);
    }
  });

  // 3. Then add in-progress and completed courses so "Récentes lectures" is always populated
  recentInProgress.forEach((c, idx) => {
    addCourseEntry(c, idx === 0 ? 'Aujourd’hui' : 'Cette semaine');
  });
  recentCompleted.forEach((c, idx) => {
    addCourseEntry(c, idx === 0 ? 'Hier' : `Il y a ${idx + 2} jours`);
  });

  // 4. Ensure at least 4 entries for visual richness if user is new
  if (recentReadEntries.length < 4) {
    courses.slice(0, 4).forEach((c, idx) => {
      addCourseEntry(c, idx === 0 ? "Aujourd'hui" : `Il y a ${idx + 1} j`);
    });
  }

  const recentCourses = recentReadEntries.slice(0, 4).map((e) => e.course);

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
    lastCourseReadAtLabel,
    lastCourseChapterGraph,
    recentReadEntries: recentReadEntries.slice(0, 6),
    studyHoursHistory
  };
}
