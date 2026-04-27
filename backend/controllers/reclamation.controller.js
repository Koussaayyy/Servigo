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
