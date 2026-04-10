import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import { getTokenFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Force rebuild for Turbopack cache resolution
  try {
    const user = getTokenFromRequest(req);
    if (!user || user.role !== "admin") return NextResponse.json({ error: `Forbidden. Role: ${user?.role || "No Token"}` }, { status: 403 });
    await connectDB();
    const { leads } = await req.json();
    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "No leads provided" }, { status: 400 });
    }
    const inserted = await Lead.insertMany(leads, { ordered: false });
    return NextResponse.json({ inserted: inserted.length, total: leads.length }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
