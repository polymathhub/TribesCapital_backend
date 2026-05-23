import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CreateRoleDto, CreatePermissionDto, AssignRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async createRole(createRoleDto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new BadRequestException('Role already exists');
    }

    return this.prisma.role.create({
      data: createRoleDto,
      include: {
        permissions: true,
      },
    });
  }

  async getRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
        users: true,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async getAllRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: true,
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async assignRoleToUser(assignRoleDto: AssignRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: assignRoleDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: assignRoleDto.roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.prisma.user.update({
      where: { id: assignRoleDto.userId },
      data: {
        roles: {
          connect: { id: assignRoleDto.roleId },
        },
      },
      include: {
        roles: true,
      },
    });
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          disconnect: { id: roleId },
        },
      },
      include: {
        roles: true,
      },
    });
  }

  async createPermission(createPermissionDto: CreatePermissionDto) {
    const existingPermission = await this.prisma.permission.findFirst({
      where: {
        resource: createPermissionDto.resource,
        action: createPermissionDto.action,
      },
    });

    if (existingPermission) {
      throw new BadRequestException('Permission already exists');
    }

    return this.prisma.permission.create({
      data: createPermissionDto,
    });
  }

  async assignPermissionToRole(roleId: string, permissionId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          connect: { id: permissionId },
        },
      },
      include: {
        permissions: true,
      },
    });
  }

  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
        permissions: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rolePermissions = user.roles.flatMap((role) => role.permissions);
    const directPermissions = user.permissions;

    const allPermissions = [...rolePermissions, ...directPermissions];
    const uniquePermissions = Array.from(
      new Map(allPermissions.map((p) => [p.id, p])).values(),
    );

    return uniquePermissions;
  }

  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some((p) => p.resource === resource && p.action === action);
  }
}
