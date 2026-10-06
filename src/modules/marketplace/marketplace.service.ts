import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CreateContractorReviewDto, SaveContractorProfileDto } from './dto/contractor.dto';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  async listContractors(query: { search?: string; service?: string; location?: string; skip?: number; take?: number }) {
    this.ensureDatabase();
    const skip = Number.isFinite(query.skip) ? Math.max(0, Math.floor(query.skip as number)) : 0;
    const take = Number.isFinite(query.take) ? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(query.take as number))) : 50;
    const search = query.search?.trim();
    const where = {
      ...(query.service ? { services: { has: query.service } } : {}),
      ...(query.location ? { location: { contains: query.location.trim(), mode: 'insensitive' as const } } : {}),
      ...(search ? { OR: [
        { businessName: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { services: { has: search } },
        { location: { contains: search, mode: 'insensitive' as const } },
      ] } : {}),
    };

    const [profiles, total] = await Promise.all([
      this.prisma.contractorProfile.findMany({
        where,
        skip,
        take,
        orderBy: [{ isVerified: 'desc' }, { updatedAt: 'desc' }],
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.contractorProfile.count({ where }),
    ]);
    const ratings = profiles.length ? await this.prisma.contractorReview.groupBy({
      by: ['contractorId'],
      where: { contractorId: { in: profiles.map((profile) => profile.id) } },
      _avg: { rating: true },
    }) : [];
    const averageById = new Map(ratings.map((rating) => [rating.contractorId, rating._avg.rating || 0]));

    return {
      data: profiles.map(({ _count, ...profile }) => ({
        ...profile,
        reviewCount: _count.reviews,
        averageRating: averageById.get(profile.id) || 0,
      })),
      total,
      skip,
      take,
    };
  }

  async getMyProfile(userId: string) {
    this.ensureDatabase();
    const profile = await this.prisma.contractorProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Contractor profile not found');
    return profile;
  }

  async saveMyProfile(userId: string, dto: SaveContractorProfileDto) {
    this.ensureDatabase();
    const data = {
      businessName: dto.businessName.trim(),
      description: dto.description.trim(),
      services: dto.services.map((service) => service.trim()).filter(Boolean),
      location: dto.location?.trim() || null,
      contactEmail: dto.contactEmail?.trim() || null,
      website: dto.website?.trim() || null,
      certifications: dto.certifications?.map((certificate) => certificate.trim()).filter(Boolean) || [],
      teamSize: dto.teamSize?.trim() || null,
      foundedYear: dto.foundedYear,
    };
    return this.prisma.contractorProfile.upsert({
      where: { userId },
      create: { ...data, userId },
      update: data,
    });
  }

  async getContractor(id: string) {
    this.ensureDatabase();
    const profile = await this.prisma.contractorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
        },
        _count: { select: { reviews: true } },
      },
    });
    if (!profile) throw new NotFoundException('Contractor not found');
    const average = profile.reviews.length
      ? profile.reviews.reduce((total, review) => total + review.rating, 0) / profile.reviews.length
      : 0;
    return { ...profile, reviewCount: profile._count.reviews, averageRating: average };
  }

  async addReview(contractorId: string, authorId: string, dto: CreateContractorReviewDto) {
    this.ensureDatabase();
    const profile = await this.prisma.contractorProfile.findUnique({ where: { id: contractorId }, select: { id: true, userId: true } });
    if (!profile) throw new NotFoundException('Contractor not found');
    if (profile.userId === authorId) throw new BadRequestException('You cannot review your own business');
    return this.prisma.contractorReview.upsert({
      where: { contractorId_authorId: { contractorId, authorId } },
      create: { contractorId, authorId, rating: dto.rating, content: dto.content?.trim() || null },
      update: { rating: dto.rating, content: dto.content?.trim() || null },
    });
  }

  async setVerification(id: string, isVerified: boolean) {
    this.ensureDatabase();
    try {
      return await this.prisma.contractorProfile.update({ where: { id }, data: { isVerified } });
    } catch (error) {
      if ((error as { code?: string })?.code === 'P2025') throw new NotFoundException('Contractor not found');
      throw error;
    }
  }

  private ensureDatabase() {
    if (!this.prisma.isDatabaseAvailable()) {
      throw new ServiceUnavailableException('Marketplace data is unavailable while the database is offline.');
    }
  }
}