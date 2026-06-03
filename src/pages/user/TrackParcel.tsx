import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import PageBackground from "@/components/PageBackground";
import bgTrack from "@/assets/bg-track.jpg";
import { Button } from "@/components/ui/button";
import LeafletMap from "@/components/LeafletMap";

import { toast } from "sonner";

import {
  Package,
  CheckCircle,
  Truck,
  Building2,
  Clock,
  Activity,
  Search,
  AlertTriangle,
  Shield,
  Compass,
  Sparkles,
} from "lucide-react";

import { motion } from "framer-motion";

import { getTrackingInfo, advanceTrackingStage } from "@/services/trackingService";
import { getMyParcels } from "@/services/parcelService";
import type { TrackingResponse } from "@/types/tracking";


const getMilestoneIcon = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("booked")) return Package;
  if (s.includes("pickup") || s.includes("picked")) return Building2;
  if (s.includes("source") || s.includes("sorting") || s.includes("hub") || s.includes("office")) return Building2;
  if (s.includes("transit") || s.includes("out for delivery")) return Truck;
  if (s.includes("delivered")) return CheckCircle;
  return Package;
};

type TrackingData = {
  tracking_id: string;
  current_status: string;
  progress_percentage: number;
  current_location: string;
  current_lat: number;
  current_lng: number;
  estimated_delivery: string;
  timeline: Array<{
    status: string;
    time: string;
    location: string;
    details: string;
    done: boolean;
    predicted: boolean;
  }>;
  risk_info: {
    risk_level: string;
    risk_score: number;
    risk_factors: string[];
    recommendation: string;
  };
  parcel_details: {
    source_address: string;
    destination_address: string;
    sender_name: string;
    receiver_name: string;
    weight: number;
    parcel_type: string;
    price_total: number;
    source_lat: number;
    source_lng: number;
    dest_lat: number;
    dest_lng: number;
    route_coordinates: number[][];
  };
};

type UserParcelId = {
  tracking_id: string;
  sender_name?: string;
  receiver_name?: string;
  source_address?: string;
  destination_address?: string;
};

export default function TrackParcel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const idParam = searchParams.get("id") || "";

  const [availableIds, setAvailableIds] = useState<UserParcelId[]>([]);
  const [trackingId, setTrackingId] = useState(idParam);
  const [searchInput, setSearchInput] = useState(idParam);

  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const canPoll = useMemo(() => Boolean(trackingId), [trackingId]);

  const fetchTracking = async (id: string, quiet = false) => {
    if (!id) return;
    if (!quiet) setLoading(true);

    try {
      const data = await getTrackingInfo(id);
      setTrackingData(data);
    } catch (err) {
      const anyErr = err as unknown as { message?: string };
      console.error(err);
      if (!quiet) {
        toast.error(anyErr?.message || "Unable to load tracking for this parcel.");
        setTrackingData(null);
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  const fetchAvailableParcels = async () => {
    setAvailableIds([]);
    try {
      const res = await getMyParcels();
      setAvailableIds((res || []).map((p) => ({
        tracking_id: p.tracking_id,
        sender_name: p.sender_name,
        receiver_name: p.receiver_name,
        source_address: p.source_address,
        destination_address: p.destination_address,
      })));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your parcels.");
    }
  };

  useEffect(() => {
    // 1) If ?id is not present, load list of available ids.
    if (!idParam) {
      setTrackingId("");
      setTrackingData(null);
      setSearchInput("");
      fetchAvailableParcels();
      return;
    }

    // 2) If ?id is present, show tracking.
    setTrackingId(idParam);
    setSearchInput(idParam);
    fetchTracking(idParam);
  }, [idParam]);

  // Poll tracking only when id is present
  useEffect(() => {
    if (!canPoll || !idParam) return;
    const interval = setInterval(() => {
      fetchTracking(trackingId, true);
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPoll, idParam, trackingId]);

  const handleSelectId = (id: string) => {
    setTrackingId(id);
    setTrackingData(null);
    setSearchParams({ id });
    fetchTracking(id);
  };

  const handleAdvanceStage = async () => {
    if (!trackingId) return;
    setIsAdvancing(true);
    try {
      await advanceTrackingStage(trackingId);
      toast.success("Cargo simulation advanced to next stage!");
      fetchTracking(trackingId);
    } catch (err) {
      toast.error((err as unknown as { message?: string })?.message || "Failed to advance simulation stage.");
    } finally {
      setIsAdvancing(false);
    }
  };

  const mapMarkers = useMemo(() => {
    if (!trackingData) return [];
    return [
      {
        id: "Origin PO",
        lat: trackingData.parcel_details.source_lat,
        lng: trackingData.parcel_details.source_lng,
        label: trackingData.parcel_details.source_address.split(",")[0],
        status: "moving" as const,
      },
      {
        id: "Destination PO",
        lat: trackingData.parcel_details.dest_lat,
        lng: trackingData.parcel_details.dest_lng,
        label: trackingData.parcel_details.destination_address.split(",")[0],
        status: "delivered" as const,
      },
      {
        id: "Current Marker",
        lat: trackingData.current_lat,
        lng: trackingData.current_lng,
        label: trackingData.current_location,
        status: "current" as const,
      },
    ];
  }, [trackingData]);

  return (
    <DashboardLayout role="user">
      <PageBackground image={bgTrack} variant="scan" />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Track Parcel</h1>
        <p className="mt-1 text-white/50">Real-time tracking & delivery intelligence</p>
      </div>

      {/* Global Search Bar */}
      <div className="mb-6 max-w-xl flex flex-col gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchInput.trim()) {
              handleSelectId(searchInput.trim());
            }
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 z-10" />
            <input
              type="text"
              placeholder="Enter Tracking ID (e.g. AIP123456)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all"
            />
          </div>
          <Button
            type="submit"
            className="bg-gradient-to-r from-orange-500 to-violet-600 text-white rounded-xl px-6 hover:opacity-90 transition-all font-semibold"
          >
            Track
          </Button>
        </form>

        {idParam && (
          <div className="flex justify-start">
            <button
              onClick={() => {
                setSearchParams({});
                setTrackingId("");
                setTrackingData(null);
                setSearchInput("");
              }}
              className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 mt-1 pl-1"
            >
              ← Back to Parcels List
            </button>
          </div>
        )}
      </div>

      {!idParam ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-orange-400" />
            <h2 className="font-display text-lg font-semibold text-white">Select a parcel to track</h2>
          </div>

          {availableIds.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
              <AlertTriangle className="h-10 w-10 text-white/15 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white/40">No parcels found</h3>
              <p className="text-sm text-white/20 mt-1">Book a new parcel to start tracking.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {availableIds.map((p) => {
                return (
                  <button
                    key={p.tracking_id}
                    onClick={() => handleSelectId(p.tracking_id)}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-orange-500/30 transition-all group w-full"
                  >
                    <span className="text-sm font-bold uppercase tracking-wider text-orange-400 group-hover:text-orange-300 transition-colors">
                      {p.tracking_id}
                    </span>
                    <Package className="h-4.5 w-4.5 text-white/30 group-hover:text-orange-400 transition-colors" />
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      ) : null}

      {trackingData ? (
        <>
          {/* AI Delay Detection Tracking Alert */}
          {trackingData.anomaly && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 backdrop-blur-sm flex items-start gap-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-red-400">
                    AI Delay Detection Alert
                  </span>
                  <span className="rounded bg-red-500/25 px-1.5 py-0.5 text-[9px] font-bold text-red-200">
                    {trackingData.anomaly.anomaly_id}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mt-1">Delayed Shipment Anomaly Detected</h4>
                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                  Our delay prediction model has flagged this parcel because the current date has exceeded the estimated delivery date ({trackingData.estimated_delivery}) while status remains "{trackingData.current_status}". A High severity anomaly record has been registered.
                </p>
              </div>
            </motion.div>
          )}

          {/* Tracking Overview */}
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

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto sm:justify-end">
                {trackingData.current_status.toLowerCase() !== "delivered" && (
                  <Button
                    onClick={handleAdvanceStage}
                    disabled={isAdvancing}
                    className="bg-gradient-to-r from-orange-500 to-violet-600 text-white font-bold hover:opacity-90 rounded-xl px-5 h-11 shrink-0 w-full sm:w-auto"
                  >
                    <Compass className="mr-2 h-4 w-4" />
                    Simulate Stage
                  </Button>
                )}

                <div className="text-left sm:text-right shrink-0">
                  <p className="text-xs font-black uppercase tracking-widest text-white/40">Estimated Delivery</p>
                  <p className="text-lg font-bold text-white mt-1">{trackingData.estimated_delivery}</p>
                  <p className="text-xs text-orange-400 font-bold">Progress: {trackingData.progress_percentage}%</p>
                </div>
              </div>
            </div>

            <div className="mt-5 h-2.5 w-full rounded-full bg-white/5 overflow-hidden border border-white/[0.05]">
              <div
                className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-violet-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${trackingData.progress_percentage}%` }}
              />
            </div>
          </div>

          {/* Route History + Timeline + Map */}
          <div className="grid max-w-6xl gap-6 lg:grid-cols-3">
            <div className="space-y-6">
              {/* Parcel Details (part of Overview) */}
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
                    <span className="text-xs text-white/50 line-clamp-2" title={trackingData.parcel_details.source_address}>{trackingData.parcel_details.source_address}</span>
                  </div>

                  <div className="py-3 flex flex-col gap-0.5">
                    <span className="text-white/40 text-xs">Recipient / To</span>
                    <span className="font-semibold text-white">{trackingData.parcel_details.receiver_name}</span>
                    <span className="text-xs text-white/50 line-clamp-2" title={trackingData.parcel_details.destination_address}>{trackingData.parcel_details.destination_address}</span>
                  </div>

                  <div className="py-3 flex justify-between">
                    <span className="text-white/40">Weight / Type</span>
                    <span className="font-bold text-white">
                      {trackingData.parcel_details.weight} kg ·{' '}
                      <span className="capitalize text-violet-300">{trackingData.parcel_details.parcel_type}</span>
                    </span>
                  </div>

                  <div className="pt-3 flex justify-between">
                    <span className="text-white/40">Total Charged</span>
                    <span className="font-black text-orange-400">₹{trackingData.parcel_details.price_total.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="rounded-xl border border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-violet-400 mb-4">
                  <Sparkles className="h-4.5 w-4.5" />
                  <h3 className="text-sm font-black uppercase tracking-widest">AI Insights</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">Risk Evaluation</span>
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                        trackingData.risk_info.risk_level === "High"
                          ? "bg-red-500/15 text-red-400"
                          : trackingData.risk_info.risk_level === "Medium"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-emerald-500/15 text-emerald-400"
                      }`}
                    >
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
                      {trackingData.risk_info.risk_factors.map((factor) => (
                        <span key={factor} className="rounded-md border border-white/5 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70">
                          • {factor}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3 space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-widest text-violet-400">AI Recommendations</span>
                    <p className="text-xs text-white/70 leading-relaxed italic">"{trackingData.risk_info.recommendation}"</p>
                  </div>
                </div>
              </div>

              {trackingData.current_status.toLowerCase() !== "delivered" ? (
                <Button
                  onClick={handleAdvanceStage}
                  disabled={isAdvancing}
                  variant="outline"
                  className="w-full border-white/10 bg-white/5 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300"
                >
                  <Compass className="mr-2 h-4 w-4" />
                  Simulate Stage →
                </Button>
              ) : null}
            </div>

            {/* Map + Delivery Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <div className="h-[380px] rounded-xl border border-white/[0.08] overflow-hidden bg-white/[0.02] shadow-xl relative">
                <LeafletMap markers={mapMarkers} showRoute={true} routeCoordinates={trackingData.parcel_details.route_coordinates} className="h-full w-full" />
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
                <h3 className="mb-6 text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-400" /> Delivery Timeline
                </h3>

                <div className="space-y-1">
                  {trackingData.timeline.map((m, i) => {
                    const MilestoneIcon = getMilestoneIcon(m.status);
                    return (
                      <div key={`${m.status}-${i}`} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-500 ${
                              m.done
                                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
                                : m.predicted
                                  ? "border-2 border-dashed border-white/20 bg-white/5 text-white/30"
                                  : "bg-white/10 text-white/40"
                            }`}
                          >
                            <MilestoneIcon className="h-4.5 w-4.5" />
                          </div>

                          {i < trackingData.timeline.length - 1 ? (
                            <div
                              className={`my-1.5 h-12 w-0.5 transition-colors duration-500 ${
                                m.done && trackingData.timeline[i + 1]?.done
                                  ? "bg-gradient-to-b from-orange-500 to-amber-500"
                                  : "bg-white/10"
                              }`}
                            />
                          ) : null}
                        </div>

                        <div className="pb-6 flex-1">
                          <div className="flex items-center gap-2.5">
                            <p className={`text-sm font-bold ${m.done ? "text-white" : "text-white/40"}`}>{m.status}</p>
                            {m.predicted ? (
                              <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-violet-400">
                                AI Predicted
                              </span>
                            ) : null}
                          </div>

                          <p className="text-[11px] text-orange-400/70 font-semibold mt-0.5">Location: {m.location}</p>
                          <p className="text-xs text-white/50 mt-1 leading-relaxed max-w-xl">{m.details}</p>
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

          {/* Route History + Delivery Prediction */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2 max-w-6xl">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
              <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-400" /> Route History
              </h3>
              <div className="space-y-3">
                {trackingData.timeline.map((m, idx) => (
                  <div key={`${m.status}-${idx}`} className="flex items-start justify-between gap-4 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white/80 truncate">{m.status}</p>
                      <p className="text-xs text-white/50">{m.location}</p>
                      <p className="text-xs text-white/40 mt-1 leading-relaxed">{m.details}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white/30">{m.time}</p>
                      {m.predicted ? <p className="text-[10px] text-violet-400 mt-1 font-bold">Predicted</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
              <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-400" /> Delivery Prediction
              </h3>
              <div className="space-y-4">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/40">Estimated delivery</p>
                  <p className="mt-1 text-lg font-bold text-white">{trackingData.estimated_delivery}</p>
                </div>

                <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/40">Delay risk score</p>
                  <p className="mt-1 text-2xl font-black text-violet-300">{Math.round(trackingData.risk_info.risk_score * 100)}%</p>
                  <p className="text-xs text-white/50 mt-1">{trackingData.risk_info.risk_level} risk level</p>
                </div>

                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-violet-400">AI Recommendation</p>
                  <p className="text-xs text-white/70 mt-2 leading-relaxed italic">"{trackingData.risk_info.recommendation}"</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : idParam ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center flex flex-col items-center justify-center min-h-[360px] max-w-3xl">
          <Activity className="h-10 w-10 text-white/15 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-white/40">Loading tracking data…</h3>
          <p className="text-sm text-white/20 mt-1.5 max-w-md">Please wait while we fetch your parcel logs.</p>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

