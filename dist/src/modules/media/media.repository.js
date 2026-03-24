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
exports.MediaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let MediaRepository = class MediaRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAttachment(data) {
        return this.prisma.attachment.create({
            data: {
                uploaderId: data.uploaderId,
                storageKey: data.storageKey,
                originalName: data.originalName,
                mimeType: data.mimeType,
                sizeBytes: data.sizeBytes,
                width: data.width,
                height: data.height,
                durationSeconds: data.durationSeconds,
                thumbnailKey: data.thumbnailKey,
            },
        });
    }
    async findAttachmentById(id) {
        return this.prisma.attachment.findUnique({
            where: { id },
        });
    }
    async findAttachmentsByUploader(uploaderId) {
        return this.prisma.attachment.findMany({
            where: { uploaderId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async deleteAttachment(id) {
        return this.prisma.attachment.delete({
            where: { id },
        });
    }
};
exports.MediaRepository = MediaRepository;
exports.MediaRepository = MediaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MediaRepository);
//# sourceMappingURL=media.repository.js.map