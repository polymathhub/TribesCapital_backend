import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { UpdateUserDto } from './dto/user.dto';

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
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
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
    if (!this.prisma.isDatabaseAvailable()) {
      return {
        data: [],
        total: 0,
        skip,
        take,
      };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        include: {
          roles: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users.map((u) => this.sanitizeUser(u)),
      total,
      skip,
      take,
    };
  }

  private sanitizeUser(user: any) {
    const { password, ...result } = user;
    return result;
  }
}
