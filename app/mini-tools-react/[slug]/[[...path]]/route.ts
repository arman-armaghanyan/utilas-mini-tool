import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MiniToolDB from '@/lib/models/MiniToolDB';
import { getZipFileEntryByUrl } from '@/lib/services/reactZipProcessing';
import { getMiniToolMimeType, getMiniToolContent } from '@/lib/services/miniToolService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; path?: string[] }> }
) {
  try {
    await connectDB();

    const { slug, path } = await params;

    // Not found error handling
    const tool = await MiniToolDB.findOne({
      iframeSlug: slug.toLowerCase(),
    });

    if (!tool) {
      console.log(`[React App] Tool not found for slug: ${slug}`);
      return NextResponse.json(
        { message: "Tool not found" },
        { status: 404 }
      );
    }

    if (!tool.reactAppBlobUrl) {
      console.log(`[React App] No blob URL for slug: ${slug}`);
      return NextResponse.json(
        { message: "React app not found" },
        { status: 404 }
      );
    }

    // Get the requested file path
    // For root route, path will be undefined
    // For nested route, path will be an array
    let requestedPath = path ? path.join('/') : "";
    // Normalize path - remove leading slash if present
    if (requestedPath.startsWith("/")) {
      requestedPath = requestedPath.slice(1);
    }
    // If empty path, default to index.html
    const normalizedPath = requestedPath || "index.html";
    
    const fileEntry = await getZipFileEntryByUrl(tool.reactAppBlobUrl, normalizedPath);

    // Type guard: check if fileEntry is a valid ZipEntry (has getData method)
    if (!fileEntry || Object.keys(fileEntry).length === 0 || !('getData' in fileEntry)) {
      console.error(`[React App] File not found: ${normalizedPath}`);
      return NextResponse.json(
        { message: `File not found: ${normalizedPath}` },
        { status: 404 }
      );
    }

    // At this point, TypeScript knows fileEntry is ZipEntry, but we need to assert it
    const validFileEntry = fileEntry as { entryName: string; getData(): Buffer };
    const mimeType = getMiniToolMimeType(validFileEntry);
    const basePath = `/mini-tools-react/${slug}/`;
    const content = getMiniToolContent(validFileEntry, basePath);

    // Handle empty object return (error case)
    if (typeof content === 'object' && !Buffer.isBuffer(content) && Object.keys(content).length === 0) {
      return NextResponse.json(
        { message: "Error reading file content" },
        { status: 500 }
      );
    }

    // Ensure content is a Buffer
    if (!Buffer.isBuffer(content)) {
      return NextResponse.json(
        { message: "Error reading file content" },
        { status: 500 }
      );
    }

    const headers = new Headers();
    headers.set("Content-Type", mimeType);

    if (mimeType !== "text/html" && mimeType !== "text/html; charset=utf-8") {
      headers.set("Cache-Control", "public, max-age=31536000");
    }

    // Convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(content), { headers });
  } catch (error) {
    console.error(`[React App] Error serving file:`, error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

