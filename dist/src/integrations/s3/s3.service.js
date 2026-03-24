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
var S3Service_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const common_1 = require("@nestjs/common");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
let S3Service = S3Service_1 = class S3Service {
    constructor() {
        this.logger = new common_1.Logger(S3Service_1.name);
        this.s3Client = new client_s3_1.S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
            endpoint: process.env.S3_ENDPOINT || undefined,
            forcePathStyle: !!process.env.S3_ENDPOINT,
        });
        this.bucket = process.env.S3_BUCKET_NAME || 'whatsapp-clone-media';
    }
    async getPresignedUploadUrl(userId, mimeType, fileSize) {
        const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
        const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        const isImage = mimeType.startsWith('image/');
        const isVideo = mimeType.startsWith('video/');
        if (isImage && fileSize > MAX_IMAGE_SIZE) {
            throw new common_1.BadRequestException('Image size exceeds 10MB limit');
        }
        if (isVideo && fileSize > MAX_VIDEO_SIZE) {
            throw new common_1.BadRequestException('Video size exceeds 100MB limit');
        }
        if (!isImage && !isVideo && fileSize > MAX_FILE_SIZE) {
            throw new common_1.BadRequestException('File size exceeds 50MB limit');
        }
        const attachmentId = (0, uuid_1.v4)();
        const extension = mimeType.split('/')[1] || 'bin';
        const storageKey = `uploads/${userId}/${attachmentId}.${extension}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: storageKey,
            ContentType: mimeType,
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn: 300 });
        return { uploadUrl, attachmentId, storageKey };
    }
    async uploadFile(key, buffer, contentType) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        });
        await this.s3Client.send(command);
        return this.getPublicUrl(key);
    }
    async getSignedDownloadUrl(key, expiresIn = 3600) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
    }
    async deleteFile(key) {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        await this.s3Client.send(command);
    }
    getPublicUrl(key) {
        if (process.env.S3_ENDPOINT) {
            return `${process.env.S3_ENDPOINT}/${this.bucket}/${key}`;
        }
        return `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    }
};
exports.S3Service = S3Service;
exports.S3Service = S3Service = S3Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], S3Service);
//# sourceMappingURL=s3.service.js.map