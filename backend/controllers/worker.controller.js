// controllers/worker.controller.js
const User = require("../models/User.model");
const path = require("path");
const fs   = require("fs");

const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pushNotification = async (userId, { type, title, message }) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: { notifications: { type, title, message, createdAt: new Date(), read: false } },
    });
  } catch {}
};

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
    const { firstName, lastName, phone, gender, birthDate, workerProfile } = req.body;

    // workerProfile arrives as JSON string when sent via FormData
    let parsed = workerProfile;
    if (typeof workerProfile === "string") {
      try { parsed = JSON.parse(workerProfile); } catch {}
    }

    const data = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName  !== undefined) data.lastName  = lastName;
    if (phone     !== undefined) data.phone     = phone;
    if (gender    !== undefined) data.gender    = gender;
    if (birthDate !== undefined) data.birthDate = birthDate;

    // Use dot-notation to avoid wiping portfolio/schedule/etc.
    if (parsed) {
      const allowed = ["city","experience","bio","hourlyRate","professions","isAvailable","availabilitySchedule","availabilityCalendar"];
      for (const [key, val] of Object.entries(parsed)) {
        if (allowed.includes(key)) data[`workerProfile.${key}`] = val;
      }
    }

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
exports.getWorkerById = async (req, res) => {
  try {
    const worker = await User.findOne({ _id: req.params.workerId, role: "worker", isActive: true })
      .select("-password -clientProfile");
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    res.json(worker);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAllWorkers = async (req, res) => {
  try {
    const { profession, city, includeUnavailable } = req.query;
    
    // IMPORTANT: Only show workers that have been verified by admin
    // They must have CIN and profession documents approved
    const filter = {
      role: "worker",
      isActive: true,
      "workerVerification.status": "approved", // ← ONLY APPROVED WORKERS
    };
    
    if (includeUnavailable !== "1") {
      filter["workerProfile.isAvailable"] = true;
    }
    
    // Only filter by city from backend; let frontend handle profession filtering
    if (city) {
      filter["workerProfile.city"] = { $regex: `^${escapeRegex(city)}$`, $options: "i" };
    }
    
    console.log("🔍 Fetching workers with filter:", JSON.stringify(filter));
    const workers = await User.find(filter).select("-password -clientProfile");
    console.log(`✅ Query returned ${workers.length} workers with status='approved'`);
    
    // Log details about returned workers
    workers.forEach((w, i) => {
      console.log(`  [${i+1}] ${w.firstName} ${w.lastName} - Status: ${w.workerVerification?.status}, Profession: ${w.workerProfile?.professions?.join(", ")}`);
    });
    
    // Extra safety check: verify all returned workers actually have approved status
    const validWorkers = workers.filter(w => w.workerVerification?.status === "approved");
    console.log(`✅ After verification check: ${validWorkers.length} valid approved workers`);
    
    if (workers.length !== validWorkers.length) {
      console.warn(`⚠️ WARNING: ${workers.length - validWorkers.length} workers filtered out by verification check!`);
    }
    
    res.json(validWorkers);
  } catch (err) {
    console.error("❌ getAllWorkers error:", err);
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
    console.log("📤 Portfolio upload attempt from user:", req.user?._id);
    if (!req.file) {
      console.warn("⚠️ No file provided");
      return res.status(400).json({ message: "No file uploaded" });
    }
    const imageUrl = `/uploads/portfolio/${req.file.filename}`;
    console.log("✅ Portfolio image uploaded:", imageUrl);
    return res.json({ message: "Image uploaded", imageUrl });
  } catch (err) {
    console.error("❌ Portfolio upload error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @GET /api/worker/notifications ────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("notifications");
    const notifications = (user?.notifications || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const unreadCount = notifications.filter(n => !n.read).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PUT /api/worker/notifications/:notificationId/read ───
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { "notifications.$[elem].read": true } },
      { arrayFilters: [{ "elem._id": notificationId }], new: true }
    ).select("notifications");
    res.json({ message: "Notification marked as read", notifications: user?.notifications || [] });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PUT /api/worker/notifications/read-all ───────────────
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("notifications");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.notifications = (user.notifications || []).map((item) => ({
      ...item.toObject(),
      read: true,
    }));

    await user.save();
    return res.json({ message: "All notifications marked as read", notifications: user.notifications });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @POST /api/workers/:workerId/portfolio/:itemId/review ──
exports.submitPortfolioReview = async (req, res) => {
  try {
    const { workerId, itemId } = req.params;
    const ratingNum = Number(req.body.rating);
    const comment   = String(req.body.comment || "").trim().slice(0, 500);

    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "La note doit être entre 1 et 5" });
    }

    if (String(req.user._id) === String(workerId)) {
      return res.status(403).json({ message: "Vous ne pouvez pas évaluer votre propre portfolio" });
    }

    const worker = await User.findById(workerId);
    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ message: "Prestataire introuvable" });
    }

    const item = worker.workerProfile.portfolio.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Réalisation introuvable" });
    }

    const reviewerName = `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() || "Anonyme";
    const existing = item.reviews.find((r) => String(r.clientId) === String(req.user._id));
    const isUpdate = !!existing;

    if (existing) {
      existing.rating  = ratingNum;
      existing.comment = comment;
    } else {
      item.reviews.push({ clientId: req.user._id, clientName: reviewerName, rating: ratingNum, comment, createdAt: new Date() });
    }

    await worker.save();

    // Notify the worker
    const stars = "★".repeat(ratingNum) + "☆".repeat(5 - ratingNum);
    await User.findByIdAndUpdate(workerId, {
      $push: {
        notifications: {
          type: "review",
          title: isUpdate ? `Avis modifié par ${reviewerName}` : `Nouvel avis de ${reviewerName}`,
          message: `${stars} sur « ${item.title || "une réalisation"} »${comment ? ` — "${comment.slice(0, 80)}${comment.length > 80 ? "…" : ""}"` : ""}`,
          read: false,
          createdAt: new Date(),
        },
      },
    });

    return res.json({ message: "Avis enregistré", portfolio: worker.workerProfile.portfolio });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @POST /api/worker/portfolio ──────────────────────────
exports.createPortfolioItem = async (req, res) => {
  try {
    const { title, description, city, governorate, exactLocation } = req.body;
    const newImages = (req.files || []).map(f => `/uploads/portfolio/${f.filename}`);
    const imageUrl  = newImages[0] || "";
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { "workerProfile.portfolio": {
        title:         title         || "",
        description:   description   || "",
        city:          city          || "",
        governorate:   governorate   || "",
        exactLocation: exactLocation || "",
        imageUrl,
        images: newImages,
      }}},
      { new: true }
    ).select("-password");
    res.json({ message: "Réalisation ajoutée", portfolio: user.workerProfile.portfolio });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @PUT /api/worker/portfolio/:itemId ───────────────────
exports.updatePortfolioItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { title, description, city, governorate, exactLocation } = req.body;

    // existingImages = server paths the client wants to keep
    let existingImages = req.body.existingImages || [];
    if (typeof existingImages === "string") existingImages = [existingImages];

    const user = await User.findById(req.user.id);
    const item = user.workerProfile.portfolio.id(itemId);
    if (!item) return res.status(404).json({ message: "Réalisation introuvable" });

    if (title         !== undefined) item.title         = title;
    if (description   !== undefined) item.description   = description;
    if (city          !== undefined) item.city          = city;
    if (governorate   !== undefined) item.governorate   = governorate;
    if (exactLocation !== undefined) item.exactLocation = exactLocation;

    const newImages = (req.files || []).map(f => `/uploads/portfolio/${f.filename}`);
    item.images   = [...existingImages, ...newImages];
    item.imageUrl = item.images[0] || "";

    await user.save();
    res.json({ message: "Réalisation mise à jour", portfolio: user.workerProfile.portfolio });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @DELETE /api/worker/portfolio/:itemId ────────────────
exports.deletePortfolioItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const user = await User.findById(req.user.id);
    const item = user.workerProfile.portfolio.id(itemId);
    if (!item) return res.status(404).json({ message: "Réalisation introuvable" });
    if (item.imageUrl?.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", item.imageUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    item.deleteOne();
    await user.save();
    res.json({ message: "Réalisation supprimée", portfolio: user.workerProfile.portfolio });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @DELETE /api/worker/portfolio/:itemId/review/:reviewId
exports.deletePortfolioReview = async (req, res) => {
  try {
    const { itemId, reviewId } = req.params;
    const user = await User.findById(req.user.id);
    const item = user.workerProfile.portfolio.id(itemId);
    if (!item) return res.status(404).json({ message: "Réalisation introuvable" });
    const review = item.reviews.id(reviewId);
    if (!review) return res.status(404).json({ message: "Avis introuvable" });
    review.deleteOne();
    await user.save();
    res.json({ message: "Avis supprimé", portfolio: user.workerProfile.portfolio });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @POST /api/workers/:workerId/portfolio/:itemId/like ──
exports.togglePortfolioLike = async (req, res) => {
  try {
    const { workerId, itemId } = req.params;
    const worker = await User.findById(workerId);
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    const item = worker.workerProfile.portfolio.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    const userId = String(req.user._id);
    const existing = item.likes.find((l) => String(l.userId) === userId);
    if (existing) {
      item.likes = item.likes.filter((l) => String(l.userId) !== userId);
    } else {
      item.likes.push({ userId: req.user._id, firstName: req.user.firstName || "", lastName: req.user.lastName || "" });
      // Notify worker — don't notify self-like
      if (String(workerId) !== userId) {
        const liker = `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() || "Quelqu'un";
        await pushNotification(workerId, {
          type: "like",
          title: "Nouveau j'aime ❤️",
          message: `${liker} a aimé votre réalisation « ${item.title || "sans titre"} »`,
        });
      }
    }
    await worker.save();
    res.json({ likes: item.likes });
  } catch (err) { res.status(500).json({ message: "Server error", error: err.message }); }
};

// ── @POST /api/workers/:workerId/portfolio/:itemId/comment ─
exports.addPortfolioComment = async (req, res) => {
  try {
    const { workerId, itemId } = req.params;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Commentaire vide" });
    const worker = await User.findById(workerId);
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    const item = worker.workerProfile.portfolio.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    const userId = String(req.user._id);
    const existing = item.comments.find((c) => String(c.userId) === userId);
    if (existing) return res.status(400).json({ message: "Vous avez déjà commenté cette réalisation" });
    item.comments.push({ userId: req.user._id, firstName: req.user.firstName || "", lastName: req.user.lastName || "", avatar: req.user.avatar || "", text: text.trim(), createdAt: new Date() });
    await worker.save();
    // Notify worker — don't notify if commenting on own post
    if (String(workerId) !== userId) {
      const commenter = `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() || "Quelqu'un";
      await pushNotification(workerId, {
        type: "comment",
        title: "Nouveau commentaire 💬",
        message: `${commenter} a commenté votre réalisation « ${item.title || "sans titre"} » : "${text.trim().slice(0, 60)}${text.trim().length > 60 ? "…" : ""}"`,
      });
    }
    res.json({ comments: item.comments });
  } catch (err) { res.status(500).json({ message: "Server error", error: err.message }); }
};

// ── @PUT /api/workers/:workerId/portfolio/:itemId/comment/:commentId ─
exports.editPortfolioComment = async (req, res) => {
  try {
    const { workerId, itemId, commentId } = req.params;
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Commentaire vide" });
    const worker = await User.findById(workerId);
    const item = worker?.workerProfile?.portfolio?.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    const comment = item.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Commentaire introuvable" });
    if (String(comment.userId) !== String(req.user._id)) return res.status(403).json({ message: "Non autorisé" });
    comment.text = text.trim();
    await worker.save();
    res.json({ comments: item.comments });
  } catch (err) { res.status(500).json({ message: "Server error", error: err.message }); }
};

// ── @DELETE /api/workers/:workerId/portfolio/:itemId/comment/:commentId ─
exports.deletePortfolioComment = async (req, res) => {
  try {
    const { workerId, itemId, commentId } = req.params;
    const worker = await User.findById(workerId);
    const item = worker?.workerProfile?.portfolio?.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    const comment = item.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Commentaire introuvable" });
    const isOwner = String(req.user._id) === String(workerId);
    const isAuthor = String(comment.userId) === String(req.user._id);
    if (!isOwner && !isAuthor) return res.status(403).json({ message: "Non autorisé" });
    comment.deleteOne();
    await worker.save();
    res.json({ comments: item.comments });
  } catch (err) { res.status(500).json({ message: "Server error", error: err.message }); }
};

// ── @POST /api/workers/:workerId/portfolio/:itemId/comment/:commentId/like ─
exports.toggleCommentLike = async (req, res) => {
  try {
    const { workerId, itemId, commentId } = req.params;
    const worker = await User.findById(workerId);
    const item = worker?.workerProfile?.portfolio?.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    const comment = item.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Commentaire introuvable" });
    const userId = req.user._id;
    const liked = comment.likes.some((l) => String(l) === String(userId));
    if (liked) {
      comment.likes = comment.likes.filter((l) => String(l) !== String(userId));
    } else {
      comment.likes.push(userId);
      // Notify the comment author — don't notify if liking own comment
      if (String(comment.userId) !== String(userId)) {
        const liker = `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() || "Quelqu'un";
        await pushNotification(comment.userId, {
          type: "like",
          title: "Votre commentaire a été aimé ❤️",
          message: `${liker} a aimé votre commentaire : "${comment.text.slice(0, 60)}${comment.text.length > 60 ? "…" : ""}"`,
        });
      }
    }
    await worker.save();
    res.json({ likes: comment.likes });
  } catch (err) { res.status(500).json({ message: "Server error", error: err.message }); }
};

// ── @PUT /api/worker/schedule ────────────────────────────
const VALID_SLOT_HOURS = [8, 10, 12, 14, 16];

exports.updateSchedule = async (req, res) => {
  try {
    const { availabilitySchedule } = req.body;
    // Strip any non-valid slot hours before saving
    const clean = {};
    for (const [day, hours] of Object.entries(availabilitySchedule || {})) {
      clean[day] = (Array.isArray(hours) ? hours : [])
        .map(Number)
        .filter(h => VALID_SLOT_HOURS.includes(h));
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { "workerProfile.availabilitySchedule": clean } },
      { new: true }
    ).select("-password");
    res.json({ message: "Planning mis à jour", availabilitySchedule: user.workerProfile.availabilitySchedule });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ── @POST /api/worker/services ───────────────────────────
exports.addService = async (req, res) => {
  try {
    const { name, description, price, duration } = req.body;
    if (!name || price === undefined) return res.status(400).json({ message: "Nom et prix requis" });
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { "workerProfile.services": { name, description: description || "", price: Number(price), duration: Number(duration) || 0 } } },
      { new: true }
    ).select("-password");
    const services = user.workerProfile.services;
    res.json({ message: "Service ajouté", service: services[services.length - 1], services });
  } catch (err) { res.status(500).json({ message: "Server error", error: err.message }); }
};

// ── @PUT /api/worker/services/:serviceId ─────────────────
exports.updateService = async (req, res) => {
  try {
    const { name, description, price, duration } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.user.id, "workerProfile.services._id": req.params.serviceId },
      {
        $set: {
          "workerProfile.services.$.name":        name,
          "workerProfile.services.$.description": description || "",
          "workerProfile.services.$.price":       Number(price),
          "workerProfile.services.$.duration":    Number(duration) || 0,
        },
      },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "Service introuvable" });
    res.json({ message: "Service mis à jour", services: user.workerProfile.services });
  } catch (err) { res.status(500).json({ message: "Server error", error: err.message }); }
};

// ── @DELETE /api/worker/services/:serviceId ──────────────
exports.deleteService = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { "workerProfile.services": { _id: req.params.serviceId } } },
      { new: true }
    ).select("-password");
    res.json({ message: "Service supprimé", services: user.workerProfile.services });
  } catch (err) { res.status(500).json({ message: "Server error", error: err.message }); }
};
