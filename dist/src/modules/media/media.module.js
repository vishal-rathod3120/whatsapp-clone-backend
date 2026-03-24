"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const media_controller_1 = require("./media.controller");
const media_service_1 = require("./media.service");
const s3_storage_1 = require("./storage/s3.storage");
const local_storage_1 = require("./storage/local.storage");
const storageProvider = {
    provide: 'StorageInterface',
    useFactory: (configService) => {
        const storageType = configService.get('storage.type', 'local');
        if (storageType === 's3') {
            return new s3_storage_1.S3Storage(configService);
        }
        return new local_storage_1.LocalStorage(configService);
    },
    inject: [config_1.ConfigService],
};
let MediaModule = class MediaModule {
};
exports.MediaModule = MediaModule;
exports.MediaModule = MediaModule = __decorate([
    (0, common_1.Module)({
        controllers: [media_controller_1.MediaController],
        providers: [media_service_1.MediaService, storageProvider, s3_storage_1.S3Storage, local_storage_1.LocalStorage],
        exports: [media_service_1.MediaService],
    })
], MediaModule);
//# sourceMappingURL=media.module.js.map