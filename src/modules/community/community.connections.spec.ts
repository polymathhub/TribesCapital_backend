import { NotFoundException } from '@nestjs/common';
import { CommunityService } from './community.service';

describe('CommunityService connections', () => {
  const prisma = {
    isDatabaseAvailable: jest.fn(() => true),
    user: { findUnique: jest.fn() },
    connectionRequest: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  } as any;
  const service = new CommunityService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('creates a pending request to an active member', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'member-2', isActive: true });
    prisma.connectionRequest.findUnique.mockResolvedValue(null);
    prisma.connectionRequest.create.mockResolvedValue({ id: 'request-1', status: 'PENDING' });

    await expect(service.requestConnection('member-1', 'member-2')).resolves.toEqual({ id: 'request-1', status: 'PENDING' });
    expect(prisma.connectionRequest.create).toHaveBeenCalledWith({ data: { requesterId: 'member-1', recipientId: 'member-2' } });
  });

  it('accepts a pending reciprocal request instead of creating a duplicate', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'member-2', isActive: true });
    prisma.connectionRequest.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'request-reverse', status: 'PENDING' });
    prisma.connectionRequest.update.mockResolvedValue({ id: 'request-reverse', status: 'ACCEPTED' });

    await expect(service.requestConnection('member-1', 'member-2')).resolves.toEqual({ id: 'request-reverse', status: 'ACCEPTED' });
    expect(prisma.connectionRequest.create).not.toHaveBeenCalled();
  });

  it('only responds to a pending request addressed to the current member', async () => {
    prisma.connectionRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.respondToConnectionRequest('member-1', 'request-1', 'ACCEPTED')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.connectionRequest.updateMany).toHaveBeenCalledWith({
      where: { id: 'request-1', recipientId: 'member-1', status: 'PENDING' },
      data: { status: 'ACCEPTED' },
    });
  });
});
