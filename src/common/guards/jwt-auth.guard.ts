import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const isDevelopment = (this.configService.get<string>('app.environment') || 'development') !== 'production';

    if (isDevelopment && !request.headers?.authorization) {
      return this.getDevelopmentUser().then((user) => {
        request.user = user;
        return true;
      });
    }

    return super.canActivate(context);
  }

  private async getDevelopmentUser() {
    const devEmail = 'demo@tribes.capital';
    const existingUser = await this.prisma.user.findUnique({
      where: { email: devEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        emailVerified: true,
        roles: { select: { name: true } },
      },
    });

    if (existingUser) {
      return {
        id: existingUser.id,
        sub: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        roles: existingUser.roles.map((role: { name: string }) => role.name),
      };
    }

    try {
      const createdUser = await this.prisma.user.create({
        data: {
          email: devEmail,
          firstName: 'Demo',
          lastName: 'User',
          password: 'dev-only-password',
          emailVerified: true,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          emailVerified: true,
          roles: { select: { name: true } },
        },
      });

      return {
        id: createdUser.id,
        sub: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        roles: createdUser.roles.map((role: { name: string }) => role.name),
      };
    } catch (error) {
      const fallbackUser = await this.prisma.user.findUnique({
        where: { email: devEmail },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          emailVerified: true,
          roles: { select: { name: true } },
        },
      });

      if (!fallbackUser) {
        throw error;
      }

      return {
        id: fallbackUser.id,
        sub: fallbackUser.id,
        email: fallbackUser.email,
        firstName: fallbackUser.firstName,
        lastName: fallbackUser.lastName,
        roles: fallbackUser.roles.map((role: { name: string }) => role.name),
      };
    }
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Unauthorized');
    }
    return user;
  }
}
