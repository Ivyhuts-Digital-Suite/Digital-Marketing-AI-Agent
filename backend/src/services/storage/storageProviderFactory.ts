import { IStorageProvider } from "./storageProvider.interface";
import { PendingStorageProvider } from "./pendingStorageProvider";
import { LocalDiskStorageProvider } from "./localDiskStorageProvider";

/**
 * Resolves which IStorageProvider backs FileStorageService. Defaults to
 * "local" (disk storage under STORAGE_LOCAL_DIR, served via express.static -
 * see server.ts) since no S3-compatible provider exists in this codebase
 * yet. Set STORAGE_PROVIDER=pending to restore the old
 * always-throws-until-configured behavior explicitly.
 */
export function getStorageProvider(): IStorageProvider {
  const configured = (process.env.STORAGE_PROVIDER || "local").trim().toLowerCase();

  switch (configured) {
    case "pending":
      return new PendingStorageProvider();
    case "local":
    default:
      return new LocalDiskStorageProvider();
  }
}
