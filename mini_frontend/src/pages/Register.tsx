import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Package, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";

const roleConfig = {
  user: { label: "User", gradient: "from-orange-500 to-violet-600", shadow: "shadow-orange-500/25", glow: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
  staff: { label: "Staff", gradient: "from-violet-600 to-indigo-600", shadow: "shadow-violet-500/25", glow: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400" },
  admin: { label: "Admin", gradient: "from-indigo-600 to-orange-500", shadow: "shadow-indigo-500/25", glow: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-400" },
};

const Register = () => {
  const [role, setRole] = useState<keyof typeof roleConfig>("user");
  const navigate = useNavigate();
  const cfg = roleConfig[role];

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/${role}/dashboard`);
  };

  return (
    <div className="flex min-h-screen bg-[#050508] text-white overflow-hidden">

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0812] via-[#080510] to-[#050508]" />

        {/* Ambient orbs */}
        <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 h-64 w-64 rounded-full bg-orange-500/12 blur-[90px]" />
        <div className="absolute top-1/5 left-1/3 h-48 w-48 rounded-full bg-indigo-500/15 blur-[80px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-md px-12"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-orange-500 shadow-lg shadow-violet-500/30"
          >
            <Package className="h-7 w-7 text-white" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
              <Sparkles className="h-3 w-3" /> Get Started for Free
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white">
              Join{" "}
              <span className="bg-gradient-to-r from-violet-400 via-orange-400 to-indigo-400 bg-clip-text text-transparent">
                AIPOSTAL
              </span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/50">
              Create your account and experience AI-powered delivery management with intelligent predictions and real-time tracking.
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8 flex flex-col gap-4"
          >
            {[
              { num: "01", label: "Create your account", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
              { num: "02", label: "Choose your role", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
              { num: "03", label: "Start managing deliveries", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-3">
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border text-xs font-black ${s.color} ${s.bg}`}>
                  {s.num}
                </div>
                <span className="text-sm font-semibold text-white/70">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right edge fade */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-[#050508]" />
      </div>

      {/* ── Right Panel ── */}
      <div className="flex w-full items-center justify-center px-4 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link to="/" className="mb-8 flex items-center gap-2.5 font-black text-xl text-white lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-orange-500 shadow-lg shadow-violet-500/25">
              <Package className="h-5 w-5 text-white" />
            </div>
            AIPOSTAL
          </Link>

          <h2 className="text-3xl font-black tracking-tight text-white">Create Account</h2>
          <p className="mt-2 text-sm text-white/50">Select your role and register to get started</p>

          {/* Role selector */}
          <div className="mt-6 flex gap-1.5 rounded-xl border border-white/8 bg-white/4 p-1.5 backdrop-blur-sm">
            {(["user", "staff", "admin"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`relative flex-1 rounded-lg py-2 text-sm font-bold capitalize transition-all duration-200 ${role === r ? "text-white" : "text-white/40 hover:text-white/70"
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
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.border} ${cfg.glow} ${cfg.text}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Registering as {cfg.label}
            </motion.div>
          </AnimatePresence>

          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-semibold text-white/70">Full Name</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/25 focus:border-orange-500/50 focus-visible:ring-orange-500/20"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-white/70">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/25 focus:border-orange-500/50 focus-visible:ring-orange-500/20"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-semibold text-white/70">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/25 focus:border-orange-500/50 focus-visible:ring-orange-500/20"
                />
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-1">
              <Button
                type="submit"
                className={`w-full border-0 bg-gradient-to-r ${cfg.gradient} font-bold text-white ${cfg.shadow} shadow-lg hover:opacity-90 transition-opacity`}
              >
                Register as {cfg.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            Already have an account?{" "}
            <Link to="/login" className={`font-bold ${cfg.text} hover:underline`}>
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
export default Register;
