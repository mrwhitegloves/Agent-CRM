import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import { getTokenFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { leadIds, assignedAgentId, timelineDays } = await req.json();

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: "No leads selected" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (assignedAgentId !== undefined) {
      updateData.assignedAgentId = assignedAgentId === "unassigned" ? null : assignedAgentId;
    }
    if (timelineDays !== undefined) {
      updateData.timelineDays = timelineDays;
    }

    await Lead.updateMany(
      { _id: { $in: leadIds } },
      { $set: updateData }
    );

    return NextResponse.json({ success: true, updatedCount: leadIds.length }, { status: 200 });
  } catch (error) {
    console.error("Bulk assign error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
