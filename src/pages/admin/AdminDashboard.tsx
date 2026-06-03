import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PageBackground from "@/components/PageBackground";
import bgAdminOverview from "@/assets/bg-admin-overview.png";
import bgAdminAnalytics from "@/assets/bg-admin-analytics.png";
import bgDashboard from "@/assets/bg-dashboard.jpg";
import bgOrders from "@/assets/bg-orders.jpg";
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
  X,
  Plus,
  Trash2,
  Edit,
  Sliders,
  Shield,
  FileText
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
  getUsersList,
  toggleUserStatus,
  deleteUser,
  addStaff,
  editStaff,
  deleteStaff,
  getParcelsList,
  updateParcelStatus,
  getAnalyticsStats,
  getAiMonitoring,
  getSystemSettings,
  saveSystemSettings,
  StaffMember,
  AdminAlert,
  FailurePrediction,
  HubStats,
  HeatmapItem,
  LiveMapData,
  UniversalTrackResponse,
  User,
  SystemSettings,
  AnalyticsStats,
  AiMonitoringData
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

const getAdminBg = (tab: string) => {
  switch (tab) {
    case "overview":
      return bgAdminOverview;
    case "ml":
    case "ai":
    case "incidents":
      return bgAdminAnalytics;
    case "map":
      return bgDashboard;
    case "users":
    case "staff":
    case "parcels":
    case "hubs":
      return bgOrders;
    default:
      return bgAdminOverview;
  }
};

const AdminDashboard = () => {
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setAdminName(storedName);
    }
  }, []);

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    "overview" | "map" | "ml" | "staff" | "users" | "parcels" | "ai" | "settings" | "hubs" | "incidents" | "track"
  >("overview");

  // Core Data lists
  const [stats, setStats] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsStats | null>(null);
  const [systemAlerts, setSystemAlerts] = useState<AdminAlert[]>([]);
  const [predictions, setPredictions] = useState<FailurePrediction[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [hubsList, setHubsList] = useState<HubStats[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapItem[]>([]);
  const [liveMapData, setLiveMapData] = useState<LiveMapData | null>(null);

  // User Management
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // Parcel Management
  const [parcelsList, setParcelsList] = useState<any[]>([]);
  const [parcelSearch, setParcelSearch] = useState("");
  const [parcelStatusFilter, setParcelStatusFilter] = useState<number | undefined>(undefined);
  const [parcelDelayedOnly, setParcelDelayedOnly] = useState(false);
  const [updateParcelModal, setUpdateParcelModal] = useState<{
    open: boolean;
    trackingId: string;
    statusText: string;
    stage: number;
    location: string;
  }>({
    open: false,
    trackingId: "",
    statusText: "",
    stage: 1,
    location: ""
  });

  // AI Monitoring
  const [aiMonitoring, setAiMonitoring] = useState<AiMonitoringData | null>(null);

  // System Settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    system_status: "normal",
    ai_confidence_threshold: 0.8,
    delay_threshold_hours: 24,
    auto_assign_agents: true,
    maintenance_mode: false
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Universal search variables
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<UniversalTrackResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Resolution variables
  const [incidentsList, setIncidentsList] = useState<any[]>([]);

  // Modals / Dropdowns states
  const [reassignModal, setReassignModal] = useState<{ open: boolean; trackingId: string; agent: string }>({
    open: false,
    trackingId: "",
    agent: ""
  });

  // Staff CRUD Modals
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    phone: "",
    assigned_zone: "Delhi NCR",
    assigned_branch: "Delhi NCR Hub",
    status: "active" as "active" | "inactive" | "suspended"
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

      // Load Users list
      const users = await getUsersList();
      setUsersList(users);

      // Load Parcels list
      const parcels = await getParcelsList(parcelSearch, parcelStatusFilter, parcelDelayedOnly);
      setParcelsList(parcels);

      // Load AI Monitoring
      const aiData = await getAiMonitoring();
      setAiMonitoring(aiData);

      // Load System Settings
      const settings = await getSystemSettings();
      if (settings && settings.system_status) {
        setSystemSettings(settings);
      }

      // Fetch dynamic analytics calculated live from MongoDB
      const analyticsStats = await getAnalyticsStats();
      setAnalyticsData(analyticsStats);
      
      setStats([
        { label: "Total Parcels", value: String(analyticsStats.totalParcels), icon: Package, color: "text-orange-400" },
        { label: "In Transit (Active)", value: String(analyticsStats.activeParcels), icon: Truck, color: "text-blue-400" },
        { label: "Delayed Parcels", value: String(analyticsStats.delayedParcels), icon: AlertTriangle, color: "text-red-400" },
        { label: "Delivered (Total)", value: String(analyticsStats.deliveredParcels), icon: CheckCircle, color: "text-emerald-400" },
        { label: "Total Accounts", value: String(analyticsStats.totalUsers), icon: UserCheck, color: "text-indigo-400" },
        { label: "Total Courier Agents", value: String(analyticsStats.totalStaff), icon: Users, color: "text-violet-400" }
      ]);

    } catch (e) {
      console.error("Dashboard sync error", e);
    }
  };

  useEffect(() => {
    syncData();
  }, [parcelSearch, parcelStatusFilter, parcelDelayedOnly]);

  // Web Socket.IO subscription
  useEffect(() => {
    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("[Socket] Connected to backend live broadcast server.");
    });

    socket.on("location_update", (data) => {
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

  // Auto-refresh stats every 8 seconds (slightly relaxed for DB performance)
  useEffect(() => {
    const interval = setInterval(() => {
      syncData();
    }, 8000);
    return () => clearInterval(interval);
  }, [parcelSearch, parcelStatusFilter, parcelDelayedOnly]);

  // User Actions
  const handleToggleUserStatus = async (email: string, currentStatus?: string) => {
    const targetStatus = currentStatus === "suspended" ? "active" : "suspended";
    try {
      const res = await toggleUserStatus(email, targetStatus);
      if (res.success) {
        toast.success(`User status updated to ${targetStatus}`);
        syncData();
      }
    } catch (e) {
      toast.error("Failed to update user status");
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Are you sure you want to permanently delete user account ${email}?`)) return;
    try {
      const res = await deleteUser(email);
      if (res.success) {
        toast.success(res.message || "User account deleted successfully");
        syncData();
      }
    } catch (e) {
      toast.error("Failed to delete user");
    }
  };

  // Staff CRUD Operations
  const openAddStaff = () => {
    setEditingStaffId(null);
    setStaffForm({
      name: "",
      email: "",
      phone: "",
      assigned_zone: "Delhi NCR",
      assigned_branch: "Delhi NCR Hub",
      status: "active"
    });
    setStaffModalOpen(true);
  };

  const openEditStaff = (staff: StaffMember) => {
    setEditingStaffId(staff.staff_id);
    setStaffForm({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      assigned_zone: staff.assigned_zone,
      assigned_branch: staff.assigned_branch || "Delhi NCR Hub",
      status: staff.status
    });
    setStaffModalOpen(true);
  };

  const handleStaffFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.email) {
      toast.error("Name and Email are required fields");
      return;
    }

    try {
      if (editingStaffId) {
        const res = await editStaff(editingStaffId, staffForm);
        if (res.success) {
          toast.success("Staff details updated successfully!");
          setStaffModalOpen(false);
          syncData();
        }
      } else {
        const res = await addStaff(staffForm);
        if (res.success) {
          toast.success("New staff member registered successfully!");
          setStaffModalOpen(false);
          syncData();
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Error saving staff member");
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm(`Are you sure you want to remove staff member ${staffId}?`)) return;
    try {
      const res = await deleteStaff(staffId);
      if (res.success) {
        toast.success("Staff member deleted successfully");
        syncData();
      }
    } catch (e) {
      toast.error("Failed to delete staff member");
    }
  };

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

  // Reassign Stop modal trigger
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

  // Manual Status override submit
  const handleUpdateParcelStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateParcelModal.statusText) {
      toast.error("Please enter a status description");
      return;
    }
    try {
      const res = await updateParcelStatus(
        updateParcelModal.trackingId,
        updateParcelModal.statusText,
        updateParcelModal.stage,
        updateParcelModal.location
      );
      if (res.success) {
        toast.success("Parcel status updated and logged successfully!");
        setUpdateParcelModal({ open: false, trackingId: "", statusText: "", stage: 1, location: "" });
        syncData();
      }
    } catch (err) {
      toast.error("Failed to update parcel status");
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

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await saveSystemSettings(systemSettings);
      if (res.success) {
        toast.success("System configurations persisted to MongoDB successfully!");
        syncData();
      }
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Compile markers for Admin Map View
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
        status: "moving"
      });
    });

    liveMapData.delayed_hubs.forEach((h) => {
      adminMapMarkers.push({
        id: h.id,
        lat: h.lat,
        lng: h.lng,
        label: h.label,
        status: "delayed"
      });
    });
  }

  // Filter lists based on search
  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <PageBackground image={getAdminBg(activeTab)} variant="drift" />
      <div className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3.5xl font-extrabold text-white tracking-tight">Admin Control Center</h1>
          <p className="mt-1.5 text-white/50 text-sm">Real-time AI Logistics Core Hub & Configuration Database Monitor · Welcome, {adminName || "Admin"}</p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] max-w-full overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: Compass },
            { id: "map", label: "Operations Map", icon: MapIcon },
            { id: "ml", label: "Failure AI", icon: Zap },
            { id: "users", label: "Users", icon: UserCheck },
            { id: "staff", label: "Staff Registry", icon: Users },
            { id: "parcels", label: "Parcels", icon: Package },
            { id: "ai", label: "AI Monitor", icon: Activity },
            { id: "settings", label: "Settings", icon: Sliders },
            { id: "hubs", label: "Hubs", icon: IndianRupee },
            { id: "incidents", label: "Incidents", icon: ShieldAlert },
            { id: "track", label: "Track Search", icon: Search }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-orange-500 to-violet-600 text-white shadow-lg shadow-orange-500/20"
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
      {/* TAB 1: OVERVIEW CONTROL CENTER */}
      {/* ==================================================== */}
      {activeTab === "overview" && (
        <>
          {/* Stat Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-white/50">{s.label}</span>
                  <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
                </div>
                <p className="mt-2.5 font-display text-2xl font-extrabold text-white">{s.value}</p>
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
              {systemAlerts.length === 0 ? (
                <div className="p-4 text-center text-xs text-white/35 italic">No warnings active. All processes operating within parameters.</div>
              ) : (
                systemAlerts.map((a) => (
                  <div key={a._id} className="flex items-start gap-3 p-3.5 hover:bg-white/[0.04]">
                    <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      a.type === "critical" ? "bg-red-400 animate-pulse" : a.type === "warning" ? "bg-amber-400" : "bg-blue-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80">{a.message}</p>
                      <span className="text-[10px] text-white/30">{new Date(a.timestamp).toLocaleString()}</span>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      a.type === "critical" ? "bg-red-500/10 text-red-400" : a.type === "warning" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                    }`}>{a.type}</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Charts Row */}
          <div className="mb-8 grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md">
              <h3 className="mb-4 font-display text-base font-bold text-white">Weekly Parcel Volume</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analyticsData?.weeklyVolume && analyticsData.weeklyVolume.length > 0 ? analyticsData.weeklyVolume : [
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
                    <Pie data={analyticsData?.deliveryPerformance && analyticsData.deliveryPerformance.length > 0 ? analyticsData.deliveryPerformance : [
                      { name: "On Time", value: 78 }, { name: "Slightly Delayed", value: 14 },
                      { name: "Significantly Delayed", value: 5 }, { name: "At Risk", value: 3 }
                    ]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {(analyticsData?.deliveryPerformance && analyticsData.deliveryPerformance.length > 0 ? analyticsData.deliveryPerformance : [
                        { name: "On Time", value: 78 }, { name: "Slightly Delayed", value: 14 },
                        { name: "Significantly Delayed", value: 5 }, { name: "At Risk", value: 3 }
                      ]).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap gap-2.5 justify-center">
                {(analyticsData?.deliveryPerformance && analyticsData.deliveryPerformance.length > 0 ? analyticsData.deliveryPerformance : [
                  { name: "On Time", value: 78 }, { name: "Slightly Delayed", value: 14 },
                  { name: "Significantly Delayed", value: 5 }, { name: "At Risk", value: 3 }
                ]).map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1 text-[10px] text-white/50">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    {d.name} ({d.value}%)
                  </div>
                ))}
              </div>
            </div>
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
                {predictions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-white/35 italic">No active failure risk anomalies detected.</div>
                ) : (
                  predictions.map((p) => (
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
                  ))
                )}
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
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
            <h3 className="font-display text-base font-bold text-white">Logistics Agent Directory</h3>
            <Button onClick={openAddStaff} className="bg-gradient-to-r from-orange-500 to-violet-600 hover:from-orange-600 hover:to-violet-700 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs h-10 px-4">
              <Plus className="h-4.5 w-4.5" />
              Add Courier Agent
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-white/40 uppercase tracking-wider">
                      <th className="py-2.5">Staff Details</th>
                      <th className="py-2.5">Zone Allocation</th>
                      <th className="py-2.5">Branch Office</th>
                      <th className="py-2.5">Performance Rating</th>
                      <th className="py-2.5">Service Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-white/80">
                    {staffList.map((s) => (
                      <tr key={s.staff_id} className="hover:bg-white/[0.02]">
                        <td className="py-3">
                          <div className="font-semibold text-white">{s.name} <span className="text-[10px] text-white/40">({s.staff_id})</span></div>
                          <div className="text-[10px] text-white/40">{s.email} · {s.phone}</div>
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
                          <span className="bg-white/5 border border-white/[0.06] text-white/70 px-2.5 py-1 rounded-lg text-[10px] font-mono">
                            {s.assigned_branch || "Delhi NCR Hub"}
                          </span>
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
                        <td className="py-3 text-right space-x-1.5">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => openEditStaff(s)}
                            className="border-white/10 bg-white/5 text-white/80 hover:bg-white/10 text-[10px] rounded-lg"
                          >
                            <Edit className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => setReassignModal({ open: true, trackingId: "", agent: s.name })}
                            className="border-white/10 bg-white/5 text-orange-400 hover:bg-white/10 text-[10px] rounded-lg"
                          >
                            Assign Stop
                          </Button>
                          <Button
                            size="xs"
                            onClick={() => handleDeleteStaff(s.staff_id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] rounded-lg"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: USER ACCOUNT MANAGEMENT */}
      {/* ==================================================== */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
            <h3 className="font-display text-base font-bold text-white">User Accounts Monitor</h3>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 z-10" />
              <input
                type="text"
                placeholder="Search accounts by name/email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-[#0c0a15] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] text-white/40 uppercase tracking-wider">
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Email address</th>
                    <th className="py-2.5">Authorization Role</th>
                    <th className="py-2.5">Registered Date</th>
                    <th className="py-2.5">Account Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-white/80">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-white/40 italic">No user accounts found.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.email} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-semibold text-white">{u.name}</td>
                        <td className="py-3 font-mono text-white/60">{u.email}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            u.role === "admin" ? "bg-red-500/10 text-red-400" :
                            u.role === "staff" ? "bg-violet-500/10 text-violet-400" :
                            "bg-blue-500/10 text-blue-400"
                          }`}>{u.role}</span>
                        </td>
                        <td className="py-3 text-white/40">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "Prior migration"}
                        </td>
                        <td className="py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black ${
                            u.status === "suspended" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                          }`}>
                            {u.status || "active"}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-1.5">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleToggleUserStatus(u.email, u.status)}
                            className={`border-white/10 text-xs rounded-lg ${
                              u.status === "suspended" 
                                ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20" 
                                : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20"
                            }`}
                          >
                            {u.status === "suspended" ? "Activate" : "Suspend"}
                          </Button>
                          <Button
                            size="xs"
                            onClick={() => handleDeleteUser(u.email)}
                            className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 text-xs rounded-lg"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 6: PARCEL CONTROL REGISTRY */}
      {/* ==================================================== */}
      {activeTab === "parcels" && (
        <div className="space-y-6">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl">
            <h3 className="font-display text-base font-bold text-white shrink-0">Logistics Cargo Registry</h3>
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <div className="relative flex-1 xl:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 z-10" />
                <input
                  type="text"
                  placeholder="Search by Tracking ID/sender/receiver..."
                  value={parcelSearch}
                  onChange={(e) => setParcelSearch(e.target.value)}
                  className="w-full bg-[#0c0a15] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-orange-500"
                />
              </div>

              <select
                value={parcelStatusFilter === undefined ? "all" : String(parcelStatusFilter)}
                onChange={(e) => setParcelStatusFilter(e.target.value === "all" ? undefined : Number(e.target.value))}
                className="bg-[#0c0a15] border border-white/10 rounded-xl text-white px-3 py-2 outline-none text-xs"
              >
                <option value="all">All Stages</option>
                <option value="1">Stage 1: Booked</option>
                <option value="2">Stage 2: Picked Up</option>
                <option value="3">Stage 3: Source PO</option>
                <option value="4">Stage 4: In Transit</option>
                <option value="5">Stage 5: Sorting Hub</option>
                <option value="6">Stage 6: Out for Delivery</option>
                <option value="7">Stage 7: Delivered</option>
                <option value="-1">Stage -1: Delivery Failed</option>
              </select>

              <button
                onClick={() => setParcelDelayedOnly(!parcelDelayedOnly)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  parcelDelayedOnly 
                    ? "bg-red-500/10 border-red-500/20 text-red-400" 
                    : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                Delayed Only
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] text-white/40 uppercase tracking-wider">
                    <th className="py-2.5">Tracking ID</th>
                    <th className="py-2.5">Sender</th>
                    <th className="py-2.5">Receiver</th>
                    <th className="py-2.5">Weight / Type</th>
                    <th className="py-2.5">Estimated ETA</th>
                    <th className="py-2.5">Current Stage</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-white/80">
                  {parcelsList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-white/40 italic">No packages matching criteria in database.</td>
                    </tr>
                  ) : (
                    parcelsList.map((p) => {
                      const isDelivered = p.manual_stage_override === 7;
                      const isFailed = p.manual_stage_override === -1;
                      
                      // Check for delay: eta expired and not delivered
                      const nowStr = new Date().toISOString().split('T')[0];
                      const isDelayed = (p.eta < nowStr && !isDelivered) || isFailed;

                      return (
                        <tr key={p.tracking_id} className="hover:bg-white/[0.02]">
                          <td className="py-3 font-mono font-bold text-orange-400">{p.tracking_id}</td>
                          <td className="py-3">
                            <div className="font-semibold text-white">{p.sender_name}</div>
                            <div className="text-[9px] text-white/40">{p.source_po}</div>
                          </td>
                          <td className="py-3">
                            <div className="font-semibold text-white">{p.receiver_name}</div>
                            <div className="text-[9px] text-white/40">{p.destination_address.split(',')[0]}</div>
                          </td>
                          <td className="py-3">
                            <div className="font-semibold text-white">{p.weight} KG</div>
                            <div className="text-[9px] text-white/40 uppercase">{p.parcel_type}</div>
                          </td>
                          <td className="py-3">
                            <div className="text-white/80">{p.eta}</div>
                            {isDelayed && (
                              <span className="text-[9px] text-red-400 font-bold uppercase animate-pulse">SLA Delayed</span>
                            )}
                          </td>
                          <td className="py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              isDelivered ? "bg-emerald-500/10 text-emerald-400" :
                              isFailed ? "bg-red-500/10 text-red-400" :
                              isDelayed ? "bg-amber-500/10 text-amber-400 animate-pulse" :
                              "bg-blue-500/10 text-blue-400"
                            }`}>
                              {isDelivered ? "Delivered" : isFailed ? "Failed" : `Stage ${p.manual_stage_override || 1}`}
                            </span>
                          </td>
                          <td className="py-3 font-semibold text-emerald-400">₹{p.price_total}</td>
                          <td className="py-3 text-right">
                            <Button
                              size="xs"
                              onClick={() => setUpdateParcelModal({
                                open: true,
                                trackingId: p.tracking_id,
                                statusText: "Sorted at Facility",
                                stage: p.manual_stage_override || 1,
                                location: p.dest_po || "Sorting Hub"
                              })}
                              className="border-white/10 bg-white/5 text-orange-400 hover:bg-white/10 text-[10px] rounded-lg"
                            >
                              Update Status
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 7: AI ANOMALIES & AUDITS MONITOR */}
      {/* ==================================================== */}
      {activeTab === "ai" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Active anomalies */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="font-display text-base font-bold text-white">Flagged Logistics Anomalies</h3>
              </div>
              <div className="divide-y divide-white/[0.06] max-h-[300px] overflow-y-auto pr-1">
                {aiMonitoring?.anomalies.length === 0 ? (
                  <div className="py-6 text-center text-xs text-white/35 italic">No active anomalies detected in logs.</div>
                ) : (
                  aiMonitoring?.anomalies.map((a, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs font-bold text-orange-400">{a.tracking_id}</span>
                        <p className="text-xs text-white/80 mt-1">{a.message || "Shipment duration anomaly triggered"}</p>
                        <span className="text-[10px] text-white/30">{new Date(a.created_at).toLocaleString()}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        a.severity === "Critical" ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-amber-500/20 text-amber-400"
                      }`}>{a.severity}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Delay Predictions */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-violet-400" />
                <h3 className="font-display text-base font-bold text-white">ML Predictive Delay Analysis</h3>
              </div>
              <div className="divide-y divide-white/[0.06] max-h-[300px] overflow-y-auto pr-1">
                {aiMonitoring?.predictions.length === 0 ? (
                  <div className="py-6 text-center text-xs text-white/35 italic">No delay predictions logged.</div>
                ) : (
                  aiMonitoring?.predictions.map((p, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-center">
                      <div>
                        <span className="font-mono text-xs font-bold text-orange-400">{p.tracking_id}</span>
                        <p className="text-xs text-white/50 mt-0.5">Risk score: {p.risk_score} · {p.risk_level} Level</p>
                      </div>
                      <span className="text-xs font-bold text-white font-mono">{p.risk_level} Risk</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Security Alerts */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4.5 w-4.5 text-red-500" />
                <h3 className="font-display text-xs text-white/40 uppercase tracking-widest font-black">Fraud alerts</h3>
              </div>
              <div className="space-y-3">
                {aiMonitoring?.fraudAlerts.length === 0 ? (
                  <div className="py-4 text-center text-xs text-white/30 italic">No security warnings logged today.</div>
                ) : (
                  aiMonitoring?.fraudAlerts.map((f, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 space-y-1">
                      <span className="text-[9px] font-black uppercase text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Security Alert</span>
                      <p className="text-xs text-white/70 mt-1 leading-relaxed">{f.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Validation Audit Logs */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4.5 w-4.5 text-orange-400" />
                <h3 className="font-display text-xs text-white/40 uppercase tracking-widest font-black">OTP Validation log</h3>
              </div>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {aiMonitoring?.validationLogs.length === 0 ? (
                  <div className="text-center text-xs text-white/30 italic">No verification audits logged.</div>
                ) : (
                  aiMonitoring?.validationLogs.map((l, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl border border-white/[0.04] bg-[#0c0a15] text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="font-bold text-white/70">{l.tracking_id}</span>
                        <span className={`font-black uppercase text-[8px] px-1.5 py-0.2 rounded ${
                          l.verified ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>{l.verified ? "Verified" : "Pending"}</span>
                      </div>
                      <p className="text-white/40 text-[9px]">OTP type: {l.otp_type} · Attempts: {l.attempts}/3</p>
                      {l.verified_at && (
                        <span className="text-white/25 block text-[8px]">Verified at {new Date(l.verified_at).toLocaleTimeString()}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 8: GLOBAL SYSTEM CONFIGURATION */}
      {/* ==================================================== */}
      {activeTab === "settings" && (
        <div className="max-w-2xl mx-auto rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-4">
            <Sliders className="h-5 w-5 text-orange-400" />
            <h3 className="font-display text-lg font-bold text-white">Global System Configuration</h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-white/40 uppercase font-black block mb-1.5">System Operational Status</label>
                <select
                  value={systemSettings.system_status}
                  onChange={(e) => setSystemSettings({ ...systemSettings, system_status: e.target.value as any })}
                  className="w-full bg-[#0c0a15] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                >
                  <option value="normal">Normal Flow (nominal operations)</option>
                  <option value="restricted">Restricted Corridors (delay rerouting)</option>
                  <option value="maintenance">System Maintenance</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase font-black block mb-1.5">SLA Delay threshold (hours)</label>
                <input
                  type="number"
                  value={systemSettings.delay_threshold_hours}
                  onChange={(e) => setSystemSettings({ ...systemSettings, delay_threshold_hours: Number(e.target.value) })}
                  className="w-full bg-[#0c0a15] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/40 uppercase font-black block mb-1.5">
                AI delay prediction confidence limit ({Math.round(systemSettings.ai_confidence_threshold * 100)}%)
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={systemSettings.ai_confidence_threshold}
                onChange={(e) => setSystemSettings({ ...systemSettings, ai_confidence_threshold: Number(e.target.value) })}
                className="w-full accent-orange-500"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                <div>
                  <span className="text-xs font-bold text-white block">Auto Agent Zone Allocation</span>
                  <span className="text-[10px] text-white/40 leading-normal block">Automatically delegate cargo to closest courier staff</span>
                </div>
                <input
                  type="checkbox"
                  checked={systemSettings.auto_assign_agents}
                  onChange={(e) => setSystemSettings({ ...systemSettings, auto_assign_agents: e.target.checked })}
                  className="h-4 w-4 accent-orange-500 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                <div>
                  <span className="text-xs font-bold text-white block">Emergency Maintenance Offline Lock</span>
                  <span className="text-[10px] text-white/40 leading-normal block">Disable booking features during server database updates</span>
                </div>
                <input
                  type="checkbox"
                  checked={systemSettings.maintenance_mode}
                  onChange={(e) => setSystemSettings({ ...systemSettings, maintenance_mode: e.target.checked })}
                  className="h-4 w-4 accent-orange-500 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-white/[0.06]">
              <Button type="submit" disabled={savingSettings} className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl px-6 py-2.5 h-11 text-xs">
                {savingSettings ? "Persisting settings..." : "Commit changes to MongoDB"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 9: FINANCIALS & HUBS MONITORINGS */}
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
      {/* TAB 10: INCIDENT RESOLUTIONS SCREEN */}
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
      {/* TAB 11: UNIVERSAL SEARCH & TRACK TIMELINE */}
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

      {/* ==================================================== */}
      {/* MODALS */}
      {/* ==================================================== */}

      {/* 1. Reassign Agent Stop Modal */}
      {reassignModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d16] p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
              <h4 className="font-display text-base font-bold text-white">Reassign Courier Agent Stop</h4>
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

      {/* 2. Add / Edit Staff Modal */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleStaffFormSubmit} className="rounded-2xl border border-white/[0.08] bg-[#0d0d16] p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
              <h4 className="font-display text-base font-bold text-white">
                {editingStaffId ? "Edit Courier Staff Details" : "Register New Courier Agent"}
              </h4>
              <button type="button" onClick={() => setStaffModalOpen(false)} className="text-white/35 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3.5">
              <div>
                <label className="text-xs text-white/40 uppercase font-black block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Rahul Sharma"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full bg-[#0c0a15] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase font-black block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="rahul@aipostal.com"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full bg-[#0c0a15] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase font-black block mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  className="w-full bg-[#0c0a15] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 uppercase font-black block mb-1">Assigned Zone</label>
                  <select
                    value={staffForm.assigned_zone}
                    onChange={(e) => setStaffForm({ ...staffForm, assigned_zone: e.target.value })}
                    className="w-full bg-[#0c0a15] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Mumbai Central">Mumbai Central</option>
                    <option value="Bangalore Hub">Bangalore Hub</option>
                    <option value="Pune GPO">Pune GPO</option>
                    <option value="Hyderabad City">Hyderabad City</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase font-black block mb-1">Assigned Branch</label>
                  <select
                    value={staffForm.assigned_branch}
                    onChange={(e) => setStaffForm({ ...staffForm, assigned_branch: e.target.value })}
                    className="w-full bg-[#0c0a15] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="Delhi NCR Hub">Delhi NCR Hub</option>
                    <option value="Mumbai central GPO">Mumbai central GPO</option>
                    <option value="Bangalore GPO">Bangalore GPO</option>
                    <option value="Chennai Main GPO">Chennai Main GPO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase font-black block mb-1">Agent Status</label>
                <select
                  value={staffForm.status}
                  onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value as any })}
                  className="w-full bg-[#0c0a15] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-orange-500 outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-white/[0.06]">
              <Button type="button" size="sm" variant="ghost" onClick={() => setStaffModalOpen(false)} className="text-white/45">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg px-4">
                {editingStaffId ? "Save changes" : "Register Staff"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Update Parcel Status Override Modal */}
      {updateParcelModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleUpdateParcelStatus} className="rounded-2xl border border-white/[0.08] bg-[#0d0d16] p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
              <h4 className="font-display text-base font-bold text-white">Manual Parcel Override</h4>
              <button type="button" onClick={() => setUpdateParcelModal({ ...updateParcelModal, open: false })} className="text-white/35 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3.5">
              <div>
                <label className="text-xs text-white/40 uppercase font-black block mb-1">Tracking ID</label>
                <input
                  type="text"
                  disabled
                  value={updateParcelModal.trackingId}
                  className="w-full bg-[#0c0a15]/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white/40 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase font-black block mb-1">Status Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arrived at Sorting Facility"
                  value={updateParcelModal.statusText}
                  onChange={(e) => setUpdateParcelModal({ ...updateParcelModal, statusText: e.target.value })}
                  className="w-full bg-[#0c0a15] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/40 uppercase font-black block mb-1">Manual Stage Override</label>
                  <select
                    value={updateParcelModal.stage}
                    onChange={(e) => setUpdateParcelModal({ ...updateParcelModal, stage: Number(e.target.value) })}
                    className="w-full bg-[#0c0a15] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="1">Stage 1: Booked</option>
                    <option value="2">Stage 2: Picked Up</option>
                    <option value="3">Stage 3: At Source PO</option>
                    <option value="4">Stage 4: In Transit</option>
                    <option value="5">Stage 5: At Sorting Hub</option>
                    <option value="6">Stage 6: Out for Delivery</option>
                    <option value="7">Stage 7: Delivered</option>
                    <option value="-1">Stage -1: Delivery Failed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/40 uppercase font-black block mb-1">Current Hub Location</label>
                  <input
                    type="text"
                    placeholder="Delhi Hub / Recipient Address"
                    value={updateParcelModal.location}
                    onChange={(e) => setUpdateParcelModal({ ...updateParcelModal, location: e.target.value })}
                    className="w-full bg-[#0c0a15] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-orange-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-white/[0.06]">
              <Button type="button" size="sm" variant="ghost" onClick={() => setUpdateParcelModal({ ...updateParcelModal, open: false })} className="text-white/45">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg px-4">
                Update Status Override
              </Button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
