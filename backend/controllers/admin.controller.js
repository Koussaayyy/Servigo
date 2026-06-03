const User = require("../models/User.model");
const Reclamation = require("../models/Reclamation.model");
const Reservation = require("../models/Reservation.model");
const Signal = require("../models/Signal.model");

// ── @GET /api/admin/users ──────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });
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

// ── @GET /api/admin/reservations ─────────────────────────
exports.getAllReservations = async (_req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("client", "firstName lastName avatar phone")
      .populate("worker", "firstName lastName avatar workerProfile.city workerProfile.professions")
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @GET /api/admin/notifications ────────────────────────
exports.getAdminNotifications = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id).select("notifications");
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    const sorted = [...(admin.notifications || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PUT /api/admin/notifications/read-all ───────────────
exports.markAdminNotificationsRead = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user.id },
      { $set: { "notifications.$[].read": true } }
    );
    res.json({ message: "All notifications marked as read" });
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

// ── @GET /api/admin/worker-verifications ──────────────────
exports.getWorkerVerifications = async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    const filter = { role: "worker" };
    if (status && status !== "all") {
      filter["workerVerification.status"] = status;
    }

    const workers = await User.find(filter)
      .select("firstName lastName email phone workerProfile.professions workerProfile.city workerVerification createdAt")
      .sort({ "workerVerification.submittedAt": -1, createdAt: -1 });

    res.json(workers);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PATCH /api/admin/worker-verifications/:id/review ─────
exports.reviewWorkerVerification = async (req, res) => {
  try {
    const { status, rejectionReason = "" } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }

    const worker = await User.findById(req.params.id);
    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ message: "Worker not found" });
    }

    worker.workerVerification.status = status;
    worker.workerVerification.reviewedAt = new Date();
    worker.workerVerification.reviewedBy = req.user?.email || "admin";
    worker.workerVerification.rejectionReason = status === "rejected" ? String(rejectionReason || "").trim() : "";

    await worker.save();

    res.json({
      message: `Worker verification ${status}`,
      worker: {
        id: worker._id,
        workerVerification: worker.workerVerification,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @POST /api/admin/migrate-legacy-workers ────────────────
// Auto-verify all old worker accounts that don't have workerVerification field
exports.migrateOldWorkers = async (req, res) => {
  try {
    const result = await User.updateMany(
      {
        role: "worker",
        $or: [
          { workerVerification: { $exists: false } },
          { "workerVerification.status": { $exists: false } }
        ]
      },
      {
        $set: {
          workerVerification: {
            status: "approved",
            submittedAt: new Date(),
            reviewedAt: new Date(),
            reviewedBy: "system-migration",
            cinDocumentUrl: "",
            certificationDocumentUrl: "",
            rejectionReason: ""
          }
        }
      }
    );

    res.json({
      message: "Migration completed",
      modifiedCount: result.modifiedCount,
      details: `${result.modifiedCount} old worker account(s) have been verified`
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @GET /api/admin/signals ───────────────────────────────
exports.getSignals = async (_req, res) => {
  try {
    const signals = await Signal.find()
      .populate("reservationId", "bookingDate bookingHour serviceStartedAt status")
      .populate("clientId", "email firstName lastName")
      .populate("workerId", "email firstName lastName workerStatus warningCount")
      .sort({ createdAt: -1 });
    res.json(signals);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PATCH /api/admin/signals/:id/status ─────────────────
exports.updateSignalStatus = async (req, res) => {
  try {
    const { status, verified = false, adminNotes = "" } = req.body;
    if (!["new", "reviewed", "dismissed"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    const signal = await Signal.findById(req.params.id);
    if (!signal) return res.status(404).json({ message: "Signalement introuvable" });

    // Validate report = add a warning to the worker only once
    if (status === "reviewed" && verified) {
      if (!signal.warningApplied) {
        signal.warningApplied = true;
        const worker = await User.findById(signal.workerId);
        if (worker) {
          worker.warningCount = Number(worker.warningCount || 0) + 1;
          worker.reportHistory.push({
            signalId: signal._id,
            reason: signal.reason,
            verified: true,
            createdAt: new Date(),
          });
          worker.workerWarnings.push({
            signalId: signal._id,
            reason: signal.reason,
            note: adminNotes || "Signalement validé",
            createdAt: new Date(),
          });
          worker.notifications.unshift({
            type: "review",
            title: "Avertissement reçu",
            message: "Vous avez reçu un avertissement suite à un signalement validé par l'administration.",
            reservationId: signal.reservationId,
            read: false,
            createdAt: new Date(),
          });
          await worker.save();
        }
      }
    }

    signal.status = status;
    signal.adminNotes = adminNotes;
    signal.reviewedAt = new Date();
    await signal.save();

    res.json(signal);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @DELETE /api/admin/signals/:id ────────────────────────
exports.deleteSignal = async (req, res) => {
  try {
    const signal = await Signal.findByIdAndDelete(req.params.id);
    if (!signal) return res.status(404).json({ message: "Signalement introuvable" });
    res.json({ message: "Signalement supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PATCH /api/admin/workers/:id/ban ──────────────────────
exports.banWorker = async (req, res) => {
  try {
    const { banReason = "Admin decision" } = req.body;
    const worker = await User.findById(req.params.id);
    
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    if (worker.role !== "worker") return res.status(400).json({ message: "User is not a worker" });

    worker.workerStatus = "suspended";
    worker.bannedAt = new Date();
    worker.banReason = banReason;
    await worker.save();

    res.json({
      message: "Worker banned successfully",
      worker: { id: worker._id, workerStatus: worker.workerStatus, bannedAt: worker.bannedAt },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PATCH /api/admin/workers/:id/warn ─────────────────────
exports.warnWorker = async (req, res) => {
  try {
    const { signalId = "", warningNote = "Admin warning", warningReason = "" } = req.body;
    const worker = await User.findById(req.params.id);

    if (!worker) return res.status(404).json({ message: "Worker not found" });
    if (worker.role !== "worker") return res.status(400).json({ message: "User is not a worker" });

    worker.workerWarnings.push({
      signalId: signalId || undefined,
      reason: warningReason || warningNote,
      note: warningNote,
      createdAt: new Date(),
    });
    await worker.save();

    res.json({
      message: "Worker warned successfully",
      worker: { id: worker._id, warningsCount: worker.workerWarnings.length },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PATCH /api/admin/workers/:id/unban ────────────────────
exports.unbanWorker = async (req, res) => {
  try {
    const worker = await User.findById(req.params.id);
    
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    if (worker.role !== "worker") return res.status(400).json({ message: "User is not a worker" });

    worker.workerStatus = "active";
    worker.bannedAt = null;
    worker.banReason = "";
    await worker.save();

    res.json({
      message: "Worker unbanned successfully",
      worker: { id: worker._id, workerStatus: worker.workerStatus },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PATCH /api/admin/workers/:id/reset-warnings ──────────
exports.resetWorkerWarnings = async (req, res) => {
  try {
    const worker = await User.findById(req.params.id);

    if (!worker) return res.status(404).json({ message: "Worker not found" });
    if (worker.role !== "worker") return res.status(400).json({ message: "User is not a worker" });

    worker.warningCount = 0;
    await worker.save();

    res.json({
      message: "Worker warning counter reset successfully",
      worker: { id: worker._id, warningCount: worker.warningCount },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @GET /api/admin/workers/:id/reports ────────────────────
exports.getWorkerReports = async (req, res) => {
  try {
    const worker = await User.findById(req.params.id);
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentReports = worker.reportHistory.filter(
      (r) => new Date(r.createdAt) > sevenDaysAgo
    );

    res.json({
      workerId: worker._id,
      workerName: `${worker.firstName} ${worker.lastName}`,
      workerStatus: worker.workerStatus,
      bannedAt: worker.bannedAt,
      banReason: worker.banReason,
      totalReports: worker.reportHistory.length,
      recentReportsLast7Days: recentReports.length,
      verifiedReportsLast7Days: recentReports.filter((r) => r.verified).length,
      reportHistory: worker.reportHistory.slice(-20),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
