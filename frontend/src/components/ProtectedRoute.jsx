// ============================================================
// components/ProtectedRoute.jsx
// CONCEPTS: React Router v6, conditional rendering, redirects
// ============================================================

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// <Outlet /> renders the matched child route.
// If not authenticated, redirect to /login.
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
