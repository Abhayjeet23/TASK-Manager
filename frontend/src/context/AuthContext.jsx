// ============================================================
// context/AuthContext.jsx — Global Auth State
// CONCEPTS: React Context API, useReducer, Context Provider,
//           useContext custom hook pattern
// ============================================================

import React, { createContext, useContext, useReducer, useEffect } from "react";

// ─── 1. CREATE CONTEXT ───────────────────────────────────────
const AuthContext = createContext(null);

// ─── 2. REDUCER ──────────────────────────────────────────────
// Pure function: (currentState, action) → newState
// useReducer is preferred over useState for complex state logic.
const authReducer = (state, action) => {
  switch (action.type) {
    case "AUTH_LOADING":
      return { ...state, loading: true };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case "LOGOUT":
      return { ...initialState, loading: false };
    case "AUTH_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,   // true initially — we check localStorage on mount
  error: null,
};

// ─── 3. PROVIDER COMPONENT ───────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      dispatch({ type: "LOGIN_SUCCESS", payload: { user: JSON.parse(user) } });
    } else {
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  // ── Actions ─────────────────────────────────────────────────
  const register = async (formData) => {
    dispatch({ type: "AUTH_LOADING" });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      dispatch({ type: "LOGIN_SUCCESS", payload: data });
      return { success: true };
    } catch (err) {
      const msg = err.message || "Registration failed";
      dispatch({ type: "AUTH_ERROR", payload: msg });
      return { success: false, error: msg };
    }
  };

  const login = async (formData) => {
    dispatch({ type: "AUTH_LOADING" });
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      dispatch({ type: "LOGIN_SUCCESS", payload: data });
      return { success: true };
    } catch (err) {
      const msg = err.message || "Login failed";
      dispatch({ type: "AUTH_ERROR", payload: msg });
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch({ type: "LOGOUT" });
  };

  const clearError = () => dispatch({ type: "CLEAR_ERROR" });

  // ── Context Value ───────────────────────────────────────────
  return (
    <AuthContext.Provider
      value={{ ...state, register, login, logout, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── 4. CUSTOM HOOK ──────────────────────────────────────────
// Wraps useContext — consumers don't need to import AuthContext directly.
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
