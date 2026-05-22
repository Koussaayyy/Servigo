// server.js
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const dotenv   = require("dotenv");
const path     = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

console.log("SMTP host:", process.env.SMTP_HOST || "(missing)");
console.log("SMTP user:", process.env.SMTP_USER || process.env.GMAIL_USER || "(missing)");
console.log("Dev email bypass:", process.env.ALLOW_DEV_EMAIL_BYPASS || "false");

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// ── Serve uploaded files statically ───────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Log every request ──────────────────────────────────────
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log("Body:", req.body);
  next();
});

app.use("/api/auth",         require("./routes/auth.routes"));
app.use("/api/admin-auth",   require("./routes/admin-auth.routes"));
app.use("/api/client",       require("./routes/client.routes"));
app.use("/api/worker",       require("./routes/worker.routes"));
app.use("/api/workers",      require("./routes/workers.routes"));
app.use("/api/admin",        require("./routes/admin.routes"));
app.use("/api/reservations", require("./routes/reservation.routes"));
app.use("/api/onboarding",   require("./routes/onboarding.routes"));  // ← ADDED
app.use("/api/reclamations", require("./routes/reclamation.routes"));

app.get("/", (req, res) => res.json({ message: "Servigo API running ✅" }));

// ── Auto-expire pending reservations every minute ─────────────────
const Reservation = require("./models/Reservation.model");
setInterval(async () => {
  try {
    const now = new Date();
    const result = await Reservation.updateMany(
      {
        status: "pending",
        autoExpireAt: { $lte: now },
      },
      {
        $set: {
          status: "cancelled",
          cancellationReason: "Auto-cancelled: Worker did not accept within 12 hours",
        },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`⏰ Auto-cancelled ${result.modifiedCount} expired reservations`);
    }
  } catch (err) {
    console.error("❌ Auto-expire job error:", err);
  }
}, 60000); // Run every 60 seconds

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT, () =>
      console.log(`✅ Server running on http://localhost:${process.env.PORT}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB error:", err));