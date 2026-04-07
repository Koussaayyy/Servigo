const express   = require("express");
const router    = express.Router();
const mongoose  = require("mongoose");
const { protect } = require("../middleware/auth.middleware");
const { uploadAvatar } = require("../middleware/Upload.middleware");

router.put("/complete", protect, uploadAvatar, async (req, res) => {
  try {
    const User = mongoose.model("User"); // ← uses already-compiled model, no re-import
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { gender, birthDate, governorate, city, address, services, bio } = req.body;

    if (gender)    user.gender    = gender;
    if (birthDate) user.birthDate = birthDate;

    if (user.role === "client") {
      if (city)    user.clientProfile.city    = city;
      if (address) user.clientProfile.address = address;
      if (bio)     user.clientProfile.bio     = bio;
    }

    if (user.role === "worker") {
      if (governorate) user.workerProfile.city = governorate;
      if (city)        user.workerProfile.city = city;
      if (bio)         user.workerProfile.bio  = bio;
      if (services) {
        const parsed = typeof services === "string" ? JSON.parse(services) : services;
        user.workerProfile.professions = parsed;
      }
    }

  if (req.file) user.avatar = "/" + req.file.path.replace(/\\/g, "/").replace(/^.*uploads\//, "uploads/");

    user.onboardingComplete = true;
    await user.save();

    const updated = user.toObject();
    delete updated.password;
    res.json({ user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;