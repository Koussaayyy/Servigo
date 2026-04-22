const express   = require("express");
const router    = express.Router();
const mongoose  = require("mongoose");
const { protect } = require("../middleware/auth.middleware");
const { uploadAvatar } = require("../middleware/Upload.middleware");

router.put("/complete", protect, uploadAvatar, async (req, res) => {
  try {
    const User = mongoose.model("User");
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { gender, birthDate, governorate, city, address, services, bio } = req.body;

    // Save personal info
    if (gender)    user.gender    = gender;
    if (birthDate) user.birthDate = birthDate;

    // Save profile-specific info
    if (user.role === "client") {
      if (city)    user.clientProfile.city    = city;
      if (address) user.clientProfile.address = address;
      if (bio)     user.clientProfile.bio     = bio;
    }

    if (user.role === "worker") {
      if (city)        user.workerProfile.city = city;
      if (governorate) user.workerProfile.city = governorate; // Use governorate if provided
      if (bio)         user.workerProfile.bio  = bio;
      if (services) {
        const parsed = typeof services === "string" ? JSON.parse(services) : services;
        user.workerProfile.professions = parsed;
      }
    }

    if (req.file) {
      user.avatar = "/" + req.file.path.replace(/\\/g, "/").replace(/^.*uploads\//, "uploads/");
    }

    // Mark onboarding as complete
    user.onboardingComplete = true;
    await user.save();

    // Return updated user data
    const updated = user.toObject();
    delete updated.password;
    
    console.log("✅ Onboarding completed:", { 
      userId: user._id, 
      gender: user.gender, 
      birthDate: user.birthDate,
      onboardingComplete: user.onboardingComplete 
    });

    res.json({ user: updated });
  } catch (err) {
    console.error("❌ Onboarding error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;