import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Search,
  Package,
  CheckCircle,
  Truck,
  Building2,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

const milestones = [
  { label: "Order Placed", time: "Feb 25, 10:30 AM", done: true, icon: Package },
  { label: "Picked Up from Pune GPO", time: "Feb 25, 2:15 PM", done: true, icon: Building2 },
  { label: "In Transit to Delhi Hub", time: "Feb 26, 8:00 AM", done: true, icon: Truck },
  { label: "Arrived at Delhi Sorting", time: "Predicted: Feb 26, 6:00 PM", done: false, icon: Building2, predicted: true },
  { label: "Out for Delivery", time: "Predicted: Feb 27, 9:00 AM", done: false, icon: Truck, predicted: true },
  { label: "Delivered", time: "Predicted: Feb 27, 12:00 PM", done: false, icon: CheckCircle, predicted: true },
];

const TrackParcel = () => {
  const [trackingId, setTrackingId] = useState("AP-20260001");
  const [tracked, setTracked] = useState(true);

  const currentStepIndex = milestones.findIndex((m) => !m.done);
  const progress = Math.round((currentStepIndex / milestones.length) * 100);

  return (
    
    <DashboardLayout role="user">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Track Parcel</h1>
        <p className="mt-1 text-white/50">Real-time AI-powered tracking</p>
      </div>

      {/* Search */}
      <div className="mb-6 flex max-w-lg gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <Input
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="Enter Tracking ID"
            className="pl-10 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:scale-[1.02] transition-transform"
          />
        </div>
        <Button
          onClick={() => setTracked(true)}
          className="bg-gradient-to-r from-orange-500 to-violet-600 text-white"
        >
          Track
        </Button>
      </div>

      {tracked && (
        <>
          {/* HERO STATUS */}
          <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-r from-orange-500/10 via-violet-500/10 to-transparent p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/40">Current Status</p>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-400" />
                  In Transit to Delhi
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Estimated Delivery: Feb 27, 12:00 PM
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-white/40">Progress</p>
                <p className="text-lg font-bold text-orange-400">{progress}%</p>
              </div>
            </div>

            <div className="mt-4 h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-violet-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid max-w-5xl gap-6 lg:grid-cols-3"
          >
            {/* INFO CARD */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm hover:shadow-lg hover:shadow-orange-500/10 transition-all">
              <h3 className="text-lg font-semibold text-white">Parcel Info</h3>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <span className="text-white/40">Tracking ID</span>
                  <p className="font-medium text-orange-400">{trackingId}</p>
                </div>

                <div>
                  <span className="text-white/40">From</span>
                  <p className="text-white/80">Pune, MH</p>
                </div>

                <div>
                  <span className="text-white/40">To</span>
                  <p className="text-white/80">New Delhi, DL</p>
                </div>
              </div>

              {/* AI INSIGHTS */}
              <div className="mt-5 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                <p className="text-sm font-semibold text-violet-400">
                  🧠 AI Insights
                </p>

                <ul className="mt-2 text-xs text-white/60 space-y-1">
                  <li>• Weather may delay delivery by 4–6 hours</li>
                  <li>• Best ETA: Feb 27, 11:30 AM</li>
                  <li>• Confidence: 87%</li>
                </ul>
              </div>
            </div>

            {/* TIMELINE */}
            <div className="lg:col-span-2 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
              <h3 className="mb-6 text-lg font-semibold text-white">
                Tracking Timeline
              </h3>

              {milestones.map((m, i) => {
                const isCurrent = i === currentStepIndex;

                return (
                  <div key={m.label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full
                        ${m.done
                            ? "bg-emerald-500 text-white"
                            : isCurrent
                              ? "bg-orange-500 text-white animate-pulse"
                              : m.predicted
                                ? "border-2 border-dashed border-white/20 bg-white/5 text-white/40"
                                : "bg-white/10 text-white/40"
                          }`}
                      >
                        <m.icon className="h-4 w-4" />
                      </div>

                      {i < milestones.length - 1 && (
                        <div
                          className={`my-1 h-10 w-0.5 ${m.done
                              ? "bg-emerald-500"
                              : isCurrent
                                ? "bg-gradient-to-b from-orange-500 to-white/10"
                                : "bg-white/10"
                            }`}
                        />
                      )}
                    </div>

                    <div className="pb-6">
                      <p
                        className={`text-sm font-medium ${m.done
                            ? "text-white"
                            : isCurrent
                              ? "text-orange-400"
                              : "text-white/50"
                          }`}
                      >
                        {m.label}
                        {m.predicted && (
                          <span className="ml-2 text-xs text-violet-400">
                            (AI Predicted)
                          </span>
                        )}
                      </p>

                      <p className="flex items-center gap-1 text-xs text-white/40">
                        <Clock className="h-3 w-3" /> {m.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </DashboardLayout>
    
  );
};

export default TrackParcel;