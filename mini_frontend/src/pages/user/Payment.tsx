import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, Banknote, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const methods = [
  { id: "upi", label: "UPI", icon: Smartphone, desc: "Pay via UPI ID" },
  { id: "card", label: "Credit Card", icon: CreditCard, desc: "Visa, Mastercard" },
  { id: "cod", label: "Cash on Delivery", icon: Banknote, desc: "Pay when delivered" },
];

const Payment = () => {
  const [selected, setSelected] = useState("upi");
  const navigate = useNavigate();

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/user/confirmation");
  };

  return (
    <DashboardLayout role="user">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Payment</h1>
        <p className="mt-1 text-white/50">Complete your booking</p>
      </div>

      <div className="grid max-w-3xl gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
            <h3 className="mb-4 font-display text-lg font-semibold text-white">Payment Method</h3>
            <div className="space-y-3">
              {methods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m.id)}
                  className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all ${
                    selected === m.id ? "border-orange-500/50 bg-orange-500/10" : "border-white/[0.08] hover:border-white/20"
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${selected === m.id ? "bg-gradient-to-r from-orange-500 to-violet-600 text-white" : "bg-white/10 text-white/50"}`}>
                    <m.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{m.label}</p>
                    <p className="text-xs text-white/40">{m.desc}</p>
                  </div>
                  {selected === m.id && <CheckCircle className="ml-auto h-5 w-5 text-orange-400" />}
                </button>
              ))}
            </div>

            {selected === "upi" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                <Label className="text-white/70">UPI ID</Label>
                <Input className="mt-1 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-orange-500/50" placeholder="yourname@upi" defaultValue="john@okaxis" />
              </motion.div>
            )}

            {selected === "card" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
                <div><Label className="text-white/70">Card Number</Label><Input className="mt-1 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-orange-500/50" placeholder="1234 5678 9012 3456" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-white/70">Expiry</Label><Input className="mt-1 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-orange-500/50" placeholder="MM/YY" /></div>
                  <div><Label className="text-white/70">CVV</Label><Input className="mt-1 border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-orange-500/50" placeholder="123" type="password" /></div>
                </div>
              </motion.div>
            )}

            <Button onClick={handlePay} className="mt-6 w-full bg-gradient-to-r from-orange-500 to-violet-600 text-white hover:opacity-90">
              {selected === "cod" ? "Confirm Booking" : "Pay ₹185"}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
            <h3 className="mb-4 font-display text-lg font-semibold text-white">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-white/50">From</span><span className="text-white">Pune, MH</span></div>
              <div className="flex justify-between"><span className="text-white/50">To</span><span className="text-white">New Delhi, DL</span></div>
              <div className="flex justify-between"><span className="text-white/50">Weight</span><span className="text-white">2.5 kg</span></div>
              <div className="flex justify-between"><span className="text-white/50">Type</span><span className="text-white">Standard</span></div>
              <div className="border-t border-white/[0.08] pt-3 flex justify-between font-semibold text-white">
                <span>Total</span><span className="text-orange-400">₹185</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Payment;
