import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { StorageInterface } from './storage.interface';

@Injectable()
export class LocalStorage implements StorageInterface {
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = (this.configService.get<string>('storage.localPath')) || './uploads';
  }

  async upload(file: Buffer, key: string, mimeType: string): Promise<string> {
    const filePath = join(this.uploadDir, key);
    await writeFile(filePath, file);
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const filePath = join(this.uploadDir, key);
    return readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.uploadDir, key);
    await unlink(filePath);
  }

  getUrl(key: string): string {
    const publicUrl = (this.configService.get<string>('storage.publicUrl')) || 'http://localhost:3000/uploads';
    return `${publicUrl}/${key}`;
  }

  async getSignedDownloadUrl(key: string, expiresIn?: number): Promise<string> {
    // For local storage, return regular URL (no signing needed)
    return this.getUrl(key);
  }
}
