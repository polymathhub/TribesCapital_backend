import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import configurations from './config';
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
import { SpaFallbackController } from './spa-fallback.controller';
// DISABLED MODULES - not yet fully implemented
// import { ProgressModule } from './modules/progress/progress.module';
// import { RsvpModule } from './modules/rsvp/rsvp.module';
// import { ProjectsModule } from './modules/projects/projects.module';
// import { DocumentsModule } from './modules/documents/documents.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configurations,
      envFilePath: ['.env', '.env.local'],
    }),
    // Serve frontend static files with correct path
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../frontend/dist'),
      exclude: ['/api*'],
      serveStaticOptions: {
        index: ['index.html'],
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
  ],
  controllers: [SpaFallbackController],
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
