// ============================================================
// routes/auth.js — Authentication Routes
// CONCEPTS: Express Router, route handlers, middleware chaining
// ============================================================

const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  refresh,
  logout,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { registerRules, loginRules } = require("../middleware/validate");

// Middleware arrays: [validationRules..., validate, controller]
// Each item runs in order before the controller
router.post("/register", registerRules, register);
router.post("/login", loginRules, login);
router.post("/refresh", refresh); // refresh endpoint is PUBLIC
router.get("/me", protect, getMe); // protect runs before getMe
router.post("/logout", protect, logout); // logout endpoint requires auth

module.exports = router;
