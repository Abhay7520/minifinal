import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PageBackground from "@/components/PageBackground";
import bgOrders from "@/assets/bg-orders.jpg";
import { Link } from "react-router-dom";
import {
  MapPin,
  Package,
  RefreshCw,
  Inbox,
  Mail,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { getAllParcels } from "@/services/parcelService";


type Parcel = {
  tracking_id: string;
  source_address: string;
  destination_address: string;
  created_at?: string;
  status: string;
  parcel_type?: string;
};

const statusStyle: Record<string, string> = {
  "Delivered": "bg-emerald-500/10 text-emerald-400",
  "In Transit": "bg-blue-500/10 text-blue-400",
  "Out for Delivery": "bg-sky-500/10 text-sky-400",
  "Processing": "bg-amber-500/10 text-amber-400",
  "Parcel Booked": "bg-orange-500/10 text-orange-400",
  "Picked Up": "bg-violet-500/10 text-violet-400",
  "At Source Post Office": "bg-indigo-500/10 text-indigo-400",
  "At Sorting Hub": "bg-purple-500/10 text-purple-400",
};

const getStatusStyle = (status: string) =>
  statusStyle[status] ?? "bg-white/10 text-white/60";

const formatDate = (raw?: string) => {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const shortAddr = (addr: string) => addr.split(",").slice(0, 2).join(",").trim();

const UserOrders = () => {
  const [orders, setOrders] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const postalIcons = [Package, Mail, Truck];

  const floatingItems = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    duration: 10 + Math.random() * 6,
    delay: Math.random() * 4,
    size: 24 + Math.random() * 24,
    iconIndex: Math.floor(Math.random() * postalIcons.length),

  }));


  const fetchOrders = () => {
    setLoading(true);
    setError(null);
    getAllParcels()
      .then(setOrders)
      .catch(() => setError("Failed to load orders. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <DashboardLayout role="user">
       <PageBackground image={bgOrders} variant="pulse" />
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">My Orders</h1>
            <p className="mt-1 text-white/50">
              {loading ? "Loading your parcels…" : `${orders.length} parcel${orders.length !== 1 ? "s" : ""} found`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              disabled={loading}
              className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Link to="/user/book">
              <Button
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-violet-600 text-white font-bold hover:opacity-90 shadow-md shadow-orange-500/20"
              >
                <Package className="mr-1.5 h-3.5 w-3.5" /> Book New
              </Button>
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/25 bg-red-500/8 px-5 py-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Table card */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm overflow-hidden">

          {/* Loading skeleton */}
          {loading && (
            <div className="divide-y divide-white/[0.06]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <motion.div
                      key={j}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: j * 0.1 }}
                      className={`h-4 rounded bg-white/10 ${j === 0 ? "w-32" : j === 4 ? "w-16" : "w-24"}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Inbox className="h-12 w-12 text-white/15 mb-4" />
              <p className="text-sm font-semibold text-white/40">No orders yet</p>
              <p className="text-xs text-white/25 mt-1 mb-6">Your booked parcels will appear here</p>
              <Link to="/user/book">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-violet-600 text-white font-bold hover:opacity-90"
                >
                  <Package className="mr-1.5 h-3.5 w-3.5" /> Book Your First Parcel
                </Button>
              </Link>
            </div>
          )}

          {/* Orders table */}
          {!loading && orders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-white/40">
                    <th className="px-5 py-3 font-medium">Tracking ID</th>
                    <th className="px-5 py-3 font-medium">From</th>
                    <th className="px-5 py-3 font-medium">To</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <motion.tr
                      key={o.tracking_id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.04] transition-colors"
                    >
                      <td className="px-5 py-4 font-mono text-sm font-semibold text-orange-400">
                        {o.tracking_id}
                      </td>
                      <td className="px-5 py-4 text-sm text-white/70 max-w-[160px]">
                        <span className="line-clamp-1" title={o.source_address}>
                          {shortAddr(o.source_address)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-white/70 max-w-[160px]">
                        <span className="line-clamp-1" title={o.destination_address}>
                          {shortAddr(o.destination_address)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-white/40 whitespace-nowrap">
                        {formatDate(o.created_at)}
                      </td>
                      <td className="px-5 py-4 text-sm text-white/50 capitalize">
                        {o.parcel_type ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${getStatusStyle(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link to={`/user/track?id=${o.tracking_id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/50 hover:text-white hover:bg-white/[0.06] gap-1"
                          >
                            <MapPin className="h-3 w-3" /> Track
                          </Button>
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserOrders;