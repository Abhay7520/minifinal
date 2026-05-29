import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle, MapPin, Copy, Clock, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const OrderConfirmation = () => {
  const trackingId = "AP-20260004";

  return (
    <DashboardLayout role="user">
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Booking Confirmed!</h1>
          <p className="mt-2 text-white/50">Your parcel has been booked successfully</p>

          <div className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm text-left">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-white/40">Tracking ID</span>
                <p className="font-display text-xl font-bold text-orange-400">{trackingId}</p>
              </div>
              <Button variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => { navigator.clipboard.writeText(trackingId); toast.success("Copied!"); }}>
                <Copy className="mr-1 h-3 w-3" /> Copy
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <Clock className="mx-auto mb-1 h-5 w-5 text-blue-400" />
                <span className="text-xs text-white/40">Predicted ETA</span>
                <p className="mt-1 font-display text-sm font-semibold text-white">Feb 28, 2026</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <Shield className="mx-auto mb-1 h-5 w-5 text-emerald-400" />
                <span className="text-xs text-white/40">Confidence</span>
                <p className="mt-1 font-display text-sm font-semibold text-white">92%</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 text-center">
                <MapPin className="mx-auto mb-1 h-5 w-5 text-orange-400" />
                <span className="text-xs text-white/40">Risk Level</span>
                <p className="mt-1 font-display text-sm font-semibold text-emerald-400">Low</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-4 justify-center">
            <Link to={`/user/track?id=${trackingId}`}>
              <Button className="bg-gradient-to-r from-orange-500 to-violet-600 text-white hover:opacity-90">
                <MapPin className="mr-2 h-4 w-4" /> Track Parcel
              </Button>
            </Link>
            <Link to="/user/dashboard">
              <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">Back to Dashboard</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default OrderConfirmation;
