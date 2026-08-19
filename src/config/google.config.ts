import { registerAs } from '@nestjs/config';

export default registerAs('google', () => {
  const configuredFrontendUrl = (process.env.FRONTEND_URL || '').trim().replace(/\/+$/g, '');
  const isProductionLike =
    process.env.NODE_ENV === 'production' || configuredFrontendUrl.startsWith('https://');
  const configuredCallbackUrl = (process.env.GOOGLE_CALLBACK_URL || '').trim();
  const configuredCallbackIsLocal = /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?\//i.test(configuredCallbackUrl);
  const publicCallbackUrl = isProductionLike
    ? `${configuredFrontendUrl || 'https://community.tribes.capital'}/api/auth/google/callback`
    : undefined;

  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: configuredCallbackUrl && !(isProductionLike && configuredCallbackIsLocal)
      ? configuredCallbackUrl
      : publicCallbackUrl,
  };
});
