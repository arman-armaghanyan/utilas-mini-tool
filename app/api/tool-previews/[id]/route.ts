import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import MiniToolPrev from "@/lib/models/MiniToolPrev";
import MiniToolDB from "@/lib/models/MiniToolDB";
import { requireAuth } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized } = await requireAuth();
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const updates = (await request.json()) ?? {};

    delete updates._id;
    delete updates.id;

    if (updates.toolId !== undefined) {
      if (!updates.toolId || typeof updates.toolId !== "string") {
        return NextResponse.json(
          { message: "toolId must be a non-empty string." },
          { status: 400 }
        );
      }
      const targetTool = await MiniToolDB.findOne({ id: updates.toolId }).lean();
      if (!targetTool) {
        return NextResponse.json(
          { message: `Referenced toolId "${updates.toolId}" does not exist.` },
          { status: 400 }
        );
      }
    }

    const updated = await MiniToolPrev.findOneAndUpdate({ id }, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json({ message: "Preview not found." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating tool preview:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { authorized } = await requireAuth();
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const deleted = await MiniToolPrev.findOneAndDelete({ id });

    if (!deleted) {
      return NextResponse.json({ message: "Preview not found." }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting tool preview:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


