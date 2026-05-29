import DashboardLayout from "@/components/DashboardLayout";
import { Package, Truck, AlertTriangle, CheckCircle, Users, Clock, Trophy, IndianRupee, Bell, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { useState } from "react";

const stats = [
  { label: "Total Parcels", value: "1,247", icon: Package, color: "text-orange-400" },
  { label: "In Transit", value: "342", icon: Truck, color: "text-blue-400" },
  { label: "Delayed", value: "28", icon: AlertTriangle, color: "text-red-400" },
  { label: "Delivered Today", value: "89", icon: CheckCircle, color: "text-emerald-400" },
  { label: "Active Staff", value: "24", icon: Users, color: "text-indigo-400" },
  { label: "Avg Delivery Time", value: "2.1 days", icon: Clock, color: "text-violet-400" },
];

const barData = [
  { name: "Mon", parcels: 145 }, { name: "Tue", parcels: 178 },
  { name: "Wed", parcels: 162 }, { name: "Thu", parcels: 198 },
  { name: "Fri", parcels: 210 }, { name: "Sat", parcels: 130 },
  { name: "Sun", parcels: 85 },
];

const pieData = [
  { name: "On Time", value: 78 }, { name: "Slightly Delayed", value: 14 },
  { name: "Significantly Delayed", value: 5 }, { name: "At Risk", value: 3 },
];

const COLORS = ["hsl(142, 70%, 45%)", "hsl(38, 92%, 50%)", "hsl(25, 95%, 53%)", "hsl(0, 84%, 60%)"];

const revenueData = [
  { name: "Jan", revenue: 42000 }, { name: "Feb", revenue: 58000 },
  { name: "Mar", revenue: 51000 }, { name: "Apr", revenue: 67000 },
  { name: "May", revenue: 73000 }, { name: "Jun", revenue: 81000 },
];

const leaderboard = [
  { rank: 1, name: "Rahul Sharma", deliveries: 142, rating: 4.9, onTime: "97%", badge: "🥇" },
  { rank: 2, name: "Priya Patel", deliveries: 138, rating: 4.8, onTime: "95%", badge: "🥈" },
  { rank: 3, name: "Amit Kumar", deliveries: 125, rating: 4.7, onTime: "93%", badge: "🥉" },
  { rank: 4, name: "Sneha Reddy", deliveries: 118, rating: 4.6, onTime: "91%", badge: "" },
  { rank: 5, name: "Vikram Singh", deliveries: 110, rating: 4.5, onTime: "89%", badge: "" },
];

const heatmapRegions = [
  { name: "Delhi NCR", parcels: 312, delays: 8, density: "high" },
  { name: "Mumbai", parcels: 278, delays: 12, density: "high" },
  { name: "Bangalore", parcels: 195, delays: 3, density: "medium" },
  { name: "Chennai", parcels: 142, delays: 5, density: "medium" },
  { name: "Kolkata", parcels: 98, delays: 15, density: "low" },
  { name: "Hyderabad", parcels: 112, delays: 2, density: "medium" },
  { name: "Pune", parcels: 87, delays: 1, density: "low" },
  { name: "Jaipur", parcels: 63, delays: 7, density: "low" },
];

const systemAlerts = [
  { id: 1, type: "critical", msg: "SLA breach: 15 parcels exceeded 48-hour delivery in MH-DL corridor", time: "5m ago" },
  { id: 2, type: "warning", msg: "Sorting center Delhi Hub operating at 95% capacity", time: "12m ago" },
  { id: 3, type: "critical", msg: "Route failure: Pune-Kolkata route — 3 parcels stuck at Nagpur", time: "28m ago" },
  { id: 4, type: "info", msg: "New staff member Arjun Nair onboarded — assigned Bangalore zone", time: "1h ago" },
  { id: 5, type: "warning", msg: "Weather alert: Heavy rain forecast in Chennai — expected delivery delays", time: "2h ago" },
];

const anomalies = [
  { id: "AP-20260099", issue: "Stuck at sorting center for 72+ hours", severity: "Critical", office: "Delhi Hub" },
  { id: "AP-20260087", issue: "Repeated route failure on MH-RJ corridor", severity: "High", office: "Pune GPO" },
  { id: "Route MH-KA", issue: "3x normal transit time this week", severity: "Medium", office: "Mumbai Central" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-sm text-white shadow-lg">
        <p className="text-white/50">{label}</p>
        <p className="font-semibold text-orange-400">{typeof payload[0].value === "number" && payload[0].value > 1000 ? `₹${(payload[0].value / 1000).toFixed(0)}K` : payload[0].value} {payload[0].dataKey === "parcels" ? "parcels" : ""}</p>
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="mt-1 text-white/50">System overview and AI analytics</p>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm">
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
        className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-white/[0.06] p-4">
          <Bell className="h-4 w-4 text-red-400 animate-pulse" />
          <h3 className="font-display text-sm font-semibold text-white">Real-time System Alerts</h3>
          <span className="ml-auto rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400">{systemAlerts.filter(a => a.type === "critical").length} critical</span>
        </div>
        <div className="max-h-[200px] overflow-y-auto divide-y divide-white/[0.06]">
          {systemAlerts.map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-3 hover:bg-white/[0.04]">
              <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                a.type === "critical" ? "bg-red-400 animate-pulse" : a.type === "warning" ? "bg-amber-400" : "bg-blue-400"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80">{a.msg}</p>
                <span className="text-xs text-white/30">{a.time}</span>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                a.type === "critical" ? "bg-red-500/10 text-red-400" : a.type === "warning" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
              }`}>{a.type}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="mb-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
          <h3 className="mb-4 font-display text-lg font-semibold text-white">Weekly Parcel Volume</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "rgba(255,255,255,0.4)" }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="parcels" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
          <h3 className="mb-4 font-display text-lg font-semibold text-white">Delivery Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-3 justify-center">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-white/50">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {d.name} ({d.value}%)
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue & Heatmap */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Revenue Analytics */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-emerald-400" />
            <h3 className="font-display text-lg font-semibold text-white">Revenue Analytics</h3>
          </div>
          <div className="mb-4 flex gap-4">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 flex-1">
              <p className="text-xs text-white/40">This Month</p>
              <p className="font-display text-xl font-bold text-emerald-400">₹81,000</p>
              <p className="text-xs text-emerald-400/60">+11% vs last month</p>
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 flex-1">
              <p className="text-xs text-white/40">YTD Revenue</p>
              <p className="font-display text-xl font-bold text-white">₹3,72,000</p>
              <p className="text-xs text-white/40">Avg ₹62K/month</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={revenueData}>
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

        {/* Live Heatmap */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-400" />
              <h3 className="font-display text-lg font-semibold text-white">Regional Heatmap</h3>
            </div>
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />Live
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {heatmapRegions.map((r) => (
              <div key={r.name} className={`rounded-lg border p-3 ${
                r.density === "high" ? "border-orange-500/30 bg-orange-500/5" :
                r.density === "medium" ? "border-blue-500/20 bg-blue-500/5" :
                "border-white/[0.06] bg-white/[0.03]"
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white/80">{r.name}</span>
                  {r.delays > 5 && <AlertTriangle className="h-3 w-3 text-amber-400" />}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-white/40">{r.parcels} parcels</span>
                  <span className={`text-xs ${r.delays > 5 ? "text-red-400" : "text-emerald-400"}`}>{r.delays} delays</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-3 justify-center">
            <div className="flex items-center gap-1.5 text-[10px] text-white/40">
              <span className="h-2.5 w-2.5 rounded bg-orange-500/30" /> High Density
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/40">
              <span className="h-2.5 w-2.5 rounded bg-blue-500/20" /> Medium
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/40">
              <span className="h-2.5 w-2.5 rounded bg-white/10" /> Low
            </div>
          </div>
        </motion.div>
      </div>

      {/* Staff Leaderboard & Anomalies */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Staff Leaderboard */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
          <div className="flex items-center gap-2 border-b border-white/[0.06] p-5">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h2 className="font-display text-lg font-semibold text-white">Staff Leaderboard</h2>
            <span className="ml-auto text-xs text-white/30">This month</span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {leaderboard.map((s) => (
              <div key={s.rank} className="flex items-center gap-4 p-4 hover:bg-white/[0.04]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-sm font-bold text-white/60">
                  {s.badge || `#${s.rank}`}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <p className="text-xs text-white/40">{s.deliveries} deliveries · {s.onTime} on-time</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5">
                  <span className="text-xs font-medium text-amber-400">★ {s.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Anomalies */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
          <div className="flex items-center gap-2 border-b border-white/[0.06] p-5">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h2 className="font-display text-lg font-semibold text-white">AI Anomaly Detection</h2>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {anomalies.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-5 hover:bg-white/[0.04]">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-orange-400">{a.id}</span>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      a.severity === "Critical" ? "bg-red-500/10 text-red-400" :
                      a.severity === "High" ? "bg-amber-500/10 text-amber-400" :
                      "bg-blue-500/10 text-blue-400"
                    }`}>{a.severity}</span>
                  </div>
                  <p className="mt-1 text-sm text-white/50">{a.issue}</p>
                </div>
                <span className="text-xs text-white/40">{a.office}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
