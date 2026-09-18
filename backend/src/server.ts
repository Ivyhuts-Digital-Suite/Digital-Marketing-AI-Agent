import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import companyIntelligenceRoutes from "./routes/companyIntelligence.routes";
import contentIntelligenceRoutes from "./routes/contentIntelligence.routes";
import strategyRoutes from "./routes/strategy.routes";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// @ts-ignore - experimentation.routes.js is plain JS/ESM; allowJs is not enabled project-wide (out of scope to change here)
import("./routes/experimentation.routes.js")
  .then((mod) => {
    app.use("/api/experimentation", mod.default);
  })
  .catch((error) => {
    console.error("Failed to load experimentation routes:", error);
  });

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
