const mongoose = require("mongoose");

const agentLocationSchema = new mongoose.Schema({
  agent_id: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  speed: { type: Number, default: 0.0 },
  battery_level: { type: Number, default: 100 },
  timestamp: { type: Date, default: Date.now }
});

// Compound index for fast queries by agent and timestamp
agentLocationSchema.index({ agent_id: 1, timestamp: -1 });

module.exports = mongoose.model("AgentLocation", agentLocationSchema);
