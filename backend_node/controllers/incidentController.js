const express = require("express");
const router = express.Router();
const Incident = require("../models/Incident");

// POST /api/incidents/report
router.post("/report", async (req, res) => {
  try {
    const { tracking_id, agent_id, issue_type, details, lat, lng, image_url } = req.body;

    if (!agent_id || !issue_type) {
      return res.status(400).json({ error: "agent_id and issue_type are required" });
    }

    const newIncident = new Incident({
      tracking_id: tracking_id || "",
      agent_id,
      issue_type,
      details: details || "",
      lat: lat !== undefined ? Number(lat) : 0.0,
      lng: lng !== undefined ? Number(lng) : 0.0,
      image_url: image_url || ""
    });

    await newIncident.save();
    return res.status(201).json({ message: "Incident logged successfully", data: newIncident });
  } catch (error) {
    console.error("Error logging incident:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/incidents/active
router.get("/active", async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ timestamp: -1 }).limit(50);
    return res.status(200).json(incidents);
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
