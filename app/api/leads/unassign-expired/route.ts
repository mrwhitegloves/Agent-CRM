import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import { getTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/leads/unassign-expired
 * Admin-only: Unassigns leads from agents whose timeline has expired.
 * Timeline expiry = assignedAt + timelineDays < now
 */
export async function POST(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const now = new Date();

    // Find all assigned leads where timeline has expired
    const expiredLeads = await Lead.find({
      assignedAgentId: { $ne: null },
      assignedAt: { $ne: null },
      timelineDays: { $gt: 0 },
      status: { $nin: ["Converted", "Not Interested"] },
    }).lean();

    const toUnassign: string[] = [];
    for (const lead of expiredLeads) {
      if (lead.assignedAt && lead.timelineDays) {
        const deadline = new Date(lead.assignedAt);
        deadline.setDate(deadline.getDate() + lead.timelineDays);
        if (now > deadline) {
          toUnassign.push((lead._id as any).toString());
        }
      }
    }

    if (toUnassign.length === 0) {
      return NextResponse.json({ unassigned: 0, message: "No expired leads found" });
    }

    await Lead.updateMany(
      { _id: { $in: toUnassign } },
      {
        $set: {
          assignedAgentId: null,
          assignedAt: null,
          timelineDays: null,
          lastUpdated: now,
        },
      }
    );

    return NextResponse.json({ unassigned: toUnassign.length, message: `Unassigned ${toUnassign.length} expired leads` });
  } catch (e) {
    console.error("Unassign expired leads error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * GET /api/leads/unassign-expired
 * Returns count of currently expired leads (preview only)
 */
export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const now = new Date();

    const assignedLeads = await Lead.find({
      assignedAgentId: { $ne: null },
      assignedAt: { $ne: null },
      timelineDays: { $gt: 0 },
      status: { $nin: ["Converted", "Not Interested"] },
    }).lean();

    let expiredCount = 0;
    for (const lead of assignedLeads) {
      if (lead.assignedAt && lead.timelineDays) {
        const deadline = new Date(lead.assignedAt);
        deadline.setDate(deadline.getDate() + lead.timelineDays);
        if (now > deadline) expiredCount++;
      }
    }

    return NextResponse.json({ expiredCount });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
