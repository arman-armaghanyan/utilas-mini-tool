import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MiniToolDB from '@/lib/models/MiniToolDB';

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

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');

    if (!q || q.trim() === "") {
      return NextResponse.json(
        { message: "Query parameter 'q' is required." },
        { status: 400 }
      );
    }

    const searchQuery = q.trim();

    // Create a case-insensitive regex pattern for searching
    const searchRegex = new RegExp(searchQuery, "i");

    // Search across title, summary, and description fields
    const tools = await MiniToolDB.find({
      $or: [
        { title: searchRegex },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const results = tools.map(withIframeUrl);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching tools:", error);
    return NextResponse.json(
      { message: "Internal server error while searching tools." },
      { status: 500 }
    );
  }
}

