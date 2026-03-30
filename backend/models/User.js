// ============================================================
// models/User.js — Mongoose Model
// CONCEPTS: Schema definition, field validation, virtuals,
//           pre-save hooks, instance methods, static methods
// ============================================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ─── SCHEMA ──────────────────────────────────────────────────
// A Schema defines the shape + rules for documents in a collection.
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],   // custom error message
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,          // creates a unique index in MongoDB
      lowercase: true,       // auto-transform before saving
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,         // never return password in queries by default
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],   // only these values allowed
      default: "user",
    },
  },
  {
    // ── Schema Options ──────────────────────────────────────
    timestamps: true,   // auto-add createdAt & updatedAt fields
    toJSON: { virtuals: true },   // include virtuals in JSON output
  }
);

// ─── VIRTUAL FIELD ────────────────────────────────────────────
// Virtuals are computed properties — not stored in MongoDB.
userSchema.virtual("initials").get(function () {
  return this.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
});

// ─── PRE-SAVE HOOK (Middleware) ───────────────────────────────
// Runs before every .save() call. Used to hash passwords.
userSchema.pre("save", async function (next) {
  // Only hash if password field was modified
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12); // cost factor: higher = slower + safer
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err); // pass error to Express error handler
  }
});

// ─── INSTANCE METHOD ──────────────────────────────────────────
// Available on individual document instances (e.g., user.comparePassword(...))
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── STATIC METHOD ────────────────────────────────────────────
// Available on the Model class itself (e.g., User.findByEmail(...))
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select("+password");
};

// ─── MODEL ───────────────────────────────────────────────────
// mongoose.model(name, schema) creates a Model tied to a collection.
// Collection name = lowercase + pluralised → "users"
const User = mongoose.model("User", userSchema);

module.exports = User;
