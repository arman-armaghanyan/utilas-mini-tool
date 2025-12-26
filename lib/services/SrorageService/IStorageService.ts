export interface IStorageService {
    storeFile(id: string, buffer: Buffer): Promise<string>;

    deleteFile(url: string): Promise<void>;

    fetchFile(url: string): Promise<Buffer | undefined>;
}