// ============================================================
// middleware/auth.js — JWT Authentication Middleware
// CONCEPTS: Middleware, JWT verification, protecting routes
// ============================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect — verifies the JWT in the Authorization header.
 * Attach the decoded user to req.user for downstream handlers.
 *
 * Usage:  router.get("/profile", protect, getProfile)
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // JWT is sent as: "Authorization: Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorised — no token" });
    }

    // Verify signature + expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");

    // Attach user document (minus password) to request
    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists" });
    }

    req.user = user;   // downstream routes use req.user
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Token expired — please log in again" });
    }
    return res
      .status(401)
      .json({ success: false, message: "Invalid token" });
  }
};

/**
 * restrictTo — role-based access control.
 * Usage:  router.delete("/user/:id", protect, restrictTo("admin"), deleteUser)
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
