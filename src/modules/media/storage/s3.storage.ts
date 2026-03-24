import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageInterface, UploadResult } from './storage.interface';

@Injectable()
export class S3Storage implements StorageInterface {
  private client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.client = new S3Client({
      region: this.configService.getOrThrow('storage.region'),
      credentials: {
        accessKeyId: this.configService.getOrThrow('storage.accessKey'),
        secretAccessKey: this.configService.getOrThrow('storage.secretKey'),
      },
      endpoint: this.configService.get('storage.endpoint') || undefined,
    });
    this.bucket = this.configService.getOrThrow('storage.bucket');
  }

  async upload(file: Buffer, key: string, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });

    await this.client.send(command);
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    const stream = await response.Body?.transformToByteArray();
    return Buffer.from(stream || []);
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  getUrl(key: string): string {
    const publicUrl = this.configService.get('storage.publicUrl');
    return `${publicUrl}/${key}`;
  }

  async getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }
}
