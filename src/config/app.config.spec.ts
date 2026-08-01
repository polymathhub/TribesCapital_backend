import appConfig from './app.config';

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
});
