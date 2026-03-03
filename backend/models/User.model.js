const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    // ── Common fields ──────────────────────────────────────
    firstName:  { type: String, required: true, trim: true },
    lastName: { type: String, required: false, trim: true, default: "" },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:      { type: String, required: true },
    password:   { type: String, required: true, minlength: 8 },
    role:       { type: String, enum: ["client", "worker", "admin"], default: "client" },
    avatar:     { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    isActive:   { type: Boolean, default: true },

    // ── Reset password ─────────────────────────────────────
    resetPasswordToken:  { type: String },
    resetPasswordExpire: { type: Date },

    // ── Client profile ─────────────────────────────────────
    clientProfile: {
      address:  { type: String, default: "" },
      city:     { type: String, default: "" },
      bio:      { type: String, default: "" },
    },

    // ── Worker (Prestataire) profile ───────────────────────
    workerProfile: {
      professions:  { type: [String], default: [] },
      city:         { type: String, default: "" },
      experience:   { type: String, default: "" },
      bio:          { type: String, default: "" },
      rating:       { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      isAvailable:  { type: Boolean, default: true },
      hourlyRate:   { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// ── Hash password before saving ────────────────────────────
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Compare password method ────────────────────────────────
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);