const Reservation = require("../models/Reservation.model");
const User = require("../models/User.model");
const mongoose = require("mongoose");

const ACTIVE_STATUSES = ["pending", "accepted"];
const BOOKABLE_HOURS = [8, 9, 10, 11, 12, 14, 15, 16, 17];
const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function parseDateOnly(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function normalizeHour(value) {
  const hour = Number(value);
  if (!Number.isInteger(hour)) return null;
  if (hour < 0 || hour > 23) return null;
  return hour;
}

function toDateKey(date) {
  const day = date.getDay();
  return DAY_KEYS[day];
}

function toISODateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayRange(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getWorkerScheduleHoursForDate(worker, bookingDate) {
  const isoDate = toISODateString(bookingDate);

  const calendarEntries = Array.isArray(worker.workerProfile?.availabilityCalendar)
    ? worker.workerProfile.availabilityCalendar
    : [];

  const match = calendarEntries.find((item) => item?.date === isoDate);
  if (match) {
    return (match.hours || [])
      .map(Number)
      .filter((hour) => Number.isInteger(hour) && hour >= 0 && hour <= 23)
      .sort((a, b) => a - b);
  }

  const dayKey = toDateKey(bookingDate);
  return (worker.workerProfile?.availabilitySchedule?.[dayKey] || [])
    .map(Number)
    .filter((hour) => Number.isInteger(hour) && hour >= 0 && hour <= 23)
    .sort((a, b) => a - b);
}

async function recalculateWorkerRating(workerId) {
  const objectWorkerId = new mongoose.Types.ObjectId(workerId);
  const [stats] = await Reservation.aggregate([
    {
      $match: {
        worker: objectWorkerId,
        status: "completed",
        "clientReview.rating": { $exists: true },
      },
    },
    {
      $group: {
        _id: "$worker",
        avgRating: { $avg: "$clientReview.rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const rating = Number(stats?.avgRating || 0);
  const totalReviews = Number(stats?.totalReviews || 0);

  await User.findByIdAndUpdate(workerId, {
    $set: {
      "workerProfile.rating": Number(rating.toFixed(1)),
      "workerProfile.totalReviews": totalReviews,
    },
  });
}

exports.createReservation = async (req, res) => {
  try {
    const { workerId, bookingDate, bookingHour, serviceType, address, notes } = req.body;

    const date = parseDateOnly(bookingDate);
    const hour = normalizeHour(bookingHour);

    if (!workerId || !date || hour === null) {
      return res.status(400).json({ message: "workerId, bookingDate (YYYY-MM-DD), bookingHour are required" });
    }

    const worker = await User.findById(workerId).select("role isActive workerProfile");
    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ message: "Worker not found" });
    }

    if (!worker.isActive) {
      return res.status(403).json({ message: "Worker account is not active" });
    }

    if (!worker.workerProfile?.isAvailable) {
      return res.status(400).json({ message: "Worker is currently unavailable" });
    }

    if (!BOOKABLE_HOURS.includes(hour)) {
      return res.status(400).json({ message: "Selected hour is outside business slots" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return res.status(400).json({ message: "Cannot reserve a past date" });
    }

    const now = new Date();
    const isToday = date.getTime() === today.getTime();
    if (isToday && hour <= now.getHours()) {
      return res.status(400).json({ message: "Cannot reserve a past time today" });
    }

    const { start: dayStart, end: dayEnd } = getDayRange(date);

    // Check if slot is already taken by active reservation (pending/accepted)
    const activeExists = await Reservation.findOne({
      worker: workerId,
      bookingDate: { $gte: dayStart, $lte: dayEnd },
      bookingHour: hour,
      status: { $in: ACTIVE_STATUSES },
    });

    if (activeExists) {
      return res.status(409).json({ message: "This slot is already reserved" });
    }

    // Check if THIS CLIENT already has ANY reservation with this worker at this time
    const clientConflict = await Reservation.findOne({
      client: req.user.id,
      worker: workerId,
      bookingDate: { $gte: dayStart, $lte: dayEnd },
      bookingHour: hour,
      status: { $nin: ["cancelled", "rejected"] }, // Exclude cancelled/rejected reservations
    });

    if (clientConflict) {
      return res.status(409).json({ message: "You already have a reservation with this worker at this time" });
    }

    const reservation = await Reservation.create({
      client: req.user.id,
      worker: workerId,
      bookingDate: date,
      bookingHour: hour,
      serviceType: serviceType || "",
      address: address || "",
      notes: notes || "",
    });

    // ── Create notification for worker ─────────────────────
    const clientName = req.user.firstName || "Un client";
    await User.findByIdAndUpdate(
      workerId,
      {
        $push: {
          notifications: {
            type: "reservation",
            title: `Nouvelle réservation de ${clientName}`,
            message: `${clientName} a réservé votre service pour le ${bookingDate} à ${bookingHour}h`,
            reservationId: reservation._id,
            read: false,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );
    console.log("📢 Notification créée pour le prestataire:", workerId);

    const populated = await Reservation.findById(reservation._id)
      .populate("worker", "firstName lastName avatar workerProfile.city workerProfile.professions")
      .populate("client", "firstName lastName avatar");

    return res.status(201).json({ message: "Reservation created", reservation: populated });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getClientReservations = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { client: req.user.id, status: { $in: ["pending", "accepted"] } };
    if (status) filter.status = status;

    const reservations = await Reservation.find(filter)
      .populate("worker", "firstName lastName avatar workerProfile.city workerProfile.professions")
      .sort({ bookingDate: 1, bookingHour: 1, createdAt: -1 });

    return res.json(reservations);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getClientHistory = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reservations = await Reservation.find({
      client: req.user.id,
      $or: [
        { bookingDate: { $lt: today } },
        { status: { $in: ["cancelled", "rejected", "completed"] } },
      ],
    })
      .populate("worker", "firstName lastName avatar workerProfile.city workerProfile.professions")
      .sort({ bookingDate: -1, bookingHour: -1, createdAt: -1 });

    return res.json(reservations);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.cancelClientReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ _id: req.params.id, client: req.user.id });
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (!["pending", "accepted"].includes(reservation.status)) {
      return res.status(400).json({ message: `Cannot cancel reservation in '${reservation.status}' status` });
    }

    if (reservation.status === "accepted" && req.body?.confirmation !== "CLIENT_CONFIRMED") {
      return res.status(400).json({
        message: "Accepted reservations require explicit client confirmation before cancellation",
      });
    }

    reservation.status = "cancelled";
    reservation.cancellationReason = req.body?.reason || "Cancelled by client";
    await reservation.save();

    return res.json({ message: "Reservation cancelled", reservation });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getWorkerReservations = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { worker: req.user.id };
    if (status) filter.status = status;

    const reservations = await Reservation.find(filter)
      .populate("client", "firstName lastName avatar phone")
      .sort({ createdAt: -1, bookingDate: -1, bookingHour: -1 });

    return res.json(reservations);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateWorkerReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !["accepted", "rejected", "completed"].includes(status)) {
      return res.status(400).json({ message: "Status must be one of: accepted, rejected, completed" });
    }

    const reservation = await Reservation.findOne({ _id: req.params.id, worker: req.user.id });
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if ((status === "accepted" || status === "rejected") && reservation.status !== "pending") {
      return res.status(400).json({ message: "Only pending reservations can be accepted/rejected" });
    }

    if (status === "completed" && reservation.status !== "accepted") {
      return res.status(400).json({ message: "Only accepted reservations can be marked completed" });
    }

    reservation.status = status;
    await reservation.save();

    return res.json({ message: `Reservation marked ${status}`, reservation });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.submitClientReview = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ _id: req.params.id, client: req.user.id });
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.status !== "completed") {
      return res.status(400).json({ message: "Only completed reservations can be reviewed" });
    }

    if (reservation.clientReview?.rating) {
      return res.status(400).json({ message: "You already reviewed this reservation" });
    }

    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || "").trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating must be an integer between 1 and 5" });
    }

    reservation.clientReview = {
      rating,
      comment,
      reviewedAt: new Date(),
    };
    await reservation.save();

    await recalculateWorkerRating(reservation.worker);

    return res.json({ message: "Review submitted", reservation });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getWorkerReviews = async (req, res) => {
  try {
    const reviews = await Reservation.find({
      worker: req.user.id,
      status: "completed",
      "clientReview.rating": { $exists: true },
    })
      .populate("client", "firstName lastName avatar")
      .select("bookingDate bookingHour serviceType client clientReview")
      .sort({ "clientReview.reviewedAt": -1, createdAt: -1 });

    return res.json(reviews);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getWorkerAvailableSlots = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { date, serviceType } = req.query;

    const bookingDate = parseDateOnly(date);
    if (!bookingDate) {
      return res.status(400).json({ message: "date query is required in YYYY-MM-DD format" });
    }

    const worker = await User.findById(workerId).select("role isActive workerProfile");
    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ message: "Worker not found" });
    }

    if (!worker.isActive || !worker.workerProfile?.isAvailable) {
      return res.json({ workerId, date, slots: [] });
    }

    const scheduleHours = [...BOOKABLE_HOURS];

    if (scheduleHours.length === 0) {
      return res.json({ workerId, date, slots: [] });
    }

    const { start: dayStart, end: dayEnd } = getDayRange(bookingDate);

    // Get all reservations for this day
    const allReservations = await Reservation.find({
      worker: workerId,
      bookingDate: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ["cancelled", "rejected"] },
    }).select("bookingHour status");

    // Create status map for each hour
    const slotStatuses = {};
    allReservations.forEach((res) => {
      slotStatuses[res.bookingHour] = res.status; // "pending", "accepted", or "completed"
    });

    // Build slots array with status
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const isToday = bookingDate.getTime() === startOfToday.getTime();
    const currentHour = now.getHours();

    let slots = scheduleHours.map((hour) => ({
      hour,
      status: slotStatuses[hour] || (isToday && hour <= currentHour ? "passed" : "available"),
    }));

    return res.json({ workerId, date, slots });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getWorkerMonthlyAvailability = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { serviceType } = req.query;

    const worker = await User.findById(workerId).select("role isActive workerProfile");
    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ message: "Worker not found" });
    }

    if (!worker.isActive || !worker.workerProfile?.isAvailable) {
      return res.json({ workerId, days: [] });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 29);
    endDate.setHours(23, 59, 59, 999);

    const reservations = await Reservation.find({
      worker: workerId,
      bookingDate: { $gte: today, $lte: endDate },
      status: { $nin: ["cancelled", "rejected"] },
    }).select("bookingDate bookingHour status");

    const statusByDateHour = new Map();
    reservations.forEach((reservation) => {
      const key = toISODateString(reservation.bookingDate);
      if (!statusByDateHour.has(key)) statusByDateHour.set(key, new Map());
      statusByDateHour.get(key).set(Number(reservation.bookingHour), reservation.status);
    });

    const days = [];
    for (let index = 0; index < 30; index += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + index);

      const isoDate = toISODateString(date);
      const scheduleHours = [...BOOKABLE_HOURS];
      const dayStatuses = statusByDateHour.get(isoDate) || new Map();

      const isCurrentDay = index === 0;
      const currentHour = new Date().getHours();

      let slots = scheduleHours.map((hour) => ({
        hour,
        status: dayStatuses.get(hour) || (isCurrentDay && hour <= currentHour ? "passed" : "available"),
      }));

      const availableHours = slots
        .filter((slot) => slot.status === "available")
        .map((slot) => slot.hour);

      days.push({
        date: isoDate,
        slots,
        availableHours,
      });
    }

    return res.json({ workerId, days });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
