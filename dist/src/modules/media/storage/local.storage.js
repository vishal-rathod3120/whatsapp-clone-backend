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
exports.LocalStorage = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const promises_1 = require("fs/promises");
const path_1 = require("path");
let LocalStorage = class LocalStorage {
    constructor(configService) {
        this.configService = configService;
        this.uploadDir = (this.configService.get('storage.localPath')) || './uploads';
    }
    async upload(file, key, mimeType) {
        const filePath = (0, path_1.join)(this.uploadDir, key);
        await (0, promises_1.writeFile)(filePath, file);
        return key;
    }
    async download(key) {
        const filePath = (0, path_1.join)(this.uploadDir, key);
        return (0, promises_1.readFile)(filePath);
    }
    async delete(key) {
        const filePath = (0, path_1.join)(this.uploadDir, key);
        await (0, promises_1.unlink)(filePath);
    }
    getUrl(key) {
        const publicUrl = (this.configService.get('storage.publicUrl')) || 'http://localhost:3000/uploads';
        return `${publicUrl}/${key}`;
    }
    async getSignedDownloadUrl(key, expiresIn) {
        return this.getUrl(key);
    }
};
exports.LocalStorage = LocalStorage;
exports.LocalStorage = LocalStorage = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LocalStorage);
//# sourceMappingURL=local.storage.js.map