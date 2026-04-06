// server.js
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const dotenv   = require("dotenv");
const path     = require("path");

dotenv.config();

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
app.use("/api/client",       require("./routes/client.routes"));
app.use("/api/worker",       require("./routes/worker.routes"));
app.use("/api/admin",        require("./routes/admin.routes"));
app.use("/api/reservations", require("./routes/reservation.routes"));
app.use("/api/onboarding",   require("./routes/onboarding.routes"));  // ← ADDED

app.get("/", (req, res) => res.json({ message: "Servigo API running ✅" }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(process.env.PORT, () =>
      console.log(`✅ Server running on http://localhost:${process.env.PORT}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB error:", err));