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

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json([]);
    }
    const db = mongoose.connection.db;
    const users = await db.collection("users").find({}, { projection: { password_hash: 0 } }).toArray();
    return res.status(200).json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/users/status
router.post("/users/status", async (req, res) => {
  try {
    const { email, status } = req.body;
    if (!email || !status) {
      return res.status(400).json({ error: "email and status are required" });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(400).json({ error: "Database offline" });
    }
    const db = mongoose.connection.db;
    const result = await db.collection("users").updateOne(
      { email },
      { $set: { status } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ success: true, message: `User status updated to ${status}` });
  } catch (error) {
    console.error("Error updating user status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/users/:email
router.delete("/users/:email", async (req, res) => {
  try {
    const { email } = req.params;
    if (mongoose.connection.readyState !== 1) {
      return res.status(400).json({ error: "Database offline" });
    }
    const db = mongoose.connection.db;
    const result = await db.collection("users").deleteOne({ email });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/parcels
router.get("/parcels", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json([]);
    }
    const db = mongoose.connection.db;
    const { search, status, delayed } = req.query;
    
    let query = {};
    if (search) {
      query["$or"] = [
        { tracking_id: { $regex: search, $options: "i" } },
        { receiver_name: { $regex: search, $options: "i" } },
        { sender_name: { $regex: search, $options: "i" } }
      ];
    }
    
    if (status) {
      query["manual_stage_override"] = Number(status);
    }
    
    if (delayed === "true") {
      const nowStr = new Date().toISOString().split('T')[0];
      query["$or"] = [
        { manual_stage_override: -1 },
        {
          eta: { $lt: nowStr },
          manual_stage_override: { $ne: 7 }
        }
      ];
    }
    
    const parcels = await db.collection("parcels").find(query).sort({ created_at: -1 }).toArray();
    return res.status(200).json(parcels);
  } catch (error) {
    console.error("Error getting parcels:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/parcels/status
router.post("/parcels/status", async (req, res) => {
  try {
    const { tracking_id, status_text, manual_stage_override, current_location_name } = req.body;
    if (!tracking_id || manual_stage_override === undefined) {
      return res.status(400).json({ error: "tracking_id and manual_stage_override are required" });
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(400).json({ error: "Database offline" });
    }
    const db = mongoose.connection.db;
    const parcel = await db.collection("parcels").findOne({ tracking_id });
    if (!parcel) {
      return res.status(404).json({ error: "Parcel not found" });
    }
    
    const now = new Date();
    const stage = Number(manual_stage_override);
    
    let updateFields = { manual_stage_override: stage };
    if (stage === 7) {
      updateFields.eta = now.toISOString().split('T')[0];
    }
    await db.collection("parcels").updateOne({ tracking_id }, { $set: updateFields });
    
    let progress_percentage = 5;
    if (stage === 7) progress_percentage = 100;
    else if (stage === -1) progress_percentage = 55;
    else if (stage === 6) progress_percentage = 90;
    else if (stage === 2) progress_percentage = 20;
    else if (stage === 3) progress_percentage = 35;
    else if (stage === 4) progress_percentage = 55;
    else if (stage === 5) progress_percentage = 75;
    
    await db.collection("shipment_status").updateOne(
      { tracking_id },
      {
        $set: {
          status: status_text || "Updated by Admin",
          progress_percentage,
          current_location_name: current_location_name || parcel.current_location_name || parcel.source_po || "Sorting Hub",
          last_updated: now
        }
      },
      { upsert: true }
    );
    
    await db.collection("tracking_history").insertOne({
      tracking_id,
      status: status_text || "Updated by Admin",
      timestamp: now,
      location: current_location_name || "Admin Logistics Control Center",
      details: `Shipment status manually updated by Logistics Admin to '${status_text || "Updated"}' (Stage override: ${stage}).`
    });
    
    return res.status(200).json({ success: true, message: "Parcel status updated successfully" });
  } catch (error) {
    console.error("Error updating parcel status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/analytics/stats
router.get("/analytics/stats", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        totalUsers: 0, totalStaff: 0, totalParcels: 0, activeParcels: 0,
        deliveredParcels: 0, delayedParcels: 0, revenue: 0, monthlyTrends: []
      });
    }
    const db = mongoose.connection.db;
    
    const totalUsers = await db.collection("users").countDocuments({ role: "user" });
    const totalStaff = await db.collection("staffs").countDocuments({});
    const totalParcels = await db.collection("parcels").countDocuments({});
    
    const activeParcels = await db.collection("parcels").countDocuments({
      manual_stage_override: { $nin: [7, -1] }
    });
    
    const deliveredParcels = await db.collection("parcels").countDocuments({
      manual_stage_override: 7
    });
    
    const nowStr = new Date().toISOString().split('T')[0];
    const delayedParcels = await db.collection("parcels").countDocuments({
      $or: [
        { manual_stage_override: -1 },
        {
          eta: { $lt: nowStr },
          manual_stage_override: { $ne: 7 }
        }
      ]
    });
    
    const revRes = await db.collection("parcels").aggregate([
      { $group: { _id: null, total: { $sum: "$price_total" } } }
    ]).toArray();
    const revenue = revRes[0]?.total || 0;
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trends = await db.collection("parcels").aggregate([
      {
        $group: {
          _id: { $month: "$created_at" },
          count: { $sum: 1 },
          revenue: { $sum: "$price_total" }
        }
      },
      { $sort: { "_id": 1 } }
    ]).toArray();
    
    const monthlyTrends = trends.map(t => ({
      name: monthNames[t._id - 1] || `Month ${t._id}`,
      parcels: t.count,
      revenue: t.revenue
    }));
    
    if (monthlyTrends.length === 0) {
      monthlyTrends.push(
        { name: "Jan", parcels: 0, revenue: 0 },
        { name: "Feb", parcels: 0, revenue: 0 },
        { name: "Mar", parcels: 0, revenue: 0 },
        { name: "Apr", parcels: 0, revenue: 0 },
        { name: "May", parcels: 0, revenue: 0 },
        { name: "Jun", parcels: totalParcels, revenue: revenue }
      );
    }
    
    return res.status(200).json({
      totalUsers,
      totalStaff,
      totalParcels,
      activeParcels,
      deliveredParcels,
      delayedParcels,
      revenue,
      monthlyTrends
    });
  } catch (error) {
    console.error("Error getting analytics stats:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/ai-monitoring
router.get("/ai-monitoring", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ anomalies: [], fraudAlerts: [], predictions: [], validationLogs: [] });
    }
    const db = mongoose.connection.db;
    
    const anomalies = await db.collection("anomalies").find().sort({ created_at: -1 }).limit(30).toArray();
    const predictions = await db.collection("risk_predictions").find().sort({ created_at: -1 }).limit(30).toArray();
    const validationLogs = await db.collection("otps").find().sort({ verified_at: -1, expiry: -1 }).limit(30).toArray();
    
    const fraudAlerts = await db.collection("anomalies").find({
      anomaly_type: { $in: ["Fraud", "Tampering", "Security"] }
    }).sort({ created_at: -1 }).toArray();
    
    return res.status(200).json({
      anomalies,
      fraudAlerts,
      predictions,
      validationLogs
    });
  } catch (error) {
    console.error("Error fetching AI monitoring data:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/settings
router.get("/settings", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        system_status: "normal", ai_confidence_threshold: 0.8,
        delay_threshold_hours: 24, auto_assign_agents: true, maintenance_mode: false
      });
    }
    const db = mongoose.connection.db;
    const settings = await db.collection("settings").findOne({ settings_id: "global" });
    return res.status(200).json(settings || {});
  } catch (error) {
    console.error("Error getting system settings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/settings
router.post("/settings", async (req, res) => {
  try {
    const { system_status, ai_confidence_threshold, delay_threshold_hours, auto_assign_agents, maintenance_mode } = req.body;
    if (mongoose.connection.readyState !== 1) {
      return res.status(400).json({ error: "Database offline" });
    }
    const db = mongoose.connection.db;
    await db.collection("settings").updateOne(
      { settings_id: "global" },
      {
        $set: {
          system_status: system_status || "normal",
          ai_confidence_threshold: Number(ai_confidence_threshold || 0.8),
          delay_threshold_hours: Number(delay_threshold_hours || 24),
          auto_assign_agents: !!auto_assign_agents,
          maintenance_mode: !!maintenance_mode,
          last_updated: new Date()
        }
      },
      { upsert: true }
    );
    return res.status(200).json({ success: true, message: "System settings updated successfully" });
  } catch (error) {
    console.error("Error saving system settings:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
