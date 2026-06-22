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
  const startTime = Date.now();

  console.log(`\n📋 Starting Tribes Capital Backend...`);
  console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}\n`);

  // ============================================================================
  // STEP 1: Validate Critical Environment Variables
  // ============================================================================
  const requiredSecrets = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'DATABASE_URL',
  ];
  
  const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);

  if (missingSecrets.length > 0) {
    console.error(
      `\n❌ STARTUP ERROR: Missing critical environment variables:\n` +
      missingSecrets.map(s => `   • ${s}`).join('\n') +
      `\n\nPlease set these variables and try again.` +
      `\nFor Railway deployment: Set via dashboard Variables tab.` +
      `\nFor local development: Copy .env.example to .env.local and configure.\n`
    );
    process.exit(1);
  }

  // ============================================================================
  // STEP 2: Set Database URL (fallback if not already set)
  // ============================================================================
  if (!process.env.DATABASE_URL) {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbUsername = process.env.DB_USERNAME || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || 'postgres';
    const dbName = process.env.DB_NAME || 'tribes_capital';

    process.env.DATABASE_URL = `postgresql://${dbUsername}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
    console.log(`✅ Generated DATABASE_URL from individual components`);
  }

  // ============================================================================
  // STEP 3: Create NestJS Application
  // ============================================================================
  let app: NestExpressApplication;
  try {
    app = await NestFactory.create<NestExpressApplication>(AppModule);
    console.log(`✅ Application created successfully`);
  } catch (error) {
    console.error(`\n❌ Failed to create application:`, error);
    process.exit(1);
  }

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  const environment = configService.get<string>('app.environment') || 'development';

  // ============================================================================
  // STEP 4: Configure Security & Middleware
  // ============================================================================
  app.use(helmet());

  app.enableCors({
    origin: true,
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

  console.log(`✅ Security & middleware configured`);

  // ============================================================================
  // STEP 5: Verify Database Connection (with retries)
  // ============================================================================
  let dbConnected = false;
  let retries = 0;
  const maxRetries = 3;
  
  while (!dbConnected && retries < maxRetries) {
    try {
      const prisma = app.get(PrismaService);
      await prisma.$executeRawUnsafe('SELECT 1');
      dbConnected = true;
      console.log(`✅ Database connection verified`);
    } catch (error) {
      retries++;
      if (retries < maxRetries) {
        console.warn(
          `⚠️  Database connection attempt ${retries} failed. Retrying in 2s...`
        );
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.error(
          `\n❌ Database connection failed after ${maxRetries} attempts.`,
          `Check DATABASE_URL configuration.\n`,
          error instanceof Error ? error.message : error
        );
        process.exit(1);
      }
    }
  }

  // ============================================================================
  // STEP 6: Start Server
  // ============================================================================
  try {
    await app.listen(port);
    const uptime = Date.now() - startTime;
    console.log(`\n🚀 Server started successfully!`);
    console.log(`   Port: ${port}`);
    console.log(`   Env: ${environment}`);
    console.log(`   Startup time: ${uptime}ms\n`);
  } catch (error) {
    console.error(`\n❌ Failed to start server:`, error);
    process.exit(1);
  }
}

bootstrap();
