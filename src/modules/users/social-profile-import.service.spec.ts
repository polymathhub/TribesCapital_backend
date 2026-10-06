import { SocialProfileImportService } from './social-profile-import.service';

describe('SocialProfileImportService', () => {
  const user = {
    displayName: 'Current Name',
    firstName: 'Current',
    lastName: '',
    occupation: 'Current headline',
    bio: '',
    address: 'Current location',
    avatar: null,
    socialLink: null,
    socialLinks: [],
  };
  const prisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const config = { get: jest.fn((key: string) => key === 'jwt.secret' ? 'test-secret-that-is-at-least-32-characters-long' : undefined) };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({ ...user });
    prisma.user.update.mockResolvedValue({});
  });

  it('fills only empty profile fields and adds provider links', async () => {
    const service = new SocialProfileImportService(config as any, prisma as any);

    await (service as any).fillEmptyFields('user-1', 'x', {
      name: 'Imported Name',
      bio: 'Imported biography',
      location: 'Imported location',
      avatar: 'https://images.example/avatar.jpg',
      profileUrl: 'https://x.com/imported',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        lastName: 'Name',
        bio: 'Imported biography',
        avatar: 'https://images.example/avatar.jpg',
        socialLinks: ['https://x.com/imported'],
        socialLink: 'https://x.com/imported',
      },
    });
  });

  it('rejects unsupported providers before starting authorization', async () => {
    const service = new SocialProfileImportService(config as any, prisma as any);
    await expect(service.createAuthorizationUrl('user-1', 'unknown')).rejects.toThrow('Unsupported professional profile provider');
  });
});