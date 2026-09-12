import {
  IStorageProvider,
  RetrievedFile,
  StoredFileInput,
  StoredFileMetadata,
} from "./storageProvider.interface";
import { PendingStorageProvider } from "./pendingStorageProvider";

/**
 * Storage layer for original uploaded files (Step 1C of the Company
 * Intelligence / Marketing Brain pipeline):
 *
 *   Upload Document -> Store Original File -> Create Knowledge Source -> ...
 *
 * This service only handles the original file. It does not parse,
 * chunk, embed, or index anything. It delegates the actual storage
 * mechanics to an injected IStorageProvider so a real S3-compatible
 * backend can be plugged in later without changing callers.
 */
export class FileStorageService {
  private readonly provider: IStorageProvider;

  constructor(provider: IStorageProvider = new PendingStorageProvider()) {
    this.provider = provider;
  }

  async storeFile(input: StoredFileInput): Promise<StoredFileMetadata> {
    return this.provider.store(input);
  }

  async getFile(key: string): Promise<RetrievedFile> {
    return this.provider.retrieve(key);
  }

  async deleteFile(key: string): Promise<void> {
    return this.provider.delete(key);
  }
}

// Default instance. Uses PendingStorageProvider until a real
// S3-compatible provider is configured and injected.
export const fileStorageService = new FileStorageService();
