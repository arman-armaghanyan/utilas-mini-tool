import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MiniToolDB from '@/lib/models/MiniToolDB';

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

  // Remove file path from response (internal use only)
  if (plain.reactAppZipPath) {
    delete plain.reactAppZipPath;
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

    const tools = (await MiniToolDB.find()
      .sort({ createdAt: -1 })
      .lean())
      .map(withIframeUrl);
    // withIframeUrl will compute iframeUrl for each tool
    return NextResponse.json(tools);
  } catch (error) {
    console.error("Error fetching tools:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { id, title, summary, description, thumbnail, iframeSlug, appType } = body;

    if (
      !id ||
      !title ||
      !summary ||
      !description ||
      !Array.isArray(description) ||
      description.length === 0 ||
      !thumbnail ||
      !iframeSlug
    ) {
      return NextResponse.json(
        { message: "All fields are required, and description must be a non-empty array." },
        { status: 400 }
      );
    }

    // Validate each description block
    for (let i = 0; i < description.length; i++) {
      const block = description[i];
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

    const createData = {
      id,
      title,
      summary,
      description,
      thumbnail,
      iframeSlug,
      appType: appType,
    };

    const created = await MiniToolDB.create(createData);

    return NextResponse.json(withIframeUrl(created), { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Tool id or iframeSlug already exists." },
        { status: 409 }
      );
    }
    console.error("Error creating tool:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

