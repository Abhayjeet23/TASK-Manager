// ============================================================
// pages/Register.jsx
// ============================================================

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const { register, isAuthenticated, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
    return () => clearError();
  }, [isAuthenticated, navigate, clearError]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }
    setLocalError("");
    const result = await register(form);
    if (result.success) navigate("/");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>⚡ TaskFlow</h1>
          <p>Create your account</p>
        </div>

        {(error || localError) && (
          <div className="error-msg">{localError || error}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Doe"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              required
            />
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
