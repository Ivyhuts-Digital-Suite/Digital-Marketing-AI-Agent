import mongoose, { Document, Schema, Types } from "mongoose";

export interface IKnowledgeChunkMetadata {
  page?: number;
  section?: string;
  heading?: string;
}

export interface IKnowledgeChunk extends Document {
  organizationId: Types.ObjectId;
  sourceId: Types.ObjectId;
  chunkIndex: number;
  text: string;
  embedding?: number[];
  tokenCount?: number;
  metadata?: IKnowledgeChunkMetadata;
}

const knowledgeChunkSchema = new Schema<IKnowledgeChunk>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    sourceId: {
      type: Schema.Types.ObjectId,
      ref: "KnowledgeSource",
      required: true,
      index: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    // Populated by the (not-yet-implemented) embedding generation step.
    // Left optional so chunks can exist in the "chunked" pipeline stage
    // before they reach "embedded".
    embedding: {
      type: [Number],
      default: undefined,
    },

    tokenCount: {
      type: Number,
    },

    metadata: {
      page: Number,
      section: String,
      heading: String,
    },
  },
  {
    timestamps: true,
  }
);

knowledgeChunkSchema.index(
  { organizationId: 1, sourceId: 1, chunkIndex: 1 },
  { unique: true }
);

const KnowledgeChunk = mongoose.model<IKnowledgeChunk>(
  "KnowledgeChunk",
  knowledgeChunkSchema
);

export default KnowledgeChunk;
