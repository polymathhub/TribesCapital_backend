import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { GetCurrentUser } from '@common/decorators/get-current-user.decorator';
import { GuestReadable } from '@common/decorators/account-type-access.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateCommunityCommentDto, CreateCommunityPostDto, RespondConnectionRequestDto } from './dto/community.dto';
import { CommunityService } from './community.service';

@Controller('community')
@ApiTags('Community')
@ApiBearerAuth()
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('stats')
  @GuestReadable()
  getStats() {
    return this.communityService.getStats();
  }

  @Get('members')
  @GuestReadable()
  listMembers(
    @GetCurrentUser('sub') userId: string,
    @Query('search') search?: string,
    @Query('take') take?: string,
  ) {
    return this.communityService.listMembers(userId, search, Number(take) || 20);
  }

  @Get('posts')
  @GuestReadable()
  listPosts(
    @GetCurrentUser('sub') userId: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.communityService.listPosts(userId, { category, search, skip: Number(skip) || 0, take: Number(take) || 20 });
  }

  @Post('posts')
  createPost(@GetCurrentUser('sub') userId: string, @Body() dto: CreateCommunityPostDto) {
    return this.communityService.createPost(userId, dto);
  }

  @Get('posts/:id')
  @GuestReadable()
  getPost(@Param('id') id: string, @GetCurrentUser('sub') userId: string) {
    return this.communityService.getPost(id, userId);
  }

  @Post('posts/:id/comments')
  createComment(
    @Param('id') postId: string,
    @GetCurrentUser('sub') userId: string,
    @Body() dto: CreateCommunityCommentDto,
  ) {
    return this.communityService.createComment(postId, userId, dto);
  }

  @Post('posts/:id/vote')
  togglePostVote(@Param('id') postId: string, @GetCurrentUser('sub') userId: string) {
    return this.communityService.togglePostVote(postId, userId);
  }

  @Post('comments/:id/vote')
  toggleCommentVote(@Param('id') commentId: string, @GetCurrentUser('sub') userId: string) {
    return this.communityService.toggleCommentVote(commentId, userId);
  }

  @Post('posts/:id/save')
  togglePostSave(@Param('id') postId: string, @GetCurrentUser('sub') userId: string) {
    return this.communityService.togglePostSave(postId, userId);
  }

  @Post('members/:id/follow')
  toggleFollow(@Param('id') followedId: string, @GetCurrentUser('sub') userId: string) {
    return this.communityService.toggleFollow(userId, followedId);
  }

  @Get('connections')
  listConnections(@GetCurrentUser('sub') userId: string) {
    return this.communityService.listConnections(userId);
  }

  @Post('members/:id/connection-requests')
  requestConnection(@Param('id') recipientId: string, @GetCurrentUser('sub') userId: string) {
    return this.communityService.requestConnection(userId, recipientId);
  }

  @Patch('connection-requests/:id')
  respondToConnectionRequest(
    @Param('id') requestId: string,
    @GetCurrentUser('sub') userId: string,
    @Body() dto: RespondConnectionRequestDto,
  ) {
    return this.communityService.respondToConnectionRequest(userId, requestId, dto.status);
  }
}