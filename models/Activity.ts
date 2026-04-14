import mongoose, { Schema, Document, Types } from "mongoose";
import "./Lead";
import "./User";

export type ActivityType = "Call" | "WhatsApp" | "Note";

export interface IActivity extends Document {
  leadId: Types.ObjectId;
  agentId: Types.ObjectId;
  type: ActivityType;
  comment: string;
  nextFollowUpDate?: Date;
  timestamp: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    agentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["Call", "WhatsApp", "Note"], required: true },
    comment: { type: String, trim: true, default: "" },
    nextFollowUpDate: { type: Date, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Activity || mongoose.model<IActivity>("Activity", ActivitySchema);
