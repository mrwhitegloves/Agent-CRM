import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Lead from "@/models/Lead";
import bcrypt from "bcryptjs";
import { getTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const profile = await User.findById(user.userId).select("-password").lean();
    if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Agent gets their own lead stats too
    const [totalLeads, converted, pending] = await Promise.all([
      Lead.countDocuments({ assignedAgentId: user.userId }),
      Lead.countDocuments({ assignedAgentId: user.userId, status: "Converted" }),
      Lead.countDocuments({ assignedAgentId: user.userId, status: { $nin: ["Converted", "Not Interested"] } }),
    ]);

    return NextResponse.json({ profile, stats: { totalLeads, converted, pending } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    if (body.name) updateData.name = body.name;
    if (body.phone) updateData.phone = body.phone;

    // Only allow password update with old password verification
    if (body.newPassword && body.oldPassword) {
      const dbUser = await User.findById(user.userId);
      if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
      const match = await bcrypt.compare(body.oldPassword, dbUser.password);
      if (!match) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      updateData.password = await bcrypt.hash(body.newPassword, 12);
    }

    const updated = await User.findByIdAndUpdate(user.userId, updateData, { new: true }).select("-password");
    return NextResponse.json({ profile: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
