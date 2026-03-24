import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Storage } from './storage/s3.storage';
import * as sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private s3Storage: S3Storage,
  ) {}

  async createAttachment(
    uploaderId: string,
    file: Express.Multer.File,
    storageKey: string,
  ) {
    // Get file metadata
    const metadata = await this.getFileMetadata(file);

    // Upload main file to storage
    const mainBuffer = readFileSync(file.path);
    await this.s3Storage.upload(mainBuffer, storageKey, file.mimetype);

    // Upload thumbnail to storage
    if (metadata.thumbnailKey) {
      const thumbPath = join(file.destination, metadata.thumbnailKey);
      try {
        const thumbBuffer = readFileSync(thumbPath);
        await this.s3Storage.upload(thumbBuffer, metadata.thumbnailKey, 'image/webp');
      } catch (e) {
        Logger.warn(`Failed to upload thumbnail to S3: ${e.message}`);
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

  async getAttachmentById(id: string) {
    return this.prisma.attachment.findUnique({
      where: { id },
    });
  }

  private async getFileMetadata(file: Express.Multer.File): Promise<{
    width?: number;
    height?: number;
    duration?: number;
    thumbnailKey?: string;
  }> {
    const metadata: {
      width?: number;
      height?: number;
      duration?: number;
      thumbnailKey?: string;
    } = {};

    try {
      if (file.mimetype.startsWith('image/')) {
        const buffer = readFileSync(file.path);
        const sharpInstance = sharp(buffer);
        const meta = await sharpInstance.metadata();
        
        metadata.width = meta.width;
        metadata.height = meta.height;

        // Generate thumbnail
        const thumbBuffer = await sharpInstance
          .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        const thumbFilename = `thumb-${file.filename}.webp`;
        const thumbPath = join(file.destination, thumbFilename);
        writeFileSync(thumbPath, thumbBuffer);

        metadata.thumbnailKey = thumbFilename;
      }

      if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
        try {
          // Native duration extraction using ffprobe
          const out = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file.path}"`, { stdio: 'pipe' });
          metadata.duration = Math.round(parseFloat(out.toString()));
        } catch (err) {
          // Fallback if ffprobe isn't installed in the environment
          metadata.duration = 0;
        }
      }
    } catch (e) {
      Logger.error(`Error processing media file metadata: ${e.message}`);
    }

    return metadata;
  }

  async getSignedUrl(storageKey: string, expiresIn: number = 900): Promise<string> {
    return this.s3Storage.getSignedDownloadUrl(storageKey, expiresIn);
  }
}
