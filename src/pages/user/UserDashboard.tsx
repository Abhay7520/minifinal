import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PageBackground from "@/components/PageBackground";
import bgDashboard from "@/assets/bg-dashboard.jpg";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import { BarChart3, Package, MapPin, Clock, TrendingUp, Sparkles, ArrowRight, AlertTriangle } from "lucide-react";

import { apiGet } from "@/lib/api";
import { getAllParcels } from "@/services/parcelService";

type WeeklyActivityPoint = { day: string; parcels: number };

type MonthlyOverviewPoint = { month: string; sent: number; received: number };

type DashboardAlert = {
  anomaly_id: string;
  tracking_id: string;
  anomaly_type: string;
  severity: string;
  created_at: string;
  resolved: boolean;
  eta: string;
};

type DashboardResponse = {
  activeParcels: number;
  deliveredParcels: number;
  delayedParcels: number;
  returnedParcels: number;
  weeklyActivity: WeeklyActivityPoint[];
  monthlyOverview: MonthlyOverviewPoint[];
  nextEta: string;
  alerts?: DashboardAlert[];
};

async function fetchMyDashboard(): Promise<DashboardResponse> {
  return apiGet<DashboardResponse>("/me/dashboard");
}



const CustomTooltip = ({
  active,

  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#12121a] px-3 py-2 text-xs text-white shadow-lg">
        <p className="text-white/50">{label}</p>
        <p className="font-semibold text-orange-400">{payload[0].value} parcels</p>
      </div>
    );
  }
  return null;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

export default function UserDashboard() {
  const [loading, setLoading] = useState(true);

  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  // chart data is sourced from GET /me/dashboard
  // (kept in state to allow rerendering on refetch)
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityPoint[]>([]);
  const [monthlyOverview, setMonthlyOverview] = useState<MonthlyOverviewPoint[]>([]);
  const [recentParcels, setRecentParcels] = useState<any[]>([]);

  const greeting = useMemo(() => getGreeting(), []);



  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetchMyDashboard();
        const parcelsRes = await getAllParcels();
        if (cancelled) return;
        setDashboard(res);
        setWeeklyActivity(res.weeklyActivity || []);
        setMonthlyOverview(res.monthlyOverview || []);
        setRecentParcels((parcelsRes || []).slice(0, 4));
      } catch (e) {
        console.error("Failed to load dashboard data:", e);
        if (cancelled) return;
        setDashboard(null);
        setWeeklyActivity([]);
        setMonthlyOverview([]);
        setRecentParcels([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);


  const activeCount = dashboard?.activeParcels ?? 0;
  const deliveredParcelsCount = dashboard?.deliveredParcels ?? 0;
  const weeklyActivityData = dashboard?.weeklyActivity ?? [];
  const monthlyOverviewData = dashboard?.monthlyOverview ?? [];

  return (


    <DashboardLayout role="user">
      <PageBackground image={bgDashboard} variant="drift" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-2xl border border-white/[0.08] bg-gradient-to-r from-orange-500/10 via-violet-500/5 to-transparent p-6 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-medium uppercase tracking-wider text-orange-400/80">
                AI Postal Dashboard
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold text-white">{greeting} 👋</h1>
            <p className="mt-1 text-white/50">
              You have <span className="font-semibold text-orange-400">{activeCount}</span> active parcels being tracked.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <Link to="/user/book">
              <Button className="bg-gradient-to-r from-orange-500 to-violet-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:opacity-90 transition-all">
                <Package className="mr-2 h-4 w-4" /> Book New Parcel
              </Button>
            </Link>
            <Link to="/user/track">
              <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                <MapPin className="mr-2 h-4 w-4" /> Track Parcel
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* AI Delay Detection Alert Banner */}
      {dashboard?.alerts && dashboard.alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 space-y-3"
        >
          {dashboard.alerts.map((alert) => (
            <div
              key={alert.anomaly_id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 backdrop-blur-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                  <AlertTriangle className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-red-400">
                      AI Delay Detection Alert
                    </span>
                    <span className="rounded bg-red-500/25 px-1.5 py-0.5 text-[9px] font-bold text-red-200">
                      {alert.anomaly_id}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-1">
                    Shipment {alert.tracking_id} is delayed
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    ETA was {alert.eta ? new Date(alert.eta).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}. Active anomaly logged in MongoDB.
                  </p>
                </div>
              </div>
              <Link to={`/user/track?id=${alert.tracking_id}`}>
                <Button size="sm" className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-500/20 self-start sm:self-auto gap-1 border-0">
                  Track Parcel <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          ))}
        </motion.div>
      )}

      {dashboard?.nextEta ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-xl border border-white/[0.08] bg-gradient-to-r from-violet-500/10 via-orange-500/10 to-transparent p-5 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Clock className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-orange-400/80">Next Expected Delivery (ETA)</h4>
              <p className="text-lg font-bold text-white mt-0.5">
                Arriving on {new Date(dashboard.nextEta).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <Link to="/user/track">
            <Button variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10 gap-1">
              Track Shipments <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </motion.div>
      ) : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[ 
          {



            label: "Active Parcels",
            value: String(activeCount),
            icon: Package,
            color: "text-orange-400",
            bg: "from-orange-500/20 to-orange-500/5",
            border: "border-orange-500/20",
            trend: "Current",
            trendUp: true,
          },
          {
            label: "Delivered",
            value: String(deliveredParcelsCount),
            icon: MapPin,
            color: "text-emerald-400",
            bg: "from-emerald-500/20 to-emerald-500/5",
            border: "border-emerald-500/20",
            trend: "Completed",
            trendUp: true,
          },
          {
            label: "Delayed",
            value: String(dashboard?.delayedParcels ?? 0),
            icon: Clock,
            color: "text-indigo-400",
            bg: "from-indigo-500/20 to-indigo-500/5",
            border: "border-indigo-500/20",
            trend: "Past ETA",
            trendUp: false,
          },
          {
            label: "Returned",
            value: String(dashboard?.returnedParcels ?? 0),
            icon: TrendingUp,
            color: "text-violet-400",
            bg: "from-violet-500/20 to-violet-500/5",
            border: "border-violet-500/20",
            trend: "Lifecycle",
            trendUp: false,
          },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group relative overflow-hidden rounded-xl border ${s.border} bg-gradient-to-b ${s.bg} p-5 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">{s.label}</span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 font-display text-3xl font-bold text-white">{s.value}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-white/30">
              {s.trendUp && <TrendingUp className="h-3 w-3 text-emerald-400" />}
              {s.trend}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mb-8 flex gap-3 lg:hidden">
        <Link to="/user/book" className="flex-1">
          <Button className="w-full bg-gradient-to-r from-orange-500 to-violet-600 text-white hover:opacity-90">
            <Package className="mr-2 h-4 w-4" /> Book Parcel
          </Button>
        </Link>
        <Link to="/user/track" className="flex-1">
          <Button variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10">
            <MapPin className="mr-2 h-4 w-4" /> Track
          </Button>
        </Link>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm lg:col-span-1"
        >
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-400" />
            <h3 className="font-display text-sm font-semibold text-white">Weekly Activity</h3>
          </div>

          {weeklyActivityData.length ? (

            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={weeklyActivityData}>

                <defs>
                  <linearGradient id="userActivityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="parcels" stroke="hsl(25, 95%, 53%)" fill="url(#userActivityGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-white/40">No weekly activity data yet.</div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-violet-400" />
              <h3 className="font-display text-sm font-semibold text-white">Recent Parcels</h3>
            </div>
            <Link to="/user/orders">
              <Button size="sm" variant="ghost" className="text-xs text-white/40 hover:text-white">
                View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {recentParcels && recentParcels.length > 0 ? (
            <div className="space-y-3">
              {recentParcels.map((parcel) => (
                <div
                  key={parcel.tracking_id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.05]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-orange-400">
                          {parcel.tracking_id}
                        </span>
                        <span className="text-[10px] text-white/30 capitalize">
                          {parcel.parcel_type ?? "standard"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-white/50 line-clamp-1 max-w-[250px] sm:max-w-[320px]">
                        {parcel.source_address.split(",")[0]} → {parcel.destination_address.split(",")[0]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 mt-1 sm:mt-0">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        parcel.status === "Delivered"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : parcel.status === "Delayed"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : parcel.status === "Returned"
                          ? "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {parcel.status}
                    </span>
                    <Link to={`/user/track?id=${parcel.tracking_id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-white/45 hover:text-white hover:bg-white/[0.06] px-2 gap-1 text-xs"
                      >
                        Track <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Package className="h-8 w-8 text-white/10 mb-2" />
              <p className="text-xs text-white/40">No recent parcels found</p>
              <Link to="/user/book" className="mt-2">
                <Button size="sm" className="h-8 bg-gradient-to-r from-orange-500 to-violet-600 text-white text-xs font-bold hover:opacity-90">
                  Book A Parcel
                </Button>
              </Link>
            </div>
          )}

        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-violet-400" />
          <h3 className="font-display text-sm font-semibold text-white">Monthly Overview</h3>
        </div>

          {monthlyOverviewData.length ? (
            <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyOverviewData} barGap={4}>

              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sent" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} opacity={0.8} />
              <Bar dataKey="received" fill="hsl(270, 70%, 60%)" radius={[4, 4, 0, 0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-sm text-white/40">No monthly overview data yet.</div>
        )}
      </motion.div>

      {loading ? (
        <div className="mt-6 text-center text-xs text-white/40">Loading...</div>
      ) : null}
    </DashboardLayout>
  );
}

