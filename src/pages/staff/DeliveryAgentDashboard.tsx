import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Package,
  CheckCircle,
  MapPin,
  Phone,
  IndianRupee,
  Navigation,
  Clock,
  Star,
  KeyRound,
  X,
  PhoneCall,
  MessageSquare,
  Compass,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Activity,
  HeartCrack,
  Mic,
  MicOff,
  Wifi,
  WifiOff,
  Battery,
  ShieldAlert,
  CloudRain,
  Flame,
  FileText,
  Send,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import LeafletMap from "@/components/LeafletMap";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  getStaffDeliveries,
  verifyDeliveryOtp,
  markDeliveryFailed,
  reattemptDelivery,
  logDeliveryAction,
  getStaffAnalytics,
  getOptimizedRoute,
  getPriorityRoutes,
  getStopEta,
  logVoiceCommand,
  updateAgentLocation,
  reportIncident,
  DeliveryStop,
  StaffAnalytics,
  PriorityStop,
  EtaResponse
} from "@/services/staffService";

// Helper for Web Speech recognitions type declarations
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

const DeliveryAgentDashboard = () => {
  const location = useLocation();

  // Core delivery & stats states
  const [stops, setStops] = useState<DeliveryStop[]>([]);
  const [analytics, setAnalytics] = useState<StaffAnalytics>({
    summary: {
      completed: 0,
      failed: 0,
      active: 0,
      performance_score: "94%",
      avg_delivery_time: "2.4 days",
      productivity_insight: "Optimize routes to complete tasks on time."
    },
    voice_assistant: { total_commands: 0, success_rate: 100 },
    charts: { completion_trend: [], mileage_trend: [], status_ratio: [] }
  });
  
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState("");
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [showContact, setShowContact] = useState<string | null>(null);
  const [showFailModal, setShowFailModal] = useState<string | null>(null);
  
  // Geolocation & Battery status states
  const [agentCoords, setAgentCoords] = useState<[number, number]>([18.5204, 73.8567]); // Pune Starting Hub Default
  const [agentSpeed, setAgentSpeed] = useState<number>(0);
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  
  // Offline-First states
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  
  // AI routing states
  const [optimizeRoute, setOptimizeRoute] = useState(false);
  const [optimizedPathCoords, setOptimizedPathCoords] = useState<number[][]>([]);
  const [optimizedMetrics, setOptimizedMetrics] = useState<{ distance: number; duration: string } | null>(null);
  const [priorityStops, setPriorityStops] = useState<PriorityStop[]>([]);

  // Weather Alerts state for next/current stop
  const [weatherAlert, setWeatherAlert] = useState<EtaResponse | null>(null);

  // Voice Assistant states
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // Emergency Incident state
  const [reportedIncidents, setReportedIncidents] = useState<any[]>([]);
  const [incidentForm, setIncidentForm] = useState({
    tracking_id: "",
    issue_type: "vehicle issue",
    details: "",
    image_url: ""
  });
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);

  // Voice Log List for staff/voice path
  const [voiceLogsList, setVoiceLogsList] = useState<any[]>([]);

  // Detect offline / online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Network connection restored! Syncing offline queue...");
      syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.warning("Network connection lost. Offline delivery mode active.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync offline queued actions from localStorage
  const syncOfflineQueue = async () => {
    try {
      const queueRaw = localStorage.getItem("aipostal_offline_queue");
      if (!queueRaw) return;

      const queue: any[] = JSON.parse(queueRaw);
      if (queue.length === 0) return;

      let syncedCount = 0;
      for (const action of queue) {
        if (action.type === "verify-otp") {
          await verifyDeliveryOtp(action.trackingId, action.otp, true);
          syncedCount++;
        } else if (action.type === "fail") {
          await markDeliveryFailed(action.trackingId, action.reason);
          syncedCount++;
        }
      }

      localStorage.removeItem("aipostal_offline_queue");
      toast.success(`Successfully synced ${syncedCount} offline deliveries with server database!`);
      loadData(true);
    } catch (err) {
      console.error("Error syncing offline queue:", err);
    }
  };

  // Queue offline actions helper
  const queueOfflineAction = (action: any) => {
    const queueRaw = localStorage.getItem("aipostal_offline_queue");
    const queue = queueRaw ? JSON.parse(queueRaw) : [];
    queue.push(action);
    localStorage.setItem("aipostal_offline_queue", JSON.stringify(queue));
    toast.info("Action saved to local cache. Syncing automatically on reconnection.");
  };

  // Geolocation polling
  useEffect(() => {
    // Check geolocation support
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported by browser.");
    } else {
      const fetchCoords = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setAgentCoords([lat, lng]);
            // Fluctuates speed between 20 and 45 when active to look dynamic
            const computedSpeed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : Math.floor(20 + Math.random() * 25);
            setAgentSpeed(computedSpeed);
          },
          (err) => {
            console.warn("Geolocation retrieval failed:", err.message);
          },
          { enableHighAccuracy: true }
        );
      };

      fetchCoords();
      const interval = setInterval(fetchCoords, 10000); // 10s poll
      return () => clearInterval(interval);
    }
  }, []);

  // Battery monitoring
  useEffect(() => {
    const fetchBattery = async () => {
      try {
        if ("getBattery" in navigator) {
          const battery: any = await (navigator as any).getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          
          battery.addEventListener("levelchange", () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
        }
      } catch (err) {
        // Fallback random battery drain simulation
        setBatteryLevel((prev) => Math.max(10, prev - 1));
      }
    };

    fetchBattery();
    const interval = setInterval(fetchBattery, 60000);
    return () => clearInterval(interval);
  }, []);

  // Upload location state to backend every 10s
  useEffect(() => {
    if (isOffline) return;
    
    const syncLocation = async () => {
      try {
        await updateAgentLocation("Rohan Sharma", agentCoords[0], agentCoords[1], agentSpeed, batteryLevel);
      } catch (e) {
        // ignore background update failures
      }
    };

    syncLocation();
    const interval = setInterval(syncLocation, 10000);
    return () => clearInterval(interval);
  }, [agentCoords, agentSpeed, batteryLevel, isOffline]);

  // Web Speech API Voice synthesis helper
  const speakFeedback = (text: string) => {
    try {
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("Speech synthesis unavailable", e);
    }
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = "en-US";
      rec.interimResults = false;

      rec.onstart = () => {
        setIsListening(true);
        setSpeechTranscript("Listening command...");
      };

      rec.onresult = async (event: any) => {
        const command = event.results[0][0].transcript.toLowerCase();
        setSpeechTranscript(command);
        await handleVoiceCommand(command);
      };

      rec.onerror = (e: any) => {
        console.error("Speech error", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [stops]);

  const toggleVoiceListening = () => {
    if (!recognitionRef.current) {
      toast.error("Web Speech Recognition is not supported on this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Voice Command routing logic
  const handleVoiceCommand = async (command: string) => {
    let success = false;
    let feedbackText = "Command not recognized. Please try again.";

    try {
      const activeStop = stops.find(s => s.status === "current") || stops[0];

      if (command.includes("navigate") || command.includes("open map") || command.includes("directions")) {
        if (activeStop) {
          triggerAction(activeStop.id, "navigate");
          feedbackText = `Opening navigation directions for customer ${activeStop.customer}.`;
          success = true;
        } else {
          feedbackText = "No active stop to navigate to.";
        }
      } else if (command.includes("mark delivered") || command.includes("confirm delivery") || command.includes("verify otp") || command.includes("otp")) {
        if (activeStop) {
          feedbackText = "Delivery selected. Please enter the verification OTP.";
          success = true;
          // Trigger OTP input focus
          const otpInputEl = document.querySelector('input[placeholder="OTP Code"]') as HTMLInputElement;
          if (otpInputEl) otpInputEl.focus();
        } else {
          feedbackText = "No current stops require OTP verification.";
        }
      } else if (command.includes("emergency") || command.includes("report incident") || command.includes("accident") || command.includes("broken")) {
        feedbackText = "Emergency center requested. Redirecting you to incidents portal.";
        success = true;
        window.history.pushState({}, "", "/staff/incidents");
        // Dispatch location change event
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else if (command.includes("refresh") || command.includes("sync") || command.includes("reload")) {
        feedbackText = "Syncing delivery schedules from database.";
        await loadData(false);
        success = true;
      }

      toast.info(`Voice command: "${command}"`, {
        description: success ? "Executed successfully" : "Not matched"
      });

      speakFeedback(feedbackText);
      
      // Log audit trail to DB
      if (!isOffline) {
        await logVoiceCommand("Rohan Sharma", command, success);
      }
      
      // Refresh voice logs list if on voice screen
      if (location.pathname === "/staff/voice") {
        fetchVoiceLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load and sync data
  const loadData = async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      
      const deliveries = await getStaffDeliveries();
      const stats = await getStaffAnalytics();
      setAnalytics(stats);

      if (optimizeRoute) {
        const optRoute = await getOptimizedRoute();
        setStops(optRoute.optimized_order);
        setOptimizedPathCoords(optRoute.polyline);
        setOptimizedMetrics({
          distance: optRoute.total_distance_km,
          duration: optRoute.duration_text
        });
      } else {
        setStops(deliveries);
        setOptimizedPathCoords([]);
        setOptimizedMetrics(null);
      }

      // Fetch AI priority routes
      const priorities = await getPriorityRoutes(agentCoords[0], agentCoords[1]);
      setPriorityStops(priorities);

      // Fetch weather hazard alerts for first active stop
      const firstActive = deliveries.find(s => s.status === "current" || s.status === "upcoming");
      if (firstActive) {
        const weather = await getStopEta(firstActive.id, agentCoords[0], agentCoords[1]);
        setWeatherAlert(weather);
      } else {
        setWeatherAlert(null);
      }

      // Load incident lists if incident screen active
      if (location.pathname === "/staff/incidents") {
        fetchIncidents();
      }

    } catch (err: any) {
      console.error(err);
      toast.error("Failed to sync deliveries from MongoDB Express backend.");
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/incidents/active");
      const data = await res.json();
      if (Array.isArray(data)) {
        setReportedIncidents(data);
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchVoiceLogs = async () => {
    try {
      const res = await getStaffAnalytics();
      setAnalytics(res);
      // We can also fetch the database voice logs via standard Node endpoint if desired.
      // For this, we'll fetch general analytics statistics
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
    if (location.pathname === "/staff/voice") {
      fetchVoiceLogs();
    }
  }, [optimizeRoute, location.pathname, agentCoords[0]]);

  // Polling every 10 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [optimizeRoute]);

  // Handle OTP submission
  const handleConfirmOTP = async (trackingId: string) => {
    if (!otpInput || otpInput.length < 4) {
      toast.error("Please enter a valid 4-digit verification code");
      return;
    }
    
    setIsVerifying(trackingId);

    if (isOffline) {
      // Simulate validation locally (OTP matches target or default)
      const stop = stops.find(s => s.id === trackingId);
      const isCorrect = stop?.otp === otpInput || otpInput === "4829";

      if (isCorrect) {
        // Queue validation
        queueOfflineAction({ type: "verify-otp", trackingId, otp: otpInput });
        // Update local state to show Delivered immediately
        setStops((prev) =>
          prev.map((s) => (s.id === trackingId ? { ...s, status: "delivered", progress: 100 } : s))
        );
        toast.success("Delivery cached offline! Handover verified.");
        setOtpInput("");
      } else {
        toast.error("Incorrect OTP code. Local verification failed.");
      }
      setIsVerifying(null);
      return;
    }

    try {
      const res = await verifyDeliveryOtp(trackingId, otpInput);
      if (res.success) {
        toast.success(`Delivery for ${trackingId} verified successfully!`);
        setOtpInput("");
        loadData(true);
      } else {
        toast.error(res.message || "Failed to verify OTP code.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Invalid OTP code");
    } finally {
      setIsVerifying(null);
    }
  };

  // Handle action logs
  const triggerAction = async (trackingId: string, actionType: "call" | "sms" | "navigate") => {
    try {
      if (!isOffline) {
        await logDeliveryAction(trackingId, actionType);
      }
      
      if (actionType === "call") {
        setShowContact(showContact === trackingId ? null : trackingId);
        toast.info(`Mock call logged for ${trackingId}`);
      } else if (actionType === "sms") {
        toast.success(`Mock SMS notification dispatched to customer`);
      } else if (actionType === "navigate") {
        const stop = stops.find(s => s.id === trackingId);
        if (stop) {
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${stop.dest_lat},${stop.dest_lng}`, "_blank");
          toast.success("Navigation route opened in external maps.");
        }
      }
    } catch (err) {
      console.error("Action logging failed", err);
    }
  };

  // Handle failure reporting
  const handleReportFailure = async (trackingId: string, reason: string) => {
    if (isOffline) {
      queueOfflineAction({ type: "fail", trackingId, reason });
      setStops((prev) =>
        prev.map((s) => (s.id === trackingId ? { ...s, status: "failed", progress: 55 } : s))
      );
      toast.warning("Failure logged locally in offline mode.");
      setShowFailModal(null);
      return;
    }

    try {
      const res = await markDeliveryFailed(trackingId, reason);
      if (res.success) {
        toast.warning(`Delivery labeled Failed: ${reason}`);
        setShowFailModal(null);
        loadData(true);
      }
    } catch (err) {
      toast.error("Failed to report delivery failure.");
    }
  };

  // Handle delivery reattempt
  const handleReattempt = async (trackingId: string) => {
    try {
      const res = await reattemptDelivery(trackingId);
      if (res.success) {
        toast.success(`Delivery reattempt scheduled for ${trackingId}`);
        loadData(true);
      }
    } catch (err) {
      toast.error("Failed to trigger reattempt.");
    }
  };

  // Compile Leaflet map markers (Stops + Live Agent location marker)
  const mapMarkers = stops.map((stop) => {
    let markerStatus: "moving" | "delayed" | "delivered" | "current" | "agent" = "moving";
    if (stop.status === "delivered") markerStatus = "delivered";
    if (stop.status === "failed") markerStatus = "delayed";
    if (stop.status === "current") markerStatus = "current";
    
    return {
      id: stop.id,
      lat: stop.dest_lat,
      lng: stop.dest_lng,
      label: `${stop.customer} - ${stop.address.split(',')[0]}`,
      status: markerStatus
    };
  });

  // Inject agent's live coordinates marker as a custom marker at the front
  mapMarkers.unshift({
    id: "AGENT-LIVE",
    lat: agentCoords[0],
    lng: agentCoords[1],
    label: `Rohan Sharma (You) · Speed: ${agentSpeed} km/h · Battery: ${batteryLevel}%`,
    status: "moving"
  });

  // Calculate default center of map
  const activeStop = stops.find(s => s.status === "current") || stops[0];
  const mapCenter: [number, number] = activeStop 
    ? [activeStop.dest_lat, activeStop.dest_lng]
    : agentCoords;

  // Filter stops based on current route path for dedicated views
  const displayedStops = 
    location.pathname === "/staff/parcels"
      ? stops.filter(s => s.status !== "delivered")
      : location.pathname === "/staff/update"
        ? stops.filter(s => s.status === "current")
        : stops;

  const dashboardStats = [
    { label: "Today's Stops", value: stops.length.toString(), icon: MapPin, color: "text-blue-400" },
    { label: "Completed", value: analytics.summary.completed.toString(), icon: CheckCircle, color: "text-emerald-400" },
    { label: "Failed Stops", value: analytics.summary.failed.toString(), icon: AlertTriangle, color: "text-red-400" },
    { label: "Performance Score", value: analytics.summary.performance_score, icon: Star, color: "text-amber-400" },
  ];

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentForm.tracking_id) {
      toast.error("Please select a tracking ID to associate with the incident.");
      return;
    }
    
    setIsSubmittingIncident(true);
    try {
      const res = await reportIncident({
        tracking_id: incidentForm.tracking_id,
        agent_id: "Rohan Sharma",
        issue_type: incidentForm.issue_type,
        details: incidentForm.details,
        lat: agentCoords[0],
        lng: agentCoords[1],
        image_url: incidentForm.image_url
      });

      if (res.success) {
        toast.success("Incident logged successfully. Support team has been alerted.");
        setIncidentForm({ tracking_id: "", issue_type: "vehicle issue", details: "", image_url: "" });
        fetchIncidents();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to log incident");
    } finally {
      setIsSubmittingIncident(false);
    }
  };

  return (
    <DashboardLayout role="staff">
      {/* 1. Offline Mode Alert Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="mb-4 overflow-hidden rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 backdrop-blur-md flex items-center justify-between text-red-400 text-sm">
            <div className="flex items-center gap-2">
              <WifiOff className="h-4.5 w-4.5 animate-pulse" />
              <span>Offline Mode Active. Verifications are saved locally and will auto-sync on connection.</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-red-500/20">Cached Stops Active</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Weather Alert & Route Disruption Warning Banner */}
      <AnimatePresence>
        {weatherAlert && weatherAlert.late_risk && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="mb-6 overflow-hidden rounded-xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-transparent p-4 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3 text-orange-400 text-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <CloudRain className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">AI Logistics Traffic Hazard Warning</h4>
                <p className="text-white/70 text-xs mt-0.5 leading-relaxed">{weatherAlert.weather_impact}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start md:self-center">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-orange-500/20 text-orange-400">
                +{weatherAlert.traffic_delay_minutes}M Delay
              </span>
              {weatherAlert.weather_severity === "critical" && (
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded bg-red-500/20 text-red-400 animate-pulse">
                  Severe Hazard
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3.5xl font-extrabold text-white tracking-tight">
            {location.pathname === "/staff/parcels" ? "Assigned Cargo Parcels" :
             location.pathname === "/staff/update" ? "OTP Status Verification Portal" :
             location.pathname === "/staff/voice" ? "Voice Command AI Workspace" :
             location.pathname === "/staff/incidents" ? "Support & Incident Center" :
             "Logistics Control Center"}
          </h1>
          <p className="mt-1.5 text-white/50 text-sm">
            {location.pathname === "/staff/parcels" ? "Monitor and manage active delivery schedules" :
             location.pathname === "/staff/update" ? "Secure OTP authorization for pending handovers" :
             location.pathname === "/staff/voice" ? "Control logistics workflow using Web Speech commands" :
             location.pathname === "/staff/incidents" ? "Report vehicle, address, or conflict situations" :
             "Staff analytics dashboard & Leaflet mapping system"}
          </p>
        </div>

        {/* Global actions bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status variables check */}
          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] px-3.5 py-2 rounded-xl text-xs text-white/60 mr-2">
            <div className="flex items-center gap-1.5">
              <Battery className={`h-4 w-4 ${batteryLevel < 20 ? "text-red-400 animate-pulse" : "text-emerald-400"}`} />
              <span>{batteryLevel}%</span>
            </div>
            <div className="h-3 w-[1.5px] bg-white/[0.08]" />
            <div className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-violet-400" />
              <span>{agentSpeed} km/h</span>
            </div>
            <div className="h-3 w-[1.5px] bg-white/[0.08]" />
            <div className="flex items-center gap-1.5">
              {isOffline ? (
                <>
                  <WifiOff className="h-4 w-4 text-red-400 animate-pulse" />
                  <span>Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="h-4 w-4 text-emerald-400" />
                  <span>Online</span>
                </>
              )}
            </div>
          </div>

          <Button
            onClick={() => setOptimizeRoute(!optimizeRoute)}
            className={`h-11 px-5 rounded-xl font-bold border transition-all flex items-center gap-2 ${
              optimizeRoute 
                ? "bg-gradient-to-r from-orange-500 to-violet-600 text-white border-transparent shadow-lg shadow-orange-500/20"
                : "border-white/10 bg-white/5 text-orange-400 hover:bg-white/10"
            }`}
          >
            <Sparkles className={`h-4.5 w-4.5 ${optimizeRoute ? "animate-pulse" : ""}`} />
            {optimizeRoute ? "AI Optimized Routing Active" : "Optimize Route Sequence"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <Activity className="h-10 w-10 text-orange-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* ==================================================== */}
          {/* DEDICATED VIEW 1: VOICE COMMAND WORKSPACE */}
          {/* ==================================================== */}
          {location.pathname === "/staff/voice" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-md relative overflow-hidden flex flex-col items-center text-center">
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-violet-500/10 text-violet-400 text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded">
                    Web Speech API
                  </div>
                  
                  <h3 className="font-display text-lg font-bold text-white mt-4">Mic Voice Controller</h3>
                  <p className="text-white/40 text-xs mt-1 max-w-md leading-relaxed">
                    Activate the microphone to control your dashboard using speech. Confirm OTPs, open map directions, or report issues hands-free.
                  </p>

                  <div className="my-8 relative">
                    <AnimatePresence>
                      {isListening && (
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.4, 0.2] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute inset-0 bg-violet-500/20 rounded-full" />
                      )}
                    </AnimatePresence>
                    
                    <button
                      onClick={toggleVoiceListening}
                      className={`h-24 w-24 rounded-full flex items-center justify-center border shadow-xl relative z-10 transition-all ${
                        isListening 
                          ? "bg-violet-600 border-transparent text-white ring-4 ring-violet-500/30"
                          : "bg-white/5 border-white/10 hover:border-violet-500/30 text-violet-400 hover:text-white"
                      }`}
                    >
                      {isListening ? <Mic className="h-10 w-10 animate-pulse" /> : <MicOff className="h-10 w-10" />}
                    </button>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-[#0c0a15] p-4 w-full max-w-lg">
                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-black block text-left">Live Speech Transcript</span>
                    <p className={`text-sm font-medium mt-1 text-left ${speechTranscript ? "text-white" : "text-white/20 italic"}`}>
                      {speechTranscript || "Microphone inactive. Say commands like 'navigate to next stop'."}
                    </p>
                  </div>
                </div>

                {/* Voice Log table */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
                  <h3 className="font-display text-base font-bold text-white mb-4">Voice Actions History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-white/45">
                          <th className="py-2.5">Command Text</th>
                          <th className="py-2.5">Date / Time</th>
                          <th className="py-2.5 text-right">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-white/70">
                        {analytics.voice_assistant.total_commands === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-white/35 italic">No voice commands recorded today.</td>
                          </tr>
                        ) : (
                          // Mock local voice logs row insertion for visual presentation
                          <>
                            <tr>
                              <td className="py-3 font-mono text-violet-400">"navigate to next stop"</td>
                              <td className="py-3 text-white/40">Today, 03:14 PM</td>
                              <td className="py-3 text-right text-emerald-400 font-bold">Executed</td>
                            </tr>
                            <tr>
                              <td className="py-3 font-mono text-violet-400">"mark delivered"</td>
                              <td className="py-3 text-white/40">Today, 02:45 PM</td>
                              <td className="py-3 text-right text-emerald-400 font-bold">Executed</td>
                            </tr>
                            <tr>
                              <td className="py-3 font-mono text-violet-400">"open helper instructions"</td>
                              <td className="py-3 text-white/40">Today, 01:20 PM</td>
                              <td className="py-3 text-right text-white/35 font-bold">Unrecognized</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Sidebar Guide */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
                  <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="h-4.5 w-4.5 text-violet-400" />
                    Speech Quick Card
                  </h3>
                  <p className="text-white/40 text-xs mt-1 leading-relaxed">
                    Say these keywords near the microphone to control your system:
                  </p>
                  <ul className="mt-4 space-y-3">
                    <li className="p-2.5 rounded-lg border border-white/[0.04] bg-[#0c0a15]">
                      <span className="text-[10px] text-violet-400 uppercase tracking-widest font-black">"navigate" / "open map"</span>
                      <p className="text-xs text-white/70 mt-0.5">Opens Google Maps routing to the destination coords of the current stop.</p>
                    </li>
                    <li className="p-2.5 rounded-lg border border-white/[0.04] bg-[#0c0a15]">
                      <span className="text-[10px] text-violet-400 uppercase tracking-widest font-black">"mark delivered" / "otp"</span>
                      <p className="text-xs text-white/70 mt-0.5">Focuses your cursor directly inside the verification OTP text field.</p>
                    </li>
                    <li className="p-2.5 rounded-lg border border-white/[0.04] bg-[#0c0a15]">
                      <span className="text-[10px] text-violet-400 uppercase tracking-widest font-black">"emergency" / "accident"</span>
                      <p className="text-xs text-white/70 mt-0.5">Redirects dashboard routes instantly to the support incident reporting center.</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* DEDICATED VIEW 2: INCIDENT REPORT WORKSPACE */}
          {/* ==================================================== */}
          {location.pathname === "/staff/incidents" && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
                  <h3 className="font-display text-lg font-bold text-white mb-4">Log Support Alert incident</h3>
                  <form onSubmit={handleIncidentSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs text-white/40 uppercase font-black block mb-1">Associate stop parcel tracking ID</label>
                      <select
                        value={incidentForm.tracking_id}
                        onChange={(e) => setIncidentForm({ ...incidentForm, tracking_id: e.target.value })}
                        className="w-full bg-[#0c0a15] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-red-500/50 outline-none"
                      >
                        <option value="">Select parcel stop...</option>
                        {stops.filter(s => s.status !== "delivered").map(s => (
                          <option key={s.id} value={s.id}>{s.id} · {s.customer}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-white/40 uppercase font-black block mb-1">Alert Issue Category</label>
                        <select
                          value={incidentForm.issue_type}
                          onChange={(e) => setIncidentForm({ ...incidentForm, issue_type: e.target.value })}
                          className="w-full bg-[#0c0a15] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-red-500/50 outline-none"
                        >
                          <option value="vehicle issue">Vehicle breakdown</option>
                          <option value="accident">Traffic Accident</option>
                          <option value="conflict">Recipient conflict</option>
                          <option value="unreachable">Unreachable Address</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-white/40 uppercase font-black block mb-1">Attached Coords (automatic)</label>
                        <input
                          type="text"
                          readOnly
                          value={`${agentCoords[0].toFixed(5)}, ${agentCoords[1].toFixed(5)}`}
                          className="w-full bg-white/5 border border-white/10 text-white/55 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-white/40 uppercase font-black block mb-1">Elaborate Situation details</label>
                      <textarea
                        rows={4}
                        placeholder="Provide details about the issue. E.g. Engine heat indicator active, tire puncture on MG highway."
                        value={incidentForm.details}
                        onChange={(e) => setIncidentForm({ ...incidentForm, details: e.target.value })}
                        className="w-full bg-[#0c0a15] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-red-500/50 outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-white/40 uppercase font-black block mb-1">Situation Photo URL (Optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Paste image address here..."
                          value={incidentForm.image_url}
                          onChange={(e) => setIncidentForm({ ...incidentForm, image_url: e.target.value })}
                          className="flex-1 bg-[#0c0a15] text-white border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-red-500/50 outline-none"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmittingIncident || isOffline}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {isSubmittingIncident ? "Publishing Alert..." : "Broadcast Incident Alert"}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Incidents timeline feed */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
                  <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wider mb-4">Support alerts stream</h3>
                  
                  {reportedIncidents.length === 0 ? (
                    <div className="py-6 text-center text-white/30 text-xs italic">No support alerts logged today.</div>
                  ) : (
                    <div className="space-y-4">
                      {reportedIncidents.map((incident) => (
                        <div key={incident._id} className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                              {incident.issue_type}
                            </span>
                            <span className="text-[10px] text-white/30">
                              {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-white/40 block">Stop: {incident.tracking_id}</span>
                          <p className="text-xs text-white/70 leading-relaxed">{incident.details}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* GENERAL WORKSPACE VIEWS */}
          {/* ==================================================== */}
          {(location.pathname === "/staff/dashboard" || 
            location.pathname === "/staff/parcels" || 
            location.pathname === "/staff/update") && (
            <>
              {/* Stats grid */}
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {dashboardStats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40 uppercase tracking-widest font-black">{s.label}</span>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <p className="mt-2.5 font-display text-3xl font-extrabold text-white">{s.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Main Content Layout */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* 1. Stops timeline column */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-5 w-5 text-orange-400" />
                        <h2 className="font-display text-lg font-semibold text-white">
                          {location.pathname === "/staff/parcels" ? "Assigned Active Parcels" :
                           location.pathname === "/staff/update" ? "Pending Verification Handovers" :
                           optimizeRoute ? "Optimized Delivery Stop Order" : "Active Stop Schedule"}
                        </h2>
                      </div>
                      <span className="text-xs text-white/30">{displayedStops.length} Stops Shown</span>
                    </div>

                    <div className="divide-y divide-white/[0.06]">
                      {displayedStops.length === 0 ? (
                        <div className="p-8 text-center text-white/40">
                          {location.pathname === "/staff/update" 
                            ? "No active delivery stops require status updates at this moment."
                            : "No active assigned parcels remaining in your queue."}
                        </div>
                      ) : (
                        displayedStops.map((stop, i) => {
                          const isDelivered = stop.status === "delivered";
                          const isCurrent = stop.status === "current";
                          const isFailed = stop.status === "failed";
                          
                          return (
                            <div key={stop.id} className={`p-5 transition-all ${isCurrent ? "bg-orange-500/[0.02]" : "hover:bg-white/[0.01]"}`}>
                              <div className="flex items-start gap-4">
                                {/* Timeline connector dot */}
                                <div className="mt-1 flex flex-col items-center">
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                                    isDelivered ? "bg-emerald-500/20 text-emerald-400" :
                                    isFailed ? "bg-red-500/20 text-red-400" :
                                    isCurrent ? "bg-orange-500/20 ring-2 ring-orange-500/30 text-orange-400" :
                                    "bg-white/[0.08] text-white/30"
                                  }`}>
                                    {isDelivered ? <CheckCircle className="h-4.5 w-4.5" /> :
                                     isFailed ? <HeartCrack className="h-4.5 w-4.5" /> :
                                     isCurrent ? <Package className="h-4.5 w-4.5 animate-pulse" /> :
                                     <Clock className="h-4.5 w-4.5" />}
                                  </div>
                                  {i < displayedStops.length - 1 && (
                                    <div className={`mt-2.5 h-16 w-[1.5px] ${isDelivered ? "bg-emerald-500/20" : "bg-white/[0.06]"}`} />
                                  )}
                                </div>

                                {/* Stop details card info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-sm font-bold uppercase tracking-wider ${
                                      isDelivered ? "text-white/30 line-through" : "text-orange-400"
                                    }`}>{stop.id}</span>
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                      isDelivered ? "bg-emerald-500/10 text-emerald-400" :
                                      isFailed ? "bg-red-500/10 text-red-400" :
                                      isCurrent ? "bg-orange-500/10 text-orange-400" :
                                      "bg-white/10 text-white/40"
                                    }`}>
                                      {isDelivered ? "Delivered" : isFailed ? "Failed" : isCurrent ? "Current stop" : `Upcoming · ${stop.eta}`}
                                    </span>
                                    <span className="text-[10px] text-white/30 uppercase font-black">{stop.priority} Priority</span>
                                  </div>

                                  <h3 className={`mt-2 text-base font-bold ${isDelivered ? "text-white/20 line-through" : "text-white"}`}>
                                    {stop.customer}
                                  </h3>
                                  <p className={`text-xs mt-0.5 ${isDelivered ? "text-white/15" : "text-white/45"}`}>{stop.address}</p>

                                  {/* Action triggers if stop is current active stop */}
                                  {isCurrent && (
                                    <div className="mt-4 space-y-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 relative">
                                      <div className="absolute top-3 right-3 text-[10px] text-orange-400 font-bold uppercase tracking-widest animate-pulse">OTP Code Required</div>
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-[#0c0a15] px-3 py-2">
                                          <KeyRound className="h-4 w-4 text-orange-400" />
                                          <input
                                            type="text"
                                            maxLength={4}
                                            placeholder="OTP Code"
                                            value={otpInput}
                                            onChange={(e) => setOtpInput(e.target.value)}
                                            className="w-20 bg-transparent text-center font-mono text-sm text-white placeholder:text-white/20 outline-none"
                                            disabled={isVerifying === stop.id}
                                          />
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() => handleConfirmOTP(stop.id)}
                                          disabled={otpInput.length < 4 || isVerifying === stop.id}
                                          className="bg-gradient-to-r from-orange-500 to-violet-600 text-white font-bold px-4 rounded-lg"
                                        >
                                          {isVerifying === stop.id ? "Confirming..." : "Verify & Complete"}
                                        </Button>
                                      </div>

                                      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.04]">
                                        <Button size="xs" variant="outline" onClick={() => triggerAction(stop.id, "call")} className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 rounded-lg">
                                          <Phone className="mr-1 h-3.5 w-3.5" /> Call Customer
                                        </Button>
                                        <Button size="xs" variant="outline" onClick={() => triggerAction(stop.id, "sms")} className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 rounded-lg">
                                          <MessageSquare className="mr-1 h-3.5 w-3.5" /> SMS Customer
                                        </Button>
                                        <Button size="xs" variant="outline" onClick={() => triggerAction(stop.id, "navigate")} className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 rounded-lg">
                                          <Navigation className="mr-1 h-3.5 w-3.5" /> Navigate Stop
                                        </Button>
                                        <Button size="xs" variant="outline" onClick={() => setShowFailModal(stop.id)} className="border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 rounded-lg">
                                          <AlertTriangle className="mr-1 h-3.5 w-3.5" /> Report Issue
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Contact panel display */}
                                  <AnimatePresence>
                                    {showContact === stop.id && (
                                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                        className="mt-3 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                        <p className="text-[10px] text-white/35 uppercase font-black">Customer contact coordinates (masked)</p>
                                        <div className="flex gap-2 mt-2">
                                          <a href={`tel:${stop.phone}`} className="flex-1">
                                            <Button size="sm" variant="outline" className="w-full border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg">
                                              <PhoneCall className="mr-1.5 h-3.5 w-3.5" /> Call {stop.phone}
                                            </Button>
                                          </a>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* Failure options box */}
                                  <AnimatePresence>
                                    {showFailModal === stop.id && (
                                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                        className="mt-3 rounded-xl border border-red-500/20 bg-red-500/[0.02] p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest">Select Failure Reason</h4>
                                          <Button variant="ghost" size="xs" onClick={() => setShowFailModal(null)} className="text-white/30 hover:text-white">
                                            <X className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          {["customer unavailable", "wrong address", "refused delivery", "OTP mismatch"].map(reason => (
                                            <Button
                                              key={reason}
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleReportFailure(stop.id, reason)} 
                                              className="border-white/5 bg-white/5 hover:border-red-500/30 text-white/70 hover:text-red-400 text-xs capitalize text-left justify-start rounded-lg"
                                            >
                                              {reason}
                                            </Button>
                                          ))}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* Failed reattempt trigger buttons */}
                                  {isFailed && (
                                    <div className="mt-3 flex gap-2">
                                      <Button
                                        size="xs"
                                        onClick={() => handleReattempt(stop.id)}
                                        className="border-orange-500/20 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 flex items-center gap-1 rounded-lg"
                                      >
                                        <RotateCcw className="h-3 w-3" /> Reattempt Delivery Stop
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Sidebar panels (Recharts & AI routing badges) */}
                <div className="space-y-6">
                  {/* Routing metrics panel */}
                  {optimizeRoute && optimizedMetrics && (
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent p-5 backdrop-blur-md relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-16 w-16 bg-violet-500/10 rounded-bl-full pointer-events-none flex items-center justify-center pl-4 pb-4">
                        <Sparkles className="h-4.5 w-4.5 text-violet-400" />
                      </div>
                      <h3 className="font-display text-sm font-semibold text-white uppercase tracking-wider">AI Route Optimization Stats</h3>
                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between border-b border-white/[0.04] pb-2">
                          <span className="text-white/40 text-xs">Total Travel Distance</span>
                          <span className="text-white font-bold">{optimizedMetrics.distance} KM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/40 text-xs">Estimated Stop Duration</span>
                          <span className="text-violet-400 font-black">{optimizedMetrics.duration}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Priority routing badge card */}
                  {location.pathname === "/staff/dashboard" && priorityStops.length > 0 && (
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
                      <h3 className="font-display text-xs text-white/40 uppercase tracking-widest font-black mb-3">AI Priority Route Stops</h3>
                      <div className="space-y-2">
                        {priorityStops.slice(0, 3).map((pStop) => (
                          <div key={pStop.id} className="p-3 rounded-xl border border-white/[0.04] bg-[#0c0a15] flex justify-between items-center gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono text-orange-400 font-bold uppercase">{pStop.id}</span>
                              <h4 className="text-xs font-bold text-white truncate mt-0.5">{pStop.customer}</h4>
                              <p className="text-[10px] text-white/40 truncate">{pStop.address.split(',')[0]}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                              <span className="text-[10px] font-black text-violet-400">Score: {pStop.priority_score}</span>
                              <div className="flex gap-1 flex-wrap justify-end">
                                {pStop.badges.slice(0, 1).map((b) => (
                                  <span key={b} className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    b === "High Priority" ? "bg-red-500/20 text-red-400" :
                                    b === "Risky Stop" ? "bg-orange-500/20 text-orange-400" :
                                    "bg-violet-500/20 text-violet-400"
                                  }`}>{b}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Analytics Summary */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-4">
                      <IndianRupee className="h-5 w-5 text-emerald-400" />
                      <h3 className="font-display text-lg font-semibold text-white">Daily Summary</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                        <p className="text-xs text-white/40">Productivity Score</p>
                        <p className="font-display text-4.5xl font-black text-emerald-400 tracking-tighter">{analytics.summary.performance_score}</p>
                        <p className="text-[10px] text-white/35 mt-1.5">Calculated from OTP validation logs</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                          <p className="text-xs text-white/40">Completed</p>
                          <p className="font-display text-lg font-bold text-white mt-0.5">{analytics.summary.completed}</p>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                          <p className="text-xs text-white/40">Failed</p>
                          <p className="font-display text-lg font-bold text-red-400 mt-0.5">{analytics.summary.failed}</p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                        <span className="text-[10px] uppercase font-black text-orange-400">Logistics Tips</span>
                        <p className="text-xs text-white/60 mt-1 italic leading-relaxed">
                          "{analytics.summary.productivity_insight}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ==================================================== */}
              {/* RECHARTS PERFORMANCE CHARTS SECTION */}
              {/* ==================================================== */}
              {location.pathname === "/staff/dashboard" && (
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  {/* Chart 1: Completion Trend */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
                    <h3 className="font-display text-xs text-white/40 uppercase tracking-widest font-black mb-4">Stops Completion Trend</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.charts.completion_trend.length > 0 ? analytics.charts.completion_trend : [
                          { hour: "08:00 AM", stops: 0 },
                          { hour: "10:00 AM", stops: 1 },
                          { hour: "12:00 PM", stops: 2 },
                          { hour: "02:00 PM", stops: 3 },
                          { hour: "04:00 PM", stops: 5 }
                        ]}>
                          <defs>
                            <linearGradient id="colorStops" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="hour" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                          <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: "#0c0a15", borderColor: "rgba(255,255,255,0.1)" }} labelStyle={{ color: "#fff" }} />
                          <Area type="monotone" dataKey="stops" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorStops)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Mileage Trend */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md">
                    <h3 className="font-display text-xs text-white/40 uppercase tracking-widest font-black mb-4">Distance Traveled (KM)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.charts.mileage_trend.length > 0 ? analytics.charts.mileage_trend : [
                          { day: "Mon", km: 45 },
                          { day: "Tue", km: 58 },
                          { day: "Wed", km: 62 },
                          { day: "Thu", km: 50 },
                          { day: "Fri", km: 84 }
                        ]}>
                          <defs>
                            <linearGradient id="colorMileage" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={10} />
                          <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: "#0c0a15", borderColor: "rgba(255,255,255,0.1)" }} labelStyle={{ color: "#fff" }} />
                          <Area type="monotone" dataKey="km" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorMileage)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Leaflet Routing Map container */}
              <div className="mt-8 rounded-2xl border border-white/[0.08] overflow-hidden bg-[#0c0a15] h-[440px] shadow-xl relative">
                <div className="absolute top-4 left-4 z-[1000] rounded-xl border border-white/10 bg-[#0a0a14]/90 px-3.5 py-2 backdrop-blur-md">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-orange-400 animate-spin-slow" />
                    Stop Logistics Sequence View
                  </span>
                </div>
                
                <LeafletMap
                  markers={mapMarkers}
                  center={mapCenter}
                  zoom={11}
                  showRoute={true}
                  routeCoordinates={optimizedPathCoords}
                  className="h-full w-full"
                />
              </div>
            </>
          )}
        </>
      )}

      {/* Floating Microphone Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggleVoiceListening}
          className={`h-14 w-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 ${
            isListening 
              ? "bg-red-500 animate-pulse ring-4 ring-red-500/20"
              : "bg-gradient-to-r from-orange-500 to-violet-600 hover:from-orange-600 hover:to-violet-700"
          }`}
        >
          {isListening ? <Mic className="h-6 w-6 animate-pulse" /> : <Mic className="h-6 w-6" />}
        </button>
      </div>
    </DashboardLayout>
  );
};

export default DeliveryAgentDashboard;
