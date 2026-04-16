import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import User from "@/models/User";
import { getTokenFromRequest } from "@/lib/auth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const user = getTokenFromRequest(req);
    if (!user || user.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await connectDB();
    const { agentId } = await params;

    if (!mongoose.Types.ObjectId.isValid(agentId))
      return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 });

    const agentObjectId = new mongoose.Types.ObjectId(agentId);

    // Fetch agent info
    const agent = await User.findById(agentObjectId)
      .select("name email phone isActive")
      .lean();
    if (!agent)
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });

    // Fetch all leads assigned to this agent
    const leads = await Lead.find({ assignedAgentId: agentObjectId })
      .sort({ lastUpdated: -1 })
      .lean();

    const leadIds = leads.map((l) => l._id);

    // Fetch all activities for these leads (by this agent), latest first
    const activities = await Activity.find({
      leadId: { $in: leadIds },
      agentId: agentObjectId,
    })
      .sort({ timestamp: -1 })
      .lean();

    // Build a map: leadId -> most recent activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latestActivityMap: Record<string, any> = {};
    for (const act of activities) {
      const key = act.leadId.toString();
      if (!latestActivityMap[key]) latestActivityMap[key] = act;
    }

    // Attach latestActivity to each lead
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leadsWithActivity = leads.map((lead: any) => ({
      ...lead,
      latestActivity: latestActivityMap[lead._id.toString()] || null,
    }));

    return NextResponse.json({ agent, leads: leadsWithActivity, activities });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
