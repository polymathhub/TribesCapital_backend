import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CreateCommunityCommentDto, CreateCommunityPostDto } from './dto/community.dto';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    this.ensureDatabase();
    const [members, discussions] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.communityPost.count(),
    ]);
    return { members, discussions };
  }

  async listMembers(userId: string, search = '', take = 20) {
    this.ensureDatabase();
    const limit = this.normalizeTake(take);
    const term = search.trim();
    const members = await this.prisma.user.findMany({
      where: {
        isActive: true,
        ...(term ? {
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { occupation: { contains: term, mode: 'insensitive' } },
          ],
        } : {}),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        occupation: true,
        address: true,
        avatar: true,
        communityFollowers: { where: { followerId: userId }, select: { id: true } },
      },
    });

    return members.map(({ communityFollowers, ...member }) => ({ ...member, isFollowedByMe: communityFollowers.length > 0 }));
  }

  async listPosts(userId: string, query: { category?: string; search?: string; skip?: number; take?: number }) {
    this.ensureDatabase();
    const skip = this.normalizeSkip(query.skip);
    const take = this.normalizeTake(query.take);
    const search = query.search?.trim();
    const where = {
      ...(query.category && query.category !== 'All' ? { category: query.category } : {}),
      ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' as const } }, { content: { contains: search, mode: 'insensitive' as const } }] } : {}),
    };

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        skip,
        take,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: this.postInclude(userId),
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    return { data: posts.map((post) => this.serializePost(post)), total, skip, take };
  }

  async createPost(userId: string, dto: CreateCommunityPostDto) {
    this.ensureDatabase();
    const post = await this.prisma.communityPost.create({
      data: {
        title: dto.title.trim(),
        content: dto.content.trim(),
        category: dto.category?.trim() || 'General',
        tags: dto.tags || [],
        creatorId: userId,
      },
      include: this.postInclude(userId),
    });
    return this.serializePost(post);
  }

  async getPost(id: string, userId: string) {
    this.ensureDatabase();
    const existing = await this.prisma.communityPost.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException('Discussion not found');
    await this.prisma.communityPost.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: {
        ...this.postInclude(userId),
        comments: {
          take: MAX_PAGE_SIZE,
          orderBy: { createdAt: 'asc' },
          include: {
            creator: { select: { id: true, firstName: true, lastName: true, occupation: true, address: true, avatar: true } },
            votes: { where: { userId }, select: { value: true } },
          },
        },
      },
    });
    if (!post) throw new NotFoundException('Discussion not found');
    return this.serializePost(post);
  }

  async createComment(postId: string, userId: string, dto: CreateCommunityCommentDto) {
    this.ensureDatabase();
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) throw new NotFoundException('Discussion not found');
    const comment = await this.prisma.communityComment.create({
      data: { postId, creatorId: userId, content: dto.content.trim() },
      include: { creator: { select: { id: true, firstName: true, lastName: true, occupation: true, address: true, avatar: true } } },
    });
    return this.serializeComment({ ...comment, votes: [] });
  }

  async togglePostVote(postId: string, userId: string) {
    this.ensureDatabase();
    return this.prisma.$transaction(async (tx) => {
      const post = await tx.communityPost.findUnique({ where: { id: postId }, select: { id: true } });
      if (!post) throw new NotFoundException('Discussion not found');
      const key = { userId_postId: { userId, postId } };
      const existing = await tx.communityPostVote.findUnique({ where: key });
      if (existing) {
        await tx.communityPostVote.delete({ where: { id: existing.id } });
        await tx.communityPost.update({ where: { id: postId }, data: { upvotes: { decrement: 1 } } });
      } else {
        await tx.communityPostVote.create({ data: { userId, postId, value: 1 } });
        await tx.communityPost.update({ where: { id: postId }, data: { upvotes: { increment: 1 } } });
      }
      const updated = await tx.communityPost.findUnique({ where: { id: postId }, select: { upvotes: true, downvotes: true } });
      return { userVote: existing ? 0 : 1, upvotes: updated?.upvotes || 0, downvotes: updated?.downvotes || 0 };
    });
  }

  async toggleCommentVote(commentId: string, userId: string) {
    this.ensureDatabase();
    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.communityComment.findUnique({ where: { id: commentId }, select: { id: true } });
      if (!comment) throw new NotFoundException('Comment not found');
      const key = { userId_commentId: { userId, commentId } };
      const existing = await tx.communityCommentVote.findUnique({ where: key });
      if (existing) {
        await tx.communityCommentVote.delete({ where: { id: existing.id } });
        await tx.communityComment.update({ where: { id: commentId }, data: { upvotes: { decrement: 1 } } });
      } else {
        await tx.communityCommentVote.create({ data: { userId, commentId, value: 1 } });
        await tx.communityComment.update({ where: { id: commentId }, data: { upvotes: { increment: 1 } } });
      }
      const updated = await tx.communityComment.findUnique({ where: { id: commentId }, select: { upvotes: true, downvotes: true } });
      return { userVote: existing ? 0 : 1, upvotes: updated?.upvotes || 0, downvotes: updated?.downvotes || 0 };
    });
  }

  async togglePostSave(postId: string, userId: string) {
    this.ensureDatabase();
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) throw new NotFoundException('Discussion not found');
    const key = { userId_postId: { userId, postId } };
    const existing = await this.prisma.communityPostSave.findUnique({ where: key });
    if (existing) {
      await this.prisma.communityPostSave.delete({ where: { id: existing.id } });
      return { saved: false };
    }
    await this.prisma.communityPostSave.create({ data: { userId, postId } });
    return { saved: true };
  }

  async toggleFollow(followerId: string, followedId: string) {
    this.ensureDatabase();
    if (followerId === followedId) throw new BadRequestException('You cannot follow yourself');
    const member = await this.prisma.user.findUnique({ where: { id: followedId }, select: { id: true } });
    if (!member) throw new NotFoundException('Member not found');
    const key = { followerId_followedId: { followerId, followedId } };
    const existing = await this.prisma.communityFollow.findUnique({ where: key });
    if (existing) {
      await this.prisma.communityFollow.delete({ where: { id: existing.id } });
      return { following: false };
    }
    await this.prisma.communityFollow.create({ data: { followerId, followedId } });
    return { following: true };
  }

  async listConnections(userId: string) {
    this.ensureDatabase();
    const memberSelect = { id: true, firstName: true, lastName: true, displayName: true, occupation: true, bio: true, school: true, department: true, avatar: true };
    const [received, sent, connections] = await Promise.all([
      this.prisma.connectionRequest.findMany({ where: { recipientId: userId, status: 'PENDING' }, include: { requester: { select: memberSelect } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.connectionRequest.findMany({ where: { requesterId: userId, status: 'PENDING' }, include: { recipient: { select: memberSelect } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.connectionRequest.findMany({ where: { OR: [{ requesterId: userId }, { recipientId: userId }], status: 'ACCEPTED' }, include: { requester: { select: memberSelect }, recipient: { select: memberSelect } }, orderBy: { updatedAt: 'desc' } }),
    ]);
    return { received, sent, connections };
  }

  async requestConnection(requesterId: string, recipientId: string) {
    this.ensureDatabase();
    if (requesterId === recipientId) throw new BadRequestException('You cannot connect with yourself');
    const recipient = await this.prisma.user.findUnique({ where: { id: recipientId }, select: { id: true, isActive: true } });
    if (!recipient?.isActive) throw new NotFoundException('Member not found');

    const sentKey = { requesterId_recipientId: { requesterId, recipientId } };
    const reverseKey = { requesterId_recipientId: { requesterId: recipientId, recipientId: requesterId } };
    const [existing, reverse] = await Promise.all([
      this.prisma.connectionRequest.findUnique({ where: sentKey }),
      this.prisma.connectionRequest.findUnique({ where: reverseKey }),
    ]);
    if (existing?.status === 'ACCEPTED' || existing?.status === 'PENDING') return existing;
    if (reverse?.status === 'ACCEPTED') return reverse;
    if (reverse?.status === 'PENDING') {
      return this.prisma.connectionRequest.update({ where: { id: reverse.id }, data: { status: 'ACCEPTED' } });
    }
    if (existing) {
      return this.prisma.connectionRequest.update({ where: { id: existing.id }, data: { status: 'PENDING' } });
    }
    return this.prisma.connectionRequest.create({ data: { requesterId, recipientId } });
  }

  async respondToConnectionRequest(userId: string, requestId: string, status: 'ACCEPTED' | 'DECLINED') {
    this.ensureDatabase();
    const result = await this.prisma.connectionRequest.updateMany({
      where: { id: requestId, recipientId: userId, status: 'PENDING' },
      data: { status },
    });
    if (!result.count) throw new NotFoundException('Pending connection request not found');
    return this.prisma.connectionRequest.findUnique({ where: { id: requestId } });
  }

  private postInclude(userId: string) {
    return {
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          occupation: true,
          address: true,
          avatar: true,
          communityFollowers: { where: { followerId: userId }, select: { id: true } },
        },
      },
      votes: { where: { userId }, select: { value: true } },
      saves: { where: { userId }, select: { id: true } },
      _count: { select: { comments: true } },
    };
  }

  private serializePost(post: any) {
    const { votes = [], saves = [], _count, creator, comments, ...data } = post;
    const { communityFollowers = [], ...creatorData } = creator || {};
    return {
      ...data,
      creator: { ...creatorData, isFollowedByMe: communityFollowers.length > 0 },
      userVote: votes[0]?.value || 0,
      savedByMe: saves.length > 0,
      commentsCount: _count?.comments ?? comments?.length ?? 0,
      ...(comments ? { comments: comments.map((comment: any) => this.serializeComment(comment)) } : {}),
    };
  }

  private serializeComment(comment: any) {
    const { votes = [], ...data } = comment;
    return { ...data, userVote: votes[0]?.value || 0 };
  }

  private normalizeSkip(value?: number) {
    return Number.isFinite(value) ? Math.max(0, Math.floor(value as number)) : 0;
  }

  private normalizeTake(value?: number) {
    return Number.isFinite(value) ? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(value as number))) : 20;
  }

  private ensureDatabase() {
    if (!this.prisma.isDatabaseAvailable()) {
      throw new ServiceUnavailableException('Community data is unavailable while the database is offline.');
    }
  }
}