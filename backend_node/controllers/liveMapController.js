const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const AgentLocation = require("../models/AgentLocation");
const LiveTracking = require("../models/LiveTracking");

// GET /api/admin/live-map
router.get("/live-map", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    
    // 1. Fetch live staff positions from AgentLocation schema
    const staffLocations = await AgentLocation.find().sort({ timestamp: -1 });
    // Filter duplicates to get only the latest coordinate for each agent
    const latestStaff = [];
    const seenAgents = new Set();
    
    for (const loc of staffLocations) {
      if (!seenAgents.has(loc.agent_id)) {
        seenAgents.add(loc.agent_id);
        latestStaff.push({
          id: loc.agent_id,
          lat: loc.lat,
          lng: loc.lng,
          speed: loc.speed,
          battery: loc.battery_level,
          label: `${loc.agent_id} (Active)`,
          status: "agent"
        });
      }
    }

    // Default seed staff if empty
    if (latestStaff.length === 0) {
      latestStaff.push({
        id: "Rohan Sharma",
        lat: 18.5308,
        lng: 73.8474,
        speed: 35,
        battery: 88,
        label: "Rohan Sharma (Active)",
        status: "agent"
      });
    }

    // 2. Fetch all parcels and convert into map markers
    let parcels = [];
    if (mongoose.connection.readyState === 1 && db) {
      parcels = await db.collection("parcels").find().toArray();
    }

    const parcelMarkers = [];
    for (const p of parcels) {
      const override = p.manual_stage_override;
      let status = "moving"; // Orange
      if (override === 7) {
        status = "delivered"; // Green
      } else if (override === -1) {
        status = "delayed"; // Red
      }
      
      parcelMarkers.push({
        id: p.tracking_id || p._id.toString(),
        lat: Number(p.dest_lat || 12.9716),
        lng: Number(p.dest_lng || 77.5946),
        label: `${p.receiver_name || "Customer"} - ${p.destination_address?.split(',')[0]}`,
        status: status
      });
    }

    // Add standard seeding if empty
    if (parcelMarkers.length === 0) {
      parcelMarkers.push(
        { id: "AIP-20260010", lat: 12.9716, lng: 77.5946, label: "Ravi Menon - Bangalore", status: "delivered" },
        { id: "AIP-20260012", lat: 28.5996, lng: 77.3473, label: "Karan Joshi - Noida", status: "moving" },
        { id: "AIP-20260015", lat: 18.5308, lng: 73.8474, label: "Sneha Patil - Pune", status: "delayed" }
      );
    }

    // 3. Delays/Hotspots zones mapping
    const delayedHubs = [
      { id: "Delhi Hub Overload", lat: 28.6139, lng: 77.2090, label: "Delhi sorting GPO operating at 95% capacity", status: "delayed" },
      { id: "Chennai Floods Delay", lat: 13.0827, lng: 80.2707, label: "Chennai transit hub - heavy storm backlog", status: "delayed" }
    ];

    return res.status(200).json({
      staff: latestStaff,
      parcels: parcelMarkers,
      delayed_hubs: delayedHubs,
      center: latestStaff[0] ? [latestStaff[0].lat, latestStaff[0].lng] : [18.5204, 73.8567]
    });
  } catch (error) {
    console.error("Live operations map generator failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
