export function validateConfig(config: Record<string, unknown>): Record<string, unknown> {
  const app = config.app as Record<string, unknown> | undefined;
  const google = config.google as Record<string, unknown> | undefined;

  const frontendUrl =
    (typeof app?.frontendUrl === 'string' && app.frontendUrl.trim()) ||
    (typeof process.env.FRONTEND_URL === 'string' && process.env.FRONTEND_URL.trim()) ||
    (typeof process.env.CORS_ORIGIN === 'string' && process.env.CORS_ORIGIN.trim()) ||
    'https://community.tribes.capital';

  if (!frontendUrl) {
    throw new Error('FRONTEND_URL must be configured and non-empty.');
  }

  try {
    new URL(frontendUrl);
  } catch {
    throw new Error('FRONTEND_URL must be a valid absolute URL with scheme (http:// or https://).');
  }

  const googleClientId =
    (typeof google?.clientId === 'string' && google.clientId.trim()) ||
    (typeof process.env.GOOGLE_CLIENT_ID === 'string' && process.env.GOOGLE_CLIENT_ID.trim());

  const googleClientSecret =
    (typeof google?.clientSecret === 'string' && google.clientSecret.trim()) ||
    (typeof process.env.GOOGLE_CLIENT_SECRET === 'string' && process.env.GOOGLE_CLIENT_SECRET.trim());

  const environment = typeof app?.environment === 'string' ? app.environment.trim().toLowerCase() : 'development';
  let callbackUrl = typeof google?.callbackUrl === 'string' ? google.callbackUrl.trim() : '';

  if (!callbackUrl && frontendUrl) {
    callbackUrl = new URL('/api/auth/google/callback', frontendUrl).toString();
  }

  if (environment === 'production' && !callbackUrl) {
    throw new Error('GOOGLE_CALLBACK_URL must be configured in production for Google OAuth.');
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
    google.clientId = googleClientId;
    google.clientSecret = googleClientSecret;
  }

  if (app) {
    app.frontendUrl = frontendUrl;
  }

  return config;
}
