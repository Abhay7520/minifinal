import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { Package, MapPin, Brain, ShieldCheck, Clock, TrendingUp, ArrowRight, CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  { icon: Brain, title: "AI Address Validation", desc: "Intelligent address parsing and standardization for error-free deliveries." },
  { icon: MapPin, title: "Smart Post Office ID", desc: "Automatically identifies the nearest and most efficient post office." },
  { icon: Clock, title: "Delivery ETA Prediction", desc: "ML-powered delivery time estimates using traffic, weather & priority data." },
  { icon: ShieldCheck, title: "Delay Risk Detection", desc: "Proactive alerts when potential delays are detected on your parcel route." },
  { icon: TrendingUp, title: "Anomaly Detection", desc: "Flags stuck parcels, overloaded offices, and repeated route failures." },
  { icon: Package, title: "Real-time Tracking", desc: "Live milestone updates with AI-powered predictive status changes." },
];

const steps = [
  { num: "01", title: "Book Your Parcel", desc: "Enter addresses and parcel details. AI validates and selects the best post office." },
  { num: "02", title: "Make Payment", desc: "Choose UPI, Credit Card, or Cash on Delivery and confirm your booking." },
  { num: "03", title: "Get AI Predictions", desc: "Receive tracking ID with predicted delivery date, confidence score, and risk level." },
  { num: "04", title: "Track & Receive", desc: "Monitor real-time updates with smart delay notifications until delivery." },
];

const roles = [
  { role: "User", desc: "Book, pay, and track parcels with AI-powered predictions.", path: "/auth/user/login", items: ["Book parcels", "AI delivery ETA", "Real-time tracking"], gradient: "from-orange-500 to-violet-600", check: "text-orange-400" },
  { role: "Staff", desc: "Manage deliveries with smart prioritization and risk indicators.", path: "/auth/staff/login", items: ["View assignments", "Risk indicators", "Status updates"], gradient: "from-violet-600 to-indigo-600", check: "text-violet-400" },
  { role: "Admin", desc: "Monitor operations with anomaly detection and analytics.", path: "/auth/admin/login", items: ["System overview", "Anomaly detection", "Staff management"], gradient: "from-indigo-600 to-orange-500", check: "text-indigo-400" },
];

const featureColors = [
  { icon: "text-orange-400", bg: "from-orange-600/20 to-violet-600/20", hover: "from-orange-600/40 to-violet-600/40", ring: "ring-orange-500/20", border: "hover:border-orange-500/30", glow: "from-orange-600/5" },
  { icon: "text-violet-400", bg: "from-violet-600/20 to-indigo-600/20", hover: "from-violet-600/40 to-indigo-600/40", ring: "ring-violet-500/20", border: "hover:border-violet-500/30", glow: "from-violet-600/5" },
  { icon: "text-indigo-400", bg: "from-indigo-600/20 to-cyan-600/20", hover: "from-indigo-600/40 to-cyan-600/40", ring: "ring-indigo-500/20", border: "hover:border-indigo-500/30", glow: "from-indigo-600/5" },
  { icon: "text-orange-400", bg: "from-orange-600/20 to-red-600/20", hover: "from-orange-600/40 to-red-600/40", ring: "ring-orange-500/20", border: "hover:border-orange-500/30", glow: "from-orange-600/5" },
  { icon: "text-violet-400", bg: "from-violet-600/20 to-purple-600/20", hover: "from-violet-600/40 to-purple-600/40", ring: "ring-violet-500/20", border: "hover:border-violet-500/30", glow: "from-violet-600/5" },
  { icon: "text-orange-300", bg: "from-orange-500/20 to-violet-600/20", hover: "from-orange-500/40 to-violet-600/40", ring: "ring-orange-400/20", border: "hover:border-orange-400/30", glow: "from-orange-500/5" },
];
const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

const Landing = () => {
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 500], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  return (
    <div className="min-h-screen bg-[#050508] text-white overflow-x-hidden">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        {/* Parallax BG */}
        <motion.div style={{ y: heroParallax, opacity: heroOpacity }} className="absolute inset-0">
          <img src={heroBg} alt="" className="h-full w-full object-cover scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-[#050508]" />
        </motion.div>

        {/* Ambient glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-indigo-500/15 blur-[100px]" />
          <div className="absolute top-1/3 right-1/5 h-72 w-72 rounded-full bg-orange-500/12 blur-[110px]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm font-semibold text-orange-300 backdrop-blur-sm"
            >
              <Zap className="h-3.5 w-3.5" />
              AI-Powered Delivery System
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.65, ease: [0.22, 1, 0.36, 1] as const }}
              className="mb-6 text-5xl font-black leading-[1.08] tracking-tight text-white md:text-7xl"
            >
              Smarter Deliveries
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                with AI Precision
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mb-10 max-w-xl text-lg font-medium leading-relaxed text-white/60"
            >
              AIPOSTAL revolutionizes postal delivery with intelligent address validation,
              predictive ETAs, and proactive delay detection. Experience the future of logistics.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link to="/auth/select/register">
                  <Button
                    size="lg"
                    className="group relative overflow-hidden border-0 bg-gradient-to-r from-orange-500 to-violet-600 font-bold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-shadow"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link to="/auth/select/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/25 bg-white/5 font-bold text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/40 hover:text-white"
                  >
                    Sign In
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.6 }}
              className="mt-14 flex gap-10"
            >
              {[["99.2%", "Accuracy", "text-orange-400"], ["2.4x", "Faster", "text-violet-400"], ["50K+", "Parcels", "text-indigo-400"]].map(([val, label, color]) => (
                <div key={label}>
                  <div className={`text-2xl font-black ${color}`}>{val}</div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/40">{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050508] to-transparent" />
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Core Capabilities</span>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
              Powered by Artificial Intelligence
            </h2>
            <p className="mt-4 text-base text-white/50 max-w-lg mx-auto">
              Every delivery decision is backed by machine learning models trained on millions of real-world shipments.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((f, i) => {
              const c = featureColors[i];
              return (
                <motion.div
                  key={f.title}
                  variants={itemVariants}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`group relative rounded-2xl border border-white/8 bg-white/4 p-6 backdrop-blur-sm transition-all ${c.border} hover:bg-white/6`}
                >
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${c.bg} ring-1 ${c.ring} transition-all group-hover:${c.hover}`}>
                    <f.icon className={`h-5 w-5 ${c.icon}`} />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-white">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-white/50">{f.desc}</p>
                  <div className={`absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100 bg-gradient-to-br ${c.glow} to-transparent pointer-events-none`} />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-950/5 to-transparent pointer-events-none" />
        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Simple Process</span>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">How It Works</h2>
          </motion.div>

          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
                className="relative"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute top-6 left-16 right-0 hidden h-px bg-gradient-to-r from-orange-500/40 to-transparent lg:block" />
                )}
                <div className={`text-6xl font-black leading-none bg-clip-text text-transparent ${i % 2 === 0
                  ? "bg-gradient-to-br from-orange-500/60 to-violet-500/30"
                  : "bg-gradient-to-br from-violet-500/50 to-indigo-500/25"
                  }`}>
                  {s.num}
                </div>
                <h3 className="mt-3 text-lg font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles CTA ── */}
      <section className="py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-14 text-center"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Get Started</span>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">Choose Your Portal</h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-3"
          >
            {roles.map((r) => (
              <motion.div
                key={r.role}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group relative rounded-2xl border border-white/10 bg-white/4 p-8 backdrop-blur-sm overflow-hidden"
              >
                {/* Top gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${r.gradient}`} />
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-16 w-32 bg-gradient-to-b ${r.gradient} opacity-10 blur-xl`} />

                <h3 className="text-2xl font-black text-white">{r.role} Portal</h3>
                <p className="mt-2 text-sm text-white/50">{r.desc}</p>

                <ul className="mt-5 space-y-2.5">
                  {r.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-white/80">
                      <CheckCircle className={`h-4 w-4 flex-shrink-0 ${r.check}`} />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link to={r.path}>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="mt-7">
                    <Button
                      className={`w-full font-bold text-white border-0 bg-gradient-to-r ${r.gradient} hover:opacity-90 shadow-lg transition-all`}
                    >
                      Enter as {r.role}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 py-8">
        <div className="container mx-auto flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-sm font-black text-white">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-violet-600">
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            AIPOSTAL
          </div>
          <p className="text-xs font-medium text-white/30">© 2026 AIPOSTAL. AI-Powered Delivery System.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
