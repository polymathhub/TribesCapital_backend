export function validateConfig(config: Record<string, unknown>): Record<string, unknown> {
  const app = config.app as Record<string, unknown> | undefined;
  const google = config.google as Record<string, unknown> | undefined;

  if (!app || typeof app.frontendUrl !== 'string' || !app.frontendUrl.trim()) {
    throw new Error('FRONTEND_URL must be configured and non-empty.');
  }

  if (!google || typeof google.clientId !== 'string' || !google.clientId.trim()) {
    throw new Error('GOOGLE_CLIENT_ID must be configured.');
  }

  if (!google || typeof google.clientSecret !== 'string' || !google.clientSecret.trim()) {
    throw new Error('GOOGLE_CLIENT_SECRET must be configured.');
  }

  const environment = typeof app.environment === 'string' ? app.environment.trim().toLowerCase() : 'development';
  let callbackUrl = typeof google.callbackUrl === 'string' ? google.callbackUrl.trim() : '';

  if (!callbackUrl) {
    callbackUrl = new URL('/api/auth/google/callback', app.frontendUrl as string).toString();
  }

  if (environment === 'production' && !callbackUrl) {
    throw new Error('GOOGLE_CALLBACK_URL must be configured in production for Google OAuth.');
  }

  try {
    new URL(app.frontendUrl as string);
  } catch {
    throw new Error('FRONTEND_URL must be a valid absolute URL with scheme (http:// or https://).');
  }

  if (callbackUrl) {
    try {
      new URL(callbackUrl);
    } catch {
      throw new Error('GOOGLE_CALLBACK_URL must be a valid absolute URL with scheme (http:// or https://).');
    }
  }

  if (google) {
    google.callbackUrl = callbackUrl;
  }

  return config;
}
