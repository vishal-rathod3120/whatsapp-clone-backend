import { MediaService } from './media.service';
import { JwtPayload } from '../auth/types/jwt-payload.type';
export declare class MediaController {
    private mediaService;
    constructor(mediaService: MediaService);
    uploadFile(file: Express.Multer.File, type: string, user: JwtPayload): Promise<{
        attachmentId: string;
        url: string;
        mimeType: string;
        size: number;
    }>;
    getDownloadUrl(attachmentId: string, expiresIn?: number): Promise<{
        error: string;
        attachmentId?: undefined;
        url?: undefined;
        expiresIn?: undefined;
    } | {
        attachmentId: string;
        url: string;
        expiresIn: number;
        error?: undefined;
    }>;
}
