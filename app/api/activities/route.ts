import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Activity from "@/models/Activity";
import Lead from "@/models/Lead";
import User from "@/models/User";
import { getTokenFromRequest } from "@/lib/auth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};
    if (leadId) query.leadId = leadId;
    // Always scope to agent's own activities when role is agent
    if (user.role === "agent") {
      query.agentId = new mongoose.Types.ObjectId(user.userId);
    }

    const activities = await Activity.find(query)
      .populate("agentId", "name")
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ activities });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const { clearFollowUp, ...activityData } = body;

    // When clearing, force nextFollowUpDate to null on the new log entry
    const activity = await Activity.create({
      ...activityData,
      nextFollowUpDate: clearFollowUp ? null : activityData.nextFollowUpDate,
      agentId: new mongoose.Types.ObjectId(user.userId),
    });

    // Only update lead status if a status was explicitly passed in the body
    if (body.status) {
      await Lead.findByIdAndUpdate(body.leadId, {
        status: body.status,
        lastUpdated: new Date(),
      });
    }

    // If clearing follow-up, also null out nextFollowUpDate on all previous activities for this lead
    // so they don't show up in the deduplication query
    if (clearFollowUp) {
      await Activity.updateMany(
        { leadId: body.leadId, nextFollowUpDate: { $ne: null } },
        { $set: { nextFollowUpDate: null } }
      );
    }

    // Populate leadId for the response
    await activity.populate("leadId", "name phone status");

    return NextResponse.json({ activity }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
