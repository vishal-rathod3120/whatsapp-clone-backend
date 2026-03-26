import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StatusService } from './status.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Status')
@ApiBearerAuth()
@Controller('status')
@UseGuards(JwtAuthGuard)
export class StatusController {
  constructor(private statusService: StatusService) {}

  @Post('text')
  @ApiOperation({ summary: 'Create text status' })
  async createTextStatus(
    @Body() body: { textContent: string; bgColor: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.statusService.createTextStatus(user.sub, body.textContent, body.bgColor);
  }

  @Post('image')
  @ApiOperation({ summary: 'Create image status' })
  async createImageStatus(
    @Body() body: { imageUrl: string; caption?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.statusService.createImageStatus(user.sub, body.imageUrl, body.caption);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get my statuses' })
  async getMyStatuses(@CurrentUser() user: JwtPayload) {
    return this.statusService.getMyStatuses(user.sub);
  }

  @Get('contacts')
  @ApiOperation({ summary: 'Get contact statuses' })
  async getContactStatuses(@CurrentUser() user: JwtPayload) {
    return this.statusService.getContactStatuses(user.sub);
  }

  @Post(':statusId/view')
  @ApiOperation({ summary: 'Mark status as viewed' })
  async markViewed(
    @Param('statusId') statusId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.statusService.markViewed(statusId, user.sub);
  }

  @Delete(':statusId')
  @ApiOperation({ summary: 'Delete my status' })
  async deleteStatus(
    @Param('statusId') statusId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.statusService.deleteStatus(statusId, user.sub);
  }
}
