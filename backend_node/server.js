require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");

const locationRouter = require("./controllers/locationController");
const incidentRouter = require("./controllers/incidentController");
const staffRouter = require("./controllers/staffController");
const liveMapRouter = require("./routes/liveMapRoutes");
const staffAdminRouter = require("./routes/staffAdminRoutes");
const adminRouter = require("./controllers/adminController");

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server wrapping express
const server = http.createServer(app);

// Bootstrap Socket.IO server
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8080", "http://127.0.0.1:8080"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  }
});

// Configure Socket connections
io.on("connection", (socket) => {
  console.log(`[Socket] New connection established: ${socket.id}`);
  
  socket.on("disconnect", () => {
    console.log(`[Socket] Connection terminated: ${socket.id}`);
  });
});

// Attach socket io instance globally
app.set("io", io);

// Enable CORS for frontend applications (ports 5173, 8080)
app.use(cors({
  origin: "*", // Allow all origins for development; adjust in production
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root route
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "AIPOSTAL Node.js Staff & Admin Logistics API running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected (using fallback cache)",
    sockets: io.engine.clientsCount
  });
});

// Register routers
app.use("/api/location", locationRouter);
app.use("/api/incidents", incidentRouter);
app.use("/api/staff", staffRouter);
app.use("/api/admin/live-map", liveMapRouter);
app.use("/api/admin/staff", staffAdminRouter);
app.use("/api/admin", adminRouter);

// DB Connection
const mongoUri =
  process.env.MONGODB_URI ||
  "mongodb+srv://postal_user:aipostal@cluster0.g0mulqc.mongodb.net/?appName=Cluster0";

console.log(`Attempting database connection to: ${mongoUri}...`);

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 3000 // 3 seconds timeout
})
.then(() => {
  console.log("Successfully connected to real MongoDB via Mongoose!");
})
.catch((err) => {
  console.warn("Mongoose MongoDB connection failed:", err.message);
  console.warn("Server will operate using in-memory local cache fallbacks.");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled API error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start Server on HTTP wrapper (essential for Socket.io)
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`AIPOSTAL Express + Socket.IO listening on port ${PORT}`);
  console.log(`Express status checks: http://localhost:${PORT}/`);
  console.log(`====================================================`);
});
