const mongoose = require("mongoose");

const deliveryLogSchema = new mongoose.Schema({
  tracking_id: { type: String, required: true },
  agent_id: { type: String, required: true },
  status: { type: String, required: true }, // e.g. "picked", "out_for_delivery", "delivered", "failed", "reattempt"
  details: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("DeliveryLog", deliveryLogSchema);
