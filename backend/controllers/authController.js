// ============================================================
// controllers/authController.js — Auth Business Logic
// CONCEPTS: Controller pattern, JWT generation, async/await
// ============================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─── HELPER: sign a JWT ───────────────────────────────────────
const signToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

// ─── REGISTER ─────────────────────────────────────────────────
// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check for existing user
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }

    // Create user — password hashed via pre-save hook in model
    const user = await User.create({ name, email, password });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        initials: user.initials, // virtual field
      },
    });
  } catch (err) {
    next(err); // passes to global error handler in server.js
  }
};

// ─── LOGIN ────────────────────────────────────────────────────
// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // findByEmail is a static method defined on the User model
    const user = await User.findByEmail(email);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        initials: user.initials,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET PROFILE ──────────────────────────────────────────────
// GET /api/auth/me  (protected)
const getMe = async (req, res) => {
  // req.user is set by the protect middleware
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      initials: req.user.initials,
      createdAt: req.user.createdAt,
    },
  });
};

module.exports = { register, login, getMe };
