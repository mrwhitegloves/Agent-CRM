import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UploadBatch from "@/models/UploadBatch";
import { getTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user || user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();

    const batches = await UploadBatch.find()
      .populate("uploadedBy", "name email")
      .sort({ uploadedAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ batches });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
