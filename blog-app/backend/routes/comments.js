/**
 * routes/comments.js
 * Proxies comments from JSONPlaceholder with pagination and search support.
 */

const express = require("express");
const axios = require("axios");
const router = express.Router();

const BASE_URL = process.env.BASE_URL || "https://jsonplaceholder.typicode.com";

// GET /api/comments — supports ?postId=N, ?_limit=N, ?_page=N, ?q=search
router.get("/", async (req, res) => {
  try {
    const { postId, _limit = 10, _page = 1, q = "" } = req.query;
    const limit = parseInt(_limit);
    const page = parseInt(_page);

    const url = postId
      ? `${BASE_URL}/comments?postId=${postId}`
      : `${BASE_URL}/comments`;

    const response = await axios.get(url);
    let comments = response.data;

    if (q) {
      const query = q.toLowerCase();
      comments = comments.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.body.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query)
      );
    }

    const total = comments.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = comments.slice((page - 1) * limit, page * limit);

    res.json({ data: paginated, pagination: { total, totalPages, currentPage: page, limit } });
  } catch (err) {
    console.error("GET /api/comments error:", err.message);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

module.exports = router;
