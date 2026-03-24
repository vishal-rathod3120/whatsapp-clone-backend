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
exports.S3Storage = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
let S3Storage = class S3Storage {
    constructor(configService) {
        this.configService = configService;
        this.client = new client_s3_1.S3Client({
            region: this.configService.getOrThrow('storage.region'),
            credentials: {
                accessKeyId: this.configService.getOrThrow('storage.accessKey'),
                secretAccessKey: this.configService.getOrThrow('storage.secretKey'),
            },
            endpoint: this.configService.get('storage.endpoint') || undefined,
        });
        this.bucket = this.configService.getOrThrow('storage.bucket');
    }
    async upload(file, key, mimeType) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: file,
            ContentType: mimeType,
        });
        await this.client.send(command);
        return key;
    }
    async download(key) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        const response = await this.client.send(command);
        const stream = await response.Body?.transformToByteArray();
        return Buffer.from(stream || []);
    }
    async delete(key) {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        await this.client.send(command);
    }
    getUrl(key) {
        const publicUrl = this.configService.get('storage.publicUrl');
        return `${publicUrl}/${key}`;
    }
    async getSignedDownloadUrl(key, expiresIn = 3600) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
    }
};
exports.S3Storage = S3Storage;
exports.S3Storage = S3Storage = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3Storage);
//# sourceMappingURL=s3.storage.js.map