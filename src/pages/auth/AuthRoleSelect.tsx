import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, User, Briefcase, ShieldCheck, ArrowRight, Zap, Mail, Truck, BarChart3 } from "lucide-react";

const roles = [
  {
    key: "user",
    label: "User",
    icon: User,
    illustration: Mail,
    desc: "Track shipments, send parcels, and manage deliveries easily.",
    features: ["Book & send parcels", "Real-time tracking", "AI delivery ETA"],
    gradient: "from-orange-500 to-amber-400",
    glow: "bg-orange-500/20",
    border: "border-orange-500/30",
    shadow: "shadow-orange-500/20",
  },
  {
    key: "staff",
    label: "Staff",
    icon: Briefcase,
    illustration: Truck,
    desc: "Manage logistics, process deliveries, and handle operations.",
    features: ["Process deliveries", "Route management", "Parcel scanning"],
    gradient: "from-blue-500 to-cyan-400",
    glow: "bg-blue-500/20",
    border: "border-blue-500/30",
    shadow: "shadow-blue-500/20",
  },
  {
    key: "admin",
    label: "Admin",
    icon: ShieldCheck,
    illustration: BarChart3,
    desc: "Monitor system performance, analytics, and platform control.",
    features: ["System analytics", "Staff management", "Anomaly detection"],
    gradient: "from-violet-500 to-purple-400",
    glow: "bg-violet-500/20",
    border: "border-violet-500/30",
    shadow: "shadow-violet-500/20",
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

interface AuthRoleSelectProps {
  mode: "login" | "register";
}

const AuthRoleSelect = ({ mode }: AuthRoleSelectProps) => {
  const isLogin = mode === "login";

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center px-4 py-12 overflow-hidden relative">
      {/* Ambient background */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-orange-500/8 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-blue-500/8 blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-violet-500/6 blur-[80px]" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Header */}
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center mb-12"
      >
        <div className="flex flex-col items-center gap-4 mb-6">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 shadow-lg shadow-orange-500/30">
              <Package className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight">AIPOSTAL</span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold text-orange-300">
            <Zap className="h-3 w-3" /> AI-Powered Platform
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          {isLogin ? "Welcome Back" : "Get Started"}
        </h1>
        <p className="mt-3 text-lg text-white/40 max-w-md mx-auto">
          {isLogin
            ? "Select your role to sign in to your account"
            : "Choose your role to create a new account"}
        </p>
      </motion.div>

      {/* Role Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full"
      >
        {roles.map((r) => {
          const Icon = r.icon;
          const Illust = r.illustration;
          return (
            <motion.div key={r.key} variants={cardVariants}>
              <Link to={`/auth/${r.key}/${mode}`}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative rounded-2xl border ${r.border} bg-white/[0.03] backdrop-blur-sm p-6 cursor-pointer transition-colors duration-300 hover:bg-white/[0.06] overflow-hidden`}
                >
                  {/* Glow on hover */}
                  <div className={`absolute -top-20 -right-20 h-40 w-40 rounded-full ${r.glow} blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  {/* Illustration area */}
                  <div className={`relative mb-5 flex h-32 items-center justify-center rounded-xl bg-gradient-to-br ${r.gradient} overflow-hidden`}>
                    <div className="absolute inset-0 opacity-20" style={{
                      backgroundImage: "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.3) 0%, transparent 50%)",
                    }} />
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Illust className="h-14 w-14 text-white/90" strokeWidth={1.5} />
                    </motion.div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-5 w-5 text-white/70" />
                      <h3 className="text-lg font-black text-white">{r.label}</h3>
                    </div>
                    <p className="text-sm text-white/40 mb-4 leading-relaxed">{r.desc}</p>

                    <div className="space-y-1.5 mb-5">
                      {r.features.map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs text-white/50">
                          <div className={`h-1 w-1 rounded-full bg-gradient-to-r ${r.gradient}`} />
                          {f}
                        </div>
                      ))}
                    </div>

                    <div className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${r.gradient} py-2.5 text-sm font-bold text-white shadow-lg ${r.shadow} group-hover:shadow-xl transition-shadow`}>
                      {isLogin ? "Sign In" : "Register"} as {r.label}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Toggle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 mt-10 text-sm text-white/40"
      >
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <Link
          to={isLogin ? "/auth/select/register" : "/auth/select/login"}
          className="font-bold text-orange-400 hover:underline"
        >
          {isLogin ? "Create one" : "Sign in"}
        </Link>
      </motion.p>
    </div>
  );
};

export default AuthRoleSelect;
