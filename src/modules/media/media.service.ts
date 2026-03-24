import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Storage } from './storage/s3.storage';

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
    // Simplified - in production, use sharp for images, ffprobe for video/audio
    const metadata: {
      width?: number;
      height?: number;
      duration?: number;
      thumbnailKey?: string;
    } = {};

    if (file.mimetype.startsWith('image/')) {
      // Use sharp library to get image dimensions
      // metadata.width = ...;
      // metadata.height = ...;
    }

    if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/')) {
      // Use ffprobe to get duration
      // metadata.duration = ...;
    }

    return metadata;
  }

  async getSignedUrl(storageKey: string, expiresIn: number = 900): Promise<string> {
    return this.s3Storage.getSignedDownloadUrl(storageKey, expiresIn);
  }
}
