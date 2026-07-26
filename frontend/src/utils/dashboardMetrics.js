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
  if (typeof duration !== 'string') return 0;
  const hourMatch = duration.match(/(\d+)\s*h/i);
  const minuteMatch = duration.match(/(\d+)\s*m/i);
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

export {
  deriveProjectSignals,
  buildDashboardStats,
  buildLearningHubStats,
};
