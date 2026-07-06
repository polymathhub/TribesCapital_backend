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

function isValidExpiry(value: string | undefined): boolean {
  return Boolean(value && /^-?\d+(ms|s|m|h|d|w)$/i.test(value.trim()));
}

export function resolveJwtConfig(overrides: Partial<JwtConfig> = {}): JwtConfig {
  if (!Object.keys(overrides).length && cachedJwtConfig) {
    return cachedJwtConfig;
  }

  const configuredAlgorithm = getEnv('JWT_ALGORITHM');
  if (configuredAlgorithm && !isJwtAlgorithm(configuredAlgorithm)) {
    throw new Error('JWT_ALGORITHM must be either HS256 or RS256');
  }

  const algorithm: JwtAlgorithm = isJwtAlgorithm(configuredAlgorithm) ? configuredAlgorithm : 'HS256';
  const issuer = getEnv('JWT_ISSUER');
  const audience = getEnv('JWT_AUDIENCE');
  const clockTolerance = getEnv('JWT_CLOCK_TOLERANCE') || '5';
  const refreshTokenRotation = getEnv('JWT_REFRESH_TOKEN_ROTATION') === 'true';

  const resolvedSecret = overrides.secret ?? getEnv('JWT_SECRET') ?? getEnv('JWT_ACCESS_SECRET');
  const resolvedRefreshSecret = overrides.refreshSecret ?? getEnv('JWT_REFRESH_SECRET') ?? getEnv('JWT_REFRESH_TOKEN_SECRET');
  const resolvedAccessTokenExpiry = overrides.accessTokenExpiry ?? getEnv('JWT_ACCESS_EXPIRY') ?? getEnv('JWT_ACCESS_TOKEN_EXPIRY') ?? getEnv('JWT_EXPIRY');
  const resolvedRefreshTokenExpiry = overrides.refreshTokenExpiry ?? getEnv('JWT_REFRESH_EXPIRY') ?? getEnv('JWT_REFRESH_TOKEN_EXPIRY');

  if (!resolvedSecret) {
    throw new Error('JWT_SECRET must be configured');
  }

  if (!resolvedRefreshSecret) {
    throw new Error('JWT_REFRESH_SECRET must be configured');
  }

  if (!resolvedAccessTokenExpiry || !isValidExpiry(resolvedAccessTokenExpiry)) {
    throw new Error('JWT_ACCESS_EXPIRY must be a valid duration such as 15m, 1h, or 7d');
  }

  if (!resolvedRefreshTokenExpiry || !isValidExpiry(resolvedRefreshTokenExpiry)) {
    throw new Error('JWT_REFRESH_EXPIRY must be a valid duration such as 7d or 30d');
  }

  if (resolvedSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (resolvedRefreshSecret.length < 32) {
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
