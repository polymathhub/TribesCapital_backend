import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';

@Controller('uploads/multipart')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get('profile/:userId/:purpose/:fileName')
  @Public()
  async getProfileImage(
    @Param('userId') userId: string,
    @Param('purpose') purpose: string,
    @Param('fileName') fileName: string,
    @Res() response: Response,
  ) {
    if (!['profile-avatar', 'profile-cover'].includes(purpose) || fileName.includes('..')) {
      throw new BadRequestException('Invalid profile image');
    }
    const key = `uploads/${userId}/${purpose}/${fileName}`;
    return response.redirect(await this.uploadsService.getSignedDownloadUrl(key));
  }

  @Post('initiate')
  initiate(@CurrentUser() user: any, @Body() body: any) {
    return this.uploadsService.initiate(user.id, body);
  }

  @Post('part-url')
  getPartUrl(@CurrentUser() user: any, @Body() body: any) {
    return this.uploadsService.getPartUrl(user.id, body.key, body.uploadId, Number(body.partNumber));
  }

  @Post('complete')
  complete(@CurrentUser() user: any, @Body() body: any) {
    return this.uploadsService.complete(user.id, body);
  }

  @Delete()
  abort(@CurrentUser() user: any, @Body() body: any) {
    return this.uploadsService.abort(user.id, body.key, body.uploadId);
  }
}