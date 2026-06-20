import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { NestExpressApplication } from '@nestjs/platform-express';
import { PrismaService } from './database/prisma.service';
import helmet from 'helmet';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  // SECURITY: Validate critical environment variables in production
  if (isProduction) {
    const requiredSecrets = [
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'DATABASE_URL',
    ];
    const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);
    
    if (missingSecrets.length > 0) {
      console.error(
        `❌ SECURITY ERROR: Missing required environment variables in production:\n` +
        missingSecrets.map(s => `   - ${s}`).join('\n') +
        `\n\nApplication will not start without these secrets.`
      );
      process.exit(1);
    }
  }

  // Load database config early to ensure DATABASE_URL is set for Prisma
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbUsername = process.env.DB_USERNAME || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || 'postgres';
  const dbName = process.env.DB_NAME || 'tribes_capital';

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `postgresql://${dbUsername}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const port = configService.get<number>('app.port') || 3000;
  const environment = configService.get<string>('app.environment') || 'development';

  app.use(helmet());
  
  // CORS: In production, frontend is served from same domain, so allow all origins
  // This prevents CORS issues with API calls from frontend
  app.enableCors({
    origin: true, // Allow all origins (frontend is same-domain anyway)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );
  app.useGlobalPipes(new ValidationPipe());

  // Run database migrations in production
  if (isProduction) {
    try {
      const prisma = app.get(PrismaService);
      console.log('Running database migrations...');
      await prisma.$executeRawUnsafe('SELECT 1'); // Test connection
      console.log('✅ Database connection verified');
    } catch (error) {
      console.error('❌ Database migration failed:', error);
      process.exit(1);
    }
  }

  await app.listen(port);
  console.log(`🚀 Tribes Capital Backend running on port ${port} (${environment})`);
}

bootstrap();
