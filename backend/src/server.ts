import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import companyIntelligenceRoutes from "./routes/companyIntelligence.routes";
import contentIntelligenceRoutes from "./routes/contentIntelligence.routes";
import strategyRoutes from "./routes/strategy.routes";
import contentStudioRoutes from "./routes/contentStudio.routes";
import organizationRoutes from "./routes/organization.routes";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serves files written by LocalDiskStorageProvider (see
// services/storage/localDiskStorageProvider.ts) - e.g. Content Studio
// graphics/videos generated via the Gemini media providers. Not used when
// STORAGE_PROVIDER points at a real S3-compatible backend.
app.use("/uploads", express.static(path.resolve(process.env.STORAGE_LOCAL_DIR || "uploads")));

// MongoDB connection
connectDB();
console.log("SERVER FILE LOADED");

app.post("/test", (req, res) => {
  console.log("🔥 TEST ROUTE HIT");

  res.status(200).json({
    success: true,
    message: "TEST ROUTE FROM MY BACKEND"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/company-intelligence", companyIntelligenceRoutes);
app.use("/api/content-intelligence", contentIntelligenceRoutes);
app.use("/api/strategy", strategyRoutes);
app.use("/api/content-studio", contentStudioRoutes);
app.use("/api/organizations", organizationRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Digital Marketing AI Agent Backend is running"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
