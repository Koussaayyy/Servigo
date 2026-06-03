const mongoose = require("mongoose");

const SignalSchema = new mongoose.Schema(
  {
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation", required: true },
    clientId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    workerId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    clientName:    { type: String, default: "" },
    workerName:    { type: String, default: "" },
    serviceType:   { type: String, default: "" },
    reason: {
      type: String,
      enum: ["mauvais_travail", "comportement", "non_venu", "autre"],
      default: "autre",
    },
    message:    { type: String, default: "", trim: true },
    status:     { type: String, enum: ["new", "reviewed", "dismissed"], default: "new" },
    warningApplied: { type: Boolean, default: false },
    adminNotes: { type: String, default: "" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Signal", SignalSchema);
