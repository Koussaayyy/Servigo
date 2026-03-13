const Reservation = require("../models/Reservation.model");
const User = require("../models/User.model");

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
  return date.toISOString().slice(0, 10);
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

    const exists = await Reservation.findOne({
      worker: workerId,
      bookingDate: date,
      bookingHour: hour,
      status: { $in: ACTIVE_STATUSES },
    });

    if (exists) {
      return res.status(409).json({ message: "This slot is already reserved" });
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
      .sort({ bookingDate: 1, bookingHour: 1, createdAt: -1 });

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
      return res.json({ workerId, date, availableHours: [] });
    }

    const scheduleHours = [...BOOKABLE_HOURS];

    if (scheduleHours.length === 0) {
      return res.json({ workerId, date, availableHours: [] });
    }

    const takenReservations = await Reservation.find({
      worker: workerId,
      bookingDate,
      status: { $in: ACTIVE_STATUSES },
    }).select("bookingHour");

    const taken = new Set(takenReservations.map((item) => item.bookingHour));
    let availableHours = scheduleHours.filter((hour) => !taken.has(hour));

    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (bookingDate.getTime() === startOfToday.getTime()) {
      const currentHour = now.getHours();
      availableHours = availableHours.filter((hour) => hour > currentHour);
    }

    return res.json({ workerId, date, availableHours });
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

    const reservations = await Reservation.find({
      worker: workerId,
      bookingDate: { $gte: today, $lte: endDate },
      status: { $in: ACTIVE_STATUSES },
    }).select("bookingDate bookingHour");

    const takenByDate = new Map();
    reservations.forEach((reservation) => {
      const key = toISODateString(reservation.bookingDate);
      if (!takenByDate.has(key)) takenByDate.set(key, new Set());
      takenByDate.get(key).add(reservation.bookingHour);
    });

    const days = [];
    for (let index = 0; index < 30; index += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + index);

      const isoDate = toISODateString(date);
      const scheduleHours = [...BOOKABLE_HOURS];
      const takenSet = takenByDate.get(isoDate) || new Set();

      let availableHours = scheduleHours.filter((hour) => !takenSet.has(hour));

      if (index === 0) {
        const currentHour = new Date().getHours();
        availableHours = availableHours.filter((hour) => hour > currentHour);
      }

      days.push({
        date: isoDate,
        availableHours,
      });
    }

    return res.json({ workerId, days });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
