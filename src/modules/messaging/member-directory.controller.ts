import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

const normalizePage = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(Math.floor(parsed), 1) : 1;
};

const normalizeLimit = (value: string | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.floor(parsed), 1), 50) : 24;
};

@Controller('messaging/members')
@UseGuards(JwtAuthGuard)
export class MemberDirectoryController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listMembers(
    @CurrentUser() user: any,
    @Query('query') query?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const currentPage = normalizePage(page);
    const pageSize = normalizeLimit(limit);
    const search = query?.trim();
    const where: any = {
      id: { not: user.id },
      isActive: true,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isActive: true,
          lastLogin: true,
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      data: users.map((member) => ({
        ...member,
        lastSeenAt: member.lastLogin,
      })),
      meta: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
    };
  }
}
