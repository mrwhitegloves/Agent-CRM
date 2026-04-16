import mongoose, { Schema, Document, Types } from "mongoose";
import "./UploadBatch";
import "./User"; // Ensure User model is registered for population

export type LeadStatus =
  | "New Lead"
  | "Contacted"
  | "DNP"
  | "Interested"
  | "Follow-up"
  | "Converted"
  | "Not Interested"
  | "NATC (Not able to connect)";

export interface ILead extends Document {
  name: string;
  phone: string;
  city: string;
  source: string;
  assignedAgentId?: Types.ObjectId;
  assignedAt?: Date;
  status: LeadStatus;
  commissionAmount: number;
  timelineDays?: number;
  notes: string;
  uploadBatchId?: Types.ObjectId;
  createdAt: Date;
  lastUpdated: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, unique: true },
    city: { type: String, trim: true, default: "" },
    source: { type: String, trim: true, default: "" },
    assignedAgentId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    assignedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["New Lead", "Contacted", "DNP", "Interested", "Follow-up", "Converted", "Not Interested", "NATC (Not able to connect)"],
      default: "New Lead",
    },
    commissionAmount: { type: Number, default: 0 },
    timelineDays: { type: Number, default: null },
    notes: { type: String, default: "" },
    uploadBatchId: { type: Schema.Types.ObjectId, ref: "UploadBatch", default: null },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Performance indexes
LeadSchema.index({ assignedAgentId: 1, status: 1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ lastUpdated: -1 });
LeadSchema.index({ name: "text", phone: "text", city: "text" });
LeadSchema.index({ assignedAt: 1, timelineDays: 1, assignedAgentId: 1 });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
LeadSchema.pre("save", function (this: any, next: any) {
  this.lastUpdated = new Date();
  next();
});

export default mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
