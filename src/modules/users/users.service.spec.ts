import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService profile data', () => {
  const prisma = {
    isDatabaseAvailable: jest.fn(() => true),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  } as any;
  const service = new UsersService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('removes credentials and provider identifiers from the current-user profile', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'member@example.com',
      firstName: 'Amina',
      roles: [],
      permissions: [],
      password: 'hashed-password',
      passwordResetToken: 'reset-token',
      passwordResetExpires: new Date(),
      emailVerificationToken: 'verify-token',
      googleId: 'google-id',
    });

    const result = await service.getUserById('user-1');

    expect(result).toEqual(expect.objectContaining({ id: 'user-1', email: 'member@example.com', roles: [], permissions: [] }));
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('passwordResetToken');
    expect(result).not.toHaveProperty('passwordResetExpires');
    expect(result).not.toHaveProperty('emailVerificationToken');
    expect(result).not.toHaveProperty('googleId');
  });

  it('persists a self-service account type change', async () => {
    prisma.user.update.mockResolvedValue({
      id: 'user-1',
      email: 'member@example.com',
      accountType: 'INVESTOR',
      roles: [],
      password: 'hashed-password',
    });

    const result = await service.updateUser('user-1', { accountType: 'INVESTOR' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { accountType: 'INVESTOR' },
      include: { roles: true },
    });
    expect(result).toEqual(expect.objectContaining({ id: 'user-1', accountType: 'INVESTOR' }));
    expect(result).not.toHaveProperty('password');
  });

  it('returns only public profile fields for a member-by-id request', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      firstName: 'Amina',
      lastName: 'Okafor',
      displayName: 'Amina O.',
      occupation: 'Engineer',
      address: 'Lagos',
      interests: ['Solar Energy'],
      avatar: null,
      bio: 'Clean energy professional',
    });

    const result = await service.getPublicProfileById('user-2');

    expect(result).toEqual(expect.objectContaining({ id: 'user-2', displayName: 'Amina O.', occupation: 'Engineer' }));
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('roles');
    expect(result).not.toHaveProperty('permissions');
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-2' },
      select: expect.not.objectContaining({ password: true, email: true, roles: true }),
    }));
  });

  it('clamps user-list pagination and returns only profile fields', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(0);

    const result = await service.getAllUsers(-10, 10000);

    expect(result).toEqual({ data: [], total: 0, skip: 0, take: 100 });
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 100 }));
    expect(prisma.user.findMany.mock.calls[0][0].select).not.toHaveProperty('password');
    expect(prisma.user.findMany.mock.calls[0][0].select).not.toHaveProperty('roles');
  });

  it('does not return member profiles while the database is unavailable', async () => {
    prisma.isDatabaseAvailable.mockReturnValue(false);

    await expect(service.getPublicProfileById('user-2')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
