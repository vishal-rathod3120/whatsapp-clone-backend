import { ConfigService } from '@nestjs/config';
import { StorageInterface } from './storage.interface';
export declare class LocalStorage implements StorageInterface {
    private configService;
    private uploadDir;
    constructor(configService: ConfigService);
    upload(file: Buffer, key: string, mimeType: string): Promise<string>;
    download(key: string): Promise<Buffer>;
    delete(key: string): Promise<void>;
    getUrl(key: string): string;
    getSignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;
}
