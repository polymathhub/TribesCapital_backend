import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  access: {
    secret: process.env.JWT_ACCESS_SECRET || 'access-secret-key-change-in-production',
    expiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  },
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key-change-in-production',
    expiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
}));
