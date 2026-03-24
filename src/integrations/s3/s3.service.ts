import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

interface PresignUploadResult {
  uploadUrl: string;
  attachmentId: string;
  storageKey: string;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: !!process.env.S3_ENDPOINT,
    });
    this.bucket = process.env.S3_BUCKET_NAME || 'whatsapp-clone-media';
  }

  async getPresignedUploadUrl(
    userId: string,
    mimeType: string,
    fileSize: number,
  ): Promise<PresignUploadResult> {
    // Validate file size limits
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');

    if (isImage && fileSize > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Image size exceeds 10MB limit');
    }
    if (isVideo && fileSize > MAX_VIDEO_SIZE) {
      throw new BadRequestException('Video size exceeds 100MB limit');
    }
    if (!isImage && !isVideo && fileSize > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 50MB limit');
    }

    // Generate UUID-based storage key
    const attachmentId = uuidv4();
    const extension = mimeType.split('/')[1] || 'bin';
    const storageKey = `uploads/${userId}/${attachmentId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 300 }); // 5 minutes

    return { uploadUrl, attachmentId, storageKey };
  }

  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return this.getPublicUrl(key);
  }

  async getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  getPublicUrl(key: string): string {
    if (process.env.S3_ENDPOINT) {
      return `${process.env.S3_ENDPOINT}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }
}
