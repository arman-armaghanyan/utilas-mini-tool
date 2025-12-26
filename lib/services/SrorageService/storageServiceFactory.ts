import {IStorageService} from "@/lib/services/SrorageService/IStorageService";
import {VertexBlobStorageService} from "@/lib/services/SrorageService/vertexBlobStorageService";
import {LocalStorageService} from "@/lib/services/SrorageService/localStorageService";

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