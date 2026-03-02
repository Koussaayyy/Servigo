const User = require("../models/User.model");
const jwt = require("jsonwebtoken");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

exports.register = async (req, res) => {
  try {
    console.log("📩 Register called with:", req.body);

    const { firstName, lastName, email, phone, password, role, workerProfile } = req.body;

    const exists = await User.findOne({ email });
    console.log("👤 User exists?", exists ? "YES" : "NO");

    if (exists) return res.status(400).json({ message: "Email already registered" });

    const userData = { firstName, lastName, email, phone, password, role: role || "client" };

    if (role === "worker" && workerProfile) {
      userData.workerProfile = workerProfile;
    }

    console.log("💾 Creating user...");
    const user = await User.create(userData);
    console.log("✅ User created:", user._id);

    res.status(201).json({
      message: "Account created successfully",
      token: generateToken(user._id),
      user: {
        id:        user._id,
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
        role:      user.role,
      },
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
      user: {
        id:        user._id,
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
        role:      user.role,
        avatar:    user.avatar,
      },
    });
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
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