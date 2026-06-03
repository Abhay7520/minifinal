import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Package,
  LayoutDashboard,
  Truck,
  MapPin,
  ClipboardList,
  AlertTriangle,
  LogOut,
  Users,
  BarChart3,
  Search,
  Menu,
  Mic,
} from "lucide-react";
import { useState } from "react";
import CommandPalette from "./CommandPalette";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "user" | "staff" | "admin";
}

const navItems = {
  user: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/user/dashboard" },
    { label: "Book Parcel", icon: Package, path: "/user/book" },
    { label: "Track Parcel", icon: MapPin, path: "/user/track" },
    { label: "My Orders", icon: ClipboardList, path: "/user/orders" },
  ],
  staff: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/staff/dashboard" },
    { label: "Assigned Parcels", icon: Truck, path: "/staff/parcels" },
    { label: "Update Status", icon: ClipboardList, path: "/staff/update" },
    { label: "Voice Assistant", icon: Mic, path: "/staff/voice" },
    { label: "Emergency Center", icon: AlertTriangle, path: "/staff/incidents" },
  ],
  admin: [
    { label: "Dashboard", icon: BarChart3, path: "/admin/dashboard" },
    { label: "All Parcels", icon: Package, path: "/admin/parcels" },
    { label: "Staff", icon: Users, path: "/admin/staff" },
    { label: "Anomalies", icon: AlertTriangle, path: "/admin/anomalies" },
  ],
};

const roleLabels = { user: "User", staff: "Staff", admin: "Admin" };

const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const items = navItems[role];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-[#050508]">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[100px]" />
      </div>

      {/* Sidebar */}
      {role !== "admin" && (
        <motion.aside
          animate={{ width: collapsed ? 80 : 256 }}
          className="fixed left-0 top-0 z-40 flex h-full flex-col border-r border-white/[0.08] bg-[#08080c]"
        >
          {/* Header */}
          <div className="flex h-16 items-center px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-violet-600">
                <Package className="h-4 w-4 text-white" />
              </div>
              {!collapsed && (
                <span className="font-bold text-white">AIPOSTAL</span>
              )}
            </div>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="ml-auto text-white/40 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Role */}
          {!collapsed && (
            <div className="px-4 text-xs text-white/30">
              {roleLabels[role]} Panel
            </div>
          )}

          {/* Nav */}
          <nav className="mt-4 flex-1 space-y-1 px-2">
            {items.map((item) => {
              const active = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all
                  ${active
                      ? "bg-gradient-to-r from-orange-500/20 to-violet-600/10 text-orange-400"
                      : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                    }`}
                >
                  <item.icon className="h-5 w-5" />
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-white/[0.08] p-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/40 hover:bg-white/[0.04] hover:text-white"
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && "Logout"}
            </button>
          </div>
        </motion.aside>
      )}

      {/* Main */}
      <main
        className={`relative z-10 flex-1 p-8 transition-all duration-300 ${
          role === "admin" ? "ml-0" : (collapsed ? "ml-20" : "ml-64")
        }`}
      >
        {/* Top bar */}
        <div className="mb-6 flex justify-between items-center">
          {role === "admin" && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-violet-600">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">AIPOSTAL ADMIN</span>
            </div>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex h-10 w-64 items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-sm text-white/40 hover:bg-white/[0.08]"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Quick Search...</span>
            </button>
            {role === "admin" && (
              <button
                onClick={handleLogout}
                className="flex h-10 items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 text-sm text-red-400 hover:bg-red-500/20 font-bold transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>

        {children}
      </main>

      <CommandPalette
        open={isCommandPaletteOpen}
        setOpen={setIsCommandPaletteOpen}
        role={role}
      />
    </div>
  );
};

export default DashboardLayout;