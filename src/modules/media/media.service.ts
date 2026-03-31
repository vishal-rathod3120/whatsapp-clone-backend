import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageInterface } from './storage/storage.interface';
import * as sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

import { MessageQueueService } from '../../common/queue/message-queue.service';

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject('StorageInterface') private storage: StorageInterface,
    private messageQueue: MessageQueueService,
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
    await this.storage.upload(mainBuffer, storageKey, file.mimetype);

    // Upload thumbnail to storage
    if (metadata.thumbnailKey) {
      const thumbPath = join(file.destination, metadata.thumbnailKey);
      try {
        const thumbBuffer = readFileSync(thumbPath);
        await this.storage.upload(thumbBuffer, metadata.thumbnailKey, 'image/webp');
      } catch (e: any) {
        Logger.warn(`Failed to upload thumbnail: ${e.message}`);
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

    if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/ogg') {
      try {
        await this.messageQueue.enqueue({
          type: 'transcribe_audio',
          data: {
            attachmentId: attachment.id,
          },
          priority: 3, // slightly higher priority so UI updates fast
        });
        Logger.log(`Enqueued transcribe_audio job for attachment ${attachment.id}`);
      } catch (e: any) {
        Logger.error(`Failed to enqueue transcribe job: ${e.message}`);
      }
    }

    return attachment;
  }

  async getAttachmentById(id: string) {
    return this.prisma.attachment.findUnique({
      where: { id },
    });
  }

  async downloadAttachment(id: string): Promise<Buffer | null> {
    const attachment = await this.getAttachmentById(id);
    if (!attachment) return null;
    try {
      return await this.storage.download(attachment.storageKey);
    } catch (e) {
      Logger.error(`Failed to download attachment ${id}: ${e.message}`);
      return null;
    }
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
    if (typeof this.storage.getSignedDownloadUrl === 'function') {
      return this.storage.getSignedDownloadUrl(storageKey, expiresIn);
    }
    // Fallback for LocalStorage which doesn't implement getSignedDownloadUrl natively
    const baseUrl = this.configService.get('storage.publicUrl') || 'http://localhost:3000/uploads';
    return `${baseUrl}/${storageKey}`;
  }

  async deleteAttachment(id: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      return;
    }

    try {
      // Delete main file
      await this.storage.delete(attachment.storageKey);

      // Delete thumbnail if exists
      if (attachment.thumbnailKey) {
        await this.storage.delete(attachment.thumbnailKey);
      }
    } catch (e: any) {
      Logger.error(`Failed to delete storage file for attachment ${id}: ${e.message}`);
      // Continue to delete DB record even if file deletion fails
    }

    await this.prisma.attachment.delete({
      where: { id },
    });
  }
}
