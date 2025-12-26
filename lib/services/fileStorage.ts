
// Wrapper functions for backwards compatibility
import {StorageServiceFactory} from "@/lib/services/SrorageService/storageServiceFactory";

export async function storeFile(toolId: string, buffer: Buffer): Promise<string> {
  const service = StorageServiceFactory.getService();
  return service.storeFile(toolId, buffer);
}

export async function deleteFile(url: string): Promise<void> {
  const service = StorageServiceFactory.getService();
  return service.deleteFile(url);
}

export async function fetchFile(url: string): Promise<Buffer | undefined> {
  const service = StorageServiceFactory.getService();
  return service.fetchFile(url);
}
