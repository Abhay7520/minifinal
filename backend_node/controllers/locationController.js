const express = require("express");
const router = express.Router();
const AgentLocation = require("../models/AgentLocation");

// POST /api/location/update
router.post("/update", async (req, res) => {
  try {
    const { agent_id, lat, lng, speed, battery_level } = req.body;
    if (!agent_id || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "agent_id, lat, and lng are required" });
    }

    const newLoc = new AgentLocation({
      agent_id,
      lat: Number(lat),
      lng: Number(lng),
      speed: speed !== undefined ? Number(speed) : 0.0,
      battery_level: battery_level !== undefined ? Number(battery_level) : 100
    });

    await newLoc.save();
    return res.status(200).json({ message: "Location updated successfully", data: newLoc });
  } catch (error) {
    console.error("Error in location update:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/location/live/:agentId
router.get("/live/:agentId", async (req, res) => {
  try {
    const { agentId } = req.params;
    const latest = await AgentLocation.findOne({ agent_id: agentId })
      .sort({ timestamp: -1 });

    if (!latest) {
      return res.status(404).json({ error: "No location records found for agent" });
    }

    return res.status(200).json(latest);
  } catch (error) {
    console.error("Error fetching live location:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
