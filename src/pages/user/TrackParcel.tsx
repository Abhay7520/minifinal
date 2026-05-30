import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import PostalBackground from "@/components/PostalBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LeafletMap from "@/components/LeafletMap";
import { getTrackingInfo, advanceTrackingStage } from "@/services/trackingService";
import { toast } from "sonner";

import {
  Search,
  Package,
  CheckCircle,
  Truck,
  Building2,
  Clock,
  Shield,
  Activity,
  AlertTriangle,
  ArrowRight,
  User,
  Compass
} from "lucide-react";
import { motion } from "framer-motion";

// Helper to map status strings to Lucide icons
const getMilestoneIcon = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("booked")) return Package;
  if (s.includes("pickup") || s.includes("picked")) return User;
  if (s.includes("source") || s.includes("sorting") || s.includes("hub") || s.includes("office")) return Building2;
  if (s.includes("transit") || s.includes("out for delivery")) return Truck;
  if (s.includes("delivered")) return CheckCircle;
  return Package;
};

const TrackParcel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const idParam = searchParams.get("id") || "";
  
  const [trackingId, setTrackingId] = useState(idParam || "AIP202601");
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const fetchTracking = async (id: string, quiet = false) => {
    if (!id) return;
    if (!quiet) setLoading(true);
    try {
      const data = await getTrackingInfo(id);
      setTrackingData(data);
    } catch (err: any) {
      console.error(err);
      if (!quiet) {
        toast.error(err?.message || "Tracking ID not found in database.");
        setTrackingData(null);
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    if (idParam) {
      setTrackingId(idParam);
      fetchTracking(idParam);
    }
  }, [idParam]);

  // Set up 5-second polling interval
  useEffect(() => {
    if (!trackingId || !idParam) return;
    const interval = setInterval(() => {
      fetchTracking(trackingId, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [trackingId, idParam]);

  const handleTrackSubmit = () => {
    if (!trackingId.trim()) {
      toast.error("Please enter a Tracking ID");
      return;
    }
    setSearchParams({ id: trackingId });
    fetchTracking(trackingId);
  };

  const handleAdvanceStage = async () => {
    if (!trackingId) return;
    setIsAdvancing(true);
    try {
      await advanceTrackingStage(trackingId);
      toast.success("Cargo simulation advanced to next stage!");
      fetchTracking(trackingId);
    } catch (err: any) {
      toast.error(err?.message || "Failed to advance simulation stage.");
    } finally {
      setIsAdvancing(false);
    }
  };

  // Compile Leaflet Map markers
  const mapMarkers = trackingData ? [
    {
      id: "Origin PO",
      lat: trackingData.parcel_details.source_lat,
      lng: trackingData.parcel_details.source_lng,
      label: trackingData.parcel_details.source_address.split(',')[0],
      status: "moving" as const
    },
    {
      id: "Destination PO",
      lat: trackingData.parcel_details.dest_lat,
      lng: trackingData.parcel_details.dest_lng,
      label: trackingData.parcel_details.destination_address.split(',')[0],
      status: "delivered" as const
    },
    {
      id: "Current Marker",
      lat: trackingData.current_lat,
      lng: trackingData.current_lng,
      label: trackingData.current_location,
      status: "current" as const
    }
  ] : [];

  return (
    <DashboardLayout role="user">
      <PostalBackground />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Track Parcel</h1>
        <p className="mt-1 text-white/50">Real-time AI-powered tracking & simulation</p>
      </div>

      {/* Search & Actions */}
      <div className="mb-8 flex flex-col sm:flex-row max-w-2xl gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Enter Tracking ID (e.g. AIP123456)"
            className="pl-10 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:scale-[1.01] transition-all h-11 rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && handleTrackSubmit()}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleTrackSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-orange-500 to-violet-600 text-white font-bold h-11 px-6 rounded-xl"
          >
            {loading ? "Searching..." : "Track"}
          </Button>

          {trackingData && (
            <Button
              onClick={handleAdvanceStage}
              disabled={isAdvancing || trackingData.current_status === "Delivered"}
              variant="outline"
              className="border-white/10 bg-white/5 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 h-11 rounded-xl gap-1.5"
            >
              <Compass className="h-4 w-4 animate-spin-slow" />
              Simulate Stage →
            </Button>
          )}
        </div>
      </div>

      {trackingData ? (
        <>
          {/* HERO STATUS BANNER */}
          <div className="mb-8 rounded-2xl border border-white/10 bg-gradient-to-br from-orange-500/10 via-violet-500/10 to-[#0e0c18]/40 p-6 backdrop-blur-md relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white/40">Current Status</p>
                <h2 className="text-2xl font-black text-white flex items-center gap-2.5 mt-1">
                  <Truck className="h-6 w-6 text-orange-400 animate-pulse" />
                  {trackingData.current_status}
                </h2>
                <p className="text-xs text-white/50 mt-1 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-violet-400" />
                  At Location: <span className="font-bold text-white">{trackingData.current_location}</span>
                </p>
              </div>

              <div className="w-full sm:w-auto text-left sm:text-right">
                <p className="text-xs font-black uppercase tracking-widest text-white/40">Estimated Delivery</p>
                <p className="text-lg font-bold text-white mt-1">{trackingData.estimated_delivery}</p>
                <p className="text-xs text-orange-400 font-bold">Progress: {trackingData.progress_percentage}%</p>
              </div>
            </div>

            <div className="mt-5 h-2.5 w-full rounded-full bg-white/5 overflow-hidden border border-white/[0.05]">
              <div
                className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-violet-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${trackingData.progress_percentage}%` }}
              />
            </div>
          </div>

          {/* GRID PANELS */}
          <div className="grid max-w-6xl gap-6 lg:grid-cols-3">
            {/* LEFT COLUMN: INFO & AI INSIGHTS */}
            <div className="space-y-6">
              {/* PARCEL INFO CARD */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm">
                <h3 className="text-sm font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4 text-orange-400" /> Parcel Details
                </h3>

                <div className="space-y-4 text-sm divide-y divide-white/[0.05]">
                  <div className="pt-0 pb-3 flex justify-between">
                    <span className="text-white/40">Tracking ID</span>
                    <span className="font-bold text-orange-400">{trackingData.tracking_id}</span>
                  </div>
                  <div className="py-3 flex flex-col gap-0.5">
                    <span className="text-white/40 text-xs">Sender / From</span>
                    <span className="font-semibold text-white">{trackingData.parcel_details.sender_name}</span>
                    <span className="text-xs text-white/50 line-clamp-2">{trackingData.parcel_details.source_address}</span>
                  </div>
                  <div className="py-3 flex flex-col gap-0.5">
                    <span className="text-white/40 text-xs">Recipient / To</span>
                    <span className="font-semibold text-white">{trackingData.parcel_details.receiver_name}</span>
                    <span className="text-xs text-white/50 line-clamp-2">{trackingData.parcel_details.destination_address}</span>
                  </div>
                  <div className="py-3 flex justify-between">
                    <span className="text-white/40">Weight / Type</span>
                    <span className="font-bold text-white">{trackingData.parcel_details.weight} kg · <span className="capitalize text-violet-300">{trackingData.parcel_details.parcel_type}</span></span>
                  </div>
                  <div className="pt-3 flex justify-between">
                    <span className="text-white/40">Total Charged</span>
                    <span className="font-black text-orange-400">₹{trackingData.parcel_details.price_total.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* AI DELAY RISK CARD */}
              <div className="rounded-xl border border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-violet-400 mb-4">
                  <Activity className="h-4.5 w-4.5" />
                  <h3 className="text-sm font-black uppercase tracking-widest">AI Delay Risk Analysis</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">Risk Evaluation</span>
                    <span className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      trackingData.risk_info.risk_level === "High" ? "bg-red-500/15 text-red-400" :
                      trackingData.risk_info.risk_level === "Medium" ? "bg-amber-500/15 text-amber-400" :
                      "bg-emerald-500/15 text-emerald-400"
                    }`}>
                      {trackingData.risk_info.risk_level} Risk
                    </span>
                  </div>

                  <div className="rounded-lg bg-white/5 p-3.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1.5">Model Score</p>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-white">{Math.round(trackingData.risk_info.risk_score * 100)}%</span>
                      <span className="text-xs text-white/40 leading-snug">Probability of segment delivery delay</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">Contributing Factors</p>
                    <div className="flex flex-wrap gap-1.5">
                      {trackingData.risk_info.risk_factors.map((factor: string) => (
                        <span key={factor} className="rounded-md border border-white/5 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70">
                          • {factor}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3 space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-widest text-violet-400">AI Recommendations</span>
                    <p className="text-xs text-white/70 leading-relaxed italic">
                      "{trackingData.risk_info.recommendation}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* MIDDLE/RIGHT COLUMN: MAP & TIMELINE */}
            <div className="lg:col-span-2 space-y-6">
              {/* ROUTE MAP CONTAINER */}
              <div className="h-[380px] rounded-xl border border-white/[0.08] overflow-hidden bg-white/[0.02] shadow-xl relative">
                <LeafletMap
                  markers={mapMarkers}
                  showRoute={true}
                  routeCoordinates={trackingData.parcel_details.route_coordinates}
                  className="h-full w-full"
                />
              </div>

              {/* TIMELINE TIMELINE */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
                <h3 className="mb-6 text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-400" /> Tracking Milestones
                </h3>

                <div className="space-y-1">
                  {trackingData.timeline.map((m: any, i: number) => {
                    const MilestoneIcon = getMilestoneIcon(m.status);
                    
                    return (
                      <div key={m.status} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500
                            ${m.done
                                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
                                : m.predicted
                                  ? "border-2 border-dashed border-white/20 bg-white/5 text-white/30"
                                  : "bg-white/10 text-white/40"
                              }`}
                          >
                            <MilestoneIcon className="h-4.5 w-4.5" />
                          </div>

                          {i < trackingData.timeline.length - 1 && (
                            <div
                              className={`my-1.5 h-12 w-0.5 transition-colors duration-500 ${
                                m.done && trackingData.timeline[i + 1]?.done
                                  ? "bg-gradient-to-b from-orange-500 to-amber-500"
                                  : "bg-white/10"
                              }`}
                            />
                          )}
                        </div>

                        <div className="pb-6 flex-1">
                          <div className="flex items-center gap-2.5">
                            <p className={`text-sm font-bold ${m.done ? "text-white" : "text-white/40"}`}>
                              {m.status}
                            </p>
                            {m.predicted && (
                              <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-violet-400">
                                AI Predicted
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[11px] text-orange-400/70 font-semibold mt-0.5">
                            Location: {m.location}
                          </p>
                          <p className="text-xs text-white/50 mt-1 leading-relaxed max-w-xl">
                            {m.details}
                          </p>
                          <span className="text-[10px] text-white/30 mt-1 flex items-center gap-1.5">
                            <Clock className="h-3 w-3" /> {m.time}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center flex flex-col items-center justify-center min-h-[360px] max-w-3xl">
          <Activity className="h-10 w-10 text-white/15 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-white/40">AIPOSTAL Global Tracking Engine</h3>
          <p className="text-sm text-white/20 mt-1.5 max-w-md">
            Enter a valid tracking ID above to load your parcel logs. You can create a new cargo booking in the "Book Parcel" tab to trigger the simulation.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TrackParcel;