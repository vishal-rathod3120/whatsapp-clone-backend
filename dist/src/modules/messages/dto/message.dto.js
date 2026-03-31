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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleMessageDto = exports.SeenDto = exports.DeliveredDto = exports.GetMessagesQueryDto = exports.EditMessageDto = exports.SendMessageDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const enums_1 = require("../../../common/enums");
class SendMessageDto {
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "clientTempId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.MessageType),
    __metadata("design:type", String)
], SendMessageDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "textContent", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "attachmentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "replyToMessageId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SendMessageDto.prototype, "isEncrypted", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "encryptionType", void 0);
class EditMessageDto {
}
exports.EditMessageDto = EditMessageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EditMessageDto.prototype, "textContent", void 0);
class GetMessagesQueryDto {
    constructor() {
        this.limit = 30;
    }
}
exports.GetMessagesQueryDto = GetMessagesQueryDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], GetMessagesQueryDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetMessagesQueryDto.prototype, "cursor", void 0);
class DeliveredDto {
}
exports.DeliveredDto = DeliveredDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeliveredDto.prototype, "messageId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeliveredDto.prototype, "chatId", void 0);
class SeenDto {
}
exports.SeenDto = SeenDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SeenDto.prototype, "chatId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SeenDto.prototype, "messageId", void 0);
class ScheduleMessageDto {
}
exports.ScheduleMessageDto = ScheduleMessageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScheduleMessageDto.prototype, "chatId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.MessageType),
    __metadata("design:type", String)
], ScheduleMessageDto.prototype, "type", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], ScheduleMessageDto.prototype, "scheduledAt", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ScheduleMessageDto.prototype, "textContent", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ScheduleMessageDto.prototype, "attachmentId", void 0);
//# sourceMappingURL=message.dto.js.map