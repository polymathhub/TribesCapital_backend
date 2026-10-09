import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountTypeAccessGuard } from './account-type-access.guard';
import {
  GUEST_READABLE_KEY,
  INVESTOR_ONLY_KEY,
  INVESTOR_READ_ONLY_KEY,
} from '@common/decorators/account-type-access.decorator';

describe('AccountTypeAccessGuard', () => {
  const handler = () => undefined;
  class Controller {}
  const createContext = (user: any, method: string) => ({
    switchToHttp: () => ({ getRequest: () => ({ user, method }) }),
    getHandler: () => handler,
    getClass: () => Controller,
  }) as any;

  it('allows guests to read explicitly guest-readable routes', () => {
    const reflector = { getAllAndOverride: (key: string) => key === GUEST_READABLE_KEY } as unknown as Reflector;
    const guard = new AccountTypeAccessGuard(reflector);
    expect(guard.canActivate(createContext({ accountType: 'GUEST' }, 'GET'))).toBe(true);
  });

  it('blocks guest writes and unapproved reads', () => {
    const reflector = { getAllAndOverride: () => false } as unknown as Reflector;
    const guard = new AccountTypeAccessGuard(reflector);
    expect(() => guard.canActivate(createContext({ accountType: 'GUEST' }, 'POST'))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(createContext({ accountType: 'GUEST' }, 'GET'))).toThrow(ForbiddenException);
  });

  it('allows community members to read routes without investor-only access', () => {
    const reflector = { getAllAndOverride: () => false } as unknown as Reflector;
    const guard = new AccountTypeAccessGuard(reflector);
    expect(guard.canActivate(createContext({ accountType: 'COMMUNITY_MEMBER' }, 'GET'))).toBe(true);
  });

  it('limits investor tools to investor reads', () => {
    const reflector = { getAllAndOverride: (key: string) => key === INVESTOR_ONLY_KEY || key === INVESTOR_READ_ONLY_KEY } as unknown as Reflector;
    const guard = new AccountTypeAccessGuard(reflector);
    expect(guard.canActivate(createContext({ accountType: 'INVESTOR' }, 'GET'))).toBe(true);
    expect(() => guard.canActivate(createContext({ accountType: 'INVESTOR' }, 'POST'))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(createContext({ accountType: 'COMMUNITY_MEMBER' }, 'GET'))).toThrow(ForbiddenException);
  });
});