import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { TurnService } from '../../integrations/turn/turn.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Calls')
@ApiBearerAuth()
@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(
    private callsService: CallsService,
    private turnService: TurnService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get call history' })
  async getCalls(
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
    @CurrentUser() user?: JwtPayload
  ) {
    // If running under AuthGuard, user is non-null
    return this.callsService.getCallsByUser(user!.sub, limit ? Number(limit) : 20, cursor);
  }

  @Get(':callId')
  @ApiOperation({ summary: 'Get call details' })
  async getCallById(
    @Param('callId') callId: string,
    @CurrentUser() user?: JwtPayload
  ) {
    return this.callsService.getCallById(callId, user!.sub);
  }

  @Get('turn-credentials')
  @ApiOperation({ summary: 'Get TURN server credentials for WebRTC' })
  async getTurnCredentials() {
    const credentials = this.turnService.generateTurnCredentials();
    const servers = this.turnService.getTurnServers();
    
    return {
      iceServers: servers,
      ...credentials,
      expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }
}
