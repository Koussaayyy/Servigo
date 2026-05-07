const express = require("express");
const router = express.Router();
const { register, login, getMe, googleLogin, forgotPassword, resetPassword, verifyEmail, resendVerificationCode } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/register",              register);
router.post("/login",                 login);
router.post("/google",                googleLogin);
router.post("/verify-email",          verifyEmail);
router.post("/resend-verification",   resendVerificationCode);
router.post("/forgot-password",       forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/me",                     protect, getMe);

module.exports = router;