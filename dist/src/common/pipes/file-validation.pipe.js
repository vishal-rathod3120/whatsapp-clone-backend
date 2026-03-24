"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileValidationPipe = void 0;
const common_1 = require("@nestjs/common");
const FileType = require("file-type");
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    'application/pdf',
    'text/plain',
];
let FileValidationPipe = class FileValidationPipe {
    async transform(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const MAX_SIZE = 100 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            throw new common_1.BadRequestException('File size exceeds 100MB limit');
        }
        const fileType = await FileType.fileTypeFromBuffer(file.buffer);
        if (!fileType) {
            throw new common_1.BadRequestException('Could not determine file type');
        }
        if (!ALLOWED_MIME_TYPES.includes(fileType.mime)) {
            throw new common_1.BadRequestException(`File type ${fileType.mime} is not allowed`);
        }
        if (file.mimetype !== fileType.mime) {
            throw new common_1.BadRequestException('Declared MIME type does not match actual file content');
        }
        return file;
    }
};
exports.FileValidationPipe = FileValidationPipe;
exports.FileValidationPipe = FileValidationPipe = __decorate([
    (0, common_1.Injectable)()
], FileValidationPipe);
//# sourceMappingURL=file-validation.pipe.js.map