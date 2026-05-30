const mongoose = require("mongoose");

const otpLogSchema = new mongoose.Schema({
  tracking_id: { type: String, required: true },
  agent_id: { type: String, required: true },
  otp_entered: { type: String, default: "" },
  success: { type: Boolean, default: false },
  is_offline: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("OtpLog", otpLogSchema);
