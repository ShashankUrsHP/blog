/**
 * routes/albums.js
 * Proxies albums from JSONPlaceholder with pagination and search.
 */

const express = require("express");
const axios = require("axios");
const router = express.Router();

const BASE_URL = process.env.BASE_URL || "https://jsonplaceholder.typicode.com";

// GET /api/albums — supports ?userId=N, ?_limit=N, ?_page=N, ?q=search
router.get("/", async (req, res) => {
  try {
    const { userId, _limit = 10, _page = 1, q = "" } = req.query;
    const limit = parseInt(_limit);
    const page = parseInt(_page);

    const url = userId ? `${BASE_URL}/albums?userId=${userId}` : `${BASE_URL}/albums`;
    const response = await axios.get(url);
    let albums = response.data;

    if (q) {
      const query = q.toLowerCase();
      albums = albums.filter((a) => a.title.toLowerCase().includes(query));
    }

    const total = albums.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = albums.slice((page - 1) * limit, page * limit);

    res.json({ data: paginated, pagination: { total, totalPages, currentPage: page, limit } });
  } catch (err) {
    console.error("GET /api/albums error:", err.message);
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});

module.exports = router;
