import { registerAs } from '@nestjs/config';

const configuredFrontendUrl = (process.env.FRONTEND_URL || '').trim().replace(/\/+$/g, '');
const isProductionLike =
  process.env.NODE_ENV === 'production' || configuredFrontendUrl.startsWith('https://');
const defaultCallbackUrl = process.env.GOOGLE_CALLBACK_URL || (
  isProductionLike
    ? `${configuredFrontendUrl || 'https://community.tribes.capital'}/api/auth/google/callback`
    : undefined
);

export default registerAs('google', () => ({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackUrl: defaultCallbackUrl,
}));
