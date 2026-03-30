// ============================================================
// controllers/taskController.js — Task CRUD + Advanced Queries
// CONCEPTS: CRUD, filtering, sorting, pagination, populate,
//           aggregation, ownership checks
// ============================================================

const Task = require("../models/Task");

// ─── GET ALL TASKS (with filter / sort / pagination) ──────────
// GET /api/tasks?status=todo&priority=high&page=1&limit=10&sort=-createdAt
const getTasks = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      search,
      page = 1,
      limit = 10,
      sort = "-createdAt",   // default: newest first
    } = req.query;

    // Build query object dynamically
    const filter = { owner: req.user._id };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      // Text search via regex (simple approach; use $text index for production)
      filter.title = { $regex: search, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Execute query + count in parallel for efficiency
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort(sort)               // sort("-createdAt") = descending
        .skip(skip)
        .limit(Number(limit))
        .populate("owner", "name email"),   // populate: replaces ObjectId with user doc
      Task.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: tasks.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      tasks,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET SINGLE TASK ──────────────────────────────────────────
// GET /api/tasks/:id
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate("owner", "name email");

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Ownership check — only owner can view (or admin)
    if (task.owner._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorised" });
    }

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// ─── CREATE TASK ──────────────────────────────────────────────
// POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, tags } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      tags,
      owner: req.user._id,   // set from auth middleware
    });

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// ─── UPDATE TASK ──────────────────────────────────────────────
// PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (task.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorised" });
    }

    // findByIdAndUpdate: atomic update in MongoDB
    // { new: true }         → return the updated document (not the old one)
    // { runValidators: true } → run schema validators on the update
    task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE TASK ──────────────────────────────────────────────
// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (task.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorised" });
    }

    await task.deleteOne();

    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    next(err);
  }
};

// ─── GET STATS (Aggregation) ──────────────────────────────────
// GET /api/tasks/stats
// CONCEPT: MongoDB Aggregation Pipeline
const getStats = async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      // Stage 1: Filter to current user's tasks
      { $match: { owner: req.user._id } },

      // Stage 2: Group by status and count
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          highPriority: {
            $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] },
          },
        },
      },

      // Stage 3: Reshape output
      {
        $project: {
          status: "$_id",
          count: 1,
          highPriority: 1,
          _id: 0,
        },
      },
    ]);

    const total = await Task.countDocuments({ owner: req.user._id });
    const overdue = await Task.countDocuments({
      owner: req.user._id,
      status: { $ne: "done" },
      dueDate: { $lt: new Date() },
    });

    res.json({ success: true, stats, total, overdue });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, getStats };
