import {IStorageService} from "@/lib/services/SrorageService/IStorageService";
import path from "path";
import fs from "fs/promises";

export class LocalStorageService implements IStorageService {
    private readonly storageDir: string;

    constructor() {
        this.storageDir = path.join(process.cwd(), 'storage');
    }

    private async ensureStorageDir(): Promise<void> {
        try {
            await fs.mkdir(this.storageDir, {recursive: true});
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