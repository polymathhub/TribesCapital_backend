import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RolesService } from '@modules/roles/roles.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolesService: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermission = this.reflector.getAllAndOverride<{ resource: string; action: string } | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userRoles = user.roles?.map((r: any) => r.name) || [];

    // If specific permission metadata is present, check it via rolesService
    if (requiredPermission && requiredPermission.resource && requiredPermission.action) {
      const ok = await this.rolesService.hasPermission(user.id, requiredPermission.resource, requiredPermission.action);
      if (!ok) {
        throw new ForbiddenException('Insufficient permissions');
      }
      return true;
    }

    if (requiredRoles) {
      const hasRole = requiredRoles.some((role) => userRoles.includes(role));
      if (!hasRole) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }
}
