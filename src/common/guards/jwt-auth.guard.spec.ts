import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const createContext = (authorization?: string) => {
    const request = { headers: authorization ? { authorization } : {}, user: undefined };
    return {
      request,
      context: {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({ getRequest: () => request }),
      } as any,
    };
  };

  it('accepts the frontend demo token in development and attaches the demo user', async () => {
    const guard = new JwtAuthGuard(
      { getAllAndOverride: jest.fn().mockReturnValue(false) } as any,
      { get: jest.fn().mockReturnValue('development') } as any,
      { isDatabaseAvailable: jest.fn().mockReturnValue(false) } as any,
    );
    const { context, request } = createContext('Bearer demo-access-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual(expect.objectContaining({
      id: 'demo-user',
      email: 'demo@tribes.capital',
    }));
  });

});