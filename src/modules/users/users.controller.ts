import { Controller, Get, Patch, Put, Body, Param, UseGuards, Query, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiOkResponse({ type: UserResponseDto, description: 'The authenticated user profile, including account type and saved profile images.' })
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getUserById(user.id);
  }

  @Get()
  async getAll(@Query('skip') skip?: string, @Query('take') take?: string) {
    return this.usersService.getAllUsers(
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 10,
    );
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiBody({ type: UpdateUserDto, description: 'Profile fields can be updated together. Cover images may be supplied as data URLs.' })
  @ApiOkResponse({ type: UserResponseDto, description: 'Updated user profile.' })
  async updateProfile(@Body() updateUserDto: UpdateUserDto, @CurrentUser() user: any) {
    return this.usersService.updateUser(user.id, updateUserDto);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getPublicProfileById(id);
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CurrentUser() user: any) {
    if (user.id !== id) {
      throw new UnauthorizedException();
    }
    return this.usersService.updateUser(id, updateUserDto);
  }
}
