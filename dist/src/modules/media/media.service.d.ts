import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageInterface } from './storage/storage.interface';
import { MessageQueueService } from '../../common/queue/message-queue.service';
export declare class MediaService {
    private prisma;
    private configService;
    private storage;
    private messageQueue;
    constructor(prisma: PrismaService, configService: ConfigService, storage: StorageInterface, messageQueue: MessageQueueService);
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
        transcript: string | null;
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
        transcript: string | null;
        uploaderId: string;
    } | null>;
    downloadAttachment(id: string): Promise<Buffer | null>;
    private getFileMetadata;
    getSignedUrl(storageKey: string, expiresIn?: number): Promise<string>;
    deleteAttachment(id: string): Promise<void>;
}
