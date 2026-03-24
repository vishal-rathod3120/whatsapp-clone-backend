import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { CreateDirectChatDto, MarkChatReadDto, GetChatsQueryDto } from './dto/chat.dto';

@ApiTags('Chats')
@Controller('chats')
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Post('direct')
  @ApiOperation({ summary: 'Create or get a direct chat' })
  async createDirectChat(@Body() dto: CreateDirectChatDto) {
    // User ID should come from auth guard
    return { message: 'Create direct chat' };
  }

  @Get()
  @ApiOperation({ summary: 'Get chat list' })
  async getChats(@Query() query: GetChatsQueryDto) {
    // User ID should come from auth guard
    return { message: 'Get chats' };
  }

  @Get(':chatId')
  @ApiOperation({ summary: 'Get chat details' })
  async getChatById(@Param('chatId') chatId: string) {
    // User ID should come from auth guard
    return { message: 'Get chat details' };
  }

  @Post(':chatId/read')
  @ApiOperation({ summary: 'Mark chat as read' })
  async markChatAsRead(
    @Param('chatId') chatId: string,
    @Body() dto: MarkChatReadDto,
  ) {
    // User ID should come from auth guard
    return { message: 'Mark chat as read' };
  }
}
