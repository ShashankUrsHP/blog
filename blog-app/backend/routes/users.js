/**
 * routes/users.js
 * Proxies users from JSONPlaceholder with search support.
 */

const express = require("express");
const axios = require("axios");
const router = express.Router();

const BASE_URL = process.env.BASE_URL || "https://jsonplaceholder.typicode.com";

// GET /api/users — supports ?q=search
router.get("/", async (req, res) => {
  try {
    const { q = "" } = req.query;
    const response = await axios.get(`${BASE_URL}/users`);
    let users = response.data;

    if (q) {
      const query = q.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query) ||
          (u.company?.name || "").toLowerCase().includes(query)
      );
    }

    res.json({ data: users, total: users.length });
  } catch (err) {
    console.error("GET /api/users error:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/users/:id
router.get("/:id", async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/users/${req.params.id}`);
    res.json(response.data);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

module.exports = router;
