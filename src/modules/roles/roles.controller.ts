import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesService } from './roles.service';
import { CreateRoleDto, CreatePermissionDto, AssignRoleDto } from './dto/role.dto';
import { Roles } from '@common/decorators/roles.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post()
  @Roles('admin')
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.createRole(createRoleDto);
  }

  @Get()
  async getAllRoles() {
    return this.rolesService.getAllRoles();
  }

  @Get(':id')
  async getRoleById(@Param('id') id: string) {
    return this.rolesService.getRoleById(id);
  }

  @Post('assign')
  @Roles('admin')
  async assignRoleToUser(@Body() assignRoleDto: AssignRoleDto) {
    return this.rolesService.assignRoleToUser(assignRoleDto);
  }

  @Post('permissions')
  @Roles('admin')
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.rolesService.createPermission(createPermissionDto);
  }

  @Post(':roleId/permissions/:permissionId')
  @Roles('admin')
  async assignPermissionToRole(
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.rolesService.assignPermissionToRole(roleId, permissionId);
  }

  @Get(':userId/permissions')
  async getUserPermissions(@Param('userId') userId: string) {
    return this.rolesService.getUserPermissions(userId);
  }
}
