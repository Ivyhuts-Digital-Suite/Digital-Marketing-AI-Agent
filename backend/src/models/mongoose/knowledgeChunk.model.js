import mongoose from "mongoose";

const KnowledgeChunkSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KnowledgeDocument",
      required: true,
      index: true
    },

    chunkIndex: {
      type: Number,
      required: true
    },

    text: {
      type: String,
      required: true
    },

    embedding: {
      type: [Number],
      required: true
    },

    tokenCount: Number,

    metadata: {
      page: Number,
      section: String,
      heading: String
    }
  },
  {
    timestamps: true
  }
);

KnowledgeChunkSchema.index({
  organizationId: 1,
  documentId: 1,
  chunkIndex: 1
});

export default mongoose.model(
  "KnowledgeChunk",
  KnowledgeChunkSchema
);