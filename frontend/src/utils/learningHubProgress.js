export const COURSE_PROGRESS_STORAGE_PREFIX = 'tribes-course-progress';

export function readStoredCourseProgress(courseId) {
  if (typeof window === 'undefined' || !courseId) {
    return { progress: 0, completedLessonIds: [], lastLessonId: null, lastLessonIndex: 0, lastAccessedAt: null };
  }

  try {
    const storedValue = window.localStorage.getItem(`${COURSE_PROGRESS_STORAGE_PREFIX}:${courseId}`);
    if (!storedValue) {
      return { progress: 0, completedLessonIds: [], lastLessonId: null, lastLessonIndex: 0, lastAccessedAt: null };
    }

    const parsed = JSON.parse(storedValue);
    const completedLessonIds = Array.isArray(parsed?.completedLessonIds) ? parsed.completedLessonIds : [];
    const lastLessonIndex = Number.isInteger(parsed?.lastLessonIndex) ? parsed.lastLessonIndex : 0;

    return {
      progress: Number(parsed?.progress || 0),
      completedLessonIds,
      lastLessonId: parsed?.lastLessonId || null,
      lastLessonIndex: lastLessonIndex >= 0 ? lastLessonIndex : 0,
      lastAccessedAt: parsed?.lastAccessedAt || null,
    };
  } catch {
    return { progress: 0, completedLessonIds: [], lastLessonId: null, lastLessonIndex: 0, lastAccessedAt: null };
  }
}

export function persistCourseProgress(courseId, progress, completedLessonIds, lastLessonId = null, lastLessonIndex = 0, lastAccessedAt = Date.now()) {
  if (typeof window === 'undefined' || !courseId) return;

  try {
    window.localStorage.setItem(
      `${COURSE_PROGRESS_STORAGE_PREFIX}:${courseId}`,
      JSON.stringify({
        progress: Number(progress || 0),
        completedLessonIds: Array.isArray(completedLessonIds) ? completedLessonIds : [],
        lastLessonId: lastLessonId || null,
        lastLessonIndex: Number.isInteger(lastLessonIndex) ? lastLessonIndex : 0,
        lastAccessedAt: lastAccessedAt || Date.now(),
      }),
    );
  } catch {
    // ignore storage failures
  }
}

export function formatRelativeTime(value) {
  const timestamp = value instanceof Date ? value.getTime() : Number(value);
  if (!Number.isFinite(timestamp)) return 'just now';

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.round(diffDays / 7)}w ago`;

  return new Date(timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' });
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
