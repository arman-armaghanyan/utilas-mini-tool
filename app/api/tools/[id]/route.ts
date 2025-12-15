import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MiniToolDB from '@/lib/models/MiniToolDB';
import { deleteZipFromBlob } from '@/lib/services/blobStorage';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const tool = await MiniToolDB.findOne({ id });

    if (!tool) {
      return NextResponse.json(
        { message: "Tool not found." },
        { status: 404 }
      );
    }

    // If React app has relative URL, update it to full URL
    if (tool.appType === 'react' && tool.reactAppUrl && !tool.reactAppUrl.startsWith('http')) {
      const baseUrl = getBaseUrl();
      const reactAppPath = tool.reactAppUrl.startsWith('/')
        ? tool.reactAppUrl
        : `/mini-tools-react/${tool.iframeSlug}/`;
      tool.reactAppUrl = `${baseUrl}${reactAppPath}`;
      await tool.save();
    }

    return NextResponse.json(withIframeUrl(tool));
  } catch (error) {
    console.error("Error fetching tool:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const updates = await request.json();
    delete updates._id;
    delete updates.id;
    delete updates.reactAppZip; // Prevent direct zip updates via PUT

    // Validate description blocks if provided
    if (updates.description !== undefined) {
      if (!Array.isArray(updates.description) || updates.description.length === 0) {
        return NextResponse.json(
          { message: "Description must be a non-empty array." },
          { status: 400 }
        );
      }

      // Validate each description block
      for (let i = 0; i < updates.description.length; i++) {
        const block = updates.description[i];
        if (!block || typeof block !== 'object') {
          return NextResponse.json(
            { message: `Description block ${i + 1} must be an object.` },
            { status: 400 }
          );
        }
        if (!block.image || typeof block.image !== 'string') {
          return NextResponse.json(
            { message: `Description block ${i + 1} must have a valid image URL.` },
            { status: 400 }
          );
        }
        if (!block.text || typeof block.text !== 'string') {
          return NextResponse.json(
            { message: `Description block ${i + 1} must have text.` },
            { status: 400 }
          );
        }
        if (!block.orientation || !['left', 'right'].includes(block.orientation)) {
          return NextResponse.json(
            { message: `Description block ${i + 1} must have orientation 'left' or 'right'.` },
            { status: 400 }
          );
        }
      }
    }

    const tool = await MiniToolDB.findOne({ id });

    if (!tool) {
      return NextResponse.json(
        { message: "Tool not found." },
        { status: 404 }
      );
    }

    const updated = await MiniToolDB.findOneAndUpdate(
      { id },
      updates,
      { new: true, runValidators: true }
    );

    return NextResponse.json(withIframeUrl(updated));
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "iframeSlug already exists." },
        { status: 409 }
      );
    }
    console.error("Error updating tool:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const tool = await MiniToolDB.findOne({ id });

    if (!tool) {
      return NextResponse.json(
        { message: "Tool not found." },
        { status: 404 }
      );
    }

    // Delete associated blob from Vercel Blob if it exists
    if (tool.reactAppBlobUrl) {
      await deleteZipFromBlob(tool.reactAppBlobUrl);
    }

    await MiniToolDB.findOneAndDelete({ id });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting tool:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

