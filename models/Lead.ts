import mongoose, { Schema, Document, Types } from "mongoose";

export type LeadStatus =
  | "New Lead"
  | "Contacted"
  | "DNP"
  | "Interested"
  | "Follow-up"
  | "Converted"
  | "Not Interested";

export interface ILead extends Document {
  name: string;
  phone: string;
  city: string;
  source: string;
  assignedAgentId?: Types.ObjectId;
  status: LeadStatus;
  commissionAmount: number;
  timelineDays?: number;
  notes: string;
  createdAt: Date;
  lastUpdated: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, trim: true, default: "" },
    source: { type: String, trim: true, default: "" },
    assignedAgentId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["New Lead", "Contacted", "DNP", "Interested", "Follow-up", "Converted", "Not Interested"],
      default: "New Lead",
    },
    commissionAmount: { type: Number, default: 0 },
    timelineDays: { type: Number, default: null },
    notes: { type: String, default: "" },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

LeadSchema.pre("save", function (this: any, next: any) {
  this.lastUpdated = new Date();
  // @ts-ignore
  next();
});

export default mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
