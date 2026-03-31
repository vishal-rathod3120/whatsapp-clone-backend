import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Communities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new community' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { name: string; description?: string; avatarUrl?: string }
  ) {
    return this.communitiesService.createCommunity(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all communities for current user' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.communitiesService.getUserCommunities(user.sub);
  }

  @Post(':id/groups')
  @ApiOperation({ summary: 'Link an existing group to this community' })
  addGroup(
    @CurrentUser() user: JwtPayload,
    @Param('id') communityId: string,
    @Body('chatId') chatId: string
  ) {
    return this.communitiesService.addGroupToCommunity(user.sub, communityId, chatId);
  }

  @Delete(':id/groups/:chatId')
  @ApiOperation({ summary: 'Unlink a group from this community' })
  removeGroup(
    @CurrentUser() user: JwtPayload,
    @Param('id') communityId: string,
    @Param('chatId') chatId: string
  ) {
    return this.communitiesService.removeGroupFromCommunity(user.sub, communityId, chatId);
  }
}
