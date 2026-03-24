/**
 * server.js — Main entry point for Blog App Backend
 * Node.js + Express server with CORS, JSON middleware, and modular routes
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const postsRouter = require("./routes/posts");
const commentsRouter = require("./routes/comments");
const albumsRouter = require("./routes/albums");
const photosRouter = require("./routes/photos");
const todosRouter = require("./routes/todos");
const usersRouter = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse incoming JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/posts", postsRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/albums", albumsRouter);
app.use("/api/photos", photosRouter);
app.use("/api/todos", todosRouter);
app.use("/api/users", usersRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Blog App API is running 🚀", timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Blog App Backend running at http://localhost:${PORT}`);
  console.log(`📋 API Endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
  console.log(`   GET  http://localhost:${PORT}/api/posts`);
  console.log(`   POST http://localhost:${PORT}/api/posts`);
  console.log(`   PUT  http://localhost:${PORT}/api/posts/:id`);
  console.log(`   DEL  http://localhost:${PORT}/api/posts/:id`);
  console.log(`   GET  http://localhost:${PORT}/api/comments`);
  console.log(`   GET  http://localhost:${PORT}/api/albums`);
  console.log(`   GET  http://localhost:${PORT}/api/photos`);
  console.log(`   GET  http://localhost:${PORT}/api/todos`);
  console.log(`   GET  http://localhost:${PORT}/api/users\n`);
});
