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
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const sharp = require("sharp");
const fs_1 = require("fs");
const path_1 = require("path");
const child_process_1 = require("child_process");
let MediaService = class MediaService {
    constructor(prisma, configService, storage) {
        this.prisma = prisma;
        this.configService = configService;
        this.storage = storage;
    }
    async createAttachment(uploaderId, file, storageKey) {
        const metadata = await this.getFileMetadata(file);
        const mainBuffer = (0, fs_1.readFileSync)(file.path);
        await this.storage.upload(mainBuffer, storageKey, file.mimetype);
        if (metadata.thumbnailKey) {
            const thumbPath = (0, path_1.join)(file.destination, metadata.thumbnailKey);
            try {
                const thumbBuffer = (0, fs_1.readFileSync)(thumbPath);
                await this.storage.upload(thumbBuffer, metadata.thumbnailKey, 'image/webp');
            }
            catch (e) {
                common_1.Logger.warn(`Failed to upload thumbnail: ${e.message}`);
            }
        }
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
        try {
            if (file.mimetype.startsWith('image/')) {
                const buffer = (0, fs_1.readFileSync)(file.path);
                const sharpInstance = sharp(buffer);
                const meta = await sharpInstance.metadata();
                metadata.width = meta.width;
                metadata.height = meta.height;
                const thumbBuffer = await sharpInstance
                    .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toBuffer();
                const thumbFilename = `thumb-${file.filename}.webp`;
                const thumbPath = (0, path_1.join)(file.destination, thumbFilename);
                (0, fs_1.writeFileSync)(thumbPath, thumbBuffer);
                metadata.thumbnailKey = thumbFilename;
            }
            if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
                try {
                    const out = (0, child_process_1.execSync)(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file.path}"`, { stdio: 'pipe' });
                    metadata.duration = Math.round(parseFloat(out.toString()));
                }
                catch (err) {
                    metadata.duration = 0;
                }
            }
        }
        catch (e) {
            common_1.Logger.error(`Error processing media file metadata: ${e.message}`);
        }
        return metadata;
    }
    async getSignedUrl(storageKey, expiresIn = 900) {
        if (typeof this.storage.getSignedDownloadUrl === 'function') {
            return this.storage.getSignedDownloadUrl(storageKey, expiresIn);
        }
        const baseUrl = this.configService.get('storage.publicUrl') || 'http://localhost:3000/uploads';
        return `${baseUrl}/${storageKey}`;
    }
    async deleteAttachment(id) {
        const attachment = await this.prisma.attachment.findUnique({
            where: { id },
        });
        if (!attachment) {
            return;
        }
        try {
            await this.storage.delete(attachment.storageKey);
            if (attachment.thumbnailKey) {
                await this.storage.delete(attachment.thumbnailKey);
            }
        }
        catch (e) {
            common_1.Logger.error(`Failed to delete storage file for attachment ${id}: ${e.message}`);
        }
        await this.prisma.attachment.delete({
            where: { id },
        });
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)('StorageInterface')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService, Object])
], MediaService);
//# sourceMappingURL=media.service.js.map