export declare class AttachmentResponse {
    id: string;
    url: string;
    originalName?: string;
    mimeType: string;
    sizeBytes: string;
    width?: number;
    height?: number;
    durationSeconds?: number;
    thumbnailUrl?: string;
    createdAt: Date;
    constructor(attachment: any);
}
