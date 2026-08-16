import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const environment = (process.env.NODE_ENV || 'development').trim();
  const rawFrontendUrl =
    process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
  const frontendUrl = rawFrontendUrl?.toString().trim().replace(/\/+$/g, '');
  const configuredCorsOrigin = (process.env.CORS_ORIGIN || '').trim();
  const defaultLocalOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];

  const corsOrigins = new Set<string>();
  if (configuredCorsOrigin) {
    configuredCorsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean).forEach((origin) => corsOrigins.add(origin));
  }
  defaultLocalOrigins.forEach((origin) => corsOrigins.add(origin));

  if (frontendUrl && !corsOrigins.has(frontendUrl)) {
    corsOrigins.add(frontendUrl);
  }

  const rawCorsOrigin = Array.from(corsOrigins).join(',');

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
