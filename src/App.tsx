import { Toaster } from "@/components/ui/toaster";
import "leaflet/dist/leaflet.css";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { lazy, Suspense } from "react";
import PostcardLoader from "./components/PostcardLoader";
import BackButton from "./components/BackButton";
import ProtectedRoute from "./components/ProtectedRoute";

const Landing = lazy(() => import("./pages/Landing"));
const AuthPage = lazy(() => import("./pages/auth/AuthPage"));
const AuthRoleSelect = lazy(() => import("./pages/auth/AuthRoleSelect"));
const UserDashboard = lazy(() => import("./pages/user/UserDashboard"));
const BookParcel = lazy(() => import("./pages/user/BookParcel"));
const Payment = lazy(() => import("./pages/user/Payment"));
const OrderConfirmation = lazy(() => import("./pages/user/OrderConfirmation"));
const TrackParcel = lazy(() => import("./pages/user/TrackParcel"));
const UserOrders = lazy(() => import("./pages/user/UserOrders"));
const StaffDashboard = lazy(() => import("./pages/staff/StaffDashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <BackButton />
        <Suspense fallback={<PostcardLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            
            {/* Unified premium auth routes */}
            <Route path="/auth/select/login" element={<AuthRoleSelect mode="login" />} />
            <Route path="/auth/select/register" element={<AuthRoleSelect mode="register" />} />
            <Route path="/auth/:role/:mode" element={<AuthPage />} />
            <Route path="/login" element={<Navigate to="/auth/select/login" replace />} />
            <Route path="/register" element={<Navigate to="/auth/select/register" replace />} />
            
            {/* User routes */}
            <Route element={<ProtectedRoute allowedRole="user" />}>
              <Route path="/user/dashboard" element={<UserDashboard />} />
              <Route path="/user/book" element={<BookParcel />} />
              <Route path="/user/payment" element={<Payment />} />
              <Route path="/user/confirmation" element={<OrderConfirmation />} />
              <Route path="/user/track" element={<TrackParcel />} />
              <Route path="/user/orders" element={<UserOrders />} />
            </Route>

            {/* Staff routes */}
            <Route element={<ProtectedRoute allowedRole="staff" />}>
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route path="/staff/delivery" element={<StaffDashboard />} />
              <Route path="/staff/parcels" element={<StaffDashboard />} />
              <Route path="/staff/update" element={<StaffDashboard />} />
              <Route path="/staff/voice" element={<StaffDashboard />} />
              <Route path="/staff/incidents" element={<StaffDashboard />} />
            </Route>

            {/* Admin routes */}
            <Route element={<ProtectedRoute allowedRole="admin" />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/parcels" element={<AdminDashboard />} />
              <Route path="/admin/staff" element={<AdminDashboard />} />
              <Route path="/admin/anomalies" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
