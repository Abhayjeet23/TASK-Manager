// ============================================================
// routes/auth.js — Authentication Routes
// CONCEPTS: Express Router, route handlers, middleware chaining
// ============================================================

const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { registerRules, loginRules } = require("../middleware/validate");

// Middleware arrays: [validationRules..., validate, controller]
// Each item runs in order before the controller
router.post("/register", registerRules, register);
router.post("/login", loginRules, login);
router.get("/me", protect, getMe);   // protect runs before getMe

module.exports = router;
