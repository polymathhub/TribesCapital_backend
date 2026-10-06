import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SocialProfileImportController } from './social-profile-import.controller';
import { SocialProfileImportService } from './social-profile-import.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController, SocialProfileImportController],
  providers: [UsersService, SocialProfileImportService],
  exports: [UsersService],
})
export class UsersModule {}
