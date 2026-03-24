# Blogosphere — Full-Stack Blog Web Application

A modern, full-stack blog platform built with **Node.js + Express** (backend) and **Vanilla HTML/CSS/JS** (frontend), featuring a rich editorial dark UI.

---

## 📁 Project Structure

```
blog-app/
├── backend/
│   ├── routes/
│   │   ├── posts.js       ← Full CRUD (GET, POST, PUT, DELETE)
│   │   ├── comments.js    ← Proxy with pagination & search
│   │   ├── albums.js      ← Proxy with pagination & search
│   │   ├── photos.js      ← Proxy with pagination & search
│   │   ├── todos.js       ← Proxy with status filter
│   │   └── users.js       ← Proxy with search
│   ├── .env               ← Environment variables
│   ├── package.json
│   └── server.js          ← Express entry point
│
└── frontend/
    ├── css/
    │   └── style.css      ← Complete styling
    ├── js/
    │   ├── api.js         ← All API calls (backend only)
    │   └── app.js         ← UI logic, state, rendering
    └── index.html         ← Main HTML shell
```

---

## 🚀 How to Run

### 1. Backend

```bash
cd backend
npm install
node server.js
```

The backend starts at: **http://localhost:5000**

> For development with auto-reload:
> ```bash
> npm run dev   # uses nodemon
> ```

### 2. Frontend

Open `frontend/index.html` in your browser:
- **VS Code**: Right-click → "Open with Live Server"
- **Direct**: Double-click `index.html` (note: some CORS policies may apply)
- **Python**: `python -m http.server 3000` from the `frontend/` folder

---

## 🔌 Backend API Reference

### Health Check
```
GET  /api/health
```

### Posts (Full CRUD)
```
GET    /api/posts                   → List posts (supports ?_page, ?_limit, ?q)
GET    /api/posts/:id               → Single post
POST   /api/posts                   → Create post { title, body, userId }
PUT    /api/posts/:id               → Update post { title, body, userId }
DELETE /api/posts/:id               → Delete post
```

### Read-Only (Proxied from JSONPlaceholder)
```
GET    /api/comments                → ?_page, ?_limit, ?q, ?postId
GET    /api/albums                  → ?_page, ?_limit, ?q, ?userId
GET    /api/photos                  → ?_page, ?_limit, ?q, ?albumId
GET    /api/todos                   → ?_page, ?_limit, ?q, ?completed, ?userId
GET    /api/users                   → ?q
GET    /api/users/:id               → Single user
```

---

## ✨ Features

| Feature | Status |
|---|---|
| Fetch all 6 JSONPlaceholder resources | ✅ |
| Full CRUD for Posts | ✅ |
| In-memory custom post store | ✅ |
| CORS enabled | ✅ |
| Environment variables (.env) | ✅ |
| Request logging middleware | ✅ |
| Error handling (4xx / 5xx) | ✅ |
| Pagination (all sections) | ✅ |
| Search / filter (all sections) | ✅ |
| Todo status filter (All/Done/Pending) | ✅ |
| Loading indicators | ✅ |
| Toast notifications | ✅ |
| Create/Edit post modal with validation | ✅ |
| Delete confirmation modal | ✅ |
| Keyboard shortcuts (Ctrl+N, Esc) | ✅ |
| Responsive mobile layout | ✅ |
| Lazy image loading (Photos) | ✅ |

---

## 🧰 Tech Stack

**Backend**
- Node.js + Express
- axios (HTTP client for third-party APIs)
- cors (Cross-Origin Resource Sharing)
- dotenv (environment variables)

**Frontend**
- Vanilla HTML5, CSS3, JavaScript (ES6+)
- Google Fonts (Playfair Display, DM Sans, DM Mono)
- No external JS frameworks or libraries

---

## 💡 Notes

- Custom posts are stored **in memory** (reset on server restart). For persistence, replace the `customPosts` array in `routes/posts.js` with a JSON file or database.
- The frontend only calls `http://localhost:5000/api/*` — never directly to JSONPlaceholder.
- JSONPlaceholder `PUT` and `DELETE` calls are simulated (they respond 200 but don't actually persist data on their server). Our in-memory store handles local posts fully.
