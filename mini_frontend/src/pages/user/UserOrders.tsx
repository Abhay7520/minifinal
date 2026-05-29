import DashboardLayout from "@/components/DashboardLayout";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const orders = [
  { id: "AP-20260001", from: "Pune, MH", to: "New Delhi, DL", date: "Feb 25", status: "In Transit", risk: "Medium" },
  { id: "AP-20260002", from: "Mumbai, MH", to: "Bangalore, KA", date: "Feb 23", status: "Processing", risk: "Low" },
  { id: "AP-20260003", from: "Pune, MH", to: "Chennai, TN", date: "Feb 20", status: "Delivered", risk: "None" },
  { id: "AP-20260004", from: "Delhi, DL", to: "Kolkata, WB", date: "Feb 18", status: "Delivered", risk: "None" },
];

const UserOrders = () => {
  return (
    
      <DashboardLayout role="user">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">My Orders</h1>
          <p className="mt-1 text-white/50">All your parcel bookings</p>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="px-5 py-3 font-medium">Tracking ID</th>
                  <th className="px-5 py-3 font-medium">From</th>
                  <th className="px-5 py-3 font-medium">To</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.04]">
                    <td className="px-5 py-4 font-medium text-orange-400">{o.id}</td>
                    <td className="px-5 py-4 text-sm text-white/80">{o.from}</td>
                    <td className="px-5 py-4 text-sm text-white/80">{o.to}</td>
                    <td className="px-5 py-4 text-sm text-white/40">{o.date}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${o.status === "Delivered" ? "bg-emerald-500/10 text-emerald-400" :
                        o.status === "In Transit" ? "bg-blue-500/10 text-blue-400" :
                          "bg-amber-500/10 text-amber-400"
                        }`}>{o.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Link to={`/user/track?id=${o.id}`}>
                        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/[0.06]"><MapPin className="mr-1 h-3 w-3" /> Track</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
    
  );
};

export default UserOrders;
