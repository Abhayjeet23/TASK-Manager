// ============================================================
// pages/Dashboard.jsx — Main App Page
// CONCEPTS: useState, custom hooks, conditional rendering,
//           list rendering with .map(), lifting state up
// ============================================================

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import useTasks from "../hooks/useTasks";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";
import AIAssistant from "../components/AIAssistant";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
    page: 1,
    limit: 10,
  });

  // Custom hook encapsulates all task data fetching logic
  const { tasks, stats, loading, error, pagination, createTask, updateTask, deleteTask } =
    useTasks(filters);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  return (
    <div className="dashboard">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>⚡ TaskFlow</h1>
          <span className="user-chip">
            <span className="avatar">{user?.initials}</span>
            {user?.name}
          </span>
        </div>
        <button className="btn-secondary" onClick={logout}>
          Logout
        </button>
      </header>

      {/* ── STATS CARDS ────────────────────────────────────── */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-num">{stats.total}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
          {stats.stats.map((s) => (
            <div key={s.status} className={`stat-card stat-${s.status}`}>
              <span className="stat-num">{s.count}</span>
              <span className="stat-label">{s.status}</span>
            </div>
          ))}
          {stats.overdue > 0 && (
            <div className="stat-card stat-overdue">
              <span className="stat-num">{stats.overdue}</span>
              <span className="stat-label">Overdue ⚠️</span>
            </div>
          )}
        </div>
      )}

      {/* ── CONTROLS ───────────────────────────────────────── */}
      <div className="controls">
        <div className="filters">
          <input
            name="search"
            type="text"
            placeholder="🔍 Search tasks..."
            value={filters.search}
            onChange={handleFilterChange}
            className="search-input"
          />
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select name="priority" value={filters.priority} onChange={handleFilterChange}>
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "✕ Cancel" : "+ New Task"}
        </button>
      </div>

      {/* ── AI ASSISTANT ─────────────────────────────────────── */}
      <div className="ai-assistant-wrapper">
        <AIAssistant onTaskCreated={() => setFilters((p) => ({ ...p, page: 1 }))} />
      </div>

      {/* ── TASK FORM (conditional render) ─────────────────── */}
      {showForm && (
        <TaskForm
          onSubmit={createTask}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* ── TASK LIST ──────────────────────────────────────── */}
      <div className="task-list">
        {loading && <div className="spinner-center"><div className="spinner" /></div>}

        {error && <div className="error-banner">⚠️ {error}</div>}

        {!loading && !error && tasks.length === 0 && (
          <div className="empty-state">
            <p>🎉 No tasks found. Create one above!</p>
          </div>
        )}

        {/* .map() — renders a list; always use a unique key prop */}
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
        ))}
      </div>

      {/* ── PAGINATION ─────────────────────────────────────── */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
          >
            ← Prev
          </button>
          <span>
            Page {pagination.page} of {pagination.pages} ({pagination.total} tasks)
          </span>
          <button
            disabled={pagination.page === pagination.pages}
            onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
