const express = require("express");
const router = express.Router();
const { chatWithAgent } = require("../controllers/aiController");
const { protect } = require("../middleware/auth");

// Must be authenticated to use AI services
router.use(protect);

router.post("/chat", chatWithAgent);

module.exports = router;
