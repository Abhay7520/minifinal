import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Package, Mail, Lock, ArrowRight, Zap, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import authBg from "@/assets/auth-bg.png";

const roleConfig = {
  user:  { label: "User",  gradient: "from-orange-500 to-violet-600",  shadow: "shadow-orange-500/25",  glow: "bg-orange-500/10",  border: "border-orange-500/30",  text: "text-orange-400",  ring: "focus-visible:ring-orange-500/30" },
  staff: { label: "Staff", gradient: "from-blue-500 to-cyan-500",       shadow: "shadow-blue-500/25",    glow: "bg-blue-500/10",    border: "border-blue-500/30",    text: "text-blue-400",    ring: "focus-visible:ring-blue-500/30" },
  admin: { label: "Admin", gradient: "from-violet-600 to-purple-500",   shadow: "shadow-violet-500/25",  glow: "bg-violet-500/10",  border: "border-violet-500/30",  text: "text-violet-400",  ring: "focus-visible:ring-violet-500/30" },
};

const Login = () => {
  const [searchParams] = useSearchParams();
  const defaultRole = (searchParams.get("role") || "user") as keyof typeof roleConfig;
  const [role, setRole] = useState<keyof typeof roleConfig>(defaultRole);
  const navigate = useNavigate();
  const cfg = roleConfig[role];

  const [email, setEmail]       = useState("demo@aipostal.com");
  const [password, setPassword] = useState("password");
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { apiPost } = await import("@/lib/api");
      const res = await apiPost<{ token: string; role: string; email: string; name: string }>("/auth/login", { role, email, password });
      localStorage.setItem("token", res.token);
      localStorage.setItem("userName", res.name || email.split("@")[0]);
      localStorage.setItem("role", res.role);
      navigate(`/${res.role}/dashboard`);
    } catch (err: any) {
      setError(err?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

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

      {/* Floating ambient orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[15%] h-72 w-72 rounded-full bg-orange-500/15 blur-[100px]" />
        <div className="absolute right-[12%] bottom-[20%] h-56 w-56 rounded-full bg-violet-600/20 blur-[90px]" />
        <div className="absolute left-[55%] top-[60%] h-40 w-40 rounded-full bg-indigo-500/15 blur-[80px]" />
      </div>

      {/* ── Glass Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px] mx-4"
      >
        {/* Card */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-2xl">

          {/* Top accent bar */}
          <div className={`h-1 w-full bg-gradient-to-r ${cfg.gradient}`} />

          <div className="px-8 py-9">
            {/* Logo + brand */}
            <div className="mb-7 flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${cfg.gradient} shadow-lg ${cfg.shadow}`}>
                <Package className="h-5.5 w-5.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">AIPOSTAL</p>
                <p className="text-lg font-black text-white leading-tight">Welcome back</p>
              </div>
            </div>

            {/* Role selector */}
            <div className="mb-5 flex gap-1.5 rounded-xl border border-white/8 bg-black/20 p-1.5 backdrop-blur-sm">
              {(["user", "staff", "admin"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`relative flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-all duration-200 ${
                    role === r ? "text-white" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {role === r && (
                    <motion.div
                      layoutId="login-role-pill"
                      className={`absolute inset-0 rounded-lg bg-gradient-to-r ${roleConfig[r].gradient}`}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{r.charAt(0).toUpperCase() + r.slice(1)}</span>
                </button>
              ))}
            </div>

            {/* Role badge */}
            <AnimatePresence mode="wait">
              <motion.div
                key={role}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className={`mb-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${cfg.border} ${cfg.glow} ${cfg.text}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                Signing in as {cfg.label}
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
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-white/60">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 z-10" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/25 focus:border-current ${cfg.ring}`}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-white/60">Password</Label>
                  <span className="cursor-pointer text-[11px] text-white/30 transition-colors hover:text-white/60">Forgot password?</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 z-10" />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`h-11 border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder:text-white/25 focus:border-current ${cfg.ring}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/70"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-1">
                <Button
                  type="submit"
                  disabled={loading}
                  className={`h-11 w-full border-0 bg-gradient-to-r ${cfg.gradient} font-bold text-white shadow-lg ${cfg.shadow} hover:opacity-90 transition-opacity`}
                >
                  {loading ? "Signing in…" : `Sign In as ${cfg.label}`}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </motion.div>
            </form>

            {/* Feature pills */}
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { color: "text-orange-400 bg-orange-500/10 border-orange-500/20", label: "AI ETA Prediction" },
                { color: "text-violet-400 bg-violet-500/10 border-violet-500/20", label: "Real-time Tracking" },
                { color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",      label: "Anomaly Detection" },
              ].map((f) => (
                <span key={f.label} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${f.color}`}>
                  <Zap className="h-2.5 w-2.5" /> {f.label}
                </span>
              ))}
            </div>

            {/* Sign up link */}
            <p className="mt-6 border-t border-white/5 pt-5 text-center text-xs text-white/40">
              Don't have an account?{" "}
              <Link to="/register" className={`font-bold ${cfg.text} hover:underline`}>
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom caption */}
        <p className="mt-4 text-center text-[10px] text-white/20">
          Secured by AI · AIPOSTAL Logistics Platform
        </p>
      </motion.div>
    </div>
  );
};

export default Login;