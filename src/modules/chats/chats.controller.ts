import { Controller, Get, Post, Body, Param, Query, Patch, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { CreateDirectChatDto, MarkChatReadDto, GetChatsQueryDto, CreateGroupChatDto, AddMembersDto, UpdateMemberRoleDto, UpdateGroupDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Chats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private chatsService: ChatsService) {}

  @Post('direct')
  @ApiOperation({ summary: 'Create or get a direct chat' })
  async createDirectChat(@Body() dto: CreateDirectChatDto, @CurrentUser() user: JwtPayload) {
    return this.chatsService.createDirectChat(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get chat list' })
  async getChats(@Query() query: GetChatsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.chatsService.getChatList(user.sub, query.limit, query.cursor);
  }

  @Get(':chatId')
  @ApiOperation({ summary: 'Get chat details' })
  async getChatById(@Param('chatId') chatId: string, @CurrentUser() user: JwtPayload) {
    return this.chatsService.getChatById(chatId, user.sub);
  }

  @Post(':chatId/read')
  @ApiOperation({ summary: 'Mark chat as read' })
  async markChatAsRead(
    @Param('chatId') chatId: string,
    @Body() dto: MarkChatReadDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.chatsService.markChatAsRead(chatId, user.sub, dto.lastReadMessageId);
  }

  @Post('group')
  @ApiOperation({ summary: 'Create a group chat' })
  async createGroupChat(@Body() dto: CreateGroupChatDto, @CurrentUser() user: JwtPayload) {
    return this.chatsService.createGroupChat(user.sub, dto);
  }

  @Post(':chatId/members')
  @ApiOperation({ summary: 'Add members to group' })
  async addGroupMembers(
    @Param('chatId') chatId: string,
    @Body() dto: AddMembersDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.chatsService.addGroupMembers(chatId, user.sub, dto.userIds);
  }

  @Delete(':chatId/members/:userId')
  @ApiOperation({ summary: 'Remove or kick member from group' })
  async removeGroupMember(
    @Param('chatId') chatId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: JwtPayload
  ) {
    return this.chatsService.removeGroupMember(chatId, user.sub, targetUserId);
  }

  @Patch(':chatId/members/:userId/role')
  @ApiOperation({ summary: 'Update member role' })
  async updateMemberRole(
    @Param('chatId') chatId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.chatsService.updateMemberRole(chatId, user.sub, targetUserId, dto.role);
  }

  @Patch(':chatId')
  @ApiOperation({ summary: 'Update group info' })
  async updateGroupInfo(
    @Param('chatId') chatId: string,
    @Body() dto: UpdateGroupDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.chatsService.updateGroupInfo(chatId, user.sub, dto.title, dto.avatarUrl);
  }

  @Delete(':chatId')
  @ApiOperation({ summary: 'Delete a group chat' })
  async deleteGroup(@Param('chatId') chatId: string, @CurrentUser() user: JwtPayload) {
    return this.chatsService.deleteGroup(chatId, user.sub);
  }

  @Patch(':chatId/disappearing-messages')
  @ApiOperation({ summary: 'Update disappearing messages timer for a chat' })
  async updateDisappearingTimer(
    @Param('chatId') chatId: string,
    @Body() body: { timer: number | null },
    @CurrentUser() user: JwtPayload
  ) {
    return this.chatsService.updateDisappearingTimer(chatId, user.sub, body.timer);
  }
}
