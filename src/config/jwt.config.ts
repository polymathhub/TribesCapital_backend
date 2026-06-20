import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  // CRITICAL: Ensure secrets are set in production to prevent auth bypass
  if (isProduction && (!accessSecret || !refreshSecret)) {
    throw new Error(
      'SECURITY: JWT secrets are required in production. ' +
      'Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables. ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  return {
    access: {
      secret: accessSecret || 'dev-access-secret-change-this-in-production-min-32-chars',
      expiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    },
    refresh: {
      secret: refreshSecret || 'dev-refresh-secret-change-this-in-production-min-32-chars',
      expiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    },
  };
});
