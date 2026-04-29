const User = require("../models/User.model");
const Reclamation = require("../models/Reclamation.model");

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

    // Reclamation statistics
    const totalReclamations = await Reclamation.countDocuments();
    const newReclamations = await Reclamation.countDocuments({ status: "new" });
    const inProgressReclamations = await Reclamation.countDocuments({ status: "in_progress" });
    const resolvedReclamations = await Reclamation.countDocuments({ status: "resolved" });

    // Category breakdown
    const categoryCounts = await Reclamation.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Priority breakdown
    const priorityCounts = await Reclamation.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Average resolution time (for resolved reclamations)
    const avgResolutionTime = await Reclamation.aggregate([
      { $match: { status: "resolved", resolvedAt: { $ne: null } } },
      {
        $project: {
          resolutionTime: { $subtract: ["$resolvedAt", "$createdAt"] }
        }
      },
      { $group: { _id: null, avgTime: { $avg: "$resolutionTime" } } }
    ]);

    res.json({
      users: { totalUsers, totalClients, totalWorkers, totalAdmins },
      reclamations: {
        total: totalReclamations,
        new: newReclamations,
        inProgress: inProgressReclamations,
        resolved: resolvedReclamations,
      },
      categories: categoryCounts.map(c => ({ category: c._id, count: c.count })),
      priorities: priorityCounts.map(p => ({ priority: p._id, count: p.count })),
      avgResolutionTimeDays: avgResolutionTime[0]
        ? Math.round(avgResolutionTime[0].avgTime / (1000 * 60 * 60 * 24))
        : 0,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @GET /api/admin/reclamations ──────────────────────────
exports.getReclamations = async (_req, res) => {
  try {
    const reclamations = await Reclamation.find().sort({ createdAt: -1 });
    res.json(reclamations);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};