// controllers/client.controller.js
const User = require("../models/User.model");
const path = require("path");
const fs   = require("fs");

// ── @GET /api/client/profile ───────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PUT /api/client/profile ───────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, gender, birthDate, clientProfile } = req.body;

    let parsed = clientProfile;
    if (typeof clientProfile === "string") {
      try { parsed = JSON.parse(clientProfile); } catch {}
    }

    const data = {};
    if (firstName) data.firstName     = firstName;
    if (lastName)  data.lastName      = lastName;
    if (phone)     data.phone         = phone;
    if (gender)    data.gender        = gender;
    if (birthDate) data.birthDate     = birthDate;
    if (parsed)    data.clientProfile = parsed;

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

// ── @PUT /api/client/avatar ────────────────────────────────
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

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

// ── @DELETE /api/client/avatar ─────────────────────────────
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

// ── @PUT /api/client/password ──────────────────────────────
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

// ── @DELETE /api/client/account ───────────────────────────
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

// ── @GET /api/client/notifications ────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("notifications");
    const notifications = (user?.notifications || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const unreadCount = notifications.filter((n) => !n.read).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PUT /api/client/notifications/:notificationId/read ───
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { "notifications.$[elem].read": true } },
      { arrayFilters: [{ "elem._id": notificationId }], new: true }
    ).select("notifications");
    res.json({ notifications: user?.notifications || [] });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PUT /api/client/notifications/read-all ───────────────
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("notifications");
    if (!user) return res.status(404).json({ message: "User not found" });
    user.notifications = (user.notifications || []).map((n) => ({ ...n.toObject(), read: true }));
    await user.save();
    res.json({ notifications: user.notifications });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @GET /api/client/saved-workers ────────────────────────
exports.getSavedWorkers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("savedWorkers", "firstName lastName avatar role workerProfile")
      .select("savedWorkers");
    res.json(user.savedWorkers || []);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @POST /api/client/saved-workers/:workerId ─────────────
exports.saveWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    const worker = await User.findById(workerId).select("role isActive");
    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ message: "Worker not found" });
    }
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { savedWorkers: workerId },
    });
    res.json({ message: "Worker saved" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @DELETE /api/client/saved-workers/:workerId ───────────
exports.unsaveWorker = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { savedWorkers: req.params.workerId },
    });
    res.json({ message: "Worker removed from saved" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};