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
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const s3_storage_1 = require("./storage/s3.storage");
let MediaService = class MediaService {
    constructor(prisma, configService, s3Storage) {
        this.prisma = prisma;
        this.configService = configService;
        this.s3Storage = s3Storage;
    }
    async createAttachment(uploaderId, file, storageKey) {
        const metadata = await this.getFileMetadata(file);
        const attachment = await this.prisma.attachment.create({
            data: {
                uploaderId,
                storageKey,
                originalName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: BigInt(file.size),
                width: metadata.width,
                height: metadata.height,
                durationSeconds: metadata.duration,
                thumbnailKey: metadata.thumbnailKey,
            },
        });
        return attachment;
    }
    async getAttachmentById(id) {
        return this.prisma.attachment.findUnique({
            where: { id },
        });
    }
    async getFileMetadata(file) {
        const metadata = {};
        if (file.mimetype.startsWith('image/')) {
        }
        if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
        }
        return metadata;
    }
    async getSignedUrl(storageKey, expiresIn = 900) {
        return this.s3Storage.getSignedDownloadUrl(storageKey, expiresIn);
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        s3_storage_1.S3Storage])
], MediaService);
//# sourceMappingURL=media.service.js.map