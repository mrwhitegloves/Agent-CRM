import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import { getTokenFromRequest } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (user.role === "admin") {
      const totalLeads = await Lead.countDocuments();
      const converted = await Lead.countDocuments({ status: "Converted" });
      const newToday = await Lead.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } });
      const totalCommission = await Lead.aggregate([
        { $match: { status: "Converted" } },
        { $group: { _id: null, total: { $sum: "$commissionAmount" } } },
      ]);
      const statusBreakdown = await Lead.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
      const agentPerformance = await Lead.aggregate([
        { $match: { assignedAgentId: { $ne: null } } },
        { $group: { _id: "$assignedAgentId", total: { $sum: 1 }, converted: { $sum: { $cond: [{ $eq: ["$status", "Converted"] }, 1, 0] } }, commission: { $sum: "$commissionAmount" } } },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "agent" } },
        { $unwind: "$agent" },
        { $project: { name: "$agent.name", total: 1, converted: 1, commission: 1 } },
        { $sort: { converted: -1 } },
        { $limit: 10 },
      ]);
      const timelineGroups = await Lead.aggregate([
        { $match: { timelineDays: { $exists: true, $gt: 0 }, status: { $nin: ["Converted", "Not Interested"] } } },
        { $group: { _id: "$timelineDays", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).exec();
      return NextResponse.json({ totalLeads, converted, newToday, totalCommission: totalCommission[0]?.total || 0, statusBreakdown, agentPerformance, timelineGroups });
    } else {
      const myLeads = await Lead.countDocuments({ assignedAgentId: user.userId });
      const myConverted = await Lead.countDocuments({ assignedAgentId: user.userId, status: "Converted" });
      const myCommission = await Lead.aggregate([
        { $match: { assignedAgentId: new mongoose.Types.ObjectId(user.userId), status: "Converted" } },
        { $group: { _id: null, total: { $sum: "$commissionAmount" } } },
      ]);
      const followUps = await Activity.find({
        agentId: user.userId,
        nextFollowUpDate: { $gte: today, $lt: tomorrow },
      }).populate("leadId", "name phone status").lean();
      const recentActivity = await Activity.find({ agentId: user.userId })
        .populate("leadId", "name phone")
        .sort({ timestamp: -1 })
        .limit(5)
        .lean();
      const statusBreakdown = await Lead.aggregate([
        { $match: { assignedAgentId: new mongoose.Types.ObjectId(user.userId) } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]);
      const timelineGroups = await Lead.aggregate([
        { $match: { assignedAgentId: new mongoose.Types.ObjectId(user.userId), timelineDays: { $exists: true, $gt: 0 }, status: { $nin: ["Converted", "Not Interested"] } } },
        { $group: { _id: "$timelineDays", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]).exec();
      return NextResponse.json({ myLeads, myConverted, myCommission: myCommission[0]?.total || 0, followUps, recentActivity, statusBreakdown, timelineGroups });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
