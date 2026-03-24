/**
 * routes/photos.js
 * Proxies photos from JSONPlaceholder with pagination and search.
 */

const express = require("express");
const axios = require("axios");
const router = express.Router();

const BASE_URL = process.env.BASE_URL || "https://jsonplaceholder.typicode.com";

// GET /api/photos — supports ?albumId=N, ?_limit=N, ?_page=N, ?q=search
router.get("/", async (req, res) => {
  try {
    const { albumId, _limit = 12, _page = 1, q = "" } = req.query;
    const limit = parseInt(_limit);
    const page = parseInt(_page);

    const url = albumId ? `${BASE_URL}/photos?albumId=${albumId}` : `${BASE_URL}/photos`;
    const response = await axios.get(url);
    let photos = response.data;

    if (q) {
      const query = q.toLowerCase();
      photos = photos.filter((p) => p.title.toLowerCase().includes(query));
    }

    const total = photos.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = photos.slice((page - 1) * limit, page * limit);

    res.json({ data: paginated, pagination: { total, totalPages, currentPage: page, limit } });
  } catch (err) {
    console.error("GET /api/photos error:", err.message);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

module.exports = router;
