import mongoose from "mongoose";

const ContentCalendarSchema = new mongoose.Schema(
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
      required: true
    },

    name: String,
    startDate: Date,
    endDate: Date,
    timezone: String,

    entries: [
      {
        contentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Content"
        },

        scheduledAt: Date,
        channel: String,

        status: {
          type: String,
          enum: [
            "planned",
            "draft",
            "approved",
            "scheduled",
            "published",
            "failed"
          ]
        },

        notes: String
      }
    ],

    status: {
      type: String,
      enum: ["draft", "active", "completed", "archived"],
      default: "draft"
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "ContentCalendar",
  ContentCalendarSchema
);