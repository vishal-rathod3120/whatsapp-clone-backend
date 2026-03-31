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
exports.MessagesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const messages_service_1 = require("./messages.service");
const search_service_1 = require("./search.service");
const message_dto_1 = require("./dto/message.dto");
const search_messages_dto_1 = require("./dto/search-messages.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const link_preview_js_1 = require("link-preview-js");
let MessagesController = class MessagesController {
    constructor(messagesService, searchService) {
        this.messagesService = messagesService;
        this.searchService = searchService;
    }
    async getLinkPreview(url) {
        try {
            if (!url)
                return null;
            const preview = await (0, link_preview_js_1.getLinkPreview)(url, {
                timeout: 3000,
                headers: { 'user-agent': 'WhatsAppBot' },
                followRedirects: 'follow'
            });
            return preview;
        }
        catch (err) {
            console.error('Link preview error:', err);
            return null;
        }
    }
    async getMessages(chatId, query, user) {
        return this.messagesService.getMessages(chatId, user.sub, query.limit, query.cursor);
    }
    async sendMessage(chatId, dto, user) {
        return this.messagesService.createMessage(chatId, user.sub, dto);
    }
    async deleteMessage(chatId, messageId, forEveryone, user) {
        const isForEveryone = forEveryone === 'true';
        return this.messagesService.deleteMessage(chatId, messageId, user.sub, isForEveryone);
    }
    async editMessage(chatId, messageId, dto, user) {
        return this.messagesService.editMessage(chatId, messageId, user.sub, dto.textContent);
    }
    async starMessage(chatId, messageId, user) {
        return this.messagesService.starMessage(chatId, messageId, user.sub);
    }
    async unstarMessage(chatId, messageId, user) {
        return this.messagesService.unstarMessage(chatId, messageId, user.sub);
    }
    async getStarredMessages(user) {
        return this.messagesService.getStarredMessages(user.sub);
    }
    async searchMessages(chatId, query, user) {
        return this.searchService.searchMessages(user.sub, query.q, {
            chatId: chatId !== '_' ? chatId : query.chatId,
            limit: query.limit,
            offset: query.offset,
        });
    }
    async pinMessage(chatId, messageId, user) {
        return this.messagesService.pinMessage(chatId, messageId, user.sub);
    }
    async unpinMessage(chatId, messageId, user) {
        return this.messagesService.unpinMessage(chatId, messageId, user.sub);
    }
    async getPinnedMessages(chatId, user) {
        return this.messagesService.getPinnedMessages(chatId, user.sub);
    }
    async scheduleMessage(chatId, dto, user) {
        return this.messagesService.scheduleMessage(chatId, user.sub, dto);
    }
    async getScheduledMessages(user) {
        return this.messagesService.getScheduledMessages(user.sub);
    }
    async cancelScheduledMessage(messageId, user) {
        return this.messagesService.cancelScheduledMessage(messageId, user.sub);
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.Get)('link-preview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get metadata for a URL link preview' }),
    (0, swagger_1.ApiQuery)({ name: 'url', required: true }),
    __param(0, (0, common_1.Query)('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getLinkPreview", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get messages for a chat' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_dto_1.GetMessagesQueryDto, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Send a message (REST fallback)' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_dto_1.SendMessageDto, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Delete)(':messageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a message' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, common_1.Query)('forEveryone')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Patch)(':messageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Edit a message' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, message_dto_1.EditMessageDto, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "editMessage", null);
__decorate([
    (0, common_1.Post)(':messageId/star'),
    (0, swagger_1.ApiOperation)({ summary: 'Star a message' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "starMessage", null);
__decorate([
    (0, common_1.Delete)(':messageId/star'),
    (0, swagger_1.ApiOperation)({ summary: 'Unstar a message' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "unstarMessage", null);
__decorate([
    (0, common_1.Get)('starred'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all starred messages for the current user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getStarredMessages", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search messages across chats or within a specific chat' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, search_messages_dto_1.SearchMessagesDto, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "searchMessages", null);
__decorate([
    (0, common_1.Post)(':messageId/pin'),
    (0, swagger_1.ApiOperation)({ summary: 'Pin a message in the chat' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "pinMessage", null);
__decorate([
    (0, common_1.Delete)(':messageId/pin'),
    (0, swagger_1.ApiOperation)({ summary: 'Unpin a message' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Param)('messageId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "unpinMessage", null);
__decorate([
    (0, common_1.Get)('pinned'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all pinned messages in a chat' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getPinnedMessages", null);
__decorate([
    (0, common_1.Post)('schedule'),
    (0, swagger_1.ApiOperation)({ summary: 'Schedule a message' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, message_dto_1.ScheduleMessageDto, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "scheduleMessage", null);
__decorate([
    (0, common_1.Get)('scheduled'),
    (0, swagger_1.ApiOperation)({ summary: 'Get scheduled messages' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "getScheduledMessages", null);
__decorate([
    (0, common_1.Delete)('scheduled/:messageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a scheduled message' }),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "cancelScheduledMessage", null);
exports.MessagesController = MessagesController = __decorate([
    (0, swagger_1.ApiTags)('Messages'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('chats/:chatId/messages'),
    __metadata("design:paramtypes", [messages_service_1.MessagesService,
        search_service_1.SearchService])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map