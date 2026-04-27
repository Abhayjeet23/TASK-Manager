// ============================================================
// hooks/useTasks.js — Custom Hook for Task Data
// CONCEPTS: Custom hooks, useEffect, useState, cleanup,
//           debouncing, dependency arrays
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "../utils/apiClient";

const useTasks = (filters = {}) => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // useRef persists a value across renders without triggering re-renders.
  // Used here for a debounce timer.
  const debounceRef = useRef(null);

  // useCallback memoizes the function — prevents infinite loops
  // when passing it to useEffect dependency array.
  const fetchTasks = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = "/api/tasks";
      if (params) {
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach((key) => {
          if (params[key] !== undefined && params[key] !== "") {
            queryParams.append(key, params[key]);
          }
        });
        if (queryParams.toString()) {
          endpoint += "?" + queryParams.toString();
        }
      }
      const response = await apiClient.get(endpoint);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to load tasks");
      }
      setTasks(data.tasks);
      setPagination({ page: data.page, pages: data.pages, total: data.total });
    } catch (err) {
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/tasks/stats");
      if (!response.ok) {
        throw new Error("Stats fetch failed");
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Stats fetch failed", err);
    }
  }, []);

  // ── useEffect ───────────────────────────────────────────────
  // Re-runs whenever filters change. Debounces search input.
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => {
        fetchTasks(filters);
      },
      filters.search ? 400 : 0,
    ); // debounce search, instant otherwise

    // Cleanup: cancel pending timeout if component unmounts
    return () => clearTimeout(debounceRef.current);
  }, [JSON.stringify(filters), fetchTasks]); // stringify prevents obj reference issues

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ── CRUD operations ─────────────────────────────────────────
  const createTask = async (taskData) => {
    try {
      const response = await apiClient.post("/api/tasks", taskData);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to create task");
      }
      // Optimistic update: prepend new task without refetching
      setTasks((prev) => [data.task, ...prev]);
      fetchStats();
      return { success: true, task: data.task };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateTask = async (id, taskData) => {
    try {
      const response = await apiClient.put(`/api/tasks/${id}`, taskData);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update task");
      }
      setTasks((prev) => prev.map((t) => (t._id === id ? data.task : t)));
      fetchStats();
      return { success: true, task: data.task };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteTask = async (id) => {
    try {
      const response = await apiClient.delete(`/api/tasks/${id}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete task");
      }
      setTasks((prev) => prev.filter((t) => t._id !== id));
      fetchStats();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    tasks,
    stats,
    loading,
    error,
    pagination,
    createTask,
    updateTask,
    deleteTask,
    refetch: () => fetchTasks(filters),
  };
};

export default useTasks;
