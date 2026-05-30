const mongoose = require("mongoose");

const voiceLogSchema = new mongoose.Schema({
  agent_id: { type: String, required: true },
  command: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  success: { type: Boolean, default: true }
});

module.exports = mongoose.model("VoiceLog", voiceLogSchema);
