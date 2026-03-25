"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const chats_service_1 = require("./chats.service");
const chat_dto_1 = require("./dto/chat.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let ChatsController = class ChatsController {
    constructor(chatsService) {
        this.chatsService = chatsService;
    }
    async createDirectChat(dto, user) {
        return this.chatsService.createDirectChat(user.sub, dto);
    }
    async getChats(query, user) {
        return this.chatsService.getChatList(user.sub, query.limit, query.cursor);
    }
    async getChatById(chatId, user) {
        return this.chatsService.getChatById(chatId, user.sub);
    }
    async markChatAsRead(chatId, dto, user) {
        return this.chatsService.markChatAsRead(chatId, user.sub, dto.lastReadMessageId);
    }
    async createGroupChat(dto, user) {
        return this.chatsService.createGroupChat(user.sub, dto);
    }
    async addGroupMembers(chatId, dto, user) {
        return this.chatsService.addGroupMembers(chatId, user.sub, dto.userIds);
    }
    async removeGroupMember(chatId, targetUserId, user) {
        return this.chatsService.removeGroupMember(chatId, user.sub, targetUserId);
    }
    async updateMemberRole(chatId, targetUserId, dto, user) {
        return this.chatsService.updateMemberRole(chatId, user.sub, targetUserId, dto.role);
    }
    async updateGroupInfo(chatId, dto, user) {
        return this.chatsService.updateGroupInfo(chatId, user.sub, dto.title, dto.avatarUrl);
    }
    async deleteGroup(chatId, user) {
        return this.chatsService.deleteGroup(chatId, user.sub);
    }
};
exports.ChatsController = ChatsController;
__decorate([
    (0, common_1.Post)('direct'),
    (0, swagger_1.ApiOperation)({ summary: 'Create or get a direct chat' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chat_dto_1.CreateDirectChatDto, Object]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "createDirectChat", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get chat list' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chat_dto_1.GetChatsQueryDto, Object]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "getChats", null);
__decorate([
    (0, common_1.Get)(':chatId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get chat details' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "getChatById", null);
__decorate([
    (0, common_1.Post)(':chatId/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark chat as read' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chat_dto_1.MarkChatReadDto, Object]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "markChatAsRead", null);
__decorate([
    (0, common_1.Post)('group'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a group chat' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chat_dto_1.CreateGroupChatDto, Object]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "createGroupChat", null);
__decorate([
    (0, common_1.Post)(':chatId/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Add members to group' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chat_dto_1.AddMembersDto, Object]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "addGroupMembers", null);
__decorate([
    (0, common_1.Delete)(':chatId/members/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove or kick member from group' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "removeGroupMember", null);
__decorate([
    (0, common_1.Patch)(':chatId/members/:userId/role'),
    (0, swagger_1.ApiOperation)({ summary: 'Update member role' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, chat_dto_1.UpdateMemberRoleDto, Object]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "updateMemberRole", null);
__decorate([
    (0, common_1.Patch)(':chatId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update group info' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chat_dto_1.UpdateGroupDto, Object]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "updateGroupInfo", null);
__decorate([
    (0, common_1.Delete)(':chatId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a group chat' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "deleteGroup", null);
exports.ChatsController = ChatsController = __decorate([
    (0, swagger_1.ApiTags)('Chats'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('chats'),
    __metadata("design:paramtypes", [chats_service_1.ChatsService])
], ChatsController);
//# sourceMappingURL=chats.controller.js.map