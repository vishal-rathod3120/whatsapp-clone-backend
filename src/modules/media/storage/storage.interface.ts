export interface StorageInterface {
  upload(file: Buffer, key: string, mimeType: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
  getSignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}
