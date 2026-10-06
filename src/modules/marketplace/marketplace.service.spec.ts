import { MarketplaceService } from './marketplace.service';

describe('MarketplaceService contractor directory', () => {
  const prisma = {
    isDatabaseAvailable: jest.fn(() => true),
    contractorProfile: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    contractorReview: {
      groupBy: jest.fn(),
    },
  } as any;
  const service = new MarketplaceService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('returns the requested contractor page and total result count', async () => {
    prisma.contractorProfile.findMany.mockResolvedValue([]);
    prisma.contractorProfile.count.mockResolvedValue(49);

    const result = await service.listContractors({ skip: 24, take: 24 });

    expect(prisma.contractorProfile.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 24, take: 24 }));
    expect(result).toEqual({ data: [], total: 49, skip: 24, take: 24 });
  });

  it('clamps invalid offsets and limits page size to 100', async () => {
    prisma.contractorProfile.findMany.mockResolvedValue([]);
    prisma.contractorProfile.count.mockResolvedValue(0);

    const result = await service.listContractors({ skip: -10, take: 1000 });

    expect(prisma.contractorProfile.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 100 }));
    expect(result).toEqual({ data: [], total: 0, skip: 0, take: 100 });
  });
});