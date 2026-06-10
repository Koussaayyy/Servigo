const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const GOOGLE_CLIENT_ID = "591875820199-32sm5f83o149gl9er7f1g401n7ot3svb.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "true") === "true";
const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_PASS;
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || "Servigo";
const MAIL_FROM_EMAIL = process.env.MAIL_FROM_EMAIL || SMTP_USER;
const MAIL_FROM = `"${MAIL_FROM_NAME}" <${MAIL_FROM_EMAIL}>`;

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

const sendVerificationCodeEmail = async ({ email, firstName, code }) => {
  const allowDevBypass = process.env.NODE_ENV !== "production" && process.env.ALLOW_DEV_EMAIL_BYPASS === "true";
  try {
    await transporter.sendMail({
      from:    MAIL_FROM,
      to:      email,
      subject: "Verify your Servigo email",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
          <h2 style="color: #06b6d4;">Verify Your Email</h2>
          <p>Hi ${firstName || "there"},</p>
          <p>Welcome to Servigo! Your verification code is:</p>
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #06b6d4; letter-spacing: 5px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #666;">This code expires in 30 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't create this account, ignore this email.</p>
        </div>
      `,
    });
    return { delivered: true, bypassed: false };
  } catch (err) {
    if (err?.responseCode === 535) {
      if (allowDevBypass) {
        console.warn("Email SMTP auth failed (535). Dev bypass enabled; using terminal verification code.");
        console.log(`DEV verification code for ${email}: ${code}`);
        return { delivered: false, bypassed: true };
      }
      throw new Error("Email service auth failed. Check SMTP credentials in backend env.");
    }
    if (allowDevBypass) {
      console.warn("Email send failed. Dev bypass enabled; using terminal verification code.");
      console.log(`DEV verification code for ${email}: ${code}`);
      return { delivered: false, bypassed: true };
    }
    throw err;
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`DEBUG verification code for ${email}: ${code}`);
  }

  return { delivered: true, bypassed: false };
};

// ── Helper: full user object ───────────────────────────────
const fullUser = (user) => ({
  id:                   user._id,
  firstName:            user.firstName,
  lastName:             user.lastName,
  email:                user.email,
  isVerified:           user.isVerified,
  role:                 user.role,
  avatar:               user.avatar,
  phone:                user.phone,
  gender:               user.gender,
  birthDate:            user.birthDate,
  onboardingComplete:   user.onboardingComplete,
  workerVerification:   user.workerVerification,
  clientProfile:        user.clientProfile,
  workerProfile:        user.workerProfile,
});

exports.register = async (req, res) => {
  try {
    console.log("📩 Register called with:", req.body);
    const { firstName, lastName, email, phone, password, role, workerProfile } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "firstName, lastName, email and password are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpire = new Date(Date.now() + 30 * 60 * 1000);

    const exists = await User.findOne({ email });
    if (exists) {
      if (exists.isVerified) {
        return res.status(400).json({ message: "Email already registered" });
      }

      exists.verificationCode = verificationCode;
      exists.verificationCodeExpire = verificationCodeExpire;
      await exists.save();
      const emailResult = await sendVerificationCodeEmail({ email, firstName: exists.firstName, code: verificationCode });

      return res.status(200).json({
        message: "Account already exists but not verified. A new verification code was sent.",
        email,
        user: fullUser(exists),
      });
    }

    const userData = { firstName, lastName, email, phone, password, role: role || "client", verificationCode, verificationCodeExpire, isVerified: false };
    if (role === "worker" && workerProfile) {
      userData.workerProfile = workerProfile;
    }

    const user = await User.create(userData);

    const emailResult = await sendVerificationCodeEmail({ email, firstName, code: verificationCode });

    res.status(201).json({
      message: "Account created. Check your email for verification code.",
      email: email,
      user: fullUser(user),
    });
  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    if (!user.isActive) return res.status(403).json({ message: "Account has been disabled" });

      if (!user.isVerified) return res.status(403).json({ message: "Please verify your email before logging in" });

    res.json({
      message: "Login successful",
      token: generateToken(user._id),
      user: fullUser(user),
    });
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential, role, phone, workerProfile } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, picture } = payload;

    if (!email) return res.status(400).json({ message: "Could not get email from Google" });

    let user = await User.findOne({ email });

    if (!user) {
      if (!role) {
        return res.status(200).json({ needsCompletion: true });
      }

      user = await User.create({
        firstName:  given_name  || "User",
        lastName:   family_name || "",
        email:      email,
        phone:      phone       || "N/A",
        password:   Math.random().toString(36).slice(-10) + "Aa1!",
        role:       role,
        avatar:     picture     || "",
        isVerified: true,
        ...(role === "worker" && workerProfile ? { workerProfile } : {}),
      });
    }

    res.json({
      message: "Google login successful",
      token: generateToken(user._id),
      user: fullUser(user),
    });
  } catch (err) {
    console.error("❌ GOOGLE LOGIN ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found with this email" });

    const resetToken  = crypto.randomBytes(32).toString("hex");
    const resetExpire = Date.now() + 30 * 60 * 1000;

    user.resetPasswordToken  = resetToken;
    user.resetPasswordExpire = resetExpire;
    await user.save();

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    await transporter.sendMail({
      from:    MAIL_FROM,
      to:      email,
      subject: "Reset your Servigo password",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
          <h2 style="color: #e8620a;">Reset your password</h2>
          <p>Hi ${user.firstName},</p>
          <p>You requested to reset your password. Click the button below:</p>
          <a href="${resetUrl}" style="
            display: inline-block; padding: 12px 24px;
            background: #e8620a; color: white;
            text-decoration: none; border-radius: 6px; margin: 16px 0;
          ">Reset Password</a>
          <p style="color: #999;">This link expires in 30 minutes.</p>
          <p style="color: #999;">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    res.json({ message: "Reset link sent to your email!" });
  } catch (err) {
    console.error("❌ FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token }    = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({
      resetPasswordToken:  token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired reset link" });

    user.password            = password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successfully! You can now login." });
  } catch (err) {
    console.error("❌ RESET PASSWORD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Email and code required" });
    }

    const user = await User.findOne({
      email,
      verificationCode: code,
      verificationCodeExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpire = undefined;
    await user.save();

    res.json({
      message: "Email verified successfully",
      token: generateToken(user._id),
      user: fullUser(user),
    });
  } catch (err) {
    console.error("❌ VERIFY EMAIL ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found with this email" });
    if (user.isVerified) return res.status(400).json({ message: "Email is already verified" });

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    user.verificationCodeExpire = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const emailResult = await sendVerificationCodeEmail({
      email: user.email,
      firstName: user.firstName,
      code: verificationCode,
    });

    res.json({
      message: "Verification code resent",
    });
  } catch (err) {
    console.error("❌ RESEND VERIFICATION ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const htmlPage = (title, color, icon, heading, body) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title} — Servigo</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',sans-serif;background:#f1f5f9;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#fff;border-radius:16px;padding:40px 32px;max-width:440px;width:100%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.08)}
    .icon{font-size:48px;margin-bottom:16px}
    h1{font-size:20px;font-weight:700;color:#0f172e;margin-bottom:10px}
    p{font-size:14px;color:#64748b;line-height:1.6;margin-bottom:20px}
    a{display:inline-block;background:${color};color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px}
    a:hover{opacity:.9}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${heading}</h1>
    <p>${body}</p>
    <a href="${FRONTEND_URL}">Retour à Servigo</a>
  </div>
</body>
</html>`;

// ── @GET /api/auth/cancel-email-change?token=xxx ──────────
exports.cancelEmailChange = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(htmlPage(
        "Lien invalide", "#ef4444", "❌",
        "Lien invalide",
        "Ce lien ne contient pas de token valide."
      ));
    }

    const user = await User.findOne({ cancelEmailChangeToken: token });

    if (!user) {
      return res.status(400).send(htmlPage(
        "Lien expiré", "#f59e0b", "⏱️",
        "Lien expiré ou déjà utilisé",
        "Ce lien d'annulation est invalide ou a déjà été utilisé. Si vous pensez que votre compte est compromis, connectez-vous et changez votre mot de passe immédiatement."
      ));
    }

    user.pendingEmail           = undefined;
    user.emailChangeCode        = undefined;
    user.emailChangeCodeExpiry  = undefined;
    user.cancelEmailChangeToken = undefined;
    await user.save();

    return res.send(htmlPage(
      "Changement annulé", "#22c55e", "✅",
      "Changement d'email annulé",
      "Le changement d'adresse email a été bloqué avec succès. Votre compte est sécurisé. Si vous n'êtes pas à l'origine de cette demande, changez votre mot de passe dès maintenant."
    ));
  } catch (err) {
    return res.status(500).send(htmlPage(
      "Erreur", "#ef4444", "⚠️",
      "Une erreur est survenue",
      "Impossible de traiter votre demande. Réessayez ou contactez le support."
    ));
  }
};