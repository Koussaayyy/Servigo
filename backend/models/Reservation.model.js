const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bookingDate: {
      type: Date,
      required: true,
      index: true,
    },
    bookingHour: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
    serviceType: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

ReservationSchema.index({ worker: 1, bookingDate: 1, bookingHour: 1 });
ReservationSchema.index({ client: 1, bookingDate: -1, bookingHour: -1 });

module.exports = mongoose.model("Reservation", ReservationSchema);
