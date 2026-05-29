import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { motion } from "framer-motion";

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  // Hide on landing page
  if (path === "/") return null;

  // Check if inside a dashboard layout (has sidebar at ml-64)
  const inDashboard = path.startsWith("/user/") || path.startsWith("/staff/") || path.startsWith("/admin/");
  
  // Check if on auth pages - show "Back to Home" text instead of just arrow
  const isAuthPage = path.includes("/auth/") || path === "/login" || path === "/register";

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => isAuthPage ? navigate("/") : navigate(-1)}
      className={`fixed top-4 z-50 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-white/60 transition-all hover:bg-white/10 hover:text-white hover:border-white/20 hover:scale-105 active:scale-95 ${
        isAuthPage 
          ? "left-4 px-4 py-2.5 gap-2 text-sm font-medium" 
          : inDashboard 
            ? "left-[17.5rem] h-10 w-10" 
            : "left-4 h-10 w-10"
      }`}
      aria-label={isAuthPage ? "Back to Home Page" : "Go back"}
    >
      {isAuthPage ? (
        <>
          <Home className="h-4 w-4" />
          <span>Back to Home Page</span>
        </>
      ) : (
        <ArrowLeft className="h-5 w-5" />
      )}
    </motion.button>
  );
};

export default BackButton;
