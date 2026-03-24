import { Controller, Get, Param, Query, Post, Body, Delete, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { GetMessagesQueryDto, SendMessageDto, EditMessageDto } from './dto/message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chats/:chatId/messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get messages for a chat' })
  async getMessages(
    @Param('chatId') chatId: string,
    @Query() query: GetMessagesQueryDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.messagesService.getMessages(chatId, user.sub, query.limit, query.cursor);
  }

  @Post()
  @ApiOperation({ summary: 'Send a message (REST fallback)' })
  async sendMessage(
    @Param('chatId') chatId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.messagesService.createMessage(chatId, user.sub, dto);
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a message' })
  async deleteMessage(
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @Query('forEveryone') forEveryone: string,
    @CurrentUser() user: JwtPayload
  ) {
    const isForEveryone = forEveryone === 'true';
    return this.messagesService.deleteMessage(chatId, messageId, user.sub, isForEveryone);
  }

  @Patch(':messageId')
  @ApiOperation({ summary: 'Edit a message' })
  async editMessage(
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @Body() dto: EditMessageDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.messagesService.editMessage(chatId, messageId, user.sub, dto.textContent);
  }
}
