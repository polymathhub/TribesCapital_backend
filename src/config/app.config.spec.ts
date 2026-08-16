import appConfig from './app.config';
import { validateConfig } from './validation';

describe('app config', () => {
  const originalFrontendUrl = process.env.FRONTEND_URL;
  const originalCORSOrigin = process.env.CORS_ORIGIN;

  afterEach(() => {
    if (originalFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = originalFrontendUrl;
    }

    if (originalCORSOrigin === undefined) {
      delete process.env.CORS_ORIGIN;
    } else {
      process.env.CORS_ORIGIN = originalCORSOrigin;
    }
  });

  it('preserves the https scheme when normalizing the frontend URL', () => {
    process.env.FRONTEND_URL = 'https://community.tribes.capital';
    delete process.env.CORS_ORIGIN;

    const config = appConfig();

    expect(config.frontendUrl).toBe('https://community.tribes.capital');
  });

  it('builds the Google callback from the backend origin when GOOGLE_CALLBACK_URL is absent', () => {
    delete process.env.GOOGLE_CALLBACK_URL;
    process.env.FRONTEND_URL = 'http://localhost:5173';
    process.env.CORS_ORIGIN = 'http://localhost:5173';
    process.env.APP_HOST = '0.0.0.0';
    process.env.PORT = '3000';

    const validated = validateConfig({
      app: {
        frontendUrl: 'http://localhost:5173',
        host: '0.0.0.0',
        port: 3000,
      },
      google: {
        clientId: 'client-id',
        clientSecret: 'client-secret',
        callbackUrl: '',
      },
    } as Record<string, unknown>);

    expect(validated.google).toMatchObject({
      callbackUrl: 'http://localhost:3000/api/auth/google/callback',
    });
  });

  it('keeps localhost origins available for local development even when a production frontend URL is configured', () => {
    process.env.FRONTEND_URL = 'https://community.tribes.capital';
    process.env.CORS_ORIGIN = 'https://community.tribes.capital';

    const config = appConfig();

    expect(config.corsOrigin).toContain('http://localhost:5173');
    expect(config.corsOrigin).toContain('http://localhost:3000');
    expect(config.corsOrigin).toContain('https://community.tribes.capital');
  });
});
