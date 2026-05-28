import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Brain,
  Sparkles,
  FileText,
  Zap,
  Building2,
  Ruler,
  Shield,
  Leaf,
  Radio,
  Clock,
  Route,
  TrendingDown,
  User,
  Phone,
  Boxes,
  IndianRupee,
  Lock,
  PenLine,
  Rocket,
  ShieldCheck,
  Wand2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const steps = ["Contacts", "Parcel", "Smart Options", "AI Insights", "Review"];

type SmartOptId =
  | "gps"
  | "iot"
  | "contactless"
  | "otp"
  | "eco"
  | "carbon"
  | "signature"
  | "priority";

type SmartOpt = {
  id: SmartOptId;
  label: string;
  desc: string;
  price: number;
  icon: typeof Radio;
  defaultOn?: boolean;
};

const SMART_OPTIONS: SmartOpt[] = [
  { id: "gps", label: "Real-time GPS Tracking", desc: "Live location every 60s", price: 0, icon: Radio, defaultOn: true },
  { id: "iot", label: "IoT Tamper & Temp Sensor", desc: "Best for fragile / medicine", price: 40, icon: Zap },
  { id: "contactless", label: "Contactless Delivery", desc: "No-touch handover", price: 0, icon: ShieldCheck },
  { id: "otp", label: "OTP-secured Handover", desc: "Verified recipient only", price: 0, icon: Lock, defaultOn: true },
  { id: "eco", label: "Eco-Friendly Packaging", desc: "Recycled, biodegradable", price: 15, icon: Leaf },
  { id: "carbon", label: "Carbon-Neutral Shipping", desc: "Offsets route emissions", price: 20, icon: Leaf },
  { id: "signature", label: "Signature Required", desc: "Proof of delivery", price: 10, icon: PenLine },
  { id: "priority", label: "Priority Handling", desc: "Front-of-queue at every hub", price: 50, icon: Rocket },
];

type InsuranceTier = "basic" | "standard" | "premium";
const INSURANCE: Record<InsuranceTier, { label: string; price: number; cover: string }> = {
  basic: { label: "Basic", price: 0, cover: "up to ₹500" },
  standard: { label: "Standard", price: 25, cover: "up to ₹5,000" },
  premium: { label: "Premium", price: 75, cover: "up to ₹50,000" },
};

const TIME_SLOTS = ["Morning", "Afternoon", "Evening", "Anytime"] as const;
type TimeSlot = (typeof TIME_SLOTS)[number];

const BookParcel = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Step 1
  const [aiValidated, setAiValidated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Step 2
  const [weight, setWeight] = useState(2.5);
  const [dims, setDims] = useState({ l: 30, w: 20, h: 15 });
  const [parcelType, setParcelType] = useState("standard");
  const [category, setCategory] = useState("electronics");
  const [declaredValue, setDeclaredValue] = useState(4500);
  const [description, setDescription] = useState("Electronics - laptop charger");

  // Step 3
  const [smartOpts, setSmartOpts] = useState<Record<SmartOptId, boolean>>(() => {
    const init = {} as Record<SmartOptId, boolean>;
    SMART_OPTIONS.forEach((o) => (init[o.id] = !!o.defaultOn));
    return init;
  });
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("Anytime");
  const [dropInstructions, setDropInstructions] = useState("Leave with security if not home");
  const [insurance, setInsurance] = useState<InsuranceTier>("standard");

  // Step 4
  const [aiAnalyzed, setAiAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Step 5
  const [agreed, setAgreed] = useState(false);

  const volumetric = useMemo(
    () => +((dims.l * dims.w * dims.h) / 5000).toFixed(2),
    [dims]
  );
  const chargeableWeight = Math.max(weight, volumetric);

  const addOnsTotal = useMemo(
    () =>
      SMART_OPTIONS.filter((o) => smartOpts[o.id]).reduce((s, o) => s + o.price, 0),
    [smartOpts]
  );

  const typeMultiplier: Record<string, number> = {
    standard: 1,
    express: 1.6,
    sameday: 2.2,
    fragile: 1.3,
    document: 0.7,
  };

  const baseFare = 60;
  const weightCharge = Math.round(chargeableWeight * 40 * (typeMultiplier[parcelType] ?? 1));
  const insuranceCharge = INSURANCE[insurance].price;
  const subtotal = baseFare + weightCharge + addOnsTotal + insuranceCharge;
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  const handleValidate = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      setAiValidated(true);
    }, 1400);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAiAnalyzed(true);
    }, 1200);
  };

  const goNext = () => {
    if (step === 4 && !aiAnalyzed) handleAnalyze();
    setStep((s) => Math.min(5, s + 1));
  };

  const toggleOpt = (id: SmartOptId) =>
    setSmartOpts((p) => ({ ...p, [id]: !p[id] }));

  return (
    <DashboardLayout role="user">
      {/* Page header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400 mb-3">
          <Sparkles className="h-3 w-3" /> AI-Powered Smart Booking
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white">Book a Parcel</h1>
        <p className="mt-1.5 text-white/40">
          Address validation · IoT add-ons · Predictive ETA · Carbon-neutral options
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-10 flex items-center gap-0 overflow-x-auto pb-2">
        {steps.map((s, i) => {
          const state = step > i + 1 ? "done" : step === i + 1 ? "active" : "pending";
          return (
            <div key={s} className="flex items-center shrink-0">
              <motion.div
                animate={state === "active" ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-black transition-all duration-500 ${
                    state === "done"
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : state === "active"
                      ? "bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/40"
                      : "bg-white/5 text-white/30 border border-white/10"
                  }`}
                >
                  {state === "done" ? <CheckCircle className="h-5 w-5" /> : i + 1}
                  {state === "active" && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-orange-500/20" />
                  )}
                </div>
                <span
                  className={`text-[11px] font-semibold tracking-wide whitespace-nowrap ${
                    state === "active"
                      ? "text-orange-400"
                      : state === "done"
                      ? "text-emerald-400"
                      : "text-white/25"
                  }`}
                >
                  {s}
                </span>
              </motion.div>
              {i < steps.length - 1 && (
                <div className="mx-2 mb-4 h-px w-10 sm:w-14 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/8" />
                  {step > i + 1 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-400"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="max-w-3xl">
        <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-md overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

          <div className="p-8">
            <AnimatePresence mode="wait">
              {/* ── STEP 1: Contacts & Addresses ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  {/* Sender */}
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
                    <div className="flex items-center gap-2 text-orange-400">
                      <User className="h-4 w-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Sender</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Full Name">
                        <Input defaultValue="Rohan Sharma" className={inputCls} />
                      </Field>
                      <Field label="Phone">
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400/60" />
                          <Input defaultValue="+91 98765 43210" className={`pl-10 ${inputCls}`} />
                        </div>
                      </Field>
                    </div>
                    <Field label="Source Address">
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-orange-400/60" />
                        <Textarea
                          className={`pl-10 min-h-[72px] resize-none ${inputCls}`}
                          defaultValue="42, MG Road, Pune, Maharashtra 411001"
                        />
                      </div>
                    </Field>
                  </div>

                  {/* Receiver */}
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
                    <div className="flex items-center gap-2 text-violet-400">
                      <User className="h-4 w-4" />
                      <span className="text-xs font-black uppercase tracking-widest">Receiver</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Full Name">
                        <Input defaultValue="Priya Mehta" className={inputCls} />
                      </Field>
                      <Field label="Phone">
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400/60" />
                          <Input defaultValue="+91 91234 56789" className={`pl-10 ${inputCls}`} />
                        </div>
                      </Field>
                    </div>
                    <Field label="Destination Address">
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-violet-400/60" />
                        <Textarea
                          className={`pl-10 min-h-[72px] resize-none ${inputCls}`}
                          defaultValue="15, Connaught Place, New Delhi 110001"
                        />
                      </div>
                    </Field>
                  </div>

                  {/* AI Validate */}
                  <AnimatePresence mode="wait">
                    {!aiValidated ? (
                      <motion.button
                        key="vbtn"
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={handleValidate}
                        disabled={isValidating}
                        className="group relative w-full overflow-hidden rounded-xl border border-orange-500/20 bg-orange-500/5 px-5 py-3.5 text-sm font-bold text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/40 transition-all flex items-center justify-center gap-2.5"
                      >
                        {isValidating ? (
                          <>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                              <Sparkles className="h-4 w-4" />
                            </motion.div>
                            <span>AI is analysing addresses & route…</span>
                            <motion.div
                              animate={{ x: ["-100%", "200%"] }}
                              transition={{ duration: 1.2, repeat: Infinity }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/10 to-transparent"
                            />
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4" /> Validate with AI
                          </>
                        )}
                      </motion.button>
                    ) : (
                      <motion.div
                        key="validated"
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-4 space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20">
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                          </div>
                          <span className="font-black text-emerald-400 text-sm">
                            AI Validated · Route Serviceable
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { icon: Building2, label: "Origin PO", value: "Pune GPO" },
                            { icon: Building2, label: "Destination PO", value: "Delhi GPO" },
                            { icon: Route, label: "Distance", value: "1,452 km" },
                            { icon: Clock, label: "Transit", value: "2–3 days" },
                          ].map((item) => (
                            <div key={item.label} className="rounded-lg bg-white/5 px-3 py-2.5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">
                                {item.label}
                              </p>
                              <p className="text-xs font-bold text-white">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <NavRow>
                    <span />
                    <Button onClick={goNext} disabled={!aiValidated} className={primaryBtn}>
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </NavRow>
                </motion.div>
              )}

              {/* ── STEP 2: Parcel Details ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-5"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Weight (kg)">
                      <div className="relative">
                        <Zap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400/50" />
                        <Input
                          type="number"
                          step="0.1"
                          value={weight}
                          onChange={(e) => setWeight(+e.target.value || 0)}
                          className={`pl-10 ${inputCls}`}
                        />
                      </div>
                    </Field>
                    <Field label="Parcel Type">
                      <Select value={parcelType} onValueChange={setParcelType}>
                        <SelectTrigger className={selectCls}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#111114] text-white rounded-xl">
                          {[
                            { v: "standard", l: "Standard (2–3 days)" },
                            { v: "express", l: "Express (next-day)" },
                            { v: "sameday", l: "Same-Day" },
                            { v: "fragile", l: "Fragile Handling" },
                            { v: "document", l: "Document" },
                          ].map((o) => (
                            <SelectItem key={o.v} value={o.v} className="focus:bg-white/10 focus:text-white">
                              {o.l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Field label="Dimensions (cm)">
                    <div className="grid grid-cols-3 gap-3">
                      {(["l", "w", "h"] as const).map((k) => (
                        <div key={k} className="relative">
                          <Ruler className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <Input
                            type="number"
                            value={dims[k]}
                            onChange={(e) => setDims({ ...dims, [k]: +e.target.value || 0 })}
                            className={`pl-10 ${inputCls}`}
                            placeholder={k.toUpperCase()}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-white/30">
                            {k}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
                      <Boxes className="h-3 w-3 text-amber-400" />
                      Volumetric weight:{" "}
                      <span className="font-bold text-white">{volumetric} kg</span> · Chargeable:{" "}
                      <span className="font-bold text-orange-400">{chargeableWeight} kg</span>
                    </div>
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Contents Category">
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className={selectCls}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#111114] text-white rounded-xl">
                          {["Electronics", "Documents", "Apparel", "Food", "Medicine", "Other"].map(
                            (c) => (
                              <SelectItem
                                key={c}
                                value={c.toLowerCase()}
                                className="focus:bg-white/10 focus:text-white"
                              >
                                {c}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <button
                        type="button"
                        onClick={() => setCategory("electronics")}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-300 hover:bg-violet-500/20"
                      >
                        <Wand2 className="h-3 w-3" /> AI Auto-detect from description
                      </button>
                    </Field>

                    <Field label="Declared Value (₹) · for insurance">
                      <div className="relative">
                        <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400/60" />
                        <Input
                          type="number"
                          value={declaredValue}
                          onChange={(e) => setDeclaredValue(+e.target.value || 0)}
                          className={`pl-10 ${inputCls}`}
                        />
                      </div>
                    </Field>
                  </div>

                  <Field label="Description">
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-white/30" />
                      <Textarea
                        className={`pl-10 min-h-[80px] resize-none ${inputCls}`}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </Field>

                  <NavRow>
                    <BackBtn onClick={() => setStep(1)} />
                    <Button onClick={goNext} className={primaryBtn}>
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </NavRow>
                </motion.div>
              )}

              {/* ── STEP 3: Smart Options ── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  <div>
                    <SectionTitle icon={Sparkles} text="Smart Add-ons" />
                    <div className="grid sm:grid-cols-2 gap-3">
                      {SMART_OPTIONS.map((o) => {
                        const on = smartOpts[o.id];
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => toggleOpt(o.id)}
                            className={`group text-left rounded-xl border p-4 transition-all ${
                              on
                                ? "border-orange-500/50 bg-orange-500/10 shadow-lg shadow-orange-500/10"
                                : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                                  on ? "bg-gradient-to-br from-orange-500 to-amber-400 text-white" : "bg-white/5 text-white/50"
                                }`}
                              >
                                <o.icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-bold text-white">{o.label}</p>
                                  <span
                                    className={`text-[10px] font-black uppercase tracking-widest ${
                                      o.price === 0 ? "text-emerald-400" : "text-orange-400"
                                    }`}
                                  >
                                    {o.price === 0 ? "Free" : `+₹${o.price}`}
                                  </span>
                                </div>
                                <p className="text-xs text-white/40 mt-0.5">{o.desc}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <SectionTitle icon={Clock} text="Delivery Preference" />
                    <div className="flex flex-wrap gap-2 mb-4">
                      {TIME_SLOTS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTimeSlot(t)}
                          className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all ${
                            timeSlot === t
                              ? "border-orange-500/50 bg-orange-500/15 text-orange-300"
                              : "border-white/10 bg-white/5 text-white/50 hover:text-white"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <Field label="Drop-off Instructions">
                      <Textarea
                        value={dropInstructions}
                        onChange={(e) => setDropInstructions(e.target.value)}
                        className={`min-h-[64px] resize-none ${inputCls}`}
                        placeholder="e.g. Leave with security, ring bell twice"
                      />
                    </Field>
                  </div>

                  <div>
                    <SectionTitle icon={Shield} text="Insurance Coverage" />
                    <div className="grid sm:grid-cols-3 gap-3">
                      {(Object.keys(INSURANCE) as InsuranceTier[]).map((tier) => {
                        const t = INSURANCE[tier];
                        const active = insurance === tier;
                        return (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => setInsurance(tier)}
                            className={`rounded-xl border p-4 text-left transition-all ${
                              active
                                ? "border-emerald-500/50 bg-emerald-500/10"
                                : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-black text-white">{t.label}</p>
                              {active && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                            </div>
                            <p className="text-[11px] text-white/40 mt-1">Cover {t.cover}</p>
                            <p className="text-xs font-bold text-orange-400 mt-2">
                              {t.price === 0 ? "Free" : `+₹${t.price}`}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <NavRow>
                    <BackBtn onClick={() => setStep(2)} />
                    <Button
                      onClick={() => {
                        setStep(4);
                        if (!aiAnalyzed) handleAnalyze();
                      }}
                      className={primaryBtn}
                    >
                      Run AI Insights <Brain className="ml-2 h-4 w-4" />
                    </Button>
                  </NavRow>
                </motion.div>
              )}

              {/* ── STEP 4: AI Insights ── */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-5"
                >
                  {isAnalyzing ? (
                    <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-10 text-center relative overflow-hidden">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="inline-block mb-4"
                      >
                        <Brain className="h-10 w-10 text-violet-400" />
                      </motion.div>
                      <p className="text-sm font-bold text-violet-300">
                        AI is analyzing your shipment…
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        Predicting ETA · scoring risk · optimizing route
                      </p>
                      <motion.div
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                        className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-violet-400/10 to-transparent"
                      />
                    </div>
                  ) : aiAnalyzed ? (
                    <motion.div
                      initial="hidden"
                      animate="show"
                      variants={{ show: { transition: { staggerChildren: 0.12 } } }}
                      className="space-y-3"
                    >
                      <InsightCard
                        icon={Clock}
                        tint="text-blue-400"
                        title="Predicted Delivery Window"
                        value="Feb 28 – Mar 1, 2026"
                        sub="94% AI confidence · based on 12k similar routes"
                      />
                      <InsightCard
                        icon={Route}
                        tint="text-orange-400"
                        title="Smart Route Preview"
                      >
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {["Pune GPO", "Nagpur Hub", "Bhopal Sort", "Delhi GPO"].map((h, i, arr) => (
                            <div key={h} className="flex items-center gap-1.5">
                              <span className="rounded-md bg-white/8 px-2 py-1 text-[11px] font-bold text-white">
                                {h}
                              </span>
                              {i < arr.length - 1 && (
                                <ArrowRight className="h-3 w-3 text-white/30" />
                              )}
                            </div>
                          ))}
                        </div>
                      </InsightCard>
                      <InsightCard
                        icon={Shield}
                        tint="text-emerald-400"
                        title="Risk Score"
                        value="Low"
                        sub="Weather OK · Route stable · No congestion alerts"
                      />
                      <InsightCard
                        icon={Leaf}
                        tint="text-emerald-400"
                        title="Carbon Footprint"
                      >
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/50">Your shipment</span>
                            <span className="font-bold text-white">2.4 kg CO₂</span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full w-[45%] bg-gradient-to-r from-emerald-500 to-emerald-300" />
                          </div>
                          <p className="mt-1.5 text-[11px] text-white/40">
                            18% below average for this route
                          </p>
                        </div>
                      </InsightCard>
                      <InsightCard
                        icon={Boxes}
                        tint="text-amber-400"
                        title="Packaging Recommendation"
                        value="Medium box · 35×25×20 cm"
                        sub="Best fit for declared dimensions"
                      />
                      <InsightCard
                        icon={TrendingDown}
                        tint="text-violet-400"
                        title="Price Optimization"
                        value={parcelType === "express" ? "Save ₹40 with Standard" : "You're on the optimal plan"}
                        sub={parcelType === "express" ? "Delivery would be 1 day later" : "No cheaper alternative for this route"}
                      />
                    </motion.div>
                  ) : null}

                  <NavRow>
                    <BackBtn onClick={() => setStep(3)} />
                    <Button onClick={() => setStep(5)} disabled={!aiAnalyzed} className={primaryBtn}>
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </NavRow>
                </motion.div>
              )}

              {/* ── STEP 5: Review ── */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-400" />
                      <span className="text-xs font-black uppercase tracking-widest text-white/40">
                        Shipment Summary
                      </span>
                    </div>

                    <div className="p-5 divide-y divide-white/[0.05]">
                      {[
                        { label: "From", value: "Rohan · Pune, MH", icon: MapPin, color: "text-orange-400" },
                        { label: "To", value: "Priya · Delhi, DL", icon: MapPin, color: "text-violet-400" },
                        { label: "Weight", value: `${weight} kg (chargeable ${chargeableWeight} kg)`, icon: Zap, color: "text-amber-400" },
                        { label: "Dimensions", value: `${dims.l} × ${dims.w} × ${dims.h} cm`, icon: Ruler, color: "text-white/60" },
                        { label: "Type", value: parcelType.charAt(0).toUpperCase() + parcelType.slice(1), icon: Package, color: "text-blue-400" },
                        { label: "Category", value: category.charAt(0).toUpperCase() + category.slice(1), icon: Boxes, color: "text-violet-400" },
                        { label: "Declared Value", value: `₹${declaredValue.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-emerald-400" },
                        { label: "Time Slot", value: timeSlot, icon: Clock, color: "text-blue-400" },
                        { label: "Insurance", value: `${INSURANCE[insurance].label} · ${INSURANCE[insurance].cover}`, icon: Shield, color: "text-emerald-400" },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-2.5">
                            <row.icon className={`h-3.5 w-3.5 ${row.color}`} />
                            <span className="text-sm text-white/40">{row.label}</span>
                          </div>
                          <span className="text-sm font-bold text-white text-right">{row.value}</span>
                        </div>
                      ))}

                      {/* Active add-ons */}
                      <div className="py-3">
                        <p className="text-xs text-white/40 mb-2">Smart Add-ons</p>
                        <div className="flex flex-wrap gap-1.5">
                          {SMART_OPTIONS.filter((o) => smartOpts[o.id]).map((o) => (
                            <span
                              key={o.id}
                              className="inline-flex items-center gap-1 rounded-md border border-orange-500/25 bg-orange-500/10 px-2 py-1 text-[11px] font-bold text-orange-300"
                            >
                              <o.icon className="h-3 w-3" /> {o.label}
                              {o.price > 0 && <span className="text-orange-400/70">+₹{o.price}</span>}
                            </span>
                          ))}
                          {SMART_OPTIONS.every((o) => !smartOpts[o.id]) && (
                            <span className="text-xs text-white/30">None selected</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cost breakdown */}
                    <div className="mx-5 mb-5 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/15 p-5">
                      <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-3">
                        Cost Breakdown
                      </p>
                      <div className="space-y-1.5 text-sm">
                        <CostRow label="Base fare" value={baseFare} />
                        <CostRow label={`Weight charge (${chargeableWeight} kg · ${parcelType})`} value={weightCharge} />
                        <CostRow label="Smart add-ons" value={addOnsTotal} />
                        <CostRow label={`Insurance (${INSURANCE[insurance].label})`} value={insuranceCharge} />
                        <CostRow label="GST 18%" value={gst} muted />
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-sm font-bold text-white">Total</span>
                        <span className="text-3xl font-black text-orange-400">
                          ₹{total.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 cursor-pointer">
                    <Checkbox
                      checked={agreed}
                      onCheckedChange={(v) => setAgreed(!!v)}
                      className="mt-0.5 border-white/20 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    />
                    <span className="text-xs text-white/60 leading-relaxed">
                      I agree to AIPOSTAL's <span className="text-orange-400 font-bold">Terms & Conditions</span> and
                      confirm contents are legal, accurately declared, and comply with India Post regulations.
                    </span>
                  </label>

                  <NavRow>
                    <BackBtn onClick={() => setStep(4)} />
                    <Button
                      onClick={() => navigate("/user/payment")}
                      disabled={!agreed}
                      className={primaryBtn}
                    >
                      <Package className="h-4 w-4 mr-2" /> Proceed to Payment · ₹{total.toLocaleString("en-IN")}
                    </Button>
                  </NavRow>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

/* ───── helpers ───── */
const inputCls =
  "border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-orange-500/50 focus-visible:border-orange-500/40 rounded-xl h-11 transition-all";
const selectCls =
  "border-white/10 bg-white/5 text-white rounded-xl h-11 focus:ring-1 focus:ring-orange-500/50";
const primaryBtn =
  "bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold shadow-lg shadow-orange-500/25 hover:opacity-90 hover:shadow-orange-500/40 transition-all rounded-xl px-6 disabled:opacity-30";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-bold uppercase tracking-widest text-white/40">{label}</Label>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, text }: { icon: typeof Sparkles; text: string }) => (
  <div className="mb-3 flex items-center gap-2">
    <Icon className="h-4 w-4 text-orange-400" />
    <span className="text-xs font-black uppercase tracking-widest text-white/60">{text}</span>
  </div>
);

const NavRow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex justify-between pt-2">{children}</div>
);

const BackBtn = ({ onClick }: { onClick: () => void }) => (
  <Button
    variant="outline"
    onClick={onClick}
    className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white rounded-xl px-5 gap-2"
  >
    <ArrowLeft className="h-4 w-4" /> Back
  </Button>
);

const InsightCard = ({
  icon: Icon,
  tint,
  title,
  value,
  sub,
  children,
}: {
  icon: typeof Sparkles;
  tint: string;
  title: string;
  value?: string;
  sub?: string;
  children?: React.ReactNode;
}) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
    className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
  >
    <div className="flex items-start gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ${tint}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black uppercase tracking-widest text-white/40">{title}</p>
        {value && <p className="mt-0.5 text-sm font-bold text-white">{value}</p>}
        {sub && <p className="mt-0.5 text-xs text-white/40">{sub}</p>}
        {children}
      </div>
    </div>
  </motion.div>
);

const CostRow = ({ label, value, muted }: { label: string; value: number; muted?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className={muted ? "text-white/40" : "text-white/60"}>{label}</span>
    <span className={`font-bold ${muted ? "text-white/60" : "text-white"}`}>
      ₹{value.toLocaleString("en-IN")}
    </span>
  </div>
);

export default BookParcel;
