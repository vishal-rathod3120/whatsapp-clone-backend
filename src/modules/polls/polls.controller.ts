import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PollsService } from './polls.service';
import { CreatePollDto, VotePollDto } from './dto/poll.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Polls')
@ApiBearerAuth()
@Controller('polls')
@UseGuards(JwtAuthGuard)
export class PollsController {
  constructor(private pollsService: PollsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new poll in a chat' })
  async createPoll(@Req() req: any, @Body() dto: CreatePollDto) {
    return this.pollsService.createPoll(req.user.sub, dto);
  }

  @Post(':pollId/vote')
  @ApiOperation({ summary: 'Vote on a poll' })
  async vote(
    @Req() req: any,
    @Param('pollId') pollId: string,
    @Body() dto: VotePollDto,
  ) {
    return this.pollsService.vote(req.user.sub, pollId, dto.optionIds);
  }

  @Get(':pollId')
  @ApiOperation({ summary: 'Get poll with results' })
  async getPoll(@Param('pollId') pollId: string) {
    return this.pollsService.getPoll(pollId);
  }

  @Get('message/:messageId')
  @ApiOperation({ summary: 'Get poll by message ID' })
  async getPollByMessage(@Param('messageId') messageId: string) {
    return this.pollsService.getPollByMessageId(messageId);
  }
}
