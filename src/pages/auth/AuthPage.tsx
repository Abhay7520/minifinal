import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Mail, Lock, User, ArrowRight, ArrowLeft, Zap,
  Send, Truck, BarChart3, MapPin, Shield, Clock, Eye, EyeOff,
  CheckCircle, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import authBg from "@/assets/auth-bg.png";

const roleConfigs = {
  user: {
    label: "User",
    tagline: "Seamless delivery powered by AI",
    description: "Track shipments, send parcels, and manage deliveries easily.",
    gradient: "from-orange-500 to-amber-400",
    gradientBg: "from-orange-500/20 via-amber-500/10 to-transparent",
    shadow: "shadow-orange-500/25",
    glow: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    accent: "orange",
    illustrations: [
      { icon: Send, label: "Send Parcels", delay: 0 },
      { icon: MapPin, label: "Track Shipments", delay: 0.8 },
      { icon: Clock, label: "AI ETA", delay: 1.6 },
    ],
  },
  staff: {
    label: "Staff",
    tagline: "Empowering logistics with intelligence",
    description: "Manage logistics, process deliveries, and handle operations.",
    gradient: "from-blue-500 to-cyan-400",
    gradientBg: "from-blue-500/20 via-cyan-500/10 to-transparent",
    shadow: "shadow-blue-500/25",
    glow: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    accent: "blue",
    illustrations: [
      { icon: Truck, label: "Route Management", delay: 0 },
      { icon: Package, label: "Parcel Processing", delay: 0.8 },
      { icon: Shield, label: "Secure Handling", delay: 1.6 },
    ],
  },
  admin: {
    label: "Admin",
    tagline: "Complete control at your fingertips",
    description: "Monitor system performance, analytics, and platform control.",
    gradient: "from-violet-500 to-purple-400",
    gradientBg: "from-violet-500/20 via-purple-500/10 to-transparent",
    shadow: "shadow-violet-500/25",
    glow: "bg-violet-500/10",
    border: "border-violet-500/30",
    text: "text-violet-400",
    accent: "violet",
    illustrations: [
      { icon: BarChart3, label: "Analytics", delay: 0 },
      { icon: Shield, label: "System Control", delay: 0.8 },
      { icon: Zap, label: "AI Monitoring", delay: 1.6 },
    ],
  },
};

type Role = keyof typeof roleConfigs;

// Floating postal animation elements
const FloatingElement = ({ icon: Icon, label, delay, gradient }: { icon: any; label: string; delay: number; gradient: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: delay + 0.4, duration: 0.5 }}
    className="flex flex-col items-center gap-2"
  >
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay }}
      className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}
    >
      <Icon className="h-7 w-7 text-white" strokeWidth={1.5} />
    </motion.div>
    <span className="text-xs font-semibold text-white/50">{label}</span>
  </motion.div>
);

// Animated illustration box
const IllustrationBox = ({ role }: { role: Role }) => {
  const cfg = roleConfigs[role];

  return (
    <motion.div
      key={role}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-3xl border ${cfg.border} bg-white/[0.02] backdrop-blur-sm p-8 overflow-hidden`}
    >
      {/* Inner glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradientBg} opacity-30`} />

      {/* Animated dots pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }} />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Floating illustrations */}
        <div className="flex gap-6">
          {cfg.illustrations.map((item) => (
            <FloatingElement key={item.label} {...item} gradient={cfg.gradient} />
          ))}
        </div>

        {/* Animated connector line */}
        <div className="relative w-full max-w-[200px] h-0.5">
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${cfg.gradient} opacity-20`} />
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute top-0 left-0 h-full w-1/3 rounded-full bg-gradient-to-r ${cfg.gradient}`}
          />
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-lg font-bold text-white/60 text-center"
        >
          {cfg.tagline}
        </motion.p>
      </div>
    </motion.div>
  );
};

const AuthPage = () => {
  const { role: roleParam, mode } = useParams<{ role: string; mode: string }>();
  const role = (roleParam || "user") as Role;
  const isLogin = mode === "login";
  const cfg = roleConfigs[role] || roleConfigs.user;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const { apiPost } = await import("@/lib/api");


      if (!isLogin) {
        const payload = {
          role,
          name: formData.name,
          email: formData.email,
          password: formData.password,
        };

        const res = await apiPost<{ token: string; role: string; email: string; name: string }>("/auth/signup", payload);
        localStorage.setItem("token", res.token);
        localStorage.setItem("userName", res.name);

        toast({
          title: "Account created successfully 🎉",
          description: `Welcome to AIPOSTAL as ${cfg.label}!`,
        });
      } else {
        const payload = {
          role,
          email: formData.email,
          password: formData.password,
        };

        const res = await apiPost<{ token: string; role: string; email: string; name: string }>("/auth/login", payload);
        localStorage.setItem("token", res.token);
        localStorage.setItem("userName", res.name || formData.email.split("@")[0]);
      }

      navigate(`/${role}/dashboard`);
    } catch (e: any) {
      setError(e?.message || "Authentication failed");
    }
  };



  const toggleMode = isLogin ? "register" : "login";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden text-white">

      {/* ── Full-screen background image ── */}
      <img
        src={authBg}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-[#0a0515]/90" />

      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute left-[8%] top-[12%] h-72 w-72 rounded-full ${cfg.glow} blur-[110px] transition-colors duration-700`} />
        <div className="absolute right-[10%] bottom-[18%] h-56 w-56 rounded-full bg-white/[0.03] blur-[90px]" />
        <div className="absolute left-[50%] top-[65%] h-40 w-40 rounded-full bg-indigo-500/10 blur-[80px]" />
      </div>

      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-5 left-5 z-50"
      >
        <Link
          to={`/auth/select/${mode}`}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-xs font-semibold text-white/60 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to role selection
        </Link>
      </motion.div>

      {/* ── Glass Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-4 w-full max-w-[440px]"
      >
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-2xl">

          {/* Role-coloured accent bar */}
          <div className={`h-1 w-full bg-gradient-to-r ${cfg.gradient} transition-all duration-500`} />

          <div className="px-8 py-9">

            {/* Logo + brand */}
            <div className="mb-7 flex items-center gap-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={role}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${cfg.gradient} shadow-lg ${cfg.shadow} transition-all duration-500`}
                >
                  <Package className="h-5 w-5 text-white" />
                </motion.div>
              </AnimatePresence>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">AIPOSTAL</p>
                <p className="text-lg font-black leading-tight text-white">
                  {isLogin ? "Welcome back" : "Create account"}
                </p>
              </div>
              {/* Illustration mini-icons */}
              <div className="ml-auto flex gap-2">
                {cfg.illustrations.map((item) => (
                  <motion.div
                    key={item.label}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: item.delay }}
                    className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${cfg.gradient} opacity-80 shadow`}
                    title={item.label}
                  >
                    <item.icon className="h-3.5 w-3.5 text-white" strokeWidth={1.5} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Role selector */}
            <div className="mb-4 flex gap-1.5 rounded-xl border border-white/8 bg-black/20 p-1.5 backdrop-blur-sm">
              {(["user", "staff", "admin"] as const).map((r) => (
                <Link
                  key={r}
                  to={`/auth/${r}/${mode}`}
                  className={`relative flex-1 rounded-lg py-2 text-center text-xs font-bold capitalize transition-all duration-200 ${
                    r === role ? "text-white" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {r === role && (
                    <motion.div
                      layoutId="auth-role-pill"
                      className={`absolute inset-0 rounded-lg bg-gradient-to-r ${roleConfigs[r].gradient}`}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                </Link>
              ))}
            </div>

            {/* Role badge */}
            <AnimatePresence mode="wait">
              <motion.div
                key={role + isLogin}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className={`mb-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${cfg.border} ${cfg.glow} ${cfg.text}`}
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                {isLogin ? "Signing in" : "Registering"} as {cfg.label}
              </motion.div>
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="flex items-center gap-2 overflow-hidden rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name (register only) */}
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-white/60">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 z-10" />
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/25 focus-visible:ring-orange-500/20"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-white/60">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 z-10" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/25 focus-visible:ring-orange-500/20"
                    defaultValue={isLogin ? "demo@aipostal.com" : ""}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-white/60">Password</Label>
                  {isLogin && (
                    <span className="cursor-pointer text-[11px] text-white/30 transition-colors hover:text-white/60">Forgot password?</span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 z-10" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="h-11 border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder:text-white/25 focus-visible:ring-orange-500/20"
                    defaultValue={isLogin ? "password" : ""}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/70">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (register only) */}
              <AnimatePresence>
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold text-white/60">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 z-10" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="h-11 border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder:text-white/25 focus-visible:ring-orange-500/20"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/70">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-1">
                <Button
                  type="submit"
                  className={`h-11 w-full border-0 bg-gradient-to-r ${cfg.gradient} font-bold text-white shadow-lg ${cfg.shadow} hover:opacity-90 transition-opacity`}
                >
                  {isLogin ? `Sign In as ${cfg.label}` : `Create ${cfg.label} Account`}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </form>

            {/* Toggle */}
            <p className="mt-6 border-t border-white/5 pt-5 text-center text-xs text-white/40">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Link to={`/auth/${role}/${toggleMode}`} className={`font-bold ${cfg.text} hover:underline`}>
                {isLogin ? "Create one" : "Sign in"}
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] text-white/20">
          Secured by AI · AIPOSTAL Logistics Platform
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;