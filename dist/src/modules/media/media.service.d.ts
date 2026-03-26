import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageInterface } from './storage/storage.interface';
export declare class MediaService {
    private prisma;
    private configService;
    private storage;
    constructor(prisma: PrismaService, configService: ConfigService, storage: StorageInterface);
    createAttachment(uploaderId: string, file: Express.Multer.File, storageKey: string): Promise<{
        id: string;
        createdAt: Date;
        uploaderId: string;
        storageKey: string;
        originalName: string | null;
        mimeType: string;
        sizeBytes: bigint;
        width: number | null;
        height: number | null;
        durationSeconds: number | null;
        thumbnailKey: string | null;
    }>;
    getAttachmentById(id: string): Promise<{
        id: string;
        createdAt: Date;
        uploaderId: string;
        storageKey: string;
        originalName: string | null;
        mimeType: string;
        sizeBytes: bigint;
        width: number | null;
        height: number | null;
        durationSeconds: number | null;
        thumbnailKey: string | null;
    } | null>;
    private getFileMetadata;
    getSignedUrl(storageKey: string, expiresIn?: number): Promise<string>;
    deleteAttachment(id: string): Promise<void>;
}
