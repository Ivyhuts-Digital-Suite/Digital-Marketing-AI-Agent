import mongoose, { Document, Schema, Types } from "mongoose";

export type KnowledgeSourceType = "pdf" | "docx" | "txt" | "csv" | "url" | "other";

export type KnowledgeSourceStatus =
  | "uploaded"
  | "processing"
  | "parsed"
  | "chunked"
  | "embedded"
  | "ready"
  | "failed";

export interface IKnowledgeSource extends Document {
  organizationId: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  filename: string;
  type: KnowledgeSourceType;
  status: KnowledgeSourceStatus;
  metadata?: Record<string, unknown>;
  processingError?: string;
}

const knowledgeSourceSchema = new Schema<IKnowledgeSource>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    filename: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["pdf", "docx", "txt", "csv", "url", "other"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "uploaded",
        "processing",
        "parsed",
        "chunked",
        "embedded",
        "ready",
        "failed",
      ],
      default: "uploaded",
      required: true,
      index: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    processingError: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

knowledgeSourceSchema.index({ organizationId: 1, status: 1 });

const KnowledgeSource = mongoose.model<IKnowledgeSource>(
  "KnowledgeSource",
  knowledgeSourceSchema
);

export default KnowledgeSource;
