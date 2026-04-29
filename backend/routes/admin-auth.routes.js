// Admin Auth Routes
const express = require("express");
const router = express.Router();
const adminAuthController = require("../controllers/admin-auth.controller");

router.post("/login", adminAuthController.adminLogin);

module.exports = router;
