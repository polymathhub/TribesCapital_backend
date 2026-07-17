export const COURSE_PROGRESS_STORAGE_PREFIX = 'tribes-course-progress';

export function readStoredCourseProgress(courseId) {
  if (typeof window === 'undefined' || !courseId) {
    return { progress: 0, completedLessonIds: [], lastLessonId: null, lastLessonIndex: 0 };
  }

  try {
    const storedValue = window.localStorage.getItem(`${COURSE_PROGRESS_STORAGE_PREFIX}:${courseId}`);
    if (!storedValue) {
      return { progress: 0, completedLessonIds: [], lastLessonId: null, lastLessonIndex: 0 };
    }

    const parsed = JSON.parse(storedValue);
    const completedLessonIds = Array.isArray(parsed?.completedLessonIds) ? parsed.completedLessonIds : [];
    const lastLessonIndex = Number.isInteger(parsed?.lastLessonIndex) ? parsed.lastLessonIndex : 0;

    return {
      progress: Number(parsed?.progress || 0),
      completedLessonIds,
      lastLessonId: parsed?.lastLessonId || null,
      lastLessonIndex: lastLessonIndex >= 0 ? lastLessonIndex : 0,
    };
  } catch {
    return { progress: 0, completedLessonIds: [], lastLessonId: null, lastLessonIndex: 0 };
  }
}

export function persistCourseProgress(courseId, progress, completedLessonIds, lastLessonId = null, lastLessonIndex = 0) {
  if (typeof window === 'undefined' || !courseId) return;

  try {
    window.localStorage.setItem(
      `${COURSE_PROGRESS_STORAGE_PREFIX}:${courseId}`,
      JSON.stringify({
        progress: Number(progress || 0),
        completedLessonIds: Array.isArray(completedLessonIds) ? completedLessonIds : [],
        lastLessonId: lastLessonId || null,
        lastLessonIndex: Number.isInteger(lastLessonIndex) ? lastLessonIndex : 0,
      }),
    );
  } catch {
    // ignore storage failures
  }
}

export function getResumeLessonIndex(lessonItems, completedLessonIds = [], lastLessonIndex = 0, lastLessonId = null) {
  if (!Array.isArray(lessonItems) || !lessonItems.length) return 0;

  if (typeof lastLessonIndex === 'number' && lastLessonIndex >= 0 && lastLessonIndex < lessonItems.length) {
    const lessonAtIndex = lessonItems[lastLessonIndex];
    if (lessonAtIndex && !completedLessonIds.includes(lessonAtIndex.id)) {
      return lastLessonIndex;
    }
  }

  if (lastLessonId) {
    const lastLessonIndexById = lessonItems.findIndex((lesson) => String(lesson.id) === String(lastLessonId));
    if (lastLessonIndexById >= 0 && !completedLessonIds.includes(lessonItems[lastLessonIndexById].id)) {
      return lastLessonIndexById;
    }
  }

  const firstIncomplete = lessonItems.findIndex((lesson) => !completedLessonIds.includes(lesson.id));
  if (firstIncomplete >= 0) return firstIncomplete;

  return Math.max(0, Math.min(lastLessonIndex, lessonItems.length - 1));
}
