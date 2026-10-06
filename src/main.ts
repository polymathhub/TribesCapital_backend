import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import express from 'express';
import { existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { isDatabaseSkipEnabled } from './common/utils/runtime-config';

async function bootstrap() {
  
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbUsername = process.env.DB_USERNAME || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'postgres';
  const dbName = process.env.DB_NAME || 'tribes_capital';

  const skipDatabase = isDatabaseSkipEnabled(process.env);
  const environment = (process.env.NODE_ENV || 'development').toLowerCase();
  const isProduction = environment === 'production';

  if (skipDatabase && isProduction) {
    console.warn('Database skip mode is enabled in production; continuing without a local DB bootstrap guard.');
  }

  if (!process.env.DATABASE_URL && !skipDatabase) {
    process.env.DATABASE_URL = `postgresql://${dbUsername}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.use(express.json({ limit: '8mb' }));
  app.use(express.urlencoded({ extended: true, limit: '8mb' }));
  const configService = app.get(ConfigService);

  const port = Number(process.env.PORT || configService.get<number>('app.port') || 3000);
  const host = process.env.APP_HOST || configService.get<string>('app.host') || '0.0.0.0';
  const corsOriginConfig = configService.get<string>('app.corsOrigin') || 'http://localhost:3000,http://localhost:5173';
  const allowedOrigins = corsOriginConfig
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const normalizeOrigin = (origin: string) => origin.replace(/\/+$/, '');
  const allowedOriginSet = new Set(allowedOrigins.map(normalizeOrigin));

  let corsOrigin: string | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void) = allowedOrigins[0] || 'http://localhost:5173';

  if (allowedOrigins.length > 1) {
    corsOrigin = (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = normalizeOrigin(origin);
      if (allowedOriginSet.has(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    };
  }

  app.use(helmet({ crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' } }));
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api';
  app.setGlobalPrefix(apiPrefix);

  const frontendDistCandidates = [
    resolve(process.cwd(), 'dist', 'frontend'),
    resolve(process.cwd(), 'frontend', 'dist'),
    resolve(__dirname, '..', 'dist', 'frontend'),
    resolve(__dirname, '..', 'frontend', 'dist'),
    resolve(__dirname, '..', '..', 'dist', 'frontend'),
    resolve(__dirname, '..', '..', 'frontend', 'dist'),
  ];

  const frontendDistPath = frontendDistCandidates.find((candidate) => existsSync(candidate)) || resolve(process.cwd(), 'dist', 'frontend');
  const frontendAssetsPath = join(frontendDistPath, 'assets');

  const httpAdapter = app.getHttpAdapter();
  const expressInstance = httpAdapter.getInstance();
  const swaggerPath = `/${apiPrefix}/docs`;
  expressInstance.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path === swaggerPath || req.path.startsWith(`${swaggerPath}/`)) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self';",
      );
    }
    next();
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Tribes Capital API')
    .setDescription('Authentication, profiles, learning, community, marketplace, events, and investor tools. Account type controls guest and investor access; administrative roles remain separate.')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'Registration, login, and session endpoints.')
    .addTag('Users', 'Authenticated profile read and update operations.')
    .addTag('Courses', 'Course catalog and enrollment operations.')
    .addTag('Lessons', 'Lesson content and progress operations.')
    .addTag('Events', 'Public event listings and member event actions.')
    .addTag('Community', 'Community browsing and member interactions.')
    .addTag('Marketplace', 'Contractor listings and member actions.')
    .addTag('Projects', 'Investor-only project endpoints; read-only for investor accounts.')
    .addTag('Due Diligence', 'Investor-only due-diligence endpoints; read-only for investor accounts.')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, swaggerDocument);

  expressInstance.use(express.static(frontendDistPath, { index: false }));
  if (existsSync(frontendAssetsPath)) {
    expressInstance.use('/assets', express.static(frontendAssetsPath));
  }

  const uploadsPath = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsPath)) {
    mkdirSync(uploadsPath, { recursive: true });
  }
  expressInstance.use('/uploads', express.static(uploadsPath));

  const spaIndexHandler = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (req.method !== 'GET') {
      return next();
    }

    if (req.path.includes('.')) {
      return next();
    }

    return res.sendFile(join(frontendDistPath, 'index.html'));
  };

  expressInstance.get(['/', '/login', '/signup', '/verify-email', '/reset-password', '/forgot-password', '/dashboard', '/home'], spaIndexHandler);
  expressInstance.get(new RegExp(`^\/(?!${apiPrefix}(?:\/|$)).*`), spaIndexHandler);

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(port, host);
  console.log(`🚀 Tribes Capital Backend running on http://${host}:${port} (${environment})`);
}

bootstrap();
