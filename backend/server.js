// ============================================================
// server.js — Express Entry Point
// CONCEPTS: Express setup, middleware chain, MongoDB connection,
//           environment variables, error handling
// ============================================================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load .env variables into process.env
dotenv.config();

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────
// Middleware runs on EVERY request in the order it's registered.

// 1. Parse incoming JSON bodies  →  req.body
app.use(express.json());

// 2. Allow cross-origin requests (React dev server on :3000 → API on :5000)
const cors = require("cors");

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// 3. Simple request logger (custom middleware)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next(); // IMPORTANT: always call next() to pass control forward
});

// ─── ROUTES ──────────────────────────────────────────────────
// Each router handles a specific resource / domain.

app.use("/api/auth", require("./routes/auth"));
app.use("/api/tasks", require("./routes/tasks"));

// Health-check route
app.get("/", (_req, res) => res.json({ message: "MERN API is running 🚀" }));

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────
// Express recognises a 4-argument middleware as an error handler.
// Call  next(error)  from any route to land here.
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ─── DATABASE CONNECTION ──────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/mern_taskmanager";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // Exit process on DB failure
  });

module.exports = app; // exported for testing
