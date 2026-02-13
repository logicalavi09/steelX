import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("steelx_token");
  // Agar token nahi hai toh login par bhejo
  return token ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;