import { mapDueDiligenceToPipelineProject } from './pipeline.utils';
import { DDStatus } from './dto/due-diligence.dto';

describe('mapDueDiligenceToPipelineProject', () => {
  it('maps approved diligence into a pipeline project entry', () => {
    const item = {
      id: 'dd-123',
      title: 'Northwind Solar',
      description: 'Approved diligence case',
      type: 'investment',
      status: DDStatus.APPROVED,
      completionPercent: 100,
      targetMetadata: {
        country: 'Nigeria',
        city: 'Lagos',
        capacity: 8.4,
        value: 4500000,
        irr: 18.2,
        sponsor: 'Northwind Capital',
        tags: ['renewables', 'west-africa'],
      },
      creator: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
      },
      updatedAt: '2026-08-07T12:00:00.000Z',
    };

    const project = mapDueDiligenceToPipelineProject(item);

    expect(project).toMatchObject({
      dueDiligenceId: 'dd-123',
      name: 'Northwind Solar',
      stage: 'Due Diligence',
      country: 'Nigeria',
      city: 'Lagos',
      capacity: 8.4,
      value: 4500000,
      irr: 18.2,
      sponsor: 'Northwind Capital',
      progress: 100,
      status: DDStatus.APPROVED,
      source: 'due-diligence',
    });
    expect(project.owner).toBe('AL');
  });
});
