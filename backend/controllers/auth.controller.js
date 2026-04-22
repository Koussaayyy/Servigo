const User = require("../models/User.model");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const GOOGLE_CLIENT_ID = "591875820199-32sm5f83o149gl9er7f1g401n7ot3svb.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ── Helper: full user object ───────────────────────────────
const fullUser = (user) => ({
  id:                   user._id,
  firstName:            user.firstName,
  lastName:             user.lastName,
  email:                user.email,
  role:                 user.role,
  avatar:               user.avatar,
  phone:                user.phone,
  gender:               user.gender,
  birthDate:            user.birthDate,
  onboardingComplete:   user.onboardingComplete,
  clientProfile:        user.clientProfile,
  workerProfile:        user.workerProfile,
});

exports.register = async (req, res) => {
  try {
    console.log("📩 Register called with:", req.body);
    const { firstName, lastName, email, phone, password, role, workerProfile } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const userData = { firstName, lastName, email, phone, password, role: role || "client" };
    if (role === "worker" && workerProfile) {
      userData.workerProfile = workerProfile;
    }

    const user = await User.create(userData);

    res.status(201).json({
      message: "Account created successfully",
      token: generateToken(user._id),
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

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    if (!user.isActive) return res.status(403).json({ message: "Account has been disabled" });

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

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found with this email" });

    const resetToken  = crypto.randomBytes(32).toString("hex");
    const resetExpire = Date.now() + 30 * 60 * 1000;

    user.resetPasswordToken  = resetToken;
    user.resetPasswordExpire = resetExpire;
    await user.save();

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    await transporter.sendMail({
      from:    `"Servigo" <${process.env.GMAIL_USER}>`,
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

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};