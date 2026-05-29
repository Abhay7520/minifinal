import DashboardLayout from "@/components/DashboardLayout";
import { Package, CheckCircle, MapPin, Phone, IndianRupee, Navigation, Clock, Star, KeyRound, X, PhoneCall, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const todaysStops = [
  { id: "AP-20260010", customer: "Ravi Menon", address: "14, MG Road, Bangalore 560001", phone: "+91 98XXX XX10", eta: "10:30 AM", status: "delivered", otp: "" },
  { id: "AP-20260011", customer: "Anita Das", address: "B-12, Salt Lake, Kolkata 700091", phone: "+91 97XXX XX11", eta: "11:45 AM", status: "delivered", otp: "" },
  { id: "AP-20260012", customer: "Karan Joshi", address: "Plot 8, Sector 22, Noida 201301", phone: "+91 99XXX XX12", eta: "1:15 PM", status: "current", otp: "4829" },
  { id: "AP-20260013", customer: "Meera Nair", address: "Flat 5A, Marine Drive, Mumbai 400002", phone: "+91 96XXX XX13", eta: "3:00 PM", status: "upcoming", otp: "" },
  { id: "AP-20260014", customer: "Suresh Iyer", address: "23, Anna Nagar, Chennai 600040", phone: "+91 95XXX XX14", eta: "4:30 PM", status: "upcoming", otp: "" },
];

const earningsData = {
  today: 480,
  week: 3250,
  month: 14200,
  perDelivery: 60,
  incentiveBonus: 500,
  totalDeliveries: 8,
  completedToday: 2,
};

const DeliveryAgentDashboard = () => {
  const [otpInput, setOtpInput] = useState("");
  const [activeDelivery, setActiveDelivery] = useState<string | null>("AP-20260012");
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [showContact, setShowContact] = useState<string | null>(null);

  const handleConfirmOTP = (parcelId: string) => {
    const stop = todaysStops.find(s => s.id === parcelId);
    if (stop && otpInput === stop.otp) {
      setConfirmed(prev => [...prev, parcelId]);
      setOtpInput("");
      setActiveDelivery(null);
    }
  };

  const stats = [
    { label: "Today's Stops", value: todaysStops.length.toString(), icon: MapPin, color: "text-blue-400" },
    { label: "Completed", value: `${earningsData.completedToday + confirmed.length}`, icon: CheckCircle, color: "text-emerald-400" },
    { label: "Today's Earnings", value: `₹${earningsData.today + confirmed.length * earningsData.perDelivery}`, icon: IndianRupee, color: "text-orange-400" },
    { label: "Rating", value: "4.8 ★", icon: Star, color: "text-amber-400" },
  ];

  return (
    <DashboardLayout role="staff">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Delivery Agent</h1>
        <p className="mt-1 text-white/50">Your deliveries and route for today</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/50">{s.label}</span>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <p className="mt-2 font-display text-2xl font-bold text-white">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Route */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
          <div className="flex items-center gap-2 border-b border-white/[0.06] p-5">
            <Navigation className="h-5 w-5 text-orange-400" />
            <h2 className="font-display text-lg font-semibold text-white">Today's Route & Stops</h2>
            <span className="ml-auto text-xs text-white/30">{todaysStops.length} stops</span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {todaysStops.map((stop, i) => {
              const isDelivered = stop.status === "delivered" || confirmed.includes(stop.id);
              const isCurrent = stop.status === "current" && !confirmed.includes(stop.id);
              return (
                <div key={stop.id} className={`p-4 ${isCurrent ? "bg-orange-500/5" : "hover:bg-white/[0.04]"}`}>
                  <div className="flex items-start gap-3">
                    {/* Timeline dot */}
                    <div className="mt-1 flex flex-col items-center">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        isDelivered ? "bg-emerald-500/20" :
                        isCurrent ? "bg-orange-500/20 ring-2 ring-orange-500/30" :
                        "bg-white/[0.08]"
                      }`}>
                        {isDelivered ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> :
                         isCurrent ? <Package className="h-3.5 w-3.5 text-orange-400" /> :
                         <Clock className="h-3.5 w-3.5 text-white/30" />}
                      </div>
                      {i < todaysStops.length - 1 && (
                        <div className={`mt-1 h-8 w-px ${isDelivered ? "bg-emerald-500/30" : "bg-white/[0.08]"}`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isDelivered ? "text-white/40 line-through" : "text-orange-400"}`}>{stop.id}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          isDelivered ? "bg-emerald-500/10 text-emerald-400" :
                          isCurrent ? "bg-orange-500/10 text-orange-400" :
                          "bg-white/10 text-white/40"
                        }`}>{isDelivered ? "Delivered" : isCurrent ? "Current" : stop.eta}</span>
                      </div>
                      <p className={`mt-1 text-sm ${isDelivered ? "text-white/30" : "text-white/80"}`}>{stop.customer}</p>
                      <p className="text-xs text-white/40">{stop.address}</p>

                      {/* Actions for current stop */}
                      {isCurrent && (
                        <div className="mt-3 space-y-3">
                          {/* OTP Input */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/5 px-3 py-2">
                              <KeyRound className="h-4 w-4 text-orange-400" />
                              <input
                                type="text"
                                maxLength={4}
                                placeholder="Enter OTP"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value)}
                                className="w-16 bg-transparent text-sm font-mono text-white placeholder:text-white/30 outline-none"
                              />
                            </div>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-orange-500 to-violet-600 text-white hover:opacity-90"
                              onClick={() => handleConfirmOTP(stop.id)}
                              disabled={otpInput.length < 4}
                            >
                              Confirm Delivery
                            </Button>
                          </div>
                          {/* Contact buttons */}
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                              onClick={() => setShowContact(showContact === stop.id ? null : stop.id)}>
                              <Phone className="mr-1.5 h-3.5 w-3.5" /> Contact
                            </Button>
                            <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                              <Navigation className="mr-1.5 h-3.5 w-3.5" /> Navigate
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Contact panel */}
                      <AnimatePresence>
                        {showContact === stop.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.03] p-3"
                          >
                            <p className="mb-2 text-xs text-white/40">Customer contact (masked)</p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1 border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10">
                                <PhoneCall className="mr-1.5 h-3.5 w-3.5" /> Call {stop.phone}
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10">
                                <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> SMS
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Non-current contact */}
                      {!isCurrent && !isDelivered && (
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-white/30 hover:text-white/60"
                            onClick={() => setShowContact(showContact === stop.id ? null : stop.id)}>
                            <Phone className="mr-1 h-3 w-3" /> Contact
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Earnings Sidebar */}
        <div className="space-y-6">
          {/* Earnings Tracker */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-emerald-400" />
              <h3 className="font-display text-lg font-semibold text-white">Earnings</h3>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                <p className="text-xs text-white/40">Today's Earnings</p>
                <p className="font-display text-3xl font-bold text-emerald-400">₹{earningsData.today + confirmed.length * earningsData.perDelivery}</p>
                <p className="text-xs text-white/30">{earningsData.completedToday + confirmed.length} × ₹{earningsData.perDelivery}/delivery</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="text-xs text-white/40">This Week</p>
                  <p className="font-display text-lg font-bold text-white">₹{earningsData.week.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                  <p className="text-xs text-white/40">This Month</p>
                  <p className="font-display text-lg font-bold text-white">₹{earningsData.month.toLocaleString()}</p>
                </div>
              </div>
              {earningsData.incentiveBonus > 0 && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Incentive Bonus</span>
                    <span className="text-sm font-bold text-amber-400">+₹{earningsData.incentiveBonus}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-white/30">Complete 25 deliveries this week to unlock</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Delivery Summary */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
            <h3 className="mb-3 font-display text-sm font-semibold text-white">Today's Summary</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Total Stops</span>
                <span className="text-sm font-medium text-white">{todaysStops.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Delivered</span>
                <span className="text-sm font-medium text-emerald-400">{earningsData.completedToday + confirmed.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Remaining</span>
                <span className="text-sm font-medium text-orange-400">{todaysStops.length - earningsData.completedToday - confirmed.length}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/[0.08]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-emerald-400"
                  style={{ width: `${((earningsData.completedToday + confirmed.length) / todaysStops.length) * 100}%` }}
                />
              </div>
              <p className="text-center text-[10px] text-white/30">
                {Math.round(((earningsData.completedToday + confirmed.length) / todaysStops.length) * 100)}% complete
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DeliveryAgentDashboard;
