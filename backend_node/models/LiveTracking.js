const mongoose = require("mongoose");

const liveTrackingSchema = new mongoose.Schema({
  tracking_id: { type: String, required: true },
  agent_id: { type: String, default: "Rohan Sharma" },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  status: { type: String, default: "In Transit" }, // e.g. "In Transit", "Delivered", "Delayed", "Failed"
  last_updated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("LiveTracking", liveTrackingSchema);
