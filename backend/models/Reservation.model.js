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
    clientReview: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        default: "",
        trim: true,
      },
      reviewedAt: {
        type: Date,
      },
    },
    mediaAttachments: {
      type: [
        {
          url:          { type: String, default: "" },
          originalName: { type: String, default: "" },
          mimeType:     { type: String, default: "" },
          size:         { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    clientSignal: {
      reported:   { type: Boolean, default: false },
      reportedAt: { type: Date },
    },
    autoExpireAt: {
      type: Date,
      index: true,
    },
  },
  { timestamps: true }
);

ReservationSchema.index({ worker: 1, bookingDate: 1, bookingHour: 1 });
ReservationSchema.index({ client: 1, bookingDate: -1, bookingHour: -1 });

// Auto-expire pending reservations after 12 hours
ReservationSchema.pre('save', function(next) {
  if (this.isNew && this.status === 'pending') {
    const now = new Date();
    this.autoExpireAt = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model("Reservation", ReservationSchema);


