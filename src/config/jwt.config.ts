import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('Missing JWT_ACCESS_SECRET or JWT_SECRET environment variable');
  }

  if (!refreshSecret) {
    throw new Error('Missing JWT_REFRESH_SECRET or JWT_SECRET environment variable');
  }

  return {
    secret,
    refreshSecret,
    accessTokenExpiry: process.env.JWT_EXPIRY || '24h',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  };
});
