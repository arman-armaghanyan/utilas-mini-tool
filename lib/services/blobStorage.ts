import { put, del } from '@vercel/blob';


export async function storeZipInBlob(toolId: string, buffer: Buffer): Promise<string> {
  const fileName = `react-apps/${toolId}-${Date.now()}.zip`;
  
  const blob = await put(fileName, buffer, {
    access: 'public',
    contentType: 'application/zip',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  
  console.log(`[Blob Storage] Uploaded zip to: ${blob.url}`);
  return blob.url;
}


export async function deleteZipFromBlob(url: string): Promise<void> {
  try {
    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.log(`[Blob Storage] Deleted blob: ${url}`);
  } catch (error) {
    console.warn(`[Blob Storage] Could not delete blob: ${url}`, error);
  }
}


export async function fetchZipFromBlob(url: string): Promise<Buffer | undefined> {
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

