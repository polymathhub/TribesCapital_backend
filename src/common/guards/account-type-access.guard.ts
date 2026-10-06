import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  GUEST_READABLE_KEY,
  INVESTOR_ONLY_KEY,
  INVESTOR_READ_ONLY_KEY,
} from '@common/decorators/account-type-access.decorator';

@Injectable()
export class AccountTypeAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.accountType) return true;

    const handler = context.getHandler();
    const controller = context.getClass();
    const userRoles = user.roles?.map((role: any) => typeof role === 'string' ? role : role.name) || [];
    const isAdmin = userRoles.includes('admin') || userRoles.includes('super-admin');
    const investorOnly = this.reflector.getAllAndOverride<boolean>(INVESTOR_ONLY_KEY, [handler, controller]);
    const investorReadOnly = this.reflector.getAllAndOverride<boolean>(INVESTOR_READ_ONLY_KEY, [handler, controller]);

    if (investorOnly && user.accountType !== 'INVESTOR' && !isAdmin) {
      throw new ForbiddenException('Investor account required');
    }

    if (user.accountType === 'GUEST') {
      const guestReadable = this.reflector.getAllAndOverride<boolean>(GUEST_READABLE_KEY, [handler, controller]);
      if (request.method !== 'GET' || !guestReadable) {
        throw new ForbiddenException('Read-only guest access is limited to public content');
      }
    }

    if (user.accountType === 'INVESTOR' && investorReadOnly && request.method !== 'GET') {
      throw new ForbiddenException('Investor tools are read-only for this account');
    }

    return true;
  }
}