const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { predictFailureRisk } = require("../services/aiPredictionService");
const { scanSystemAndGenerateAlerts } = require("../services/alertEngine");

// GET /api/admin/predictions
router.get("/predictions", async (req, res) => {
  try {
    let parcels = [];
    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      parcels = await db.collection("parcels").find({
        manual_stage_override: { $nin: [7, -1] } // active only
      }).toArray();
    }

    const predictions = [];
    for (const p of parcels) {
      const pred = await predictFailureRisk(p);
      predictions.push(pred);
    }

    // Seeding mock fallback predictions if empty
    if (predictions.length === 0) {
      predictions.push(
        {
          tracking_id: "AIP713672",
          customer: "Karan Joshi",
          address: "Plot 8, Sector 22, Noida 201301",
          failure_probability: 72,
          late_delivery_risk: 88,
          route_failure_risk: 80,
          customer_unavailable_risk: 45,
          risk_level: "Critical",
          confidence_percentage: 91,
          top_risk_factors: ["Hazardous weather alert: Dense Fog / Smog in Noida", "Express SLA timeline constraint"],
          weather_impact: "Orange Alert: Low visibility on Noida Expressway."
        },
        {
          tracking_id: "AIP824190",
          customer: "Sneha Patil",
          address: "Flat 402, Shanti Vihar, Pune 411007",
          failure_probability: 32,
          late_delivery_risk: 48,
          route_failure_risk: 40,
          customer_unavailable_risk: 15,
          risk_level: "Medium",
          confidence_percentage: 87,
          top_risk_factors: ["Thunderstorm forecast in Pune"],
          weather_impact: "Severe Thunderstorm Warning: Localized wind gusts."
        }
      );
    }

    return res.status(200).json(predictions);
  } catch (error) {
    console.error("Failure prediction analysis failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/alerts
router.get("/alerts", async (req, res) => {
  try {
    const activeAlerts = await scanSystemAndGenerateAlerts();
    return res.status(200).json(activeAlerts);
  } catch (error) {
    console.error("Alert check failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/heatmap
router.get("/heatmap", async (req, res) => {
  try {
    // delay density hotspots
    const hotspots = [
      { name: "Delhi NCR Corridor", lat: 28.6139, lng: 77.2090, count: 42, delays: 8, severity: "high" },
      { name: "Mumbai Hub Sector 2", lat: 19.0760, lng: 72.8777, count: 35, delays: 12, severity: "high" },
      { name: "Bangalore MG Road Sector", lat: 12.9716, lng: 77.5946, count: 28, delays: 3, severity: "medium" },
      { name: "Chennai Coast Hub", lat: 13.0827, lng: 80.2707, count: 18, delays: 15, severity: "critical" },
      { name: "Pune GPO Area", lat: 18.5204, lng: 73.8567, count: 15, delays: 1, severity: "low" }
    ];
    return res.status(200).json(hotspots);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/parcel/:trackingId
router.get("/parcel/:trackingId", async (req, res) => {
  try {
    const { trackingId } = req.params;
    const db = mongoose.connection.db;
    
    let parcel = null;
    let history = [];
    let status = null;

    if (mongoose.connection.readyState === 1 && db) {
      parcel = await db.collection("parcels").findOne({ tracking_id: trackingId });
      history = await db.collection("tracking_history").find({ tracking_id: trackingId }).sort({ timestamp: 1 }).toArray();
      status = await db.collection("shipment_status").findOne({ tracking_id: trackingId });
    }

    if (!parcel) {
      // Mock tracking fallback if empty
      return res.status(200).json({
        parcel: {
          tracking_id: trackingId,
          receiver_name: "Karan Joshi",
          receiver_phone: "+91 99887 76655",
          destination_address: "Plot 8, Sector 22, Noida 201301",
          parcel_type: "standard",
          weight: 1.2,
          price_total: 185
        },
        status: {
          status: "In Transit",
          progress_percentage: 65,
          current_location_name: "Noida Sorting Hub"
        },
        history: [
          { timestamp: new Date(Date.now() - 3600000 * 5), location: "Pune Hub", status: "Picked Up", details: "Parcel logged at source hub" },
          { timestamp: new Date(Date.now() - 3600000 * 2), location: "In Transit Route", status: "Departed Hub", details: "Dispatched on Mumbai-Noida corridor" },
          { timestamp: new Date(), location: "Noida Hub", status: "Sorting Hub", details: "Arrived at destination post sorting hub" }
        ]
      });
    }

    return res.status(200).json({
      parcel,
      status: status || { status: "Logged", progress_percentage: 10 },
      history
    });
  } catch (error) {
    console.error("Universal search tracking failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/hubs
router.get("/hubs", async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const hubStats = [
      { name: "Delhi NCR Hub", active_load: 312, speed_items_hr: 1200, delayed_parcels: 8, staff_count: 14, efficiency: 94, suggestion: "Shift Pune traffic via alternative bypass route to offset Noida Expressway fog delays." },
      { name: "Mumbai central GPO", active_load: 278, speed_items_hr: 1100, delayed_parcels: 12, staff_count: 12, efficiency: 91, suggestion: "Deploy additional agents to offset delayed slots during monsoon tide surges." },
      { name: "Bangalore GPO", active_load: 195, speed_items_hr: 850, delayed_parcels: 3, staff_count: 8, efficiency: 97, suggestion: "Everything operating at nominal parameters. Maintain current dispatch schedule." },
      { name: "Chennai Main GPO", active_load: 142, speed_items_hr: 600, delayed_parcels: 15, staff_count: 6, efficiency: 84, suggestion: "Critical storm backlog detected. Reroute upcoming parcels through Bangalore GPO." }
    ];

    if (mongoose.connection.readyState === 1 && db) {
      // Dynamically calculate active loads from parcels collection
      for (const h of hubStats) {
        const count = await db.collection("parcels").countDocuments({
          dest_po: h.name,
          manual_stage_override: { $nin: [7, -1] }
        });
        if (count > 0) {
          h.active_load = count;
        }
      }
    }

    return res.status(200).json(hubStats);
  } catch (error) {
    console.error("Hub analytics analysis failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/incidents/resolve
router.post("/incidents/resolve", async (req, res) => {
  try {
    const { incident_id } = req.body;
    if (!incident_id) {
      return res.status(400).json({ error: "incident_id is required" });
    }

    const Incident = mongoose.model("Incident");
    const updated = await Incident.findByIdAndUpdate(incident_id, { details: "RESOLVED. Logistics issue cleared." }, { new: true });
    
    return res.status(200).json({ success: true, message: "Incident resolved successfully", data: updated });
  } catch (error) {
    console.error("Error resolving incident:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
