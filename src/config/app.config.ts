import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const environment = (process.env.NODE_ENV || 'development').trim();
  const rawFrontendUrl =
    process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
  const frontendUrl = rawFrontendUrl?.toString().trim().replace(/\/+$/g, '');
  const rawCorsOrigin = process.env.CORS_ORIGIN || rawFrontendUrl || 'http://localhost:5173';

  return {
    name: process.env.APP_NAME || 'Tribes Capital',
    environment,
    host: process.env.APP_HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '3000', 10),
    corsOrigin: rawCorsOrigin,
    frontendUrl,
    apiPrefix: process.env.API_PREFIX?.trim() || 'api',
    apiVersion: process.env.API_VERSION?.trim() || 'v1',
  };
});
