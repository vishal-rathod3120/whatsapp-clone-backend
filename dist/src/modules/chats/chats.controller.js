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
let ChatsController = class ChatsController {
    constructor(chatsService) {
        this.chatsService = chatsService;
    }
    async createDirectChat(dto) {
        return { message: 'Create direct chat' };
    }
    async getChats(query) {
        return { message: 'Get chats' };
    }
    async getChatById(chatId) {
        return { message: 'Get chat details' };
    }
    async markChatAsRead(chatId, dto) {
        return { message: 'Mark chat as read' };
    }
};
exports.ChatsController = ChatsController;
__decorate([
    (0, common_1.Post)('direct'),
    (0, swagger_1.ApiOperation)({ summary: 'Create or get a direct chat' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chat_dto_1.CreateDirectChatDto]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "createDirectChat", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get chat list' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chat_dto_1.GetChatsQueryDto]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "getChats", null);
__decorate([
    (0, common_1.Get)(':chatId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get chat details' }),
    __param(0, (0, common_1.Param)('chatId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "getChatById", null);
__decorate([
    (0, common_1.Post)(':chatId/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark chat as read' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chat_dto_1.MarkChatReadDto]),
    __metadata("design:returntype", Promise)
], ChatsController.prototype, "markChatAsRead", null);
exports.ChatsController = ChatsController = __decorate([
    (0, swagger_1.ApiTags)('Chats'),
    (0, common_1.Controller)('chats'),
    __metadata("design:paramtypes", [chats_service_1.ChatsService])
], ChatsController);
//# sourceMappingURL=chats.controller.js.map