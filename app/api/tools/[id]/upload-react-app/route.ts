import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MiniToolDB from '@/lib/models/MiniToolDB';
import { getZipFileEntryByBuffer } from '@/lib/services/reactZipProcessing';
import { storeZipInBlob, deleteZipFromBlob } from '@/lib/services/blobStorage';

// Helper function to get the base URL for full paths
function getBaseUrl() {
  const baseUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (baseUrl) {
    return baseUrl.replace(/\/$/, ""); // Remove trailing slash
  }
  // Fallback to localhost with port
  const port = process.env.PORT || 4010;
  return `http://127.0.0.1:${port}`;
}

// Helper function to add iframeUrl to tool
function withIframeUrl(tool: any) {
  if (!tool) {
    return tool;
  }

  const plain =
    typeof tool.toObject === "function" ? tool.toObject({ virtuals: true }) : { ...tool };

  // Remove internal blob URL from response (internal use only)
  if (plain.reactAppBlobUrl) {
    delete plain.reactAppBlobUrl;
  }

  const iframeUrl = plain.appType === 'react'
    ? (plain.reactAppUrl || `/mini-tools-react/${plain.iframeSlug}/`)
    : `/mini-tools/${plain.iframeSlug}`;

  return {
    ...plain,
    iframeUrl, // Relative path for same-origin use
  };
}

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

    // Check file type
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
    
    // Delete old blob if it exists (do this before uploading new one)
    if (tool.reactAppBlobUrl) {
      await deleteZipFromBlob(tool.reactAppBlobUrl);
    }
    
    const blobUrl = await storeZipInBlob(tool.id, buffer);
    console.log(`[Upload] File uploaded successfully to Vercel Blob: ${blobUrl}`);

    const baseUrl = getBaseUrl();
    const reactAppPath = `/mini-tools-react/${tool.iframeSlug}/`;

    tool.reactAppBlobUrl = blobUrl; // Store Vercel Blob URL
    tool.reactAppUrl = `${baseUrl}${reactAppPath}`; // Store full URL for iframe
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

