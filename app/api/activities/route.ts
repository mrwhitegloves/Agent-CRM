import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Activity from "@/models/Activity";
import Lead from "@/models/Lead";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");
    const query: Record<string, string> = {};
    if (leadId) query.leadId = leadId;
    if (user.role === "agent") query.agentId = user.userId;
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
    const activity = await Activity.create({ ...body, agentId: user.userId });
    if (body.nextFollowUpDate) {
      await Lead.findByIdAndUpdate(body.leadId, {
        status: "Follow-up",
        lastUpdated: new Date(),
      });
    }
    return NextResponse.json({ activity }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
