export class AttachmentResponse {
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

  constructor(attachment: any) {
    this.id = attachment.id;
    this.url = `/api/v1/media/${attachment.id}`;
    this.originalName = attachment.originalName;
    this.mimeType = attachment.mimeType;
    this.sizeBytes = attachment.sizeBytes.toString();
    this.width = attachment.width;
    this.height = attachment.height;
    this.durationSeconds = attachment.durationSeconds;
    this.thumbnailUrl = attachment.thumbnailKey
      ? `/api/v1/media/${attachment.id}/thumbnail`
      : undefined;
    this.createdAt = attachment.createdAt;
  }
}
