import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

async function bootstrap() {
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

  const port = Number(process.env.PORT || configService.get<number>('app.port') || 3000);
  const environment = configService.get<string>('app.environment') || 'development';
  let corsOrigin: string | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void) = 'http://localhost:3000';

  const corsOriginConfig = configService.get<string>('app.corsOrigin') || 'http://localhost:3000,http://localhost:5173';
  
  // Parse multiple origins if comma-separated
  const allowedOrigins = corsOriginConfig.split(',').map(origin => origin.trim()).filter(Boolean);
  
  // If multiple origins, use a function to validate dynamically
  if (allowedOrigins.length > 1) {
    corsOrigin = (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    };
  } else if (allowedOrigins.length === 1) {
    corsOrigin = allowedOrigins[0]; 
  }

  app.use(helmet());
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(port);
  console.log(`🚀 Tribes Capital Backend running on port ${port} (${environment})`);
}

bootstrap();
