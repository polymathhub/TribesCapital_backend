import { MemberDirectoryController } from './member-directory.controller';

describe('MemberDirectoryController', () => {
  const prisma = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('returns paginated members without exposing email addresses', async () => {
    prisma.user.count.mockResolvedValue(2);
    prisma.user.findMany.mockResolvedValue([
      { id: 'user-2', firstName: 'Ava', lastName: 'Scott', avatar: null, isActive: true, lastLogin: new Date('2026-09-17T10:00:00Z') },
      { id: 'user-3', firstName: 'David', lastName: 'Cole', avatar: null, isActive: true, lastLogin: null },
    ]);

    const controller = new MemberDirectoryController(prisma);
    const result = await controller.listMembers({ id: 'user-1' }, 'av', '1', '24');

    expect(result.meta).toEqual({ page: 1, limit: 24, total: 2, totalPages: 1 });
    expect(result.data[0]).toEqual(expect.objectContaining({ id: 'user-2', lastSeenAt: expect.any(Date) }));
    expect(result.data[0]).not.toHaveProperty('email');
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: { not: 'user-1' }, isActive: true, OR: expect.any(Array) }),
      take: 24,
      skip: 0,
    }));
  });

  it('clamps pagination values', async () => {
    prisma.user.count.mockResolvedValue(100);
    prisma.user.findMany.mockResolvedValue([]);

    const controller = new MemberDirectoryController(prisma);
    const result = await controller.listMembers({ id: 'user-1' }, undefined, '0', '999');

    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(50);
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50, skip: 0 }));
  });
});
