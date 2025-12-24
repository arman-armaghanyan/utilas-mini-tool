import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MiniToolDB from '@/lib/models/MiniToolDB';
import { getZipFileEntryByBuffer } from '@/lib/services/reactZipProcessing';
import { storeZipInBlob, deleteZipFromBlob } from '@/lib/services/blobStorage';
import { getBaseUrl, withIframeUrl } from '@/lib/utils/toolHelpers';
import { requireAuth } from '@/lib/auth';

function isHasIndexHtmlExist(entries: any[]) {
  return entries.some(entry => {
    const name = entry.entryName.replace(/\\/g, "/");
    return name === "index.html" ||
      name.endsWith("/index.html") ||
      name === "dist/index.html" ||
      (name.startsWith("dist/") && name.endsWith("/index.html"));
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { authorized } = await requireAuth();
    if (!authorized) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("reactApp") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file uploaded." },
        { status: 400 }
      );
    }

    if (file.type !== "application/zip" && file.type !== "application/x-zip-compressed") {
      return NextResponse.json(
        { message: "Only .zip files are allowed" },
        { status: 400 }
      );
    }

    const tool = await MiniToolDB.findOne({ id });

    if (!tool) {
      return NextResponse.json(
        { message: "Tool not found." },
        { status: 404 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const entries = getZipFileEntryByBuffer(buffer);
    console.log(`[Upload] Zip file has ${entries.length} entries`);
    if (entries.length > 0) {
      console.log(`[Upload] First 10 entries:`, entries.slice(0, 10).map(e => e.entryName));
    }

    if (!isHasIndexHtmlExist(entries)) {
      console.error(`[Upload] No index.html found in zip. Entries:`, entries.slice(0, 20).map(e => e.entryName));
      return NextResponse.json(
        { message: "Zip file must contain an index.html file." },
        { status: 400 }
      );
    }

    console.log(`[Upload] index.html found, proceeding to upload to Vercel Blob`);
    
    // Delete old blob if it exists
    if (tool.reactAppBlobUrl) {
      await deleteZipFromBlob(tool.reactAppBlobUrl);
    }
    
    const blobUrl = await storeZipInBlob(tool.id, buffer);
    console.log(`[Upload] File uploaded successfully to Vercel Blob: ${blobUrl}`);

    const baseUrl = getBaseUrl();
    const reactAppPath = `/mini-tools-react/${tool.iframeSlug}/`;

    tool.reactAppBlobUrl = blobUrl;
    tool.reactAppUrl = `${baseUrl}${reactAppPath}`;
    tool.appType = 'react';
    await tool.save();

    return NextResponse.json(withIframeUrl(tool));
  } catch (error: any) {
    if (error.message === "Only .zip files are allowed") {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      );
    }
    console.error("Error uploading React app:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
