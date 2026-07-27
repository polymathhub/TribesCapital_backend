import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { existsSync } from 'fs';
import { resolve } from 'path';
import configurations from './config';
import { resolveJwtConfig } from './config/jwt.config';
import { validateConfig } from './config/validation';
import { DatabaseModule } from './database/database.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

// Module imports
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { LearningModule } from './modules/learning/learning.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { EventsModule } from './modules/events/events.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { CommunityModule } from './modules/community/community.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DueDiligenceModule } from './modules/due-diligence/due-diligence.module';
import { HealthModule } from './modules/health/health.module';


const frontendDistCandidates = [
  resolve(process.cwd(), 'dist', 'frontend'),
  resolve(process.cwd(), 'frontend', 'dist'),
  resolve(__dirname, '..', 'dist', 'frontend'),
  resolve(__dirname, '..', 'frontend', 'dist'),
  resolve(__dirname, '..', '..', 'dist', 'frontend'),
  resolve(__dirname, '..', '..', 'frontend', 'dist'),
];

const frontendDistPath = frontendDistCandidates.find((candidate) => existsSync(candidate)) || resolve(process.cwd(), 'dist', 'frontend');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configurations,
      envFilePath: ['.env', '.env.local'],
      validate: (config) => 
        validateConfig({
          ...config,
          jwt: resolveJwtConfig(config.jwt as Record<string, unknown>),
        }),
    }),
    ServeStaticModule.forRoot({
      rootPath: frontendDistPath,
      serveRoot: '/',
      exclude: ['/api*'],
      serveStaticOptions: {
        index: false,
        fallthrough: true,
      },
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    RolesModule,
    LearningModule,
    CoursesModule,
    LessonsModule,
    EventsModule,
    MarketplaceModule,
    CommunityModule,
    NotificationsModule,
    AnalyticsModule,
    DueDiligenceModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
