import { registerAs } from '@nestjs/config';

const defaultCallbackUrl =
  process.env.GOOGLE_CALLBACK_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://community.tribes.capital/api/auth/google/callback'
    : undefined);

export default registerAs('google', () => ({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackUrl: defaultCallbackUrl,
}));
