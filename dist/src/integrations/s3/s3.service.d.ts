interface PresignUploadResult {
    uploadUrl: string;
    attachmentId: string;
    storageKey: string;
}
export declare class S3Service {
    private readonly logger;
    private readonly s3Client;
    private readonly bucket;
    constructor();
    getPresignedUploadUrl(userId: string, mimeType: string, fileSize: number): Promise<PresignUploadResult>;
    uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string>;
    getSignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;
    deleteFile(key: string): Promise<void>;
    getPublicUrl(key: string): string;
}
export {};
