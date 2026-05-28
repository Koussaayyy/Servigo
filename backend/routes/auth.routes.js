const express = require("express");
const router = express.Router();
const { register, login, getMe, googleLogin, verifyEmail, resendVerificationCode, forgotPassword, resetPassword } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/register",               register);
router.post("/login",                  login);
router.post("/google",                 googleLogin);
router.get("/me",                      protect, getMe);
router.post("/verify-email",           verifyEmail);
router.post("/resend-verification",    resendVerificationCode);
router.post("/forgot-password",        forgotPassword);
router.post("/reset-password/:token",  resetPassword);

module.exports = router;
