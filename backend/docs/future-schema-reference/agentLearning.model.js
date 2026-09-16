import mongoose from "mongoose"; 
 
const AgentLearningSchema = new mongoose.Schema( 
  { 
    organizationId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Organization", 
      required: true, 
      index: true 
    }, 
 
    companyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Company" 
    }, 
 
    category: { 
      type: String, 
      enum: [ 
        "audience", 
        "content", 
        "channel", 
        "creative", 
        "messaging", 
        "campaign", 
        "conversion", 
        "timing" 
      ] 
    }, 
 
    statement: { 
      type: String, 
      required: true 
    }, 
 
    evidence: [ 
      { 
        type: String, 
        sourceId: mongoose.Schema.Types.ObjectId, 
        value: mongoose.Schema.Types.Mixed 
      } 
    ], 
 
    confidence: Number, 
 
    impact: { 
      metric: String, 
      value: Number, 
      percentageChange: Number 
    }, 
 
    experimentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Experiment" 
    }, 
 
    applicableTo: { 
      personas: [mongoose.Schema.Types.ObjectId], 
      channels: [String], 
      contentTypes: [String], 
      campaigns: [mongoose.Schema.Types.ObjectId] 
    }, 
 
    status: { 
      type: String, 
      enum: ["candidate", "validated", "deprecated"], 
      default: "candidate" 
    } 
  }, 
  { 
    timestamps: true 
  } 
); 
 
export default mongoose.model("AgentLearning", AgentLearningSchema);