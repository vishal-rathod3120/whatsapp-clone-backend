import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import * as FileType from 'file-type';

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

@Injectable()
export class FileValidationPipe implements PipeTransform {
  async transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file size (max 100MB)
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size exceeds 100MB limit');
    }

    // Validate MIME type using magic bytes
    const fileType = await FileType.fileTypeFromBuffer(file.buffer);
    
    if (!fileType) {
      throw new BadRequestException('Could not determine file type');
    }

    if (!ALLOWED_MIME_TYPES.includes(fileType.mime)) {
      throw new BadRequestException(`File type ${fileType.mime} is not allowed`);
    }

    // Verify declared MIME matches detected MIME
    if (file.mimetype !== fileType.mime) {
      throw new BadRequestException('Declared MIME type does not match actual file content');
    }

    return file;
  }
}
