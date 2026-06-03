import { Navigate, Outlet } from "react-router-dom";

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

interface ProtectedRouteProps {
  allowedRole: "user" | "staff" | "admin";
}

export const ProtectedRoute = ({ allowedRole }: ProtectedRouteProps) => {
  const token = localStorage.getItem("token");
  const storedRole = localStorage.getItem("role");

  if (!token) {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");
    return <Navigate to="/login" replace />;
  }

  const decoded = decodeJwt(token);
  const now = Date.now() / 1000;

  if (!decoded || (decoded.exp && now > decoded.exp)) {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");
    return <Navigate to="/login" replace />;
  }

  const role = decoded.role || storedRole;

  if (role !== allowedRole) {
    if (role === "admin" || role === "staff" || role === "user") {
      return <Navigate to={`/${role}/dashboard`} replace />;
    }
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
