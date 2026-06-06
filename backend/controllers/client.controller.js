// controllers/client.controller.js
const User = require("../models/User.model");
const path = require("path");
const fs   = require("fs");
const { send: sendMail } = require("../utils/mailer");
const crypto = require("crypto");

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const BACKEND_URL  = process.env.BACKEND_URL  || "http://localhost:5000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

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
    if (firstName !== undefined) data.firstName     = firstName;
    if (lastName  !== undefined) data.lastName      = lastName;
    if (phone     !== undefined) data.phone         = phone;
    if (gender    !== undefined) data.gender        = gender;
    if (birthDate !== undefined) data.birthDate     = birthDate;
    if (parsed    !== undefined) data.clientProfile = parsed;

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

// ── @POST /api/client/send-delete-code ────────────────────
exports.sendDeleteCode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const code = generateCode();
    user.deleteAccountCode       = code;
    user.deleteAccountCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    await sendMail({
      to:      user.email,
      subject: "Suppression de votre compte Servigo",
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;">
          <h2 style="color:#ef4444;">Suppression de compte</h2>
          <p>Bonjour ${user.firstName},</p>
          <p>Vous avez demandé la suppression de votre compte Servigo. Votre code de confirmation :</p>
          <div style="background:#fef2f2;padding:20px;border-radius:8px;text-align:center;margin:20px 0;">
            <h1 style="color:#ef4444;letter-spacing:5px;margin:0;">${code}</h1>
          </div>
          <p style="color:#666;">Ce code expire dans <strong>15 minutes</strong>.</p>
          <p style="color:#dc2626;font-weight:600;">⚠️ Cette action est irréversible. Si vous n'avez pas fait cette demande, sécurisez votre compte immédiatement.</p>
        </div>
      `,
    });

    res.json({ message: "Code envoyé sur votre email" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @DELETE /api/client/account ───────────────────────────
exports.deleteAccount = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Code requis" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.deleteAccountCode || user.deleteAccountCode !== code)
      return res.status(400).json({ message: "Code incorrect" });
    if (!user.deleteAccountCodeExpiry || user.deleteAccountCodeExpiry < new Date())
      return res.status(400).json({ message: "Code expiré. Demandez un nouveau code." });

    user.isActive                = false;
    user.email                   = `deleted_${user._id}_${Date.now()}@deleted.local`;
    user.phone                   = "deleted";
    user.avatar                  = "";
    user.deleteAccountCode       = undefined;
    user.deleteAccountCodeExpiry = undefined;
    user.resetPasswordToken      = undefined;
    user.resetPasswordExpire     = undefined;
    await user.save();

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @POST /api/client/send-email-change-code ──────────────
exports.sendEmailChangeCode = async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail))
      return res.status(400).json({ message: "Email invalide" });

    const existing = await User.findOne({ email: newEmail.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Cet email est déjà utilisé" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const code        = generateCode();
    const cancelToken = crypto.randomBytes(32).toString("hex");
    user.pendingEmail              = newEmail.toLowerCase();
    user.emailChangeCode           = code;
    user.emailChangeCodeExpiry     = new Date(Date.now() + 15 * 60 * 1000);
    user.cancelEmailChangeToken    = cancelToken;
    await user.save();

    const cancelUrl = `${BACKEND_URL}/api/auth/cancel-email-change?token=${cancelToken}`;
    const resetUrl  = `${FRONTEND_URL}`;

    await Promise.all([
      // Code to new email — proves ownership
      sendMail({
        to:      newEmail,
        subject: "Vérification de votre nouvel email Servigo",
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:auto;">
            <h2 style="color:#06b6d4;">Confirmez votre nouvel email</h2>
            <p>Bonjour ${user.firstName},</p>
            <p>Quelqu'un souhaite associer cette adresse à un compte Servigo. Votre code de vérification :</p>
            <div style="background:#f0fdfe;padding:20px;border-radius:8px;text-align:center;margin:20px 0;">
              <h1 style="color:#06b6d4;letter-spacing:5px;margin:0;">${code}</h1>
            </div>
            <p style="color:#666;">Ce code expire dans <strong>15 minutes</strong>.</p>
            <p style="color:#999;font-size:12px;">Si vous n'avez pas demandé ce changement, ignorez cet email.</p>
          </div>
        `,
      }),
      // Alert to old email — warns account owner with action buttons
      sendMail({
        to:      user.email,
        subject: "⚠️ Tentative de changement d'email — Compte Servigo",
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:auto;">
            <h2 style="color:#f59e0b;">Alerte de sécurité</h2>
            <p>Bonjour ${user.firstName},</p>
            <p>Une demande de changement d'adresse email a été initiée sur votre compte Servigo.</p>
            <table style="background:#fff8f0;border:1px solid #fde68a;border-radius:8px;padding:16px;width:100%;margin:16px 0;">
              <tr><td style="font-size:13px;color:#92400e;"><strong>Email actuel :</strong> ${user.email}</td></tr>
              <tr><td style="font-size:13px;color:#92400e;padding-top:6px;"><strong>Nouvel email demandé :</strong> ${newEmail}</td></tr>
            </table>
            <p style="color:#374151;"><strong>C'est bien vous ?</strong> Vous n'avez rien à faire — entrez simplement le code envoyé sur le nouvel email.</p>
            <p style="color:#374151;"><strong>Ce n'est pas vous ?</strong> Agissez immédiatement :</p>
            <div style="margin:20px 0;display:flex;gap:12px;flex-wrap:wrap;">
              <a href="${cancelUrl}" style="display:inline-block;background:#ef4444;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:8px;">
                🚫 Annuler ce changement
              </a>
              <a href="${resetUrl}" style="display:inline-block;background:#0f172e;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:8px;">
                🔑 Réinitialiser mon mot de passe
              </a>
            </div>
            <p style="color:#9ca3af;font-size:12px;">Le lien d'annulation expire dans 15 minutes. Après ce délai, reconnectez-vous et changez votre mot de passe.</p>
          </div>
        `,
      }),
    ]);

    res.json({ message: "Code envoyé sur le nouvel email" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PUT /api/client/email ────────────────────────────────
exports.changeEmail = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Code requis" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.emailChangeCode || user.emailChangeCode !== code)
      return res.status(400).json({ message: "Code incorrect" });
    if (!user.emailChangeCodeExpiry || user.emailChangeCodeExpiry < new Date())
      return res.status(400).json({ message: "Code expiré. Demandez un nouveau code." });
    if (!user.pendingEmail)
      return res.status(400).json({ message: "Aucun email en attente" });

    user.email                  = user.pendingEmail;
    user.pendingEmail           = undefined;
    user.emailChangeCode        = undefined;
    user.emailChangeCodeExpiry  = undefined;
    user.cancelEmailChangeToken = undefined;
    await user.save();

    const updated = await User.findById(req.user.id).select("-password");
    res.json({ message: "Email modifié avec succès", user: updated });
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