import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      const demoEmail = 'demo@tribes.capital';
      let demoUser = await this.prismaService.user.findUnique({
        where: { email: demoEmail },
        select: { id: true, email: true, firstName: true, lastName: true, isActive: true, emailVerified: true },
      });

      if (!demoUser) {
        demoUser = await this.prismaService.user.create({
          data: {
            email: demoEmail,
            firstName: 'Demo',
            lastName: 'User',
            password: 'dev-placeholder-password',
            isActive: true,
            emailVerified: true,
          },
          select: { id: true, email: true, firstName: true, lastName: true, isActive: true, emailVerified: true },
        });
      }

      request.user = {
        ...demoUser,
        roles: [],
      };
      return true;
    }

    return super.canActivate(context) as any;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Unauthorized');
    }
    return user;
  }
}
