export function calculateProgressPercent(completedCount: number, totalLessons: number): number {
  if (!totalLessons) return 0;
  return Math.round((completedCount / totalLessons) * 100);
}

export function resolvePreferredLessonIndex(
  lessons: Array<{ id?: string | number; [key: string]: any }>,
  lastLessonId?: string | number | null,
  completedLessonIds: Array<string | number> = [],
): number {
  if (!lessons.length) return 0;

  if (lastLessonId) {
    const idx = lessons.findIndex((lesson) => String(lesson.id) === String(lastLessonId));
    if (idx >= 0) return idx;
  }

  const firstIncomplete = lessons.findIndex((lesson) => !completedLessonIds.includes(lesson.id as string | number));
  return firstIncomplete >= 0 ? firstIncomplete : Math.max(0, lessons.length - 1);
}
