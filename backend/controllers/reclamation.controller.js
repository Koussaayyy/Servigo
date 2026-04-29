const Reclamation = require("../models/Reclamation.model");

exports.createReclamation = async (req, res) => {
  try {
    const { name, email, subject = "", message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ message: "name, email and message are required" });
    }

    const reclamation = await Reclamation.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      subject: String(subject || "").trim(),
      message: String(message).trim(),
    });

    return res.status(201).json({
      message: "Reclamation submitted successfully",
      reclamation,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAllReclamations = async (_req, res) => {
  try {
    const reclamations = await Reclamation.find().sort({ createdAt: -1 });
    return res.json(reclamations);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateReclamationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, adminNotes } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Reclamation ID required" });
    }

    if (!status || !["new", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Valid status required: new, in_progress, or resolved" });
    }

    const updateData = { status };
    
    if (priority && ["low", "medium", "high", "urgent"].includes(priority)) {
      updateData.priority = priority;
    }
    
    if (adminNotes !== undefined) {
      updateData.adminNotes = String(adminNotes).trim();
    }

    // Set resolvedAt when status changes to resolved
    if (status === "resolved") {
      updateData.resolvedAt = new Date();
    } else {
      updateData.resolvedAt = null;
    }

    const reclamation = await Reclamation.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!reclamation) {
      return res.status(404).json({ message: "Reclamation not found" });
    }

    return res.json({
      message: "Reclamation updated",
      reclamation,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.deleteReclamation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Reclamation ID required" });
    }

    const reclamation = await Reclamation.findByIdAndDelete(id);

    if (!reclamation) {
      return res.status(404).json({ message: "Reclamation not found" });
    }

    return res.json({ message: "Reclamation deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
