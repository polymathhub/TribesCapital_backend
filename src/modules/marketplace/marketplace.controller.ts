import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { GetCurrentUser } from '@common/decorators/get-current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { CreateContractorReviewDto, SaveContractorProfileDto } from './dto/contractor.dto';
import { MarketplaceService } from './marketplace.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('marketplace')
@ApiTags('Marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Public()
  @Get('contractors')
  listContractors(
    @Query('search') search?: string,
    @Query('service') service?: string,
    @Query('location') location?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.marketplaceService.listContractors({ search, service, location, skip: Number(skip) || 0, take: Number(take) || 50 });
  }

  @Get('contractors/me')
  @ApiBearerAuth()
  getMyProfile(@GetCurrentUser('sub') userId: string) {
    return this.marketplaceService.getMyProfile(userId);
  }

  @Post('contractors')
  @ApiBearerAuth()
  saveMyProfile(@GetCurrentUser('sub') userId: string, @Body() dto: SaveContractorProfileDto) {
    return this.marketplaceService.saveMyProfile(userId, dto);
  }

  @Public()
  @Get('contractors/:id')
  getContractor(@Param('id') id: string) {
    return this.marketplaceService.getContractor(id);
  }

  @Post('contractors/:id/reviews')
  @ApiBearerAuth()
  addReview(
    @Param('id') id: string,
    @GetCurrentUser('sub') userId: string,
    @Body() dto: CreateContractorReviewDto,
  ) {
    return this.marketplaceService.addReview(id, userId, dto);
  }

  @Patch('contractors/:id/verification')
  @ApiBearerAuth()
  @Roles('admin')
  setVerification(@Param('id') id: string, @Body('isVerified') isVerified: boolean) {
    return this.marketplaceService.setVerification(id, Boolean(isVerified));
  }
}