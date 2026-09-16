import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  IStorageProvider,
  RetrievedFile,
  StoredFileInput,
  StoredFileMetadata,
} from "./storageProvider.interface";

/**
 * Development/self-hosted storage provider that writes to local disk under
 * STORAGE_LOCAL_DIR (default "uploads"), served back over HTTP via the
 * express.static mount in server.ts. Keeps the same IStorageProvider
 * contract as a real S3-compatible provider, so swapping one in later is a
 * factory change (see storageProviderFactory.ts), not a caller change.
 *
 * Not meant for production/multi-instance deployments (no CDN, no
 * durability guarantees beyond the local filesystem) - see
 * STORAGE_PROVIDER in .env.example.
 */
export class LocalDiskStorageProvider implements IStorageProvider {
  private readonly rootDirOverride?: string;
  private readonly publicBaseUrlOverride?: string;

  constructor(rootDir?: string, publicBaseUrl?: string) {
    this.rootDirOverride = rootDir;
    this.publicBaseUrlOverride = publicBaseUrl;
  }

  private get rootDir(): string {
    return path.resolve(this.rootDirOverride ?? process.env.STORAGE_LOCAL_DIR ?? "uploads");
  }

  private get publicBaseUrl(): string {
    // Media URLs are consumed by the Next.js app (normally :3000), so a
    // relative /uploads URL would incorrectly target that app instead of the
    // Express API. A configured public base still wins in deployed setups.
    return (this.publicBaseUrlOverride ?? process.env.STORAGE_PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, "");
  }

  private resolvePath(key: string): string {
    const resolved = path.resolve(this.rootDir, key);
    if (!resolved.startsWith(this.rootDir)) {
      throw new Error(`Refusing to access storage key outside the storage root: "${key}"`);
    }
    return resolved;
  }

  private buildUrl(key: string): string {
    const encodedKey = key.split("/").map(encodeURIComponent).join("/");
    return this.publicBaseUrl ? `${this.publicBaseUrl}/uploads/${encodedKey}` : `/uploads/${encodedKey}`;
  }

  async store(input: StoredFileInput): Promise<StoredFileMetadata> {
    const extension = path.extname(input.originalFilename) || "";
    const key = [
      input.organizationId ?? "shared",
      `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${extension}`,
    ].join("/");

    const fullPath = this.resolvePath(key);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, input.buffer);

    return {
      key,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      size: input.size,
      url: this.buildUrl(key),
      storedAt: new Date(),
    };
  }

  async retrieve(key: string): Promise<RetrievedFile> {
    const fullPath = this.resolvePath(key);
    const buffer = await fs.promises.readFile(fullPath);
    const stats = await fs.promises.stat(fullPath);
    return {
      buffer,
      metadata: {
        key,
        originalFilename: path.basename(key),
        mimeType: "application/octet-stream",
        size: stats.size,
        url: this.buildUrl(key),
        storedAt: stats.mtime,
      },
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.resolvePath(key);
    await fs.promises.rm(fullPath, { force: true });
  }
}
