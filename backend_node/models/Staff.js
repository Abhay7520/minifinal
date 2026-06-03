const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  staff_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  assigned_zone: { type: String, default: "Central Bangalore" },
  assigned_branch: { type: String, default: "Delhi NCR Hub" },
  status: { type: String, default: "active" }, // e.g. "active", "inactive", "suspended"
  rating: { type: Number, default: 4.8 },
  deliveries_completed: { type: Number, default: 0 },
  deliveries_failed: { type: Number, default: 0 },
  last_active: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Staff", staffSchema);
