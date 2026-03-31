import { Controller, Post, Get, Body, Param, UseGuards, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { E2EEService } from './e2ee.service';
import { SubmitPrekeysDto, SessionDto, RotateSignedPrekeyDto, ReplenishPrekeysDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('E2EE Key Distribution')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('e2ee')
export class E2EEController {
  constructor(private readonly e2eeService: E2EEService) {}

  @Post('devices/:deviceId/prekeys')
  @ApiOperation({ summary: 'Upload initial E2EE prekeys for the device' })
  async uploadPrekeys(
    @Param('deviceId') deviceId: string,
    @Body() dto: SubmitPrekeysDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.e2eeService.uploadPrekeys(deviceId, user.sub, dto);
    return { success: true };
  }

  @Get('users/:userId/prekey-bundle')
  @ApiOperation({ summary: 'Get a prekey bundle for X3DH key agreement' })
  async getPrekeyBundle(
    @Param('userId') targetUserId: string,
    @Query('deviceId') targetDeviceId?: string,
  ) {
    const bundles = await this.e2eeService.getPrekeyBundle(targetUserId, targetDeviceId);
    // If a specific device is requested, return single bundle
    if (targetDeviceId && bundles.length > 0) {
      return bundles[0];
    }
    return bundles;
  }

  @Get('devices/:deviceId/prekey-count')
  @ApiOperation({ summary: 'Get remaining one-time prekey count' })
  async getPrekeyCount(
    @Param('deviceId') deviceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.e2eeService.getPrekeyCount(deviceId);
  }

  @Post('devices/:deviceId/prekeys/replenish')
  @ApiOperation({ summary: 'Replenish one-time prekeys' })
  async replenishPrekeys(
    @Param('deviceId') deviceId: string,
    @Body() dto: ReplenishPrekeysDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.e2eeService.replenishPrekeys(deviceId, dto);
  }

  @Post('devices/:deviceId/signed-prekey/rotate')
  @ApiOperation({ summary: 'Rotate signed prekey' })
  async rotateSignedPrekey(
    @Param('deviceId') deviceId: string,
    @Body() dto: RotateSignedPrekeyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.e2eeService.rotateSignedPrekey(deviceId, dto);
  }

  @Post('devices/:deviceId/sessions')
  @ApiOperation({ summary: 'Store encrypted session state' })
  async storeSession(
    @Param('deviceId') deviceId: string,
    @Body() dto: SessionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.e2eeService.storeSession(
      deviceId,
      dto.remoteUserId,
      dto.remoteDeviceId,
      dto.sessionState
    );
  }

  @Get('devices/:deviceId/sessions')
  @ApiOperation({ summary: 'Get all sessions for device' })
  async getAllSessions(
    @Param('deviceId') deviceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.e2eeService.getAllSessions(deviceId);
  }

  @Get('devices/:deviceId/sessions/:remoteUserId/:remoteDeviceId')
  @ApiOperation({ summary: 'Get specific session state' })
  async getSession(
    @Param('deviceId') deviceId: string,
    @Param('remoteUserId') remoteUserId: string,
    @Param('remoteDeviceId') remoteDeviceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.e2eeService.getSession(deviceId, remoteUserId, remoteDeviceId);
  }

  @Delete('devices/:deviceId/sessions/:remoteUserId/:remoteDeviceId')
  @ApiOperation({ summary: 'Delete session' })
  async deleteSession(
    @Param('deviceId') deviceId: string,
    @Param('remoteUserId') remoteUserId: string,
    @Param('remoteDeviceId') remoteDeviceId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.e2eeService.deleteSession(deviceId, remoteUserId, remoteDeviceId);
  }
}
