import mongoose from "mongoose";

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      index: true
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
      index: true
    },

    settings: {
      timezone: String,
      currency: String,
      locale: String
    },

    subscription: {
      plan: String,
      status: String,
      currentPeriodStart: Date,
      currentPeriodEnd: Date
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Organization", OrganizationSchema);