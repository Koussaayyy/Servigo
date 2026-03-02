const User = require("../models/User.model");

// ── @GET /api/admin/users ──────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PUT /api/admin/users/:id/toggle ──────────────────────
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? "activated" : "deactivated"}`,
      user: { id: user._id, isActive: user.isActive },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @DELETE /api/admin/users/:id ──────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @GET /api/admin/stats ──────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const totalClients = await User.countDocuments({ role: "client" });
    const totalWorkers = await User.countDocuments({ role: "worker" });
    const totalAdmins  = await User.countDocuments({ role: "admin" });
    const totalUsers   = totalClients + totalWorkers + totalAdmins;

    res.json({ totalUsers, totalClients, totalWorkers, totalAdmins });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};