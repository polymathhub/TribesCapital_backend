export const PROJECT_PIPELINE_STAGES = [
  'Origination',
  'Development',
  'Due Diligence',
  'Structuring',
  'Funding',
  'Construction',
  'Operating',
] as const;

const PROJECT_STAGE_ALIASES: Record<string, string> = {
  planning: 'origination',
  submitted: 'origination',
  information_requested: 'origination',
  'information-requested': 'origination',
  rejected: 'origination',
  scoping: 'development',
  operational: 'operating',
};

export type TierProgressProject = {
  id: string;
  title: string;
  status: string;
  updatedAt: Date;
};

export type TierProgressActivity = {
  coursesEnrolled: number;
  eventRegistrations: number;
  communityPosts: number;
  communityComments: number;
};

const normalizeProjectStage = (status: string) => {
  const normalized = status.trim().toLowerCase().replace(/\s+/g, '-');
  const aliased = PROJECT_STAGE_ALIASES[normalized] || normalized;
  return PROJECT_PIPELINE_STAGES.findIndex((stage) => stage.toLowerCase().replace(/\s+/g, '-') === aliased);
};

export function buildTierProgress(
  projects: TierProgressProject[],
  activity: TierProgressActivity,
  kycStatus: 'not_started' | 'pending' | 'verified' | 'rejected' = 'not_started',
  providerAvailable = false,
) {
  const activityCount = activity.coursesEnrolled
    + activity.eventRegistrations
    + activity.communityPosts
    + activity.communityComments;
  const projectStages = projects
    .map((project) => ({ ...project, stageIndex: normalizeProjectStage(project.status) }))
    .filter((project) => project.stageIndex >= 0)
    .sort((a, b) => b.stageIndex - a.stageIndex || b.updatedAt.getTime() - a.updatedAt.getTime());
  const highestProject = projectStages.reduce<(typeof projectStages)[number] | null>(
    (highest, project) => !highest || project.stageIndex > highest.stageIndex ? project : highest,
    null,
  );
  const highestStageIndex = highestProject?.stageIndex ?? -1;

  let eligibleTier = 0;
  if (projects.length > 0 || activityCount > 0) eligibleTier = 1;
  if (highestStageIndex >= 1) eligibleTier = 2;
  if (highestStageIndex >= 5) eligibleTier = 3;

  const kycRequired = eligibleTier >= 2 && kycStatus !== 'verified';
  const currentTier = kycRequired ? 1 : eligibleTier;
  const tiers = [
    { level: 0, name: 'Getting started', description: 'Your Tribes Capital account is ready.' },
    { level: 1, name: 'Active member', description: 'Take part in learning, events, the community, or submit a project.' },
    { level: 2, name: 'Project development', description: 'Progress an owned project to Development or beyond. KYC is required to advance.' },
    { level: 3, name: 'Delivery and operations', description: 'Progress an owned project into Construction or Operating.' },
  ].map((tier) => ({
    ...tier,
    status: tier.level < currentTier
      ? 'complete'
      : tier.level === currentTier
        ? 'current'
        : tier.level === 2 && kycRequired
          ? 'kyc_required'
          : 'locked',
  }));

  const nextStep = currentTier === 0
    ? 'Start with a course, join an event, contribute to the community, or submit a project.'
    : currentTier === 1 && kycRequired
      ? 'KYC verification is required to advance. Provider setup is coming soon.'
      : currentTier === 1
        ? projects.length > 0
          ? 'Advance one of your projects from Origination to Development.'
          : 'Submit a project and progress it to Development to unlock Tier 2.'
        : currentTier === 2
          ? 'Progress an owned project to Construction or Operating.'
          : 'You have reached the highest tier.';
  const progressPercent = currentTier === 0
    ? 0
    : kycRequired
      ? 100
      : highestStageIndex >= 0
        ? Math.round(((highestStageIndex + 1) / PROJECT_PIPELINE_STAGES.length) * 100)
        : 0;

  return {
    currentTier,
    eligibleTier,
    nextTier: currentTier < 3 ? currentTier + 1 : null,
    progressPercent,
    nextStep,
    kyc: {
      required: kycRequired,
      status: kycRequired ? kycStatus : 'not_required',
      providerAvailable,
    },
    activity: {
      ...activity,
      total: activityCount,
    },
    projectProgress: {
      projectCount: projects.length,
      highestStage: highestProject ? PROJECT_PIPELINE_STAGES[highestProject.stageIndex] : null,
      projects: projectStages.slice(0, 6).map(({ id, title, status, stageIndex }) => ({
        id,
        title,
        status: PROJECT_PIPELINE_STAGES[stageIndex],
      })),
    },
    tiers,
  };
}
