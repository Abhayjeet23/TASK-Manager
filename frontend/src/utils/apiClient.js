// ============================================================
// utils/apiClient.js — API Client with Automatic Token Refresh
// CONCEPTS: Fetch interceptor pattern, token refresh logic,
//           retry logic for failed requests
// ============================================================

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Track if we're currently refreshing to avoid multiple refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  isRefreshing = false;
  failedQueue = [];
};

/**
 * apiFetch — Wrapper around fetch that handles automatic token refresh
 *
 * Usage:
 *   const data = await apiFetch('/api/tasks', { method: 'GET' });
 *   const result = await apiClient.post('/api/tasks', { title: 'My Task' });
 */
const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem("token");

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  // Add token to Authorization header if it exists
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    let response = await fetch(url, config);

    // If token expired (401), try to refresh
    if (response.status === 401) {
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return response;
      }

      // Prevent multiple refresh requests
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          // Call refresh endpoint
          const refreshResponse = await fetch(
            `${API_BASE_URL}/api/auth/refresh`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            },
          );

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            const newAccessToken = refreshData.accessToken;

            // Store new token
            localStorage.setItem("token", newAccessToken);

            // Process queued requests
            processQueue(null, newAccessToken);

            // Retry original request with new token
            config.headers.Authorization = `Bearer ${newAccessToken}`;
            response = await fetch(url, config);
          } else {
            // Refresh failed, redirect to login
            const error = new Error("Token refresh failed");
            processQueue(error, null);
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            window.location.href = "/login";
            throw error;
          }
        } catch (error) {
          processQueue(error, null);
          throw error;
        }
      } else {
        // Another request is already refreshing, queue this one
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          config.headers.Authorization = `Bearer ${token}`;
          return fetch(url, config);
        });
      }
    }

    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Helper methods for common HTTP verbs
 */
const apiClient = {
  get: (endpoint, options = {}) =>
    apiFetch(endpoint, { ...options, method: "GET" }),

  post: (endpoint, body, options = {}) =>
    apiFetch(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: (endpoint, body, options = {}) =>
    apiFetch(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: (endpoint, body, options = {}) =>
    apiFetch(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: (endpoint, options = {}) =>
    apiFetch(endpoint, { ...options, method: "DELETE" }),
};

export default apiClient;
