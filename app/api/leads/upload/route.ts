import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import UploadBatch from "@/models/UploadBatch";
import { getTokenFromRequest } from "@/lib/auth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = getTokenFromRequest(req);
    if (!user || user.role !== "admin")
      return NextResponse.json(
        { error: `Forbidden. Role: ${user?.role || "No Token"}` },
        { status: 403 }
      );

    await connectDB();
    const { leads, fileName } = await req.json();

    if (!Array.isArray(leads) || leads.length === 0)
      return NextResponse.json({ error: "No leads provided" }, { status: 400 });

    // ── 1. Create the batch record first (we'll update counts after) ──
    const batch = await UploadBatch.create({
      uploadedBy: new mongoose.Types.ObjectId(user.userId),
      totalSubmitted: leads.length,
      inserted: 0,
      duplicates: 0,
      fileName: fileName || "unknown.xlsx",
    });

    // ── 2. Normalise phone numbers & stamp batchId ──
    const normalised = leads.map((l) => ({
      ...l,
      phone: l.phone?.toString().trim().replace(/\s+/g, ""),
      uploadBatchId: batch._id,
    }));

    // ── 3. Detect which phones already exist (duplicates) ──
    const incomingPhones = normalised.map((l) => l.phone).filter(Boolean);
    const existingPhones = await Lead.find(
      { phone: { $in: incomingPhones } },
      { phone: 1 }
    )
      .lean()
      .then((docs) => new Set(docs.map((d) => d.phone)));

    const fresh = normalised.filter((l) => l.phone && !existingPhones.has(l.phone));
    const duplicateCount = leads.length - fresh.length;

    // ── 4. Insert only the fresh leads ──
    let insertedCount = 0;
    if (fresh.length > 0) {
      // ordered:false lets Mongo continue after any unexpected duplicate error
      try {
        const result = await Lead.insertMany(fresh, { ordered: false });
        insertedCount = result.length;
      } catch (err: unknown) {
        // BulkWriteError — some slipped through; count what was written
        if (
          err &&
          typeof err === "object" &&
          "name" in err &&
          (err as { name: string }).name === "MongoBulkWriteError"
        ) {
          const bwe = err as { result?: { insertedCount?: number } };
          insertedCount = bwe.result?.insertedCount ?? 0;
        } else {
          throw err;
        }
      }
    }

    // ── 5. Update the batch with real counts ──
    await UploadBatch.findByIdAndUpdate(batch._id, {
      inserted: insertedCount,
      duplicates: duplicateCount,
    });

    return NextResponse.json(
      {
        inserted: insertedCount,
        duplicates: duplicateCount,
        total: leads.length,
        batchId: batch._id,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
