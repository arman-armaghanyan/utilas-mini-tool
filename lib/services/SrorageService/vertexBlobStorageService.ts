import {IStorageService} from "@/lib/services/SrorageService/IStorageService";
import {del, put} from "@vercel/blob";

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