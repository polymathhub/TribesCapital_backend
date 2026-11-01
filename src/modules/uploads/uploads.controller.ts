import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { GuestReadable } from '@common/decorators/account-type-access.decorator';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { UploadsService } from './uploads.service';

@Controller('uploads/multipart')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get('profile/:userId/:purpose/:fileName')
  @Public()
  @GuestReadable()
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
    const filePath = await this.uploadsService.tryGetLocalFilePath(key);
    if (filePath) return response.sendFile(filePath);
    return response.redirect(await this.uploadsService.getSignedDownloadUrl(key));
  }

  @Get('public/:userId/messaging/:fileName')
  @Public()
  @GuestReadable()
  async getPublicMessagingFile(
    @Param('userId') userId: string,
    @Param('fileName') fileName: string,
    @Res() response: Response,
  ) {
    if (fileName.includes('..') || fileName.includes('/')) throw new BadRequestException('Invalid uploaded file');
    const filePath = await this.uploadsService.tryGetLocalFilePath(`uploads/${userId}/messaging/${fileName}`);
    if (filePath) return response.sendFile(filePath);
    return response.redirect(await this.uploadsService.getSignedDownloadUrl(`uploads/${userId}/messaging/${fileName}`));
  }

  @Get('file')
  async getFile(@Query('key') key: string, @Res() response: Response) {
    const filePath = await this.uploadsService.getLocalFilePath(key);
    return response.sendFile(filePath);
  }

  @Post('initiate')
  initiate(@CurrentUser() user: any, @Body() body: any) {
    return this.uploadsService.initiate(user.id, body);
  }

  @Put('part')
  async uploadPart(
    @CurrentUser() user: any,
    @Query('key') key: string,
    @Query('uploadId') uploadId: string,
    @Query('partNumber') partNumber: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const result = await this.uploadsService.uploadLocalPart(user.id, key, uploadId, Number(partNumber), request);
    response.setHeader('ETag', `"${result.eTag}"`);
    return response.status(200).send();
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