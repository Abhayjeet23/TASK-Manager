// ============================================================
// App.jsx — Root Component + Router Configuration
// CONCEPTS: React Router v6, nested routes, layout routes
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./styles.css";

function App() {
  return (
    // AuthProvider wraps everything — context available to all children
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes — ProtectedRoute is a layout route */}
          {/* <Outlet /> inside ProtectedRoute renders matched child */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
          </Route>

          {/* Catch-all: redirect unknown paths to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
