const express = require("express");
const router = express.Router();
const { chat } = require("../controllers/chatbot.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/", protect, chat);

module.exports = router;
