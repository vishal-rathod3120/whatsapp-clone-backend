import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Attachment } from '@prisma/client';

@Injectable()
export class MediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAttachment(data: {
    uploaderId: string;
    storageKey: string;
    originalName?: string;
    mimeType: string;
    sizeBytes: bigint;
    width?: number;
    height?: number;
    durationSeconds?: number;
    thumbnailKey?: string;
  }): Promise<Attachment> {
    return this.prisma.attachment.create({
      data: {
        uploaderId: data.uploaderId,
        storageKey: data.storageKey,
        originalName: data.originalName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        width: data.width,
        height: data.height,
        durationSeconds: data.durationSeconds,
        thumbnailKey: data.thumbnailKey,
      },
    });
  }

  async findAttachmentById(id: string): Promise<Attachment | null> {
    return this.prisma.attachment.findUnique({
      where: { id },
    });
  }

  async findAttachmentsByUploader(uploaderId: string): Promise<Attachment[]> {
    return this.prisma.attachment.findMany({
      where: { uploaderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteAttachment(id: string): Promise<Attachment> {
    return this.prisma.attachment.delete({
      where: { id },
    });
  }
}
