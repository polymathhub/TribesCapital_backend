import { registerAs } from '@nestjs/config';

export type JwtAlgorithm = 'HS256' | 'RS256';

export interface JwtConfig {
  secret: string;
  refreshSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  algorithm: JwtAlgorithm;
  issuer?: string;
  audience?: string;
  clockTolerance?: string;
  privateKey?: string;
  publicKey?: string;
  refreshPrivateKey?: string;
  refreshPublicKey?: string;
  refreshTokenRotation?: boolean;
}

let cachedJwtConfig: JwtConfig | null = null;

function isJwtAlgorithm(value: string | undefined): value is JwtAlgorithm {
  return value === 'HS256' || value === 'RS256';
}

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value : undefined;
}

function createDevelopmentFallbackSecret(label: string): string {
  return `${label}-development-secret-${Math.random().toString(36).slice(2, 14)}`;
}

function isValidExpiry(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return /^-?\d+(ms|s|m|h|d|w)$/i.test(value.trim());
}

export function resolveJwtConfig(overrides: Partial<JwtConfig> = {}): JwtConfig {
  if (!Object.keys(overrides).length && cachedJwtConfig) {
    return cachedJwtConfig;
  }

  const environment = process.env.NODE_ENV || 'development';
  const configuredAlgorithm = getEnv('JWT_ALGORITHM');

  if (configuredAlgorithm && !isJwtAlgorithm(configuredAlgorithm)) {
    throw new Error('JWT_ALGORITHM must be either HS256 or RS256');
  }

  const algorithm: JwtAlgorithm = isJwtAlgorithm(configuredAlgorithm) ? configuredAlgorithm : 'HS256';
  const issuer = getEnv('JWT_ISSUER');
  const audience = getEnv('JWT_AUDIENCE');
  const clockTolerance = getEnv('JWT_CLOCK_TOLERANCE') || '5';
  const refreshTokenRotation = getEnv('JWT_REFRESH_TOKEN_ROTATION') === 'true';

  if (environment === 'production' && !getEnv('JWT_SECRET')) {
    throw new Error('JWT_SECRET must be configured in production');
  }

  if (environment === 'production' && !getEnv('JWT_REFRESH_SECRET')) {
    throw new Error('JWT_REFRESH_SECRET must be configured in production');
  }

  const resolvedSecret = overrides.secret ?? getEnv('JWT_SECRET') ?? (environment === 'production' ? '' : createDevelopmentFallbackSecret('access'));
  const resolvedRefreshSecret = overrides.refreshSecret ?? getEnv('JWT_REFRESH_SECRET') ?? (environment === 'production' ? '' : createDevelopmentFallbackSecret('refresh'));
  const resolvedAccessTokenExpiry = overrides.accessTokenExpiry ?? getEnv('JWT_ACCESS_TOKEN_EXPIRY') ?? getEnv('JWT_EXPIRY') ?? '15m';
  const resolvedRefreshTokenExpiry = overrides.refreshTokenExpiry ?? getEnv('JWT_REFRESH_TOKEN_EXPIRY') ?? getEnv('JWT_REFRESH_EXPIRY') ?? '7d';

  if (!isValidExpiry(resolvedAccessTokenExpiry)) {
    throw new Error('JWT_ACCESS_TOKEN_EXPIRY must be a valid duration such as 15m, 1h, or 7d');
  }

  if (!isValidExpiry(resolvedRefreshTokenExpiry)) {
    throw new Error('JWT_REFRESH_TOKEN_EXPIRY must be a valid duration such as 7d or 30d');
  }

  if (!resolvedSecret || resolvedSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (!resolvedRefreshSecret || resolvedRefreshSecret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
  }

  if (algorithm === 'RS256') {
    const privateKey = overrides.privateKey ?? getEnv('JWT_PRIVATE_KEY');
    const publicKey = overrides.publicKey ?? getEnv('JWT_PUBLIC_KEY');
    const refreshPrivateKey = overrides.refreshPrivateKey ?? getEnv('JWT_REFRESH_PRIVATE_KEY');
    const refreshPublicKey = overrides.refreshPublicKey ?? getEnv('JWT_REFRESH_PUBLIC_KEY');

    if (!privateKey || !publicKey || !refreshPrivateKey || !refreshPublicKey) {
      throw new Error('RS256 requires JWT_PRIVATE_KEY, JWT_PUBLIC_KEY, JWT_REFRESH_PRIVATE_KEY, and JWT_REFRESH_PUBLIC_KEY');
    }
  }

  cachedJwtConfig = {
    secret: resolvedSecret,
    refreshSecret: resolvedRefreshSecret,
    accessTokenExpiry: resolvedAccessTokenExpiry,
    refreshTokenExpiry: resolvedRefreshTokenExpiry,
    algorithm,
    issuer,
    audience,
    clockTolerance,
    privateKey: overrides.privateKey ?? getEnv('JWT_PRIVATE_KEY'),
    publicKey: overrides.publicKey ?? getEnv('JWT_PUBLIC_KEY'),
    refreshPrivateKey: overrides.refreshPrivateKey ?? getEnv('JWT_REFRESH_PRIVATE_KEY'),
    refreshPublicKey: overrides.refreshPublicKey ?? getEnv('JWT_REFRESH_PUBLIC_KEY'),
    refreshTokenRotation,
  };

  return cachedJwtConfig;
}

export default registerAs('jwt', () => resolveJwtConfig());
