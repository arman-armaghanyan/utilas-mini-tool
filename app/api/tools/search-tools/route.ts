import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MiniToolDB from '@/lib/models/MiniToolDB';
import { withIframeUrl } from '@/lib/utils/toolHelpers';

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
    const searchRegex = new RegExp(searchQuery, "i");

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
