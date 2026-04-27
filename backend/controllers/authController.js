// ============================================================
// controllers/authController.js — Auth Business Logic
// CONCEPTS: Controller pattern, JWT generation, async/await
// ============================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─── HELPER: sign an access token (short-lived) ────────────────
const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET || "dev_secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  });

// ─── HELPER: sign a refresh token (long-lived) ────────────────
const signRefreshToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || "dev_refresh_secret",
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" },
  );

// ─── HELPER: set refresh token on user & save ──────────────────
const setRefreshToken = async (userId, token) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  user.refreshToken = token;
  await user.save();
};

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

    // Generate both tokens
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Store refresh token in database
    await setRefreshToken(user._id, refreshToken);

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
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

    // Generate both tokens
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Store refresh token in database
    await setRefreshToken(user._id, refreshToken);

    res.json({
      success: true,
      accessToken,
      refreshToken,
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

// ─── REFRESH TOKEN ────────────────────────────────────────────
// POST /api/auth/refresh
// Takes the refresh token from the request body and returns a new access token
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "Refresh token required" });
    }

    // Verify the refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "dev_refresh_secret",
    );

    // Find user and verify the refresh token matches
    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    // Generate new access token
    const newAccessToken = signAccessToken(user._id);

    res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({
          success: false,
          message: "Refresh token expired — please log in again",
        });
    }
    next(err);
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────
// POST /api/auth/logout  (protected)
// Clears the refresh token from the database
const logout = async (req, res, next) => {
  try {
    // req.user is set by the protect middleware
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, refresh, logout };
