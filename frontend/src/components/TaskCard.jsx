// ============================================================
// components/TaskCard.jsx — Controlled Component
// CONCEPTS: Props, controlled component, event handlers,
//           conditional className, prop destructuring
// ============================================================

import React, { useState } from "react";

const PRIORITY_COLORS = {
  low: "#4caf50",
  medium: "#ff9800",
  high: "#f44336",
};

const STATUS_LABELS = {
  "todo": "To Do",
  "in-progress": "In Progress",
  "done": "Done",
};

const TaskCard = ({ task, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusChange = (e) => {
    onUpdate(task._id, { status: e.target.value });
  };

  const isOverdue =
    task.dueDate &&
    task.status !== "done" &&
    new Date() > new Date(task.dueDate);

  return (
    <div className={`task-card priority-${task.priority} ${task.status === "done" ? "done" : ""}`}>
      {/* Priority indicator bar */}
      <div
        className="priority-bar"
        style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
      />

      <div className="task-card-body">
        <div className="task-header">
          <h3 className={task.status === "done" ? "strikethrough" : ""}>
            {task.title}
          </h3>
          <button
            className="expand-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-label="Toggle details"
          >
            {isExpanded ? "▲" : "▼"}
          </button>
        </div>

        <div className="task-meta">
          {/* Controlled select: value tied to state */}
          <select
            value={task.status}
            onChange={handleStatusChange}
            className={`status-badge status-${task.status}`}
          >
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>

          <span
            className="priority-badge"
            style={{ color: PRIORITY_COLORS[task.priority] }}
          >
            {task.priority}
          </span>

          {task.dueDate && (
            <span className={`due-date ${isOverdue ? "overdue" : ""}`}>
              📅 {new Date(task.dueDate).toLocaleDateString()}
              {isOverdue && " ⚠️"}
            </span>
          )}
        </div>

        {/* Conditional rendering based on isExpanded state */}
        {isExpanded && (
          <div className="task-details">
            {task.description && <p>{task.description}</p>}
            {task.tags?.length > 0 && (
              <div className="tags">
                {task.tags.map((tag) => (
                  <span key={tag} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <p className="task-date">
              Created: {new Date(task.createdAt).toLocaleString()}
            </p>
          </div>
        )}

        <div className="task-actions">
          <button
            className="btn-danger btn-sm"
            onClick={() => {
              if (window.confirm("Delete this task?")) onDelete(task._id);
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// React.memo: prevents re-render if props haven't changed (performance)
export default React.memo(TaskCard);
