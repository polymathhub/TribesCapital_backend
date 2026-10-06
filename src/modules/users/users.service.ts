import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import { UpdateUserDto } from './dto/user.dto';

const DEFAULT_TAKE = 10;
const MAX_TAKE = 100;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserById(id: string) {
    if (!this.prisma.isDatabaseAvailable()) {
      if (id === 'demo-user') {
        return {
          id: 'demo-user',
          email: 'demo@tribes.capital',
          firstName: 'Demo',
          lastName: 'User',
          isActive: true,
          emailVerified: true,
          roles: [],
          permissions: [],
        };
      }
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,
        permissions: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async getPublicProfileById(id: string) {
    if (!this.prisma.isDatabaseAvailable()) throw new NotFoundException('User not found');
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        displayName: true,
        accountType: true,
        address: true,
        occupation: true,
        interests: true,
        socialLink: true,
        socialLinks: true,
        school: true,
        department: true,
        avatar: true,
        coverPhoto: true,
        bio: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const data = {
      ...updateUserDto,
      ...(updateUserDto.socialLinks ? { socialLinks: updateUserDto.socialLinks as Prisma.InputJsonArray } : {}),
    };
    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        roles: true,
      },
    });

    return this.sanitizeUser(user);
  }

  async deactivateUser(id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return this.sanitizeUser(user);
  }

  async getAllUsers(skip = 0, take = 10) {
    const safeSkip = Number.isFinite(skip) ? Math.max(0, Math.floor(skip)) : 0;
    const safeTake = Number.isFinite(take) ? Math.min(MAX_TAKE, Math.max(1, Math.floor(take))) : DEFAULT_TAKE;
    if (!this.prisma.isDatabaseAvailable()) {
      return {
        data: [],
        total: 0,
        skip: safeSkip,
        take: safeTake,
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: safeSkip,
        take: safeTake,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          accountType: true,
          address: true,
          occupation: true,
          interests: true,
          socialLink: true,
          socialLinks: true,
          school: true,
          department: true,
          avatar: true,
          coverPhoto: true,
          bio: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      total,
      skip: safeSkip,
      take: safeTake,
    };
  }

  private sanitizeUser(user: any) {
    const {
      password,
      passwordResetToken,
      passwordResetExpires,
      emailVerificationToken,
      googleId,
      ...result
    } = user;
    return result;
  }
}
