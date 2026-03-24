import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Storage } from './storage/s3.storage';
export declare class MediaService {
    private prisma;
    private configService;
    private s3Storage;
    constructor(prisma: PrismaService, configService: ConfigService, s3Storage: S3Storage);
    createAttachment(uploaderId: string, file: Express.Multer.File, storageKey: string): Promise<{
        id: string;
        createdAt: Date;
        storageKey: string;
        originalName: string | null;
        mimeType: string;
        sizeBytes: bigint;
        width: number | null;
        height: number | null;
        durationSeconds: number | null;
        thumbnailKey: string | null;
        uploaderId: string;
    }>;
    getAttachmentById(id: string): Promise<{
        id: string;
        createdAt: Date;
        storageKey: string;
        originalName: string | null;
        mimeType: string;
        sizeBytes: bigint;
        width: number | null;
        height: number | null;
        durationSeconds: number | null;
        thumbnailKey: string | null;
        uploaderId: string;
    } | null>;
    private getFileMetadata;
    getSignedUrl(storageKey: string, expiresIn?: number): Promise<string>;
}
