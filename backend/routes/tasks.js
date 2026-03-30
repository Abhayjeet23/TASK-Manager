// ============================================================
// routes/tasks.js — Task Resource Routes (RESTful)
// CONCEPTS: RESTful conventions, route parameters, chaining
// ============================================================

const express = require("express");
const router = express.Router();
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getStats,
} = require("../controllers/taskController");
const { protect } = require("../middleware/auth");
const { taskRules } = require("../middleware/validate");

// All task routes require authentication
router.use(protect);   // applies protect to ALL routes below

// GET /api/tasks/stats — must be before /:id to avoid conflict
router.get("/stats", getStats);

// RESTful resource routes
router
  .route("/")
  .get(getTasks)              // GET    /api/tasks
  .post(taskRules, createTask); // POST   /api/tasks

router
  .route("/:id")
  .get(getTask)               // GET    /api/tasks/:id
  .put(updateTask)            // PUT    /api/tasks/:id
  .delete(deleteTask);        // DELETE /api/tasks/:id

module.exports = router;
