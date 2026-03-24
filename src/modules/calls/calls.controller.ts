import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { TurnService } from '../../integrations/turn/turn.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Calls')
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
  ) {
    return { message: 'Get calls' };
  }

  @Get(':callId')
  @ApiOperation({ summary: 'Get call details' })
  async getCallById(@Param('callId') callId: string) {
    return { message: 'Get call details' };
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
