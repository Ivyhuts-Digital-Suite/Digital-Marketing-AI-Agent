import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";

dotenv.config();

const app = express();


// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
connectDB();
console.log("SERVER FILE LOADED");
// app.post("/test", (req, res) => {
//   res.json({
//     message: "POST route is working"
//   });
// });

app.post("/test", (req, res) => {
  console.log("🔥 TEST ROUTE HIT");

  res.status(200).json({
    success: true,
    message: "TEST ROUTE FROM MY BACKEND"
  });
});

app.use("/api/auth", authRoutes);

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