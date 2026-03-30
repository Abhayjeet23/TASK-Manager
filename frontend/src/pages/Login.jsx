// ============================================================
// pages/Login.jsx
// CONCEPTS: Controlled form, useNavigate, useEffect redirect
// ============================================================

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login, isAuthenticated, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
    return () => clearError(); // cleanup: clear error on unmount
  }, [isAuthenticated, navigate, clearError]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form);
    if (result.success) navigate("/");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>⚡ TaskFlow</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-footer">
          No account?{" "}
          <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
