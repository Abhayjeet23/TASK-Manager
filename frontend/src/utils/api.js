// ============================================================
// utils/api.js — Axios Instance
// CONCEPTS: Axios interceptors, base URL, token injection,
//           centralized error handling
// ============================================================

import axios from "axios";

// Create a custom Axios instance (instead of using axios directly)
// This lets us set defaults and attach interceptors once.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api", // proxy in package.json forwards to :5000
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── REQUEST INTERCEPTOR ─────────────────────────────────────
// Runs before EVERY request. Automatically adds JWT to header.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── RESPONSE INTERCEPTOR ────────────────────────────────────
// Runs after EVERY response. Handle global errors here.
api.interceptors.response.use(
  (response) => response, // pass successful responses through
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
