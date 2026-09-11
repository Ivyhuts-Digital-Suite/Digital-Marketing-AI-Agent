import mongoose from "mongoose"; 
 
const KnowledgeDocumentSchema = new mongoose.Schema( 
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
 
    name: { 
      type: String, 
      required: true 
    }, 
 
    type: { 
      type: String, 
      enum: [ 
        "pdf", 
        "doc", 
        "docx", 
        "text", 
        "url", 
        "webpage", 
        "brand_guideline", 
        "case_study", 
        "product_documentation", 
        "other" 
      ] 
    }, 
 
    source: { 
      type: String, 
      enum: [ 
        "upload", 
        "url", 
        "generated", 
        "integration" 
      ] 
    }, 
 
    sourceUrl: String, 
 
    assetId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "ContentAsset" 
    }, 
 
    storageKey: String, 
 
    mimeType: String, 
 
    fileSize: Number, 
 
    extractedText: String, 
 
    metadata: mongoose.Schema.Types.Mixed, 
 
    contentHash: String, 
 
    embeddingModel: String, 
 
    chunkCount: Number, 
 
    status: { 
      type: String, 
      enum: [ 
        "pending", 
        "processing", 
        "indexed", 
        "failed", 
        "archived" 
      ], 
      default: "pending", 
      index: true 
    }, 
 
    indexedAt: Date 
  }, 
  { 
    timestamps: true 
  } 
); 
 
export default mongoose.model( 
  "KnowledgeDocument", 
  KnowledgeDocumentSchema 
);