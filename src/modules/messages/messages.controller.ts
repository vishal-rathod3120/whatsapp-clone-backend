import { Controller, Get, Param, Query, Post, Body, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { GetMessagesQueryDto, SendMessageDto } from './dto/message.dto';

@ApiTags('Messages')
@Controller('chats/:chatId/messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get messages for a chat' })
  async getMessages(
    @Param('chatId') chatId: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    // User ID should come from auth guard
    return { message: 'Get messages' };
  }

  @Post()
  @ApiOperation({ summary: 'Send a message (REST fallback)' })
  async sendMessage(
    @Param('chatId') chatId: string,
    @Body() dto: SendMessageDto,
  ) {
    // User ID should come from auth guard
    return { message: 'Send message' };
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a message' })
  async deleteMessage(
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
  ) {
    // User ID should come from auth guard
    return { message: 'Delete message' };
  }
}
