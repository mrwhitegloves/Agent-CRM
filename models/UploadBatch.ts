import mongoose, { Schema, Document, Types } from "mongoose";
import "./User";

export interface IUploadBatch extends Document {
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
  totalSubmitted: number;
  inserted: number;
  duplicates: number;
  fileName: string;
  note?: string;
}

const UploadBatchSchema = new Schema<IUploadBatch>(
  {
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    uploadedAt: { type: Date, default: Date.now },
    totalSubmitted: { type: Number, default: 0 },
    inserted: { type: Number, default: 0 },
    duplicates: { type: Number, default: 0 },
    fileName: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.UploadBatch ||
  mongoose.model<IUploadBatch>("UploadBatch", UploadBatchSchema);
