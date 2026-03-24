/**
 * routes/posts.js
 * Custom CRUD API for posts.
 * - GET /api/posts         → Fetches from JSONPlaceholder + local custom posts
 * - GET /api/posts/:id     → Single post by ID
 * - POST /api/posts        → Add new post (stored in memory)
 * - PUT /api/posts/:id     → Edit existing post
 * - DELETE /api/posts/:id  → Delete a post
 */

const express = require("express");
const axios = require("axios");
const router = express.Router();

const BASE_URL = process.env.BASE_URL || "https://jsonplaceholder.typicode.com";

// ─── In-memory store for custom posts ─────────────────────────────────────────
// Custom posts are identified with IDs starting above 100 (JSONPlaceholder uses 1–100)
let customPosts = [];
let nextId = 101;

// ─── GET /api/posts ───────────────────────────────────────────────────────────
// Supports: ?_limit=N, ?_page=N, ?q=searchTerm
router.get("/", async (req, res) => {
  try {
    const { _limit = 10, _page = 1, q = "" } = req.query;
    const limit = parseInt(_limit);
    const page = parseInt(_page);

    // Fetch from JSONPlaceholder
    const response = await axios.get(`${BASE_URL}/posts`);
    let allPosts = [...response.data, ...customPosts]; // Merge third-party + local

    // Optional filtering by userId
    if (req.query.userId) {
      const userIdInt = parseInt(req.query.userId);
      if (!Number.isNaN(userIdInt)) {
        allPosts = allPosts.filter((p) => p.userId === userIdInt);
      }
    }

    // Search / filter
    if (q) {
      const query = q.toLowerCase();
      allPosts = allPosts.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          (p.body && p.body.toLowerCase().includes(query))
      );
    }

    const total = allPosts.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = allPosts.slice(start, start + limit);

    const enriched = paginated.map((post) => {
      const defaultThumb = `https://picsum.photos/seed/post-${post.id}/600/320`;
      return {
        ...post,
        thumbnailUrl: post.thumbnailUrl || post.imageUrl || defaultThumb,
      };
    });

    res.json({
      data: enriched,
      pagination: { total, totalPages, currentPage: page, limit },
    });
  } catch (err) {
    console.error("GET /api/posts error:", err.message);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// ─── GET /api/posts/:id ───────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check local store first
    const local = customPosts.find((p) => p.id === id);
    if (local) return res.json(local);

    // Otherwise fetch from JSONPlaceholder
    const response = await axios.get(`${BASE_URL}/posts/${id}`);
    res.json(response.data);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// ─── POST /api/posts ──────────────────────────────────────────────────────────
router.post("/", (req, res) => {
  try {
    const { title, body, userId, thumbnailUrl } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "Title and body are required" });
    }

    const newPost = {
      id: nextId++,
      title: title.trim(),
      body: body.trim(),
      userId: userId || 1,
      thumbnailUrl: thumbnailUrl ? thumbnailUrl.trim() : undefined,
      createdAt: new Date().toISOString(),
      isCustom: true, // Flag to distinguish locally created posts
    };

    customPosts.unshift(newPost); // Add to front
    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (err) {
    res.status(500).json({ error: "Failed to create post" });
  }
});

// ─── PUT /api/posts/:id ───────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, body, userId, thumbnailUrl } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: "Title and body are required" });
    }

    // Check local store first
    const localIndex = customPosts.findIndex((p) => p.id === id);
    if (localIndex !== -1) {
      customPosts[localIndex] = {
        ...customPosts[localIndex],
        title: title.trim(),
        body: body.trim(),
        userId: userId || customPosts[localIndex].userId,
        thumbnailUrl: thumbnailUrl ? thumbnailUrl.trim() : customPosts[localIndex].thumbnailUrl,
        updatedAt: new Date().toISOString(),
      };
      return res.json({ message: "Post updated successfully", post: customPosts[localIndex] });
    }

    // For JSONPlaceholder posts, simulate update (they don't persist server-side)
    const response = await axios.put(`${BASE_URL}/posts/${id}`, { title, body, userId });
    res.json({ message: "Post updated successfully", post: { ...response.data, title: title.trim(), body: body.trim() } });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.status(500).json({ error: "Failed to update post" });
  }
});

// ─── DELETE /api/posts/:id ────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Check local store first
    const localIndex = customPosts.findIndex((p) => p.id === id);
    if (localIndex !== -1) {
      customPosts.splice(localIndex, 1);
      return res.json({ message: "Post deleted successfully", id });
    }

    // Simulate delete for JSONPlaceholder posts
    await axios.delete(`${BASE_URL}/posts/${id}`);
    res.json({ message: "Post deleted successfully", id });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.status(500).json({ error: "Failed to delete post" });
  }
});

module.exports = router;
