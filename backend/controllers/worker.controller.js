// controllers/worker.controller.js
const User = require("../models/User.model");
const path = require("path");
const fs   = require("fs");

// ── @GET /api/worker/profile ───────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PUT /api/worker/profile ───────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, workerProfile } = req.body;

    // workerProfile arrives as JSON string when sent via FormData
    let parsed = workerProfile;
    if (typeof workerProfile === "string") {
      try { parsed = JSON.parse(workerProfile); } catch {}
    }

    const data = {};
    if (firstName)  data.firstName     = firstName;
    if (lastName)   data.lastName      = lastName;
    if (phone)      data.phone         = phone;
    if (parsed)     data.workerProfile = parsed;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: data },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PUT /api/worker/avatar ────────────────────────────────
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Delete old avatar from disk
    const existing = await User.findById(req.user.id).select("avatar");
    if (existing?.avatar?.startsWith("/uploads/")) {
      const oldPath = path.join(__dirname, "..", existing.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    res.json({ message: "Avatar updated", avatar: avatarUrl, user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @DELETE /api/worker/avatar ─────────────────────────────
exports.deleteAvatar = async (req, res) => {
  try {
    const existing = await User.findById(req.user.id).select("avatar");
    if (existing?.avatar?.startsWith("/uploads/")) {
      const oldPath = path.join(__dirname, "..", existing.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: "" },
      { new: true }
    ).select("-password");
    res.json({ message: "Avatar removed", user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PUT /api/worker/password ──────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Both fields are required" });
    if (newPassword.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters" });

    const user    = await User.findById(req.user.id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @DELETE /api/worker/account ───────────────────────────
exports.deleteAccount = async (req, res) => {
  try {
    const { currentPassword } = req.body;
    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.isActive = false;
    user.email = `deleted_${user._id}_${Date.now()}@deleted.local`;
    user.phone = "deleted";
    user.avatar = "";
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @GET /api/worker/all ───────────────────────────────────
exports.getAllWorkers = async (req, res) => {
  try {
    const { profession, city, includeUnavailable } = req.query;
    const filter = { role: "worker", isActive: true };
    if (includeUnavailable !== "1") {
      filter["workerProfile.isAvailable"] = true;
    }
    if (profession) filter["workerProfile.professions"] = { $in: [profession] };
    if (city)       filter["workerProfile.city"] = city;
    const workers = await User.find(filter).select("-password -clientProfile");
    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PUT /api/worker/availability ─────────────────────────
exports.toggleAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.workerProfile.isAvailable = !user.workerProfile.isAvailable;
    await user.save();
    res.json({
      message: `You are now ${user.workerProfile.isAvailable ? "available" : "unavailable"}`,
      isAvailable: user.workerProfile.isAvailable,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @POST /api/worker/portfolio/image ─────────────────────
exports.uploadPortfolioImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const imageUrl = `/uploads/portfolio/${req.file.filename}`;
    return res.json({ message: "Image uploaded", imageUrl });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};