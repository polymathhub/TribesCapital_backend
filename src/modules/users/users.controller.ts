import { Controller, Get, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
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

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CurrentUser() user: any) {
    if (user.id !== id) {
      throw new Error('Unauthorized');
    }
    return this.usersService.updateUser(id, updateUserDto);
  }
}
