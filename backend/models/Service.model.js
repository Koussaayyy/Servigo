const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true, unique: true },
    icon:  { type: String, default: "Briefcase" },
    color: { type: String, default: "#06b6d4" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", ServiceSchema);
