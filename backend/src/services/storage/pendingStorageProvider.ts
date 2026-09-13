import {
  IStorageProvider,
  RetrievedFile,
  StoredFileInput,
  StoredFileMetadata,
} from "./storageProvider.interface";

/**
 * Thrown by PendingStorageProvider when a storage operation is attempted
 * before a real S3-compatible provider has been configured.
 */
export class StorageNotConfiguredError extends Error {
  constructor(operation: string) {
    super(
      `File storage is not yet configured. Cannot perform "${operation}". ` +
        "Provide a real S3-compatible IStorageProvider implementation to FileStorageService once storage credentials are available."
    );
    this.name = "StorageNotConfiguredError";
  }
}

/**
 * Default IStorageProvider used until a real S3-compatible backend is wired up.
 * Exists so the rest of the codebase can compile and be developed against
 * the storage abstraction without requiring real credentials.
 */
export class PendingStorageProvider implements IStorageProvider {
  async store(_input: StoredFileInput): Promise<StoredFileMetadata> {
    throw new StorageNotConfiguredError("store");
  }

  async retrieve(_key: string): Promise<RetrievedFile> {
    throw new StorageNotConfiguredError("retrieve");
  }

  async delete(_key: string): Promise<void> {
    throw new StorageNotConfiguredError("delete");
  }
}
