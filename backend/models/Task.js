// ============================================================
// models/Task.js — Mongoose Model
// CONCEPTS: References (populate), enum, indexes, query helpers
// ============================================================

const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
    },
    tags: [String],   // Array of strings

    // ── Reference to User ─────────────────────────────────────
    // Stores only the ObjectId; use .populate("owner") to fetch full user doc.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",           // points to the "User" model
      required: true,
    },
  },
  { timestamps: true }
);

// ─── INDEXES ─────────────────────────────────────────────────
// Compound index: queries filtering by owner + status will be fast.
taskSchema.index({ owner: 1, status: 1 });
taskSchema.index({ owner: 1, createdAt: -1 }); // latest-first queries

// ─── QUERY HELPER ─────────────────────────────────────────────
// Chainable helper: Task.find().byOwner(userId)
taskSchema.query.byOwner = function (userId) {
  return this.where({ owner: userId });
};

// ─── VIRTUAL: isOverdue ───────────────────────────────────────
taskSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate || this.status === "done") return false;
  return new Date() > this.dueDate;
});

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
