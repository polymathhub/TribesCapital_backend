export interface DashboardCourseLike {
  progress?: number;
  [key: string]: any;
}

export interface DashboardEventLike {
  [key: string]: any;
}

export interface DashboardProjectLike {
  id?: number | string;
  name?: string;
  stage?: string;
  [key: string]: any;
}

export interface DashboardDiligenceLike {
  id?: number | string;
  title?: string;
  targetName?: string;
  description?: string;
  [key: string]: any;
}

export interface DashboardStat {
  label: string;
  value: number | string;
  badge: string;
}

export function deriveProjectSignals(
  projects?: DashboardProjectLike[],
  diligenceDocs?: DashboardDiligenceLike[],
): Array<DashboardProjectLike & {
  linkedDiligenceCount: number;
  linkedProjectName: string | null;
}>;

export function buildDashboardStats(params: {
  memberCount?: number;
  dashboardCourses?: DashboardCourseLike[];
  dashboardEvents?: DashboardEventLike[];
  pipelineProjects?: DashboardProjectLike[];
  diligenceDocs?: DashboardDiligenceLike[];
}): DashboardStat[];
