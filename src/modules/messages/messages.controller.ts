import { Controller, Get, Param, Query, Post, Body, Delete, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { GetMessagesQueryDto, SendMessageDto, EditMessageDto } from './dto/message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { getLinkPreview } from 'link-preview-js';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chats/:chatId/messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('link-preview')
  @ApiOperation({ summary: 'Get metadata for a URL link preview' })
  @ApiQuery({ name: 'url', required: true })
  async getLinkPreview(@Query('url') url: string): Promise<any> {
    try {
      if (!url) return null;
      const preview = await getLinkPreview(url, {
        timeout: 3000,
        headers: { 'user-agent': 'WhatsAppBot' },
        followRedirects: 'follow'
      });
      return preview;
    } catch (err) {
      console.error('Link preview error:', err);
      return null;
    }
  }

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

  @Post(':messageId/star')
  @ApiOperation({ summary: 'Star a message' })
  async starMessage(
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtPayload
  ) {
    return this.messagesService.starMessage(chatId, messageId, user.sub);
  }

  @Delete(':messageId/star')
  @ApiOperation({ summary: 'Unstar a message' })
  async unstarMessage(
    @Param('chatId') chatId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: JwtPayload
  ) {
    return this.messagesService.unstarMessage(chatId, messageId, user.sub);
  }

  @Get('starred')
  @ApiOperation({ summary: 'Get all starred messages for the current user' })
  // Note: We'll overwrite the `/chats/:chatId/messages/starred` route trick to work globally or for a specific chat.
  // Actually, we should put the global get starred messages in a different controller, but since the base route is `/chats/:chatId/messages`, we can use `userId` to fetch them globally from the service.
  async getStarredMessages(@CurrentUser() user: JwtPayload) {
    return this.messagesService.getStarredMessages(user.sub);
  }
}
