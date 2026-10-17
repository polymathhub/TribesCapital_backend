import { buildTierProgress, TierProgressActivity, TierProgressProject } from './tier-progress';

const activity: TierProgressActivity = {
  coursesEnrolled: 0,
  eventRegistrations: 0,
  communityPosts: 0,
  communityComments: 0,
};

const project = (status: string): TierProgressProject => ({
  id: `project-${status}`,
  title: 'Clean energy project',
  status,
  updatedAt: new Date('2026-10-17T12:00:00Z'),
});

describe('buildTierProgress', () => {
  it('starts members at Tier 0 before platform use or project submission', () => {
    const result = buildTierProgress([], activity);

    expect(result.currentTier).toBe(0);
    expect(result.eligibleTier).toBe(0);
    expect(result.kyc.required).toBe(false);
  });

  it('awards Tier 1 for meaningful platform activity or project origination', () => {
    const activityResult = buildTierProgress([], { ...activity, coursesEnrolled: 1 });
    const projectResult = buildTierProgress([project('origination')], activity);

    expect(activityResult.currentTier).toBe(1);
    expect(projectResult.currentTier).toBe(1);
    expect(projectResult.projectProgress.highestStage).toBe('Origination');
  });

  it('holds a development-stage project at Tier 1 until KYC is available and completed', () => {
    const result = buildTierProgress([project('development')], activity);

    expect(result).toEqual(expect.objectContaining({
      currentTier: 1,
      eligibleTier: 2,
      progressPercent: 100,
      kyc: { required: true, status: 'not_started', providerAvailable: false },
    }));
    expect(result.tiers[2].status).toBe('kyc_required');
  });

  it('requires verified KYC for Tier 2 and Tier 3 when the provider becomes available', () => {
    const result = buildTierProgress([project('operating')], activity, 'verified', true);

    expect(result.currentTier).toBe(3);
    expect(result.eligibleTier).toBe(3);
    expect(result.kyc).toEqual({ required: false, status: 'not_required', providerAvailable: true });
    expect(result.tiers[2].status).toBe('complete');
    expect(result.tiers[3].status).toBe('current');
  });

  it('normalizes existing legacy project lifecycle statuses', () => {
    const result = buildTierProgress([project('operational')], activity);

    expect(result.eligibleTier).toBe(3);
    expect(result.projectProgress.highestStage).toBe('Operating');
    expect(result.kyc.required).toBe(true);
  });
});
