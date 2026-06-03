import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, Mail, Lock, User, ArrowRight, Sparkles, AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react";
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

const STEPS = [
  { num: "01", label: "Create your account",        color: "text-orange-400",  bg: "bg-orange-500/10  border-orange-500/20" },
  { num: "02", label: "Choose your role",           color: "text-violet-400",  bg: "bg-violet-500/10  border-violet-500/20" },
  { num: "03", label: "Start managing deliveries",  color: "text-cyan-400",    bg: "bg-cyan-500/10    border-cyan-500/20"   },
];

const Register = () => {
  const [role, setRole] = useState<keyof typeof roleConfig>("user");
  const navigate = useNavigate();
  const cfg = roleConfig[role];

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [showCfm,  setShowCfm]  = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim())        { setError("Full name is required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const { apiPost } = await import("@/lib/api");
      const res = await apiPost<{ token: string; role: string; email: string; name: string }>("/auth/signup", {
        role, name: name.trim(), email: email.trim(), password,
      });
      localStorage.setItem("token", res.token);
      localStorage.setItem("userName", res.name || email.split("@")[0]);
      localStorage.setItem("role", res.role);
      navigate(`/${res.role}/dashboard`);
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
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
        <div className="absolute right-[10%] top-[15%]  h-72 w-72 rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="absolute left-[12%]  bottom-[20%] h-56 w-56 rounded-full bg-orange-500/15 blur-[90px]"  />
        <div className="absolute left-[40%]  top-[65%]   h-40 w-40 rounded-full bg-cyan-500/15   blur-[80px]"  />
      </div>

      {/* ── Glass Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[440px] mx-4"
      >
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-2xl">

          {/* Top accent bar */}
          <div className={`h-1 w-full bg-gradient-to-r ${cfg.gradient}`} />

          <div className="px-8 py-8">
            {/* Logo + brand */}
            <div className="mb-6 flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${cfg.gradient} shadow-lg ${cfg.shadow}`}>
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">AIPOSTAL</p>
                <p className="text-lg font-black text-white leading-tight">Create Account</p>
              </div>
              <div className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-300">
                <Sparkles className="h-2.5 w-2.5" /> Free
              </div>
            </div>

            {/* 3-step visual */}
            <div className="mb-5 flex gap-2">
              {STEPS.map((s, i) => (
                <div key={s.num} className="flex flex-1 items-center gap-1.5">
                  <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border text-[10px] font-black ${s.color} ${s.bg}`}>
                    {s.num}
                  </div>
                  <span className="truncate text-[10px] font-semibold text-white/40">{s.label}</span>
                  {i < STEPS.length - 1 && <div className="h-px flex-1 bg-white/5" />}
                </div>
              ))}
            </div>

            {/* Role selector */}
            <div className="mb-4 flex gap-1.5 rounded-xl border border-white/8 bg-black/20 p-1.5 backdrop-blur-sm">
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
                      layoutId="register-role-pill"
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
                className={`mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${cfg.border} ${cfg.glow} ${cfg.text}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                Registering as {cfg.label}
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
            <form onSubmit={handleRegister} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <Label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-white/60">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 z-10" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/25 ${cfg.ring}`}
                  />
                </div>
              </div>

              {/* Email */}
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
                    className={`h-11 border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/25 ${cfg.ring}`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-white/60">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 z-10" />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`h-11 border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder:text-white/25 ${cfg.ring}`}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/70">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirm" className="mb-1.5 block text-xs font-semibold text-white/60">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 z-10" />
                  <Input
                    id="confirm"
                    type={showCfm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`h-11 border-white/10 bg-white/5 pl-10 pr-10 text-white placeholder:text-white/25 ${cfg.ring}`}
                  />
                  <button type="button" onClick={() => setShowCfm(!showCfm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/70">
                    {showCfm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {confirm && password && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      {confirm === password
                        ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        : <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                    </div>
                  )}
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-1">
                <Button
                  type="submit"
                  disabled={loading}
                  className={`h-11 w-full border-0 bg-gradient-to-r ${cfg.gradient} font-bold text-white shadow-lg ${cfg.shadow} hover:opacity-90 transition-opacity`}
                >
                  {loading ? "Creating account…" : `Register as ${cfg.label}`}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </motion.div>
            </form>

            {/* Sign in link */}
            <p className="mt-5 border-t border-white/5 pt-5 text-center text-xs text-white/40">
              Already have an account?{" "}
              <Link to="/login" className={`font-bold ${cfg.text} hover:underline`}>
                Sign in
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

export default Register;
