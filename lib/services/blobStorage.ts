import { put, del } from '@vercel/blob';
import * as fs from 'fs/promises';
import * as path from 'path';

interface IStorageService {
  storeFile(id: string, buffer: Buffer): Promise<string>;
  deleteFile(url: string): Promise<void>;
  fetchFile(url: string): Promise<Buffer | undefined>;
}

export class VertexBlobStorageService implements IStorageService {
  public async fetchFile(url: string): Promise<Buffer | undefined> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        console.error(`[Blob Storage] Failed to fetch blob: ${url}, status: ${response.status}`);
        return undefined;
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error(`[Blob Storage] Error fetching blob:`, error);
      return undefined;
    }
  }

  public async storeFile(id: string, buffer: Buffer): Promise<string> {
    const fileName = `react-apps/${id}-${Date.now()}.zip`;

    const blob = await put(fileName, buffer, {
      access: 'public',
      contentType: 'application/zip',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`[Blob Storage] Uploaded zip to: ${blob.url}`);
    return blob.url;
  }

  public async deleteFile(url: string): Promise<void> {
    try {
      await del(url, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      console.log(`[Blob Storage] Deleted blob: ${url}`);
    } catch (error) {
      console.warn(`[Blob Storage] Could not delete blob: ${url}`, error);
    }
  }
}

export class LocalStorageService implements IStorageService {
  private readonly storageDir: string;

  constructor() {
    this.storageDir = path.join(process.cwd(), 'storage');
  }

  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      console.error(`[Local Storage] Error creating storage directory:`, error);
      throw error;
    }
  }

  private getFilePathFromUrl(url: string): string {
    // Handle both file:// URLs and direct paths
    if (url.startsWith('file://')) {
      return url.replace('file://', '');
    }
    return url;
  }

  public async storeFile(id: string, buffer: Buffer): Promise<string> {
    await this.ensureStorageDir();

    const fileName = `${id}-${Date.now()}.zip`;
    const filePath = path.join(this.storageDir, fileName);

    await fs.writeFile(filePath, buffer);
    console.log(`[Local Storage] Saved file to: ${filePath}`);

    return `file://${filePath}`;
  }

  public async deleteFile(url: string): Promise<void> {
    try {
      const filePath = this.getFilePathFromUrl(url);
      await fs.unlink(filePath);
      console.log(`[Local Storage] Deleted file: ${filePath}`);
    } catch (error) {
      console.warn(`[Local Storage] Could not delete file: ${url}`, error);
    }
  }

  public async fetchFile(url: string): Promise<Buffer | undefined> {
    try {
      const filePath = this.getFilePathFromUrl(url);
      const buffer = await fs.readFile(filePath);
      return buffer;
    } catch (error) {
      console.error(`[Local Storage] Error reading file:`, error);
      return undefined;
    }
  }
}

export class StorageServiceFactory {
  private static instance: IStorageService | null = null;

  public static getService(): IStorageService {
    if (!this.instance) {
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        console.log('[Storage Factory] Using Vercel Blob Storage');
        this.instance = new VertexBlobStorageService();
      } else {
        console.log('[Storage Factory] Using Local Storage');
        this.instance = new LocalStorageService();
      }
    }
    return this.instance;
  }

  // Reset instance (useful for testing)
  public static resetInstance(): void {
    this.instance = null;
  }
}

// Wrapper functions for backwards compatibility
export async function storeZipInBlob(toolId: string, buffer: Buffer): Promise<string> {
  const service = StorageServiceFactory.getService();
  return service.storeFile(toolId, buffer);
}

export async function deleteZipFromBlob(url: string): Promise<void> {
  const service = StorageServiceFactory.getService();
  return service.deleteFile(url);
}

export async function fetchZipFromBlob(url: string): Promise<Buffer | undefined> {
  const service = StorageServiceFactory.getService();
  return service.fetchFile(url);
}
