function deriveProjectSignals(projects = [], diligenceDocs = []) {
  const normalizedDocs = (diligenceDocs || []).map((doc) => ({
    ...doc,
    haystack: `${doc?.title || ''} ${doc?.targetName || ''} ${doc?.description || ''}`.toLowerCase(),
  }));

  return (projects || []).map((project) => {
    const projectName = `${project?.name || ''}`.trim().toLowerCase();
    const linkedDiligence = normalizedDocs.filter((doc) => {
      if (!doc?.haystack) return false;
      return projectName && doc.haystack.includes(projectName);
    });

    return {
      ...project,
      linkedDiligenceCount: linkedDiligence.length,
      linkedProjectName: linkedDiligence[0]?.targetName || linkedDiligence[0]?.title || null,
      stage: project?.stage || 'Sourcing',
    };
  });
}

function buildDashboardStats({
  memberCount = 0,
  dashboardCourses = [],
  dashboardEvents = [],
  pipelineProjects = [],
  diligenceDocs = [],
}) {
  const inProgressCourseCount = (dashboardCourses || []).filter((course) => course.progress > 0 && course.progress < 100).length;
  const completedCourseCount = (dashboardCourses || []).filter((course) => course.progress >= 100).length;
  const activeProjects = (pipelineProjects || []).filter((project) => project.stage !== 'Portfolio').length;
  const diligenceCount = (diligenceDocs || []).length;
  const dueDiligenceProjects = (pipelineProjects || []).filter((project) => project.stage === 'Due Diligence').length;
  const upcomingEvents = (dashboardEvents || []).length;

  return [
    { label: 'Community members', value: Number(memberCount || 0), badge: 'Live' },
    { label: 'Active projects', value: activeProjects, badge: 'In pipeline' },
    { label: 'Due diligence', value: diligenceCount + dueDiligenceProjects, badge: 'Under review' },
    { label: 'Upcoming sessions', value: upcomingEvents, badge: 'This week' },
    { label: 'Courses in progress', value: inProgressCourseCount, badge: 'Momentum' },
    { label: 'Completed courses', value: completedCourseCount, badge: 'Done' },
  ];
}

function parseHoursFromDuration(duration) {
  if (typeof duration === 'number' && Number.isFinite(duration)) {
    // duration is stored in minutes (e.g. 60 => 1h)
    return duration / 60;
  }
  if (!duration || typeof duration !== 'string') return 0;

  const normalized = duration.trim();
  if (/^\d+$/.test(normalized)) {
    return Number(normalized) / 60;
  }

  const hourMatch = normalized.match(/(\d+)\s*h/i);
  const minuteMatch = normalized.match(/(\d+)\s*m/i);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
  return hours + (minutes / 60);
}

function buildLearningHubStats(courses = []) {
  const normalizedCourses = Array.isArray(courses) ? courses : [];
  const enrolledCount = normalizedCourses.filter((course) => String(course?.status || '').toLowerCase() !== 'notstarted' && Number(course?.progress || 0) > 0).length;
  const completedCount = normalizedCourses.filter((course) => String(course?.status || '').toLowerCase() === 'completed' || Number(course?.progress || 0) >= 100).length;
  const hoursLearned = normalizedCourses.reduce((sum, course) => {
    const progress = Math.max(0, Math.min(100, Number(course?.progress || 0)));
    const durationHours = parseHoursFromDuration(course?.dur || course?.duration || '');
    const progressHours = durationHours > 0 ? (durationHours * progress) / 100 : 0;
    return sum + progressHours;
  }, 0);
  const activeLessons = normalizedCourses.reduce((sum, course) => {
    const progress = Math.max(0, Math.min(100, Number(course?.progress || 0)));
    const lessonCount = Number(course?.lessons || 0);
    const startedLessons = lessonCount > 0 ? Math.ceil((lessonCount * progress) / 100) : 0;
    return sum + startedLessons;
  }, 0);

  return [
    { label: 'Courses enrolled', value: enrolledCount, badge: `${normalizedCourses.filter((course) => String(course?.status || '').toLowerCase() === 'inprogress' || (Number(course?.progress || 0) > 0 && Number(course?.progress || 0) < 100)).length} in progress` },
    { label: 'Completed', value: completedCount, badge: 'Well done' },
    { label: 'Hours learned', value: `${hoursLearned.toFixed(hoursLearned % 1 === 0 ? 0 : 1)}h`, badge: 'This month' },
    { label: 'Active lessons', value: activeLessons, badge: 'Keep going!' },
  ];
}

function computeProjectScore(project = {}) {
  // Normalize value (USD) using a log scale, cap at ~1 for large deals
  const value = typeof project.value === 'number' && Number.isFinite(project.value) ? Math.max(0, project.value) : 0;
  const valueScore = value > 0 ? Math.min(1, Math.log10(value + 1) / 6) : 0; // ~1 at 1e6

  // Progress score 0-1
  const progress = typeof project.progress === 'number' ? Math.max(0, Math.min(100, project.progress)) : 0;
  const progressScore = progress / 100;

  // IRR normalized to a 0-1 scale assuming 0-30% sensible range
  const irr = typeof project.irr === 'number' && Number.isFinite(project.irr) ? Math.max(0, project.irr) : 0;
  const irrScore = Math.min(1, irr / 30);

  // Linked diligence count (few docs -> small boost)
  const linked = typeof project.linkedDiligenceCount === 'number' ? Math.max(0, project.linkedDiligenceCount) : 0;
  const linkedScore = Math.min(1, linked / 5);

  // Weighted combination (tunable): value 50%, progress 30%, irr 12%, linked 8%
  const score = (valueScore * 0.5) + (progressScore * 0.3) + (irrScore * 0.12) + (linkedScore * 0.08);
  return Math.round(score * 100);
}
// Provide ESM named exports for the frontend (Vite).
export { deriveProjectSignals, buildDashboardStats, buildLearningHubStats, computeProjectScore };

// Also set `module.exports` when running in a CommonJS/Node environment
// (Jest, Node scripts). Guard against `module` being undefined in the
// browser ESM runtime used by Vite.
try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      deriveProjectSignals,
      buildDashboardStats,
      buildLearningHubStats,
      computeProjectScore,
    };
  }
} catch (e) {
  // ignore in browser contexts where `module` is not available
}
