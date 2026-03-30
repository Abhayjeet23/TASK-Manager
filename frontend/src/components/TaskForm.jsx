// ============================================================
// components/TaskForm.jsx — Controlled Form
// CONCEPTS: Controlled inputs, form submission, useState
// ============================================================

import { useState } from "react";

const INITIAL_STATE = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  tags: "",
};

const TaskForm = ({ onSubmit, onCancel }) => {
  // Single state object for all form fields (controlled inputs)
  const [form, setForm] = useState(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Generic change handler — works for any input/select/textarea
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();  // prevent browser page reload
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSubmitting(true);
    setError("");

    const payload = {
      ...form,
      // Transform comma-separated tags string into array
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      dueDate: form.dueDate || undefined,
    };

    const result = await onSubmit(payload);
    setSubmitting(false);

    if (result.success) {
      setForm(INITIAL_STATE);
      onCancel();
    } else {
      setError(result.error || "Something went wrong");
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h3>New Task</h3>
      {error && <div className="error-msg">{error}</div>}

      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          name="title"
          type="text"
          value={form.title}           /* controlled: React drives value */
          onChange={handleChange}
          placeholder="What needs to be done?"
          autoFocus
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          placeholder="Optional details..."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={form.status} onChange={handleChange}>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select id="priority" name="priority" value={form.priority} onChange={handleChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="dueDate">Due Date</label>
          <input
            id="dueDate"
            name="dueDate"
            type="date"
            value={form.dueDate}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            id="tags"
            name="tags"
            type="text"
            value={form.tags}
            onChange={handleChange}
            placeholder="work, urgent, design"
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Creating..." : "Create Task"}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
