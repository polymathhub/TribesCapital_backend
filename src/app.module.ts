import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import configurations from './config';
import { PrismaService } from './database/prisma.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

// Module imports
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { LearningModule } from './modules/learning/learning.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { ProgressModule } from './modules/progress/progress.module';
import { EventsModule } from './modules/events/events.module';
import { RsvpModule } from './modules/rsvp/rsvp.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { CommunityModule } from './modules/community/community.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configurations,
      envFilePath: ['.env', '.env.local'],
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    LearningModule,
    CoursesModule,
    LessonsModule,
    ProgressModule,
    EventsModule,
    RsvpModule,
    ProjectsModule,
    MarketplaceModule,
    DocumentsModule,
    CommunityModule,
    NotificationsModule,
    AnalyticsModule,
  ],
  providers: [
    PrismaService,
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
