import {
  IStorageProvider,
  RetrievedFile,
  StoredFileInput,
  StoredFileMetadata,
} from "./storageProvider.interface";
import { getStorageProvider } from "./storageProviderFactory";

/**
 * Storage layer for generated/uploaded files - originally just Step 1C of
 * the Company Intelligence pipeline (Upload Document -> Store Original File
 * -> Create Knowledge Source -> ...), now also used by Content Studio to
 * persist generated graphics/videos (see contentStudio/providers/gemini*).
 *
 * This service only handles the file itself. It does not parse, chunk,
 * embed, or index anything. It delegates the actual storage mechanics to an
 * injected IStorageProvider (see storageProviderFactory.ts) so a real
 * S3-compatible backend can be plugged in later without changing callers.
 */
export class FileStorageService {
  private readonly provider: IStorageProvider;

  constructor(provider: IStorageProvider = getStorageProvider()) {
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
