export interface StorageProvider {
  readonly name: 's3' | 'r2' | 'minio';
  upload(params: { key: string; buffer: Buffer; contentType: string }): Promise<{ key: string }>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  delete(key: string): Promise<void>;
}

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
