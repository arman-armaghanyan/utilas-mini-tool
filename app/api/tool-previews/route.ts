import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MiniToolPrev from "@/lib/models/MiniToolPrev";
import MiniToolDB from "@/lib/models/MiniToolDB";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { authorized } = await requireAuth();
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { id, title, summary, thumbnail, toolId } = body ?? {};

    if (!id || !title || !summary || !thumbnail || !toolId) {
      return NextResponse.json(
        { message: "All fields are required: id, title, summary, thumbnail, toolId." },
        { status: 400 }
      );
    }

    const targetTool = await MiniToolDB.findOne({ id: toolId }).lean();
    if (!targetTool) {
      return NextResponse.json(
        { message: `Referenced toolId "${toolId}" does not exist.` },
        { status: 400 }
      );
    }

    const created = await MiniToolPrev.create({
      id,
      title,
      summary,
      thumbnail,
      toolId,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { message: "Preview id already exists." },
        { status: 409 }
      );
    }
    console.error("Error creating tool preview:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


