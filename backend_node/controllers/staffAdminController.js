const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Staff = require("../models/Staff");

// GET /api/admin/staff
router.get("/", async (req, res) => {
  try {
    let staffList = await Staff.find();
    
    // Seed initial staff list if database is empty
    if (staffList.length === 0) {
      const defaultStaff = [
        { staff_id: "ST-01", name: "Rahul Sharma", email: "rahul@aipostal.com", phone: "+91 98765 43210", assigned_zone: "Delhi NCR", status: "active", rating: 4.9, deliveries_completed: 142, deliveries_failed: 2 },
        { staff_id: "ST-02", name: "Priya Patel", email: "priya@aipostal.com", phone: "+91 99887 76655", assigned_zone: "Mumbai Central", status: "active", rating: 4.8, deliveries_completed: 138, deliveries_failed: 4 },
        { staff_id: "ST-03", name: "Rohan Sharma", email: "rohan@aipostal.com", phone: "+91 91234 56789", assigned_zone: "Pune GPO", status: "active", rating: 4.7, deliveries_completed: 125, deliveries_failed: 1 },
        { staff_id: "ST-04", name: "Sneha Reddy", email: "sneha@aipostal.com", phone: "+91 95432 10987", assigned_zone: "Bangalore Hub", status: "active", rating: 4.6, deliveries_completed: 118, deliveries_failed: 5 },
        { staff_id: "ST-05", name: "Arjun Nair", email: "arjun@aipostal.com", phone: "+91 94321 09876", assigned_zone: "Hyderabad City", status: "inactive", rating: 4.5, deliveries_completed: 110, deliveries_failed: 7 }
      ];
      await Staff.insertMany(defaultStaff);
      staffList = await Staff.find();
    }
    
    return res.status(200).json(staffList);
  } catch (error) {
    console.error("Error fetching staff list:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/staff/assign-zone
router.post("/assign-zone", async (req, res) => {
  try {
    const { staff_id, zone } = req.body;
    if (!staff_id || !zone) {
      return res.status(400).json({ error: "staff_id and zone are required" });
    }

    const updated = await Staff.findOneAndUpdate({ staff_id }, { assigned_zone: zone }, { new: true });
    if (!updated) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    return res.status(200).json({ success: true, message: `Zone reassigned to ${zone}`, data: updated });
  } catch (error) {
    console.error("Error in assign-zone:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/staff/suspend
router.post("/suspend", async (req, res) => {
  try {
    const { staff_id, status } = req.body; // active, inactive, suspended
    if (!staff_id || !status) {
      return res.status(400).json({ error: "staff_id and status are required" });
    }

    const updated = await Staff.findOneAndUpdate({ staff_id }, { status: status }, { new: true });
    if (!updated) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    return res.status(200).json({ success: true, message: `Staff status updated to ${status}`, data: updated });
  } catch (error) {
    console.error("Error in staff status toggle:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/staff/reassign-parcel
router.post("/reassign-parcel", async (req, res) => {
  try {
    const { tracking_id, agent_name } = req.body;
    if (!tracking_id || !agent_name) {
      return res.status(400).json({ error: "tracking_id and agent_name are required" });
    }

    if (mongoose.connection.readyState === 1) {
      const db = mongoose.connection.db;
      await db.collection("parcels").updateOne(
        { tracking_id },
        { $set: { assigned_agent: agent_name } }
      );
      
      await db.collection("tracking_history").insertOne({
        tracking_id,
        status: "Agent Reassigned",
        timestamp: new Date(),
        location: "Sorting Hub",
        details: `Parcel reassigned to courier delivery agent ${agent_name} by logistics administrator.`
      });
    }

    return res.status(200).json({ success: true, message: `Parcel ${tracking_id} successfully reassigned to ${agent_name}` });
  } catch (error) {
    console.error("Error reassigning parcel:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/staff
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, assigned_zone, assigned_branch, status } = req.body;
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    const staff_id = "ST-" + Math.floor(1000 + Math.random() * 9000);
    const newStaff = new Staff({
      staff_id,
      name,
      email: email || "",
      phone: phone || "",
      assigned_zone: assigned_zone || "Delhi NCR",
      assigned_branch: assigned_branch || "Delhi NCR Hub",
      status: status || "active"
    });
    await newStaff.save();
    return res.status(201).json({ success: true, message: "Staff added successfully", data: newStaff });
  } catch (error) {
    console.error("Error creating staff:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/admin/staff/:staff_id
router.put("/:staff_id", async (req, res) => {
  try {
    const { staff_id } = req.params;
    const { name, email, phone, assigned_zone, assigned_branch, status } = req.body;
    
    const updated = await Staff.findOneAndUpdate(
      { staff_id },
      { name, email, phone, assigned_zone, assigned_branch, status },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    return res.status(200).json({ success: true, message: "Staff updated successfully", data: updated });
  } catch (error) {
    console.error("Error updating staff:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/staff/:staff_id
router.delete("/:staff_id", async (req, res) => {
  try {
    const { staff_id } = req.params;
    const deleted = await Staff.findOneAndDelete({ staff_id });
    if (!deleted) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    return res.status(200).json({ success: true, message: "Staff member deleted successfully", data: deleted });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
