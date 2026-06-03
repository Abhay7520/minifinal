import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import PageBackground from "@/components/PageBackground";
import bgBook from "@/assets/bg-book.jpg";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import ValidationMap from "@/components/ValidationMap";
import type { ValidationMapMarker } from "@/components/ValidationMap";
import { validateAddresses } from "@/services/addressService";
import { predictEta } from "@/services/etaService";
import type { AddressSuggestion, ValidateAddressResponse } from "@/types/address";
import type { PredictEtaResponse } from "@/types/eta";
import { ApiError, apiPost } from "@/lib/api";
import { toast } from "sonner";
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
  const [sourceAddress, setSourceAddress] = useState("42, MG Road, Pune, Maharashtra - 411001");
  const [destAddress, setDestAddress] = useState("15, Connaught Place, New Delhi, Delhi - 110001");
  const [sourceSelection, setSourceSelection] = useState<AddressSuggestion | null>(null);
  const [destSelection, setDestSelection] = useState<AddressSuggestion | null>(null);
  const [validationResult, setValidationResult] = useState<ValidateAddressResponse | null>(null);
  const [aiValidated, setAiValidated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Step 2
  const [weight, setWeight] = useState(2.5);
  const [dims, setDims] = useState({ l: 30, w: 20, h: 15 });
  const [parcelType, setParcelType] = useState("standard");
  const [category, setCategory] = useState("electronics");
  const [declaredValue, setDeclaredValue] = useState(4500);
  const [description, setDescription] = useState("Electronics - laptop charger");

  // New Category states
  const [aiCategory, setAiCategory] = useState("electronics");
  const [aiConfidence, setAiConfidence] = useState(0.95);
  const [isAiDetecting, setIsAiDetecting] = useState(false);
  const [isOverridden, setIsOverridden] = useState(false);

  // Step 3
  const [smartOpts, setSmartOpts] = useState<Record<SmartOptId, boolean>>(() => {
    const init = {} as Record<SmartOptId, boolean>;
    SMART_OPTIONS.forEach((o) => (init[o.id] = !!o.defaultOn));
    return init;
  });
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("Anytime");
  const [dropInstructions, setDropInstructions] = useState("Leave with security if not home");
  const [insurance, setInsurance] = useState<InsuranceTier>("standard");
  const [senderName, setSenderName] = useState("Rohan Sharma");
  const [senderPhone, setSenderPhone] = useState("+91 98765 43210");
  const [receiverName, setReceiverName] = useState("Priya Mehta");
  const [receiverPhone, setReceiverPhone] = useState("+91 91234 56789");


  // Step 4 — ETA / AI Insights
  const [aiAnalyzed, setAiAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [etaPrediction, setEtaPrediction] = useState<PredictEtaResponse | null>(null);
  const [isPredictingEta, setIsPredictingEta] = useState(false);

  // Step 5
  const [agreed, setAgreed] = useState(false);

  // Centralized Pricing Breakdown State
  const [pricingBreakdown, setPricingBreakdown] = useState<{
    volumetric_weight: number;
    chargeable_weight: number;
    base_fare: number;
    weight_charge: number;
    addons_charge: number;
    insurance_charge: number;
    subtotal: number;
    gst: number;
    total: number;
  } | null>(null);

  const activeSmartOptsList = useMemo(() => {
    return Object.keys(smartOpts).filter((k) => smartOpts[k as SmartOptId]);
  }, [smartOpts]);

  // Effect to fetch centralized pricing breakdown from backend
  useEffect(() => {
    let cancelled = false;
    async function updatePrice() {
      try {
        const res = await apiPost<any>("/calculate-price", {
          weight,
          length: dims.l,
          width: dims.w,
          height: dims.h,
          parcel_type: parcelType,
          smart_options: activeSmartOptsList,
          insurance,
        });
        if (cancelled) return;
        setPricingBreakdown(res);
      } catch (err) {
        console.error("Pricing calculation failed", err);
      }
    }
    updatePrice();
    return () => {
      cancelled = true;
    };
  }, [weight, dims, parcelType, activeSmartOptsList, insurance]);

  const volumetric = pricingBreakdown?.volumetric_weight ?? +((dims.l * dims.w * dims.h) / 5000).toFixed(2);
  const chargeableWeight = pricingBreakdown?.chargeable_weight ?? Math.max(weight, volumetric);
  const baseFare = pricingBreakdown?.base_fare ?? 60;
  const weightCharge = pricingBreakdown?.weight_charge ?? 0;
  const addOnsTotal = pricingBreakdown?.addons_charge ?? 0;
  const insuranceCharge = pricingBreakdown?.insurance_charge ?? 0;
  const subtotal = pricingBreakdown?.subtotal ?? 0;
  const gst = pricingBreakdown?.gst ?? 0;
  const total = pricingBreakdown?.total ?? 0;

  // Trigger AI Category prediction on description change
  const handleDescriptionChange = async (val: string) => {
    setDescription(val);
    if (val.trim().length > 3) {
      setIsAiDetecting(true);
      try {
        const res = await apiPost<{ category: string; confidence: number }>("/predict-category", { description: val });
        setAiCategory(res.category);
        setAiConfidence(res.confidence);
        if (!isOverridden) {
          setCategory(res.category);
        }
      } catch (err) {
        console.error("AI Category Prediction failed", err);
      } finally {
        setIsAiDetecting(false);
      }
    } else {
      setAiCategory("other");
      setAiConfidence(0.50);
      if (!isOverridden) {
        setCategory("other");
      }
    }
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    if (val !== aiCategory) {
      setIsOverridden(true);
    } else {
      setIsOverridden(false);
    }
  };

  const handleValidate = async () => {
    if (!sourceAddress.trim() || !destAddress.trim()) {
      toast.error("Please enter both source and destination addresses");
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setAiValidated(false);
    setValidationResult(null);

    try {
      const result = await validateAddresses(
        {
          address: sourceAddress,
          lat: sourceSelection?.lat ?? null,
          lng: sourceSelection?.lng ?? null,
        },
        {
          address: destAddress,
          lat: destSelection?.lat ?? null,
          lng: destSelection?.lng ?? null,
        }
      );
      setValidationResult(result);
      setAiValidated(true);
      toast.success("Addresses validated · Route mapped");
      void runEtaPrediction(result);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? typeof err.detail === "object" && err.detail && "message" in (err.detail as object)
            ? String((err.detail as { message: string }).message)
            : err.message
          : "Validation failed. Check addresses and try again.";
      setValidationError(message);
      toast.error(message);
    } finally {
      setIsValidating(false);
    }
  };

  const mapMarkers = useMemo((): ValidationMapMarker[] => {
    if (!validationResult) return [];
    const { source, destination, nearest_source_postoffice, nearest_destination_postoffice } =
      validationResult;
    return [
      {
        id: "Source",
        lat: source.lat,
        lng: source.lng,
        label: source.locality || source.matched_label,
        sublabel: `${source.city}, ${source.state}`,
        type: "source",
      },
      {
        id: "Destination",
        lat: destination.lat,
        lng: destination.lng,
        label: destination.locality || destination.matched_label,
        sublabel: `${destination.city}, ${destination.state}`,
        type: "destination",
      },
      {
        id: "Origin PO",
        lat: nearest_source_postoffice.lat,
        lng: nearest_source_postoffice.lng,
        label: nearest_source_postoffice.name,
        sublabel: `${nearest_source_postoffice.distance_km} km away`,
        type: "source-po",
      },
      {
        id: "Dest PO",
        lat: nearest_destination_postoffice.lat,
        lng: nearest_destination_postoffice.lng,
        label: nearest_destination_postoffice.name,
        sublabel: `${nearest_destination_postoffice.distance_km} km away`,
        type: "destination-po",
      },
    ];
  }, [validationResult]);

  const resetValidation = () => {
    setAiValidated(false);
    setValidationResult(null);
    setValidationError(null);
    setEtaPrediction(null);
    setAiAnalyzed(false);
  };

  const runEtaPrediction = async (validation: ValidateAddressResponse) => {
    setIsPredictingEta(true);
    try {
      const result = await predictEta({
        source_lat: validation.source.lat,
        source_lng: validation.source.lng,
        dest_lat: validation.destination.lat,
        dest_lng: validation.destination.lng,
        distance_km: validation.route.distance_km,
        weight,
        parcel_type: parcelType,
        insurance,
        time_slot: timeSlot,
      });
      setEtaPrediction(result);
    } catch {
      toast.error("ETA prediction failed");
    } finally {
      setIsPredictingEta(false);
    }
  };

  const handleAnalyze = async () => {
    if (!validationResult) {
      toast.error("Validate addresses first");
      return;
    }
    setIsAnalyzing(true);
    setAiAnalyzed(false);
    try {
      const result = await predictEta({
        source_lat: validationResult.source.lat,
        source_lng: validationResult.source.lng,
        dest_lat: validationResult.destination.lat,
        dest_lng: validationResult.destination.lng,
        distance_km: validationResult.route.distance_km,
        weight,
        parcel_type: parcelType,
        insurance,
        time_slot: timeSlot,
      });
      setEtaPrediction(result);
      setAiAnalyzed(true);
    } catch {
      toast.error("AI insights failed — could not predict ETA");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const goNext = () => {
    if (step === 4 && !aiAnalyzed) handleAnalyze();
    setStep((s) => Math.min(5, s + 1));
  };

  const handleProceedToPayment = () => {
    if (!validationResult) {
      toast.error("Addresses must be validated first");
      return;
    }
    
    const weatherOptions = ["Clear", "Rainy", "Foggy", "Stormy"];
    const simulatedWeather = validationResult.route.distance_km > 500 
      ? weatherOptions[Math.floor(Math.random() * 4)] 
      : "Clear";
    const simulatedCongestion = validationResult.route.distance_km > 300 
      ? ["Low", "Medium", "High"][Math.floor(Math.random() * 3)] 
      : "Low";

    const activeSmartOpts = Object.keys(smartOpts).filter((k) => smartOpts[k as SmartOptId]);

    const bookingData = {
      sender_name: senderName,
      sender_phone: senderPhone,
      source_address: sourceAddress,
      source_lat: validationResult.source.lat,
      source_lng: validationResult.source.lng,
      source_po: validationResult.nearest_source_postoffice.name,
      
      receiver_name: receiverName,
      receiver_phone: receiverPhone,
      destination_address: destAddress,
      dest_lat: validationResult.destination.lat,
      dest_lng: validationResult.destination.lng,
      dest_po: validationResult.nearest_destination_postoffice.name,
      
      weight,
      parcel_type: parcelType,
      declared_value: declaredValue,
      category,
      time_slot: timeSlot,
      insurance,
      
      distance_km: validationResult.route.distance_km,
      duration_hours: validationResult.route.duration_hours,
      duration_text: validationResult.route.duration_text,
      transit_days: validationResult.route.transit_days,
      route_coordinates: validationResult.route.coordinates,
      
      price_total: total,
      weather: simulatedWeather,
      congestion: simulatedCongestion,

      // New fields
      description: description,
      ai_detected_category: aiCategory,
      final_category: category,
      confidence: aiConfidence,
      dimensions: dims,
      smart_options: activeSmartOpts
    };
    
    sessionStorage.setItem("pending_booking", JSON.stringify(bookingData));
    navigate("/user/payment");
  };


  const toggleOpt = (id: SmartOptId) =>
    setSmartOpts((p) => ({ ...p, [id]: !p[id] }));

  return (
    <DashboardLayout role="user">
      <PageBackground image={bgBook} variant="depth" />
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
      <div className={step === 1 ? "max-w-6xl" : "max-w-3xl"}>
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
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left: address forms */}
                    <div className="space-y-6">
                      {/* Sender */}
                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
                        <div className="flex items-center gap-2 text-orange-400">
                          <User className="h-4 w-4" />
                          <span className="text-xs font-black uppercase tracking-widest">Sender</span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Field label="Full Name">
                            <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} className={inputCls} />
                          </Field>
                          <Field label="Phone">
                            <div className="relative">
                              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400/60" />
                              <Input value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} className={`pl-10 ${inputCls}`} />
                            </div>
                          </Field>
                        </div>
                        <AddressAutocomplete
                          id="source-address"
                          label="Source Address"
                          value={sourceAddress}
                          onChange={(v) => {
                            setSourceAddress(v);
                            resetValidation();
                            if (sourceSelection && v !== sourceSelection.label) {
                              setSourceSelection(null);
                            }
                          }}
                          onSelect={(s) => {
                            setSourceSelection(s);
                            resetValidation();
                          }}
                          placeholder="Try: gachi hyd, MG Road Pune, Connaught Place..."
                          accent="orange"
                        />
                      </div>

                      {/* Receiver */}
                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 space-y-4">
                        <div className="flex items-center gap-2 text-violet-400">
                          <User className="h-4 w-4" />
                          <span className="text-xs font-black uppercase tracking-widest">Receiver</span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Field label="Full Name">
                            <Input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} className={inputCls} />
                          </Field>
                          <Field label="Phone">
                            <div className="relative">
                              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-400/60" />
                              <Input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} className={`pl-10 ${inputCls}`} />
                            </div>
                          </Field>
                        </div>
                        <AddressAutocomplete
                          id="dest-address"
                          label="Destination Address"
                          value={destAddress}
                          onChange={(v) => {
                            setDestAddress(v);
                            resetValidation();
                            if (destSelection && v !== destSelection.label) {
                              setDestSelection(null);
                            }
                          }}
                          onSelect={(s) => {
                            setDestSelection(s);
                            resetValidation();
                          }}
                          placeholder="Try: banjara hyd, Saket Delhi, Koramangala..."
                          accent="violet"
                        />
                      </div>

                      {/* AI Validate button */}
                      <AnimatePresence mode="wait">
                        {!aiValidated ? (
                          <motion.button
                            key="vbtn"
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={handleValidate}
                            disabled={isValidating}
                            className="group relative w-full overflow-hidden rounded-xl border border-orange-500/20 bg-orange-500/5 px-5 py-3.5 text-sm font-bold text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/40 transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
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
                                <Brain className="h-4 w-4" /> Validate
                              </>
                            )}
                          </motion.button>
                        ) : null}
                      </AnimatePresence>

                      {validationError && (
                        <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-400">
                          {validationError}
                        </div>
                      )}
                    </div>

                    {/* Right: validation results + map */}
                    <div className="space-y-4">
                      <AnimatePresence mode="wait">
                        {aiValidated && validationResult ? (
                          <motion.div
                            key="validated"
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-4 space-y-4"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20">
                                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                                </div>
                                <span className="font-black text-emerald-400 text-sm">
                                  {validationResult.overall_serviceable
                                    ? "AI Validated · Route Serviceable"
                                    : "Validated · Limited Serviceability"}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">
                                {validationResult.overall_confidence}% confidence
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              {[
                                {
                                  icon: Building2,
                                  label: "Origin PO",
                                  value: validationResult.nearest_source_postoffice.name,
                                  sub: `${validationResult.nearest_source_postoffice.distance_km} km`,
                                },
                                {
                                  icon: Building2,
                                  label: "Destination PO",
                                  value: validationResult.nearest_destination_postoffice.name,
                                  sub: `${validationResult.nearest_destination_postoffice.distance_km} km`,
                                },
                                {
                                  icon: Route,
                                  label: "Distance",
                                  value: `${validationResult.route.distance_km.toLocaleString("en-IN")} km`,
                                  sub: validationResult.route.duration_text,
                                },
                                {
                                  icon: Clock,
                                  label: "Transit",
                                  value: validationResult.route.transit_days,
                                  sub: `ETA ${validationResult.route.duration_text}`,
                                },
                              ].map((item) => (
                                <div key={item.label} className="rounded-lg bg-white/5 px-3 py-2.5">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">
                                    {item.label}
                                  </p>
                                  <p className="text-xs font-bold text-white line-clamp-2">{item.value}</p>
                                  {item.sub && (
                                    <p className="text-[10px] text-white/40 mt-0.5">{item.sub}</p>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div className="grid sm:grid-cols-2 gap-2">
                              <div className="rounded-lg border border-orange-500/15 bg-orange-500/5 px-3 py-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400/60">Source</p>
                                <p className="text-xs font-semibold text-white mt-1">{validationResult.source.matched_label}</p>
                                <p className="text-[10px] text-white/40 mt-0.5">{validationResult.source.confidence}% match</p>
                              </div>
                              <div className="rounded-lg border border-violet-500/15 bg-violet-500/5 px-3 py-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400/60">Destination</p>
                                <p className="text-xs font-semibold text-white mt-1">{validationResult.destination.matched_label}</p>
                                <p className="text-[10px] text-white/40 mt-0.5">{validationResult.destination.confidence}% match</p>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 flex flex-col items-center justify-center text-center min-h-[200px]"
                          >
                            <Brain className="h-8 w-8 text-white/15 mb-3" />
                            <p className="text-sm font-semibold text-white/30">AI Validation & Live Map</p>
                            <p className="text-xs text-white/20 mt-1 max-w-xs">
                              Enter addresses, select suggestions, then validate to see route intelligence and nearest post offices.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {aiValidated && validationResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                        >
                          <ValidationMap
                            markers={mapMarkers}
                            routeCoordinates={validationResult.route.coordinates}
                            className="h-[320px] lg:h-[360px]"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>

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

                  <Field label="Description">
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-white/30" />
                      <Textarea
                        placeholder="Describe what is inside the parcel (e.g. laptop charger, books, clothes)..."
                        className={`pl-10 min-h-[80px] resize-none ${inputCls}`}
                        value={description}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                      />
                    </div>
                  </Field>

                  <div className="rounded-xl border border-violet-500/20 bg-gradient-to-r from-violet-500/10 via-orange-500/5 to-transparent p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30">
                        <Brain className={`h-5 w-5 ${isAiDetecting ? "animate-pulse" : ""}`} />
                      </div>
                      <div>
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-violet-400">AI Contents Detection</h5>
                        <p className="text-sm font-semibold text-white mt-0.5">
                          {isAiDetecting ? "AI is analyzing description..." : `Detected Category: ${aiCategory.charAt(0).toUpperCase() + aiCategory.slice(1)}`}
                        </p>
                      </div>
                    </div>
                    {!isAiDetecting && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/45 bg-white/5 px-2 py-1 rounded border border-white/10">
                        {Math.round(aiConfidence * 100)}% Confidence
                      </span>
                    )}
                  </div>

                  <Field label="Contents Category">
                    <Select value={category} onValueChange={handleCategoryChange}>
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
                    {isOverridden && (
                      <div className="mt-2 flex items-center justify-between text-xs text-orange-400/80">
                        <span className="flex items-center gap-1.5">
                          <span>⚠️</span> Manually overridden category from AI suggestion
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCategory(aiCategory);
                            setIsOverridden(false);
                          }}
                          className="font-bold text-violet-400 hover:underline"
                        >
                          Reset to AI Detection
                        </button>
                      </div>
                    )}
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
                        Predicting delivery time…
                      </p>
                      <p className="text-xs text-white/40 mt-1">
                        ML model analyzing distance · weight · parcel type · route complexity
                      </p>
                      <div className="mt-5 mx-auto max-w-xs space-y-2">
                        {[1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0.3 }}
                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                            className="h-2 rounded-full bg-white/10"
                          />
                        ))}
                      </div>
                      <motion.div
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                        className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-violet-400/10 to-transparent"
                      />
                    </div>
                  ) : aiAnalyzed && etaPrediction ? (
                    <motion.div
                      initial="hidden"
                      animate="show"
                      variants={{ show: { transition: { staggerChildren: 0.12 } } }}
                      className="space-y-3"
                    >
                      <InsightCard
                        icon={Clock}
                        tint="text-blue-400"
                        title="Estimated Delivery Time"
                        value={`${etaPrediction.estimated_days} days · ${etaPrediction.estimated_hours} hrs`}
                        sub={`Model: ${etaPrediction.model_type.replace(/_/g, " ")} · ${validationResult?.route.distance_km.toLocaleString("en-IN")} km route`}
                      />
                      <InsightCard
                        icon={Route}
                        tint="text-orange-400"
                        title="ETA Range"
                        value={`${etaPrediction.eta_range.min_days} – ${etaPrediction.eta_range.max_days} days`}
                        sub={`Window based on ${parcelType} · ${weight} kg · ${timeSlot} slot`}
                      />
                      <InsightCard
                        icon={Shield}
                        tint="text-emerald-400"
                        title="Confidence Score"
                        value={`${Math.round(etaPrediction.confidence_score * 100)}%`}
                        sub={
                          etaPrediction.confidence_score >= 0.8
                            ? "High confidence prediction"
                            : etaPrediction.confidence_score >= 0.65
                            ? "Moderate confidence — route variables apply"
                            : "Lower confidence — review risk factors"
                        }
                      />
                      <InsightCard
                        icon={Zap}
                        tint="text-amber-400"
                        title="Risk Factors"
                      >
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {etaPrediction.risk_factors.map((risk) => (
                            <motion.span
                              key={risk}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-300 capitalize"
                            >
                              {risk}
                            </motion.span>
                          ))}
                        </div>
                      </InsightCard>
                      {validationResult && (
                        <InsightCard
                          icon={Building2}
                          tint="text-violet-400"
                          title="Smart Route Preview"
                        >
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            {[
                              validationResult.nearest_source_postoffice.name,
                              "Regional Hub",
                              validationResult.nearest_destination_postoffice.name,
                            ].map((h, i, arr) => (
                              <div key={h} className="flex items-center gap-1.5">
                                <span className="rounded-md bg-white/8 px-2 py-1 text-[11px] font-bold text-white line-clamp-1 max-w-[140px]">
                                  {h}
                                </span>
                                {i < arr.length - 1 && (
                                  <ArrowRight className="h-3 w-3 text-white/30 shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        </InsightCard>
                      )}
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
                      onClick={handleProceedToPayment}
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
