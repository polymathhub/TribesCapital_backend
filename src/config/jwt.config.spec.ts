import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { resolveJwtConfig } from './jwt.config';

describe('resolveJwtConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_ALGORITHM;
    delete process.env.JWT_ACCESS_TOKEN_EXPIRY;
    delete process.env.JWT_REFRESH_TOKEN_EXPIRY;
    delete process.env.JWT_ISSUER;
    delete process.env.JWT_AUDIENCE;
    delete process.env.JWT_CLOCK_TOLERANCE;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses development defaults when secrets are absent', () => {
    process.env.NODE_ENV = 'development';

    const config = resolveJwtConfig();

    expect(config.secret).toBeDefined();
    expect(config.refreshSecret).toBeDefined();
    expect(config.algorithm).toBe('HS256');
    expect(config.accessTokenExpiry).toBe('15m');
    expect(config.refreshTokenExpiry).toBe('7d');
  });

  it('rejects invalid algorithms in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-very-secure-secret';
    process.env.JWT_REFRESH_SECRET = 'another-secure-secret';
    process.env.JWT_ALGORITHM = 'HS384';

    expect(() => resolveJwtConfig()).toThrow(/JWT_ALGORITHM/);
  });
});
