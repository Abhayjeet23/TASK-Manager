// ============================================================
// middleware/validate.js — Input Validation Middleware
// CONCEPTS: express-validator, validation chains, error handling
// ============================================================

const { validationResult, body } = require("express-validator");

/**
 * validate — reads validation errors set by express-validator chains
 * and returns a 422 if any exist. Place AFTER validation rules.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── VALIDATION RULE SETS ─────────────────────────────────────
// Each array is a middleware chain: [rule1, rule2, ..., validate]

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required")
    .isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  validate,
];

const loginRules = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

const taskRules = [
  body("title").trim().notEmpty().withMessage("Title is required")
    .isLength({ max: 100 }).withMessage("Title too long"),
  body("status")
    .optional()
    .isIn(["todo", "in-progress", "done"]).withMessage("Invalid status"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high"]).withMessage("Invalid priority"),
  body("dueDate").optional().isISO8601().withMessage("Invalid date format"),
  validate,
];

module.exports = { validate, registerRules, loginRules, taskRules };
