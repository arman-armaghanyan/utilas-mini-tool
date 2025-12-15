import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MiniToolDB from '@/lib/models/MiniToolDB';
import { withIframeUrl } from '@/lib/utils/toolHelpers';

export async function GET() {
  try {
    await connectDB();

    const tools = (await MiniToolDB.find()
      .sort({ createdAt: -1 })
      .lean())
      .map(withIframeUrl);

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
