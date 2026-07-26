const { buildDashboardStats, deriveProjectSignals } = require('./dashboardMetrics');

describe('dashboardMetrics', () => {
  it('builds live stats from pipeline, diligence, courses, and events', () => {
    const stats = buildDashboardStats({
      memberCount: 128,
      dashboardCourses: [
        { progress: 42, title: 'Course A' },
        { progress: 100, title: 'Course B' },
      ],
      dashboardEvents: [{ id: 1 }, { id: 2 }],
      pipelineProjects: [
        { id: 1, stage: 'Due Diligence', name: 'Project A' },
        { id: 2, stage: 'Portfolio', name: 'Project B' },
      ],
      diligenceDocs: [{ id: 1, title: 'Doc A', targetName: 'Project A' }, { id: 2, title: 'Doc B' }],
    });

    expect(stats[0]).toEqual(expect.objectContaining({ label: 'Community members', value: 128 }));
    expect(stats[1]).toEqual(expect.objectContaining({ label: 'Active projects', value: 1 }));
    expect(stats[2]).toEqual(expect.objectContaining({ label: 'Due diligence', value: 3 }));
    expect(stats[3]).toEqual(expect.objectContaining({ label: 'Upcoming sessions', value: 2 }));
  });

  it('links pipeline projects to diligence items when names overlap', () => {
    const signals = deriveProjectSignals([
      { id: 1, name: 'Lagos Solar Project' },
      { id: 2, name: 'Accra Wind' },
    ], [
      { id: 1, title: 'Lagos Solar Project diligence', targetName: 'Lagos Solar Project' },
      { id: 2, title: 'General diligence' },
    ]);

    expect(signals[0]).toEqual(expect.objectContaining({ linkedDiligenceCount: 1, linkedProjectName: 'Lagos Solar Project' }));
    expect(signals[1]).toEqual(expect.objectContaining({ linkedDiligenceCount: 0, linkedProjectName: null }));
  });

  it('builds live learning hub stats from course progress and duration', () => {
    const stats = require('./dashboardMetrics').buildLearningHubStats([
      { id: 1, status: 'inProgress', progress: 50, lessons: 8, dur: '2h 30m' },
      { id: 2, status: 'completed', progress: 100, lessons: 6, dur: '1h 30m' },
      { id: 3, status: 'notStarted', progress: 0, lessons: 4, dur: '1h' },
    ]);

    expect(stats[0]).toEqual(expect.objectContaining({ label: 'Courses enrolled', value: 2 }));
    expect(stats[1]).toEqual(expect.objectContaining({ label: 'Completed', value: 1 }));
    expect(stats[2]).toEqual(expect.objectContaining({ label: 'Hours learned', value: '2.8h' }));
    expect(stats[3]).toEqual(expect.objectContaining({ label: 'Active lessons', value: 10 }));
  });
});
