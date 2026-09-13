/**
 * Storage abstraction for the original uploaded file (Step 1C).
 *
 * This is intentionally provider-agnostic so it can be backed by any
 * S3-compatible object storage (AWS S3, MinIO, Cloudflare R2, etc.)
 * without changing any calling code.
 */

export interface StoredFileInput {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  size: number;
  organizationId?: string;
}

export interface StoredFileMetadata {
  key: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  url?: string;
  storedAt: Date;
}

export interface RetrievedFile {
  buffer: Buffer;
  metadata: StoredFileMetadata;
}

export interface IStorageProvider {
  store(input: StoredFileInput): Promise<StoredFileMetadata>;
  retrieve(key: string): Promise<RetrievedFile>;
  delete(key: string): Promise<void>;
}
