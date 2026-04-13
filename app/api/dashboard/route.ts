import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import User from "@/models/User";
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
      // Run queries concurrently for speed
      const [
        totalLeads,
        converted,
        newToday,
        unassignedCount,
        totalCommission,
        statusBreakdown,
        agentPerformance,
        timelineGroups,
        agentLeadCounts,
      ] = await Promise.all([
        Lead.countDocuments(),
        Lead.countDocuments({ status: "Converted" }),
        Lead.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
        Lead.countDocuments({ assignedAgentId: null }),
        Lead.aggregate([
          { $match: { status: "Converted" } },
          { $group: { _id: null, total: { $sum: "$commissionAmount" } } },
        ]),
        Lead.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Lead.aggregate([
          { $match: { assignedAgentId: { $ne: null } } },
          {
            $group: {
              _id: "$assignedAgentId",
              total: { $sum: 1 },
              converted: { $sum: { $cond: [{ $eq: ["$status", "Converted"] }, 1, 0] } },
              commission: { $sum: "$commissionAmount" },
            },
          },
          { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "agent" } },
          { $unwind: "$agent" },
          { $project: { name: "$agent.name", email: "$agent.email", isActive: "$agent.isActive", total: 1, converted: 1, commission: 1 } },
          { $sort: { converted: -1 } },
          { $limit: 20 },
        ]),
        Lead.aggregate([
          { $match: { timelineDays: { $exists: true, $gt: 0 }, status: { $nin: ["Converted", "Not Interested"] } } },
          { $group: { _id: "$timelineDays", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        // Per-agent lead assignment count (all agents, including those with 0 leads)
        User.aggregate([
          { $match: { role: "agent" } },
          {
            $lookup: {
              from: "leads",
              localField: "_id",
              foreignField: "assignedAgentId",
              as: "leads",
            },
          },
          {
            $project: {
              name: 1,
              email: 1,
              phone: 1,
              isActive: 1,
              leadsCount: { $size: "$leads" },
              convertedCount: {
                $size: {
                  $filter: { input: "$leads", as: "l", cond: { $eq: ["$$l.status", "Converted"] } },
                },
              },
            },
          },
          { $sort: { leadsCount: -1 } },
        ]),
      ]);

      return NextResponse.json({
        totalLeads,
        converted,
        newToday,
        unassignedCount,
        totalCommission: totalCommission[0]?.total || 0,
        statusBreakdown,
        agentPerformance,
        timelineGroups,
        agentLeadCounts,
      });
    } else {
      // Agent dashboard - concurrent queries
      const agentObjectId = new mongoose.Types.ObjectId(user.userId);
      const [myLeads, myConverted, myCommission, followUps, recentActivity, statusBreakdown, timelineGroups] =
        await Promise.all([
          Lead.countDocuments({ assignedAgentId: user.userId }),
          Lead.countDocuments({ assignedAgentId: user.userId, status: "Converted" }),
          Lead.aggregate([
            { $match: { assignedAgentId: agentObjectId, status: "Converted" } },
            { $group: { _id: null, total: { $sum: "$commissionAmount" } } },
          ]),
          // Deduplicated follow-ups: latest activity per lead that has a future follow-up date
          Activity.aggregate([
            {
              $match: {
                agentId: agentObjectId,
                nextFollowUpDate: {
                  $ne: null,
                  $lte: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // up to 7 days ahead
                },
              },
            },
            { $sort: { nextFollowUpDate: -1 } }, // latest first per lead
            {
              $group: {
                _id: "$leadId",                       // deduplicate by lead
                activityId: { $first: "$_id" },
                nextFollowUpDate: { $first: "$nextFollowUpDate" },
                comment: { $first: "$comment" },
                agentId: { $first: "$agentId" },
              },
            },
            { $sort: { nextFollowUpDate: 1 } },     // sort ascending for display
            { $limit: 20 },
            {
              $lookup: {
                from: "leads",
                localField: "_id",
                foreignField: "_id",
                as: "leadInfo",
              },
            },
            { $unwind: "$leadInfo" },
            {
              $project: {
                _id: "$activityId",
                leadId: {
                  _id: "$leadInfo._id",
                  name: "$leadInfo.name",
                  phone: "$leadInfo.phone",
                  status: "$leadInfo.status",
                },
                nextFollowUpDate: 1,
                comment: 1,
                agentId: 1,
              },
            },
          ]),
          Activity.find({ agentId: agentObjectId })
            .populate("leadId", "name phone")
            .sort({ timestamp: -1 })
            .limit(5)
            .lean(),
          Lead.aggregate([
            { $match: { assignedAgentId: agentObjectId } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ]),
          Lead.aggregate([
            {
              $match: {
                assignedAgentId: agentObjectId,
                timelineDays: { $exists: true, $gt: 0 },
                status: { $nin: ["Converted", "Not Interested"] },
              },
            },
            { $group: { _id: "$timelineDays", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ]),
        ]);

      return NextResponse.json({
        myLeads,
        myConverted,
        myCommission: myCommission[0]?.total || 0,
        followUps,
        recentActivity,
        statusBreakdown,
        timelineGroups,
      });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
