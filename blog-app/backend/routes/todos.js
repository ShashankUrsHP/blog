/**
 * routes/todos.js
 * Proxies todos from JSONPlaceholder with pagination, search, and status filter.
 */

const express = require("express");
const axios = require("axios");
const router = express.Router();

const BASE_URL = process.env.BASE_URL || "https://jsonplaceholder.typicode.com";

// GET /api/todos — supports ?userId=N, ?completed=true|false, ?_limit=N, ?_page=N, ?q=search
router.get("/", async (req, res) => {
  try {
    const { userId, completed, _limit = 10, _page = 1, q = "" } = req.query;
    const limit = parseInt(_limit);
    const page = parseInt(_page);

    const url = userId ? `${BASE_URL}/todos?userId=${userId}` : `${BASE_URL}/todos`;
    const response = await axios.get(url);
    let todos = response.data;

    // Filter by completion status
    if (completed !== undefined) {
      const isCompleted = completed === "true";
      todos = todos.filter((t) => t.completed === isCompleted);
    }

    // Search filter
    if (q) {
      const query = q.toLowerCase();
      todos = todos.filter((t) => t.title.toLowerCase().includes(query));
    }

    const total = todos.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = todos.slice((page - 1) * limit, page * limit);

    res.json({ data: paginated, pagination: { total, totalPages, currentPage: page, limit } });
  } catch (err) {
    console.error("GET /api/todos error:", err.message);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

module.exports = router;
