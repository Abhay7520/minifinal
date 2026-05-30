const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
  tracking_id: { type: String, default: "" },
  agent_id: { type: String, required: true },
  issue_type: { type: String, required: true }, // e.g. vehicle issue, accident, conflict, unreachable
  details: { type: String, default: "" },
  lat: { type: Number, default: 0.0 },
  lng: { type: Number, default: 0.0 },
  image_url: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Incident", incidentSchema);
