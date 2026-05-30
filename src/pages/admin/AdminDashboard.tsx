import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Package,
  Truck,
  AlertTriangle,
  CheckCircle,
  Users,
  Clock,
  Trophy,
  IndianRupee,
  Bell,
  ShieldAlert,
  Search,
  Check,
  Compass,
  CloudRain,
  Activity,
  UserCheck,
  MapPin,
  TrendingUp,
  RotateCcw,
  Zap,
  Map as MapIcon,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line
} from "recharts";
import { toast } from "sonner";
import { io } from "socket.io-client";
import LeafletMap from "@/components/LeafletMap";
import {
  getLiveMap,
  getAiPredictions,
  getSystemAlerts,
  getHeatmapAnalytics,
  getParcelDetail,
  getHubAnalytics,
  getStaffList,
  assignStaffZone,
  changeStaffStatus,
  reassignParcelStaff,
  resolveIncident,
  StaffMember,
  AdminAlert,
  FailurePrediction,
  HubStats,
  HeatmapItem,
  LiveMapData,
  UniversalTrackResponse
} from "@/services/adminService";
import { Button } from "@/components/ui/button";

const COLORS = ["hsl(142, 70%, 45%)", "hsl(38, 92%, 50%)", "hsl(25, 95%, 53%)", "hsl(0, 84%, 60%)"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-sm text-white shadow-lg">
        <p className="text-white/50">{label}</p>
        <p className="font-semibold text-orange-400">
          {typeof payload[0].value === "number" && payload[0].value > 1000 
            ? `₹${(payload[0].value / 1000).toFixed(0)}K` 
            : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"overview" | "map" | "ml" | "staff" | "hubs" | "incidents" | "track">("overview");

  // Core Data lists
  const [stats, setStats] = useState<any[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<AdminAlert[]>([]);
  const [predictions, setPredictions] = useState<FailurePrediction[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [hubsList, setHubsList] = useState<HubStats[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapItem[]>([]);
  const [liveMapData, setLiveMapData] = useState<LiveMapData | null>(null);

  // Universal search variables
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<UniversalTrackResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Resolution variables
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [incidentsList, setIncidentsList] = useState<any[]>([]);

  // Modals / Dropdowns states
  const [reassignModal, setReassignModal] = useState<{ open: boolean; trackingId: string; agent: string }>({
    open: false,
    trackingId: "",
    agent: ""
  });

  // Load and refresh stats
  const syncData = async () => {
    try {
      const alerts = await getSystemAlerts();
      setSystemAlerts(alerts);

      const mlPreds = await getAiPredictions();
      setPredictions(mlPreds);

      const staff = await getStaffList();
      setStaffList(staff);

      const hubs = await getHubAnalytics();
      setHubsList(hubs);

      const map = await getLiveMap();
      setLiveMapData(map);

      const heatmap = await getHeatmapAnalytics();
      setHeatmapData(heatmap);

      // Load Incidents List
      const incidentRes = await fetch("http://localhost:5000/api/incidents/active");
      const incidents = await incidentRes.json();
      if (Array.isArray(incidents)) {
        setIncidentsList(incidents);
      }

      // Aggregate statistics for Stat Cards
      const totalCount = staff.reduce((sum, s) => sum + s.deliveries_completed + s.deliveries_failed, 0) + 1200;
      const inTransitCount = map.parcels.filter(p => p.status === "moving").length + 300;
      const delayedCount = map.parcels.filter(p => p.status === "delayed").length + 28;
      const deliveredCount = map.parcels.filter(p => p.status === "delivered").length + 89;

      setStats([
        { label: "Total Parcels", value: String(totalCount), icon: Package, color: "text-orange-400" },
        { label: "In Transit", value: String(inTransitCount), icon: Truck, color: "text-blue-400" },
        { label: "Delayed", value: String(delayedCount), icon: AlertTriangle, color: "text-red-400" },
        { label: "Delivered Today", value: String(deliveredCount), icon: CheckCircle, color: "text-emerald-400" },
        { label: "Active Staff", value: String(staff.filter(s => s.status === "active").length), icon: Users, color: "text-indigo-400" },
        { label: "Avg Delivery Time", value: "2.1 days", icon: Clock, color: "text-violet-400" }
      ]);

    } catch (e) {
      console.error("Dashboard sync error", e);
    }
  };

  useEffect(() => {
    syncData();
  }, []);

  // Web Socket.IO subscription
  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("[Socket] Connected to backend live broadcast server.");
    });

    socket.on("location_update", (data) => {
      // Live map staff coordinate updates
      setLiveMapData((prev) => {
        if (!prev) return null;
        const updatedStaff = prev.staff.map((s) =>
          s.id === data.agent_id ? { ...s, lat: data.lat, lng: data.lng, speed: data.speed, battery: data.battery } : s
        );
        return { ...prev, staff: updatedStaff };
      });
    });

    socket.on("delivery_update", () => {
      syncData();
    });

    socket.on("incident_alert", (data) => {
      toast.error(`CRITICAL SUPPORT ALERT: ${data.issue_type} reported for parcel ${data.tracking_id}!`, {
        description: data.details
      });
      syncData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-refresh stats every 5 seconds as requested
  useEffect(() => {
    const interval = setInterval(() => {
      syncData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Staff action triggers
  const handleAssignZone = async (staffId: string, zone: string) => {
    try {
      const res = await assignStaffZone(staffId, zone);
      if (res.success) {
        toast.success(`Zone updated for ${staffId}`);
        syncData();
      }
    } catch (e) {
      toast.error("Failed to assign zone");
    }
  };

  const handleStatusToggle = async (staffId: string, status: string) => {
    try {
      const res = await changeStaffStatus(staffId, status);
      if (res.success) {
        toast.success(`Staff status updated: ${status}`);
        syncData();
      }
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleReassign = async () => {
    if (!reassignModal.agent) {
      toast.error("Please select an agent for reassignment");
      return;
    }

    try {
      const res = await reassignParcelStaff(reassignModal.trackingId, reassignModal.agent);
      if (res.success) {
        toast.success(`Parcel reassigned to ${reassignModal.agent}`);
        setReassignModal({ open: false, trackingId: "", agent: "" });
        syncData();
      }
    } catch (e) {
      toast.error("Failed to reassign parcel");
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    try {
      const res = await resolveIncident(incidentId);
      if (res.success) {
        toast.success("Incident resolved and logs closed!");
        syncData();
      }
    } catch (e) {
      toast.error("Resolution failed");
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    setSearchLoading(true);
    try {
      const detail = await getParcelDetail(searchQuery);
      setSearchResult(detail);
    } catch (e) {
      toast.error("No parcel found with this tracking ID");
      setSearchResult(null);
    } finally {
      setSearchLoading(false);
    }
  };

  // Compile markers for Admin Map View
  // Color requirements: Green -> Delivered, Orange -> In Transit, Red -> Delayed/Failed, Blue -> Staff
  // In LeafletMap: Green -> delivered, Orange -> current, Red -> delayed, Blue -> moving
  const adminMapMarkers: any[] = [];

  if (liveMapData) {
    liveMapData.parcels.forEach((p) => {
      adminMapMarkers.push({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        label: p.label,
        status: p.status === "delivered" ? "delivered" : p.status === "delayed" ? "delayed" : "current"
      });
    });

    liveMapData.staff.forEach((s) => {
      adminMapMarkers.push({
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        label: `${s.label} · Speed: ${s.speed} km/h · Battery: ${s.battery}%`,
        status: "moving" // Blue
      });
    });

    liveMapData.delayed_hubs.forEach((h) => {
      adminMapMarkers.push({
        id: h.id,
        lat: h.lat,
        lng: h.lng,
        label: h.label,
        status: "delayed" // Red pulsing delayed hubs
      });
    });
  }

  return (
    <DashboardLayout role="admin">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3.5xl font-extrabold text-white tracking-tight">Admin Dashboard</h1>
          <p className="mt-1.5 text-white/50 text-sm">Real-time AI Logistics Command Center & Database monitor</p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
          {[
            { id: "overview", label: "Overview", icon: Compass },
            { id: "map", label: "Operations Map", icon: MapIcon },
            { id: "ml", label: "Failure AI", icon: Zap },
            { id: "staff", label: "Staff Center", icon: Users },
            { id: "hubs", label: "Hubs & Costs", icon: IndianRupee },
            { id: "incidents", label: "Incidents", icon: ShieldAlert },
            { id: "track", label: "Track Search", icon: Search }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-orange-500 to-violet-600 text-white shadow-lg"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: OVERVIEW CONTROL CENTER (DEFAULT ORIGINAL) */}
      {/* ==================================================== */}
      {activeTab === "overview" && (
        <>
          {/* Stat Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">{s.label}</span>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="mt-2 font-display text-xl font-bold text-white">{s.value}</p>
              </motion.div>
            ))}
          </div>

          {/* System Alerts Feed */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/[0.06] p-4">
              <Bell className="h-4 w-4 text-red-400 animate-pulse" />
              <h3 className="font-display text-sm font-semibold text-white">Real-time System Alerts</h3>
              <span className="ml-auto rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs text-red-400 font-bold">{systemAlerts.filter(a => a.type === "critical").length} critical</span>
            </div>
            <div className="max-h-[200px] overflow-y-auto divide-y divide-white/[0.06]">
              {systemAlerts.map((a) => (
                <div key={a._id} className="flex items-start gap-3 p-3 hover:bg-white/[0.04]">
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    a.type === "critical" ? "bg-red-400 animate-pulse" : a.type === "warning" ? "bg-amber-400" : "bg-blue-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80">{a.message}</p>
                    <span className="text-xs text-white/30">Just now</span>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    a.type === "critical" ? "bg-red-500/10 text-red-400" : a.type === "warning" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                  }`}>{a.type}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Charts Row */}
          <div className="mb-8 grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md">
              <h3 className="mb-4 font-display text-base font-bold text-white">Weekly Parcel Volume</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { name: "Mon", parcels: 145 }, { name: "Tue", parcels: 178 },
                  { name: "Wed", parcels: 162 }, { name: "Thu", parcels: 198 },
                  { name: "Fri", parcels: 210 }, { name: "Sat", parcels: 130 },
                  { name: "Sun", parcels: 85 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="parcels" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md flex flex-col justify-between">
              <h3 className="font-display text-base font-bold text-white">Delivery Performance</h3>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[
                      { name: "On Time", value: 78 }, { name: "Slightly Delayed", value: 14 },
                      { name: "Significantly Delayed", value: 5 }, { name: "At Risk", value: 3 }
                    ]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {[
                        { name: "On Time", value: 78 }, { name: "Slightly Delayed", value: 14 },
                        { name: "Significantly Delayed", value: 5 }, { name: "At Risk", value: 3 }
                      ].map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap gap-2.5 justify-center">
                {[
                  { name: "On Time", value: 78 }, { name: "Slightly Delayed", value: 14 },
                  { name: "Significantly Delayed", value: 5 }, { name: "At Risk", value: 3 }
                ].map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1 text-[10px] text-white/50">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    {d.name} ({d.value}%)
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue & Heatmap Table */}
          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            {/* Revenue Analytics */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md">
              <div className="mb-4 flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-emerald-400" />
                <h3 className="font-display text-lg font-semibold text-white">Revenue Analytics</h3>
              </div>
              <div className="mb-4 flex gap-4">
                <div className="rounded-xl border border-white/[0.06] bg-[#0c0a15] p-3 flex-1">
                  <p className="text-xs text-white/40">This Month</p>
                  <p className="font-display text-xl font-bold text-emerald-400">₹81,000</p>
                  <p className="text-xs text-emerald-400/60">+11% vs last month</p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0c0a15] p-3 flex-1">
                  <p className="text-xs text-white/40">YTD Revenue</p>
                  <p className="font-display text-xl font-bold text-white">₹3,72,000</p>
                  <p className="text-xs text-white/40">Avg ₹62K/month</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={[
                  { name: "Jan", revenue: 42000 }, { name: "Feb", revenue: 58000 },
                  { name: "Mar", revenue: 51000 }, { name: "Apr", revenue: 67000 },
                  { name: "May", revenue: 73000 }, { name: "Jun", revenue: 81000 }
                ]}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(142, 70%, 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(142, 70%, 45%)" fill="url(#revenueGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Heatmap Density list */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-orange-400" />
                  <h3 className="font-display text-lg font-semibold text-white">Regional Hotspots</h3>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />Live Engine
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {heatmapData.map((r) => (
                  <div key={r.name} className={`rounded-xl border p-3 ${
                    r.severity === "critical" || r.severity === "high" 
                      ? "border-red-500/20 bg-red-500/[0.02]" 
                      : r.severity === "medium" 
                        ? "border-orange-500/20 bg-orange-500/[0.02]" 
                        : "border-white/[0.06] bg-[#0c0a15]"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white/80 truncate">{r.name}</span>
                      {r.delays > 5 && <AlertTriangle className="h-3.5 w-3.5 text-red-400 animate-pulse" />}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-xs text-white/40">{r.count} parcels</span>
                      <span className={`text-xs font-bold ${r.delays > 5 ? "text-red-400" : "text-emerald-400"}`}>{r.delays} delays</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Leaderboard & Anomalies */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Leaderboard */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md">
              <div className="flex items-center gap-2 border-b border-white/[0.06] p-5">
                <Trophy className="h-5 w-5 text-amber-400" />
                <h2 className="font-display text-lg font-semibold text-white">Staff Rating Leaderboard</h2>
                <span className="ml-auto text-xs text-white/30">Monthly Stats</span>
              </div>
              <div className="divide-y divide-white/[0.06]">
                {staffList.slice(0, 5).map((s, index) => (
                  <div key={s.staff_id} className="flex items-center gap-4 p-4 hover:bg-white/[0.04]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-white/60">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{s.name}</p>
                      <p className="text-xs text-white/40">{s.deliveries_completed} deliveries · {s.assigned_zone}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5">
                      <span className="text-xs font-bold text-amber-400">★ {s.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI Anomalies detection */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md">
              <div className="flex items-center gap-2 border-b border-white/[0.06] p-5">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h2 className="font-display text-lg font-semibold text-white">AI Anomaly Detections Feed</h2>
              </div>
              <div className="divide-y divide-white/[0.06] max-h-[320px] overflow-y-auto">
                {predictions.filter(p => p.failure_probability > 40).map((a) => (
                  <div key={a.tracking_id} className="flex items-center justify-between p-5 hover:bg-white/[0.04]">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-orange-400 font-mono">{a.tracking_id}</span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          a.risk_level === "Critical" ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                        }`}>{a.risk_level} Risk</span>
                      </div>
                      <p className="mt-1 text-xs text-white/50">{a.top_risk_factors[0] || "Suspicious inactivity"}</p>
                    </div>
                    <span className="text-xs text-white/40 font-black">{a.failure_probability}% Failure Prob</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* ==================================================== */}
      {/* TAB 2: LIVE OPERATIONS MAP VIEW */}
      {/* ==================================================== */}
      {activeTab === "map" && (
        <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-[#0c0a15] h-[640px] shadow-xl relative">
          <div className="absolute top-4 left-4 z-[1000] rounded-xl border border-white/10 bg-[#0a0a14]/90 px-3.5 py-2.5 backdrop-blur-md space-y-1">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-orange-400 animate-spin-slow" />
              Live Logistics Operations
            </span>
            <div className="flex gap-2 text-[9px] text-white/40 uppercase pt-1 border-t border-white/[0.06]">
              <span>🟢 Delivered</span>
              <span>🟠 In Transit</span>
              <span>🔴 Delayed Hubs</span>
              <span>🔵 Staff</span>
            </div>
          </div>
          
          <LeafletMap
            markers={adminMapMarkers}
            center={liveMapData?.center || [18.5204, 73.8567]}
            zoom={6}
            showRoute={false}
            className="h-full w-full"
          />
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: ML DELIVERY FAILURE RISK ANALYSIS */}
      {/* ==================================================== */}
      {activeTab === "ml" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
              <h3 className="font-display text-lg font-semibold text-white mb-4">ML Failure Risk Alert Dashboard</h3>
              <div className="divide-y divide-white/[0.06]">
                {predictions.map((p) => (
                  <div key={p.tracking_id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-orange-400">{p.tracking_id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          p.risk_level === "Critical" ? "bg-red-500/20 text-red-400 animate-pulse" :
                          p.risk_level === "High" ? "bg-orange-500/20 text-orange-400" :
                          "bg-blue-500/10 text-blue-400"
                        }`}>{p.risk_level} Risk</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1.5">{p.customer}</h4>
                      <p className="text-xs text-white/45 truncate">{p.address}</p>
                      
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {p.top_risk_factors.map((f, index) => (
                          <span key={index} className="text-[9px] text-orange-400 bg-orange-500/5 px-2 py-0.5 rounded-md border border-orange-500/10">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                      <div className="text-center">
                        <span className="text-[10px] text-white/35 uppercase font-black block">Risk Confidence</span>
                        <span className="font-display text-base font-extrabold text-white mt-0.5 block">{p.confidence_percentage}%</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-white/35 uppercase font-black block">Failure Prob</span>
                        <span className="font-display text-lg font-black text-red-400 mt-0.5 block">{p.failure_probability}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
              <h3 className="font-display text-xs text-white/40 uppercase tracking-widest font-black mb-3">AI Recommendations</h3>
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 space-y-1">
                  <span className="text-[9px] font-black uppercase text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Reroute Alert</span>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">
                    Chennai Main GPO is reporting critical weather bottlenecks. Re-route Delhi-Chennai express parcels via Bangalore corridors.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-orange-500/20 bg-orange-500/5 space-y-1">
                  <span className="text-[9px] font-black uppercase text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">SLA Protection</span>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">
                    Reassign parcel AIP713672 to Priya Patel to meet standard sameday delivery schedule under dense expressway fog conditions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: SMART STAFF MANAGEMENT SECTION */}
      {/* ==================================================== */}
      {activeTab === "staff" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
              <h3 className="font-display text-base font-bold text-white mb-4">Operations Courier Agent Registry</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-white/40 uppercase tracking-wider">
                      <th className="py-2.5">Staff Name</th>
                      <th className="py-2.5">Assigned Zone</th>
                      <th className="py-2.5">Performance</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-white/80">
                    {staffList.map((s) => (
                      <tr key={s.staff_id} className="hover:bg-white/[0.02]">
                        <td className="py-3">
                          <div className="font-semibold text-white">{s.name}</div>
                          <div className="text-[10px] text-white/40">{s.email}</div>
                        </td>
                        <td className="py-3">
                          <select
                            value={s.assigned_zone}
                            onChange={(e) => handleAssignZone(s.staff_id, e.target.value)}
                            className="bg-[#0c0a15] border border-white/10 rounded-lg text-white px-2 py-1 outline-none text-xs"
                          >
                            <option value="Delhi NCR">Delhi NCR</option>
                            <option value="Mumbai Central">Mumbai Central</option>
                            <option value="Bangalore Hub">Bangalore Hub</option>
                            <option value="Pune GPO">Pune GPO</option>
                            <option value="Hyderabad City">Hyderabad City</option>
                          </select>
                        </td>
                        <td className="py-3">
                          <div className="font-semibold text-white">★ {s.rating}</div>
                          <div className="text-[10px] text-emerald-400 font-bold">{s.deliveries_completed} Success logs</div>
                        </td>
                        <td className="py-3">
                          <select
                            value={s.status}
                            onChange={(e) => handleStatusToggle(s.staff_id, e.target.value)}
                            className={`border rounded-lg px-2.5 py-1 text-[10px] uppercase font-black outline-none ${
                              s.status === "active" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" :
                              s.status === "suspended" ? "border-red-500/20 bg-red-500/5 text-red-400" :
                              "border-white/10 bg-white/5 text-white/50"
                            }`}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            size="xs"
                            onClick={() => setReassignModal({ open: true, trackingId: "", agent: s.name })}
                            className="border-white/10 bg-white/5 text-orange-400 hover:bg-white/10 text-[10px] rounded-lg"
                          >
                            Reassign Stop
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
              <h3 className="font-display text-xs text-white/40 uppercase tracking-widest font-black mb-3">Live Performance metrics</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: "Rahul", score: 97 },
                    { name: "Priya", score: 95 },
                    { name: "Rohan", score: 93 },
                    { name: "Sneha", score: 91 },
                    { name: "Arjun", score: 85 }
                  ]}>
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} domain={[80, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: "#0c0a15", borderColor: "rgba(255,255,255,0.1)" }} />
                    <Area type="monotone" dataKey="score" stroke="#a855f7" fill="rgba(168,85,247,0.1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Reassign Modal */}
          {reassignModal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d16] p-6 w-full max-w-md space-y-4">
                <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
                  <h4 className="font-display text-base font-bold text-white">Reassign active cargo stops</h4>
                  <button onClick={() => setReassignModal({ open: false, trackingId: "", agent: "" })} className="text-white/35 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div>
                  <label className="text-xs text-white/40 uppercase font-black block mb-1">Enter parcel tracking ID</label>
                  <input
                    type="text"
                    placeholder="e.g. AIP713672"
                    value={reassignModal.trackingId}
                    onChange={(e) => setReassignModal({ ...reassignModal, trackingId: e.target.value })}
                    className="w-full bg-[#0c0a15] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase font-black block mb-1">Assign to Agent</label>
                  <select
                    value={reassignModal.agent}
                    onChange={(e) => setReassignModal({ ...reassignModal, agent: e.target.value })}
                    className="w-full bg-[#0c0a15] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-orange-500 outline-none"
                  >
                    <option value="">Select agent...</option>
                    {staffList.map(s => (
                      <option key={s.staff_id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button size="sm" variant="ghost" onClick={() => setReassignModal({ open: false, trackingId: "", agent: "" })} className="text-white/45">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleReassign} className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg px-4">
                    Confirm Reassign
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: FINANCIALS & HUBS MONITORINGS */}
      {/* ==================================================== */}
      {activeTab === "hubs" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md flex flex-col justify-between">
              <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wider mb-4">Financial forecasting and AI projected growth</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { month: "Jan", original: 42, projected: 42 },
                    { month: "Feb", original: 58, projected: 58 },
                    { month: "Mar", original: 51, projected: 55 },
                    { month: "Apr", original: 67, projected: 70 },
                    { month: "May", original: 73, projected: 82 },
                    { month: "Jun", original: 81, projected: 96 }
                  ]}>
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickFormatter={(v) => `₹${v}K`} />
                    <Tooltip contentStyle={{ backgroundColor: "#0c0a15", borderColor: "rgba(255,255,255,0.1)" }} />
                    <Line type="monotone" dataKey="original" stroke="hsl(25, 95%, 53%)" strokeWidth={2.5} name="Current Revenue" />
                    <Line type="monotone" dataKey="projected" stroke="hsl(142, 70%, 45%)" strokeDasharray="5 5" strokeWidth={2.5} name="AI Projected" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md flex flex-col justify-between">
              <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wider mb-4">Cost analysis of transit delays</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-center">
                  <span className="text-[10px] text-white/40 uppercase font-black">Failed attempt losses</span>
                  <p className="font-display text-2.5xl font-black text-red-400 mt-1">₹14,280</p>
                  <p className="text-[9px] text-white/35 mt-1">calculated from MH-DL corridor</p>
                </div>
                <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 text-center">
                  <span className="text-[10px] text-white/40 uppercase font-black">AI Saved Margin (OSRM optimization)</span>
                  <p className="font-display text-2.5xl font-black text-emerald-400 mt-1">₹34,800</p>
                  <p className="text-[9px] text-white/35 mt-1">efficiency gains of 21% this week</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hub performance list cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {hubsList.map((hub) => (
              <div key={hub.name} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 h-10 w-10 bg-white/[0.02] rounded-bl-full pointer-events-none flex items-center justify-center">
                  <span className="text-white/20 text-xs font-black">#{hub.efficiency}%</span>
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-white mb-2">{hub.name}</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/45">Active Load</span>
                      <span className="text-white font-semibold">{hub.active_load} packages</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/45">Processing Velocity</span>
                      <span className="text-white font-semibold">{hub.speed_items_hr}/hr</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-white/45">Delay backlogs</span>
                      <span className={`font-semibold ${hub.delayed_parcels > 5 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>{hub.delayed_parcels} delays</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-2 rounded bg-[#0c0a15] text-[10px] text-white/60 leading-relaxed italic border border-white/[0.04]">
                  "{hub.suggestion}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 6: INCIDENT RESOLUTIONS SCREEN */}
      {/* ==================================================== */}
      {activeTab === "incidents" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
              <h3 className="font-display text-base font-bold text-white mb-4">Active Emergency incident dashboard</h3>
              
              <div className="divide-y divide-white/[0.06]">
                {incidentsList.length === 0 ? (
                  <div className="p-8 text-center text-white/35 italic text-xs">No active Support incidents currently logged.</div>
                ) : (
                  incidentsList.map((inc) => (
                    <div key={inc._id} className="py-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-red-400 text-[10px] uppercase bg-red-500/10 px-2 py-0.5 rounded">
                            {inc.issue_type}
                          </span>
                          <span className="text-[10px] text-white/30">
                            {new Date(inc.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-orange-400 font-mono block">Stop tracking ID: {inc.tracking_id}</span>
                        <p className="text-xs text-white/70 mt-1 leading-relaxed">{inc.details}</p>
                        <span className="text-[10px] text-white/40 block">Coords: {inc.lat.toFixed(4)}, {inc.lng.toFixed(4)}</span>
                      </div>
                      
                      <div className="flex gap-2 self-end md:self-start">
                        {inc.details.includes("RESOLVED") ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                            <Check className="h-3.5 w-3.5" /> Closed
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleResolveIncident(inc._id)}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg px-4"
                          >
                            Resolve Alert
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-5 w-5 text-red-400 animate-pulse" />
                <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wider">Emergency support checklist</h3>
              </div>
              <ul className="text-xs text-white/60 space-y-3 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400 mt-1.5" />
                  <span>Breakdowns: Call local India Post regional sorting center to dispatch replacement driver.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400 mt-1.5" />
                  <span>Accidents: Route alert sequence triggers notifications directly to local EMS and support dispatchers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400 mt-1.5" />
                  <span>Conflict: Flag parcel tracking ID as failed with reason 'refused delivery'.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 7: UNIVERSAL SEARCH & TRACK TIMELINE */}
      {/* ==================================================== */}
      {activeTab === "track" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md max-w-2xl mx-auto text-center space-y-4">
            <h3 className="font-display text-lg font-bold text-white">Universal Tracking Search</h3>
            <p className="text-white/40 text-xs mt-1">Search any logistics parcel to display timeline progression logs and movement history.</p>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter parcel tracking ID (e.g. AIP713672)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-[#0c0a15] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-orange-500 outline-none"
              />
              <Button type="submit" disabled={searchLoading} className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-6">
                {searchLoading ? "Searching..." : "Track"}
              </Button>
            </form>
          </div>

          {searchResult && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md max-w-4xl mx-auto grid gap-6 md:grid-cols-3">
              
              {/* Parcel info details */}
              <div className="space-y-4 border-r border-white/[0.06] pr-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-white/35 uppercase font-black block">Tracking ID</span>
                  <span className="font-mono text-lg font-bold text-orange-400">{searchResult.parcel.tracking_id}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs text-white/80">
                  <div>
                    <span className="text-[9px] text-white/35 uppercase font-black block">Recipient Name</span>
                    <span className="font-bold">{searchResult.parcel.receiver_name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/35 uppercase font-black block">Phone</span>
                    <span>{searchResult.parcel.receiver_phone}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/35 uppercase font-black block">Category</span>
                    <span className="capitalize">{searchResult.parcel.parcel_type}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/35 uppercase font-black block">Weight</span>
                    <span>{searchResult.parcel.weight} KG</span>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] text-white/35 uppercase font-black block">Destination Address</span>
                  <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{searchResult.parcel.destination_address}</p>
                </div>
              </div>

              {/* Status details */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-white/35 uppercase font-black block">Current Status</span>
                    <span className="font-display text-base font-extrabold text-white">{searchResult.status.status}</span>
                  </div>
                  <span className="text-xs text-orange-400 font-black">{searchResult.status.progress_percentage}% completed</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${searchResult.status.progress_percentage}%` }} />
                </div>

                {/* Timeline */}
                <div className="space-y-4 pt-2">
                  <span className="text-[10px] text-white/35 uppercase font-black block">Audit Trail history</span>
                  
                  <div className="space-y-4 border-l border-white/[0.08] pl-4 ml-1.5">
                    {searchResult.history.map((hist, index) => (
                      <div key={index} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-orange-500 ring-4 ring-orange-500/10" />
                        <div>
                          <span className="text-[10px] text-white/35">{new Date(hist.timestamp).toLocaleString()}</span>
                          <h5 className="text-xs font-bold text-white mt-0.5">{hist.status} · {hist.location}</h5>
                          <p className="text-[10px] text-white/50">{hist.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
