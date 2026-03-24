/**
 * js/api.js
 * All API calls to the backend.
 * Frontend ONLY talks to this file — never to third-party APIs directly.
 */

const API_BASE = "http://localhost:5000/api";
const FALLBACK_BASE = "https://jsonplaceholder.typicode.com";

/**
 * Generic fetch wrapper with error handling.
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const parseErrorBody = async (res) => {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    return err.error || `HTTP ${res.status}`;
  };

  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });

    if (!res.ok) {
      throw new Error(await parseErrorBody(res));
    }

    return res.json();
  } catch (error) {
    // Network-level issues (failed to fetch / connection refused)
    if (error instanceof TypeError || error.message === "Failed to fetch") {
      // Try JSONPlaceholder as graceful degraded read-only fallback
      const fallbackUrl = `${FALLBACK_BASE}${endpoint}`;

      if (["/posts", "/comments", "/albums", "/photos", "/todos", "/users"].some((prefix) => endpoint.startsWith(prefix))) {
        try {
          const fallbackResponse = await fetch(fallbackUrl, {
            headers: { "Content-Type": "application/json", ...options.headers },
            ...options,
          });

          if (!fallbackResponse.ok) {
            throw new Error(await parseErrorBody(fallbackResponse));
          }

          const fallbackData = await fallbackResponse.json();
          const baseEndpoint = endpoint.split("?")[0];

          // JSONPlaceholder gives plain array for list endpoints; normalize to app expectations
          if (Array.isArray(fallbackData)) {
            const listEndpoints = ["/posts", "/comments", "/albums", "/photos", "/todos", "/users"];
            if (listEndpoints.includes(baseEndpoint)) {
              if (baseEndpoint === "/users") {
                return { data: fallbackData, total: fallbackData.length };
              }

              // apply simple local pagination for read-only fallback
              const urlObj = new URL(fallbackUrl);
              const params = urlObj.searchParams;
              const page = parseInt(params.get("_page") || "1", 10);
              const limit = parseInt(params.get("_limit") || "10", 10);
              const q = params.get("q") || "";
              let items = fallbackData;

              if (q) {
                const query = q.toLowerCase();
                if (baseEndpoint === "/posts") {
                  items = items.filter((p) => p.title.toLowerCase().includes(query) || (p.body && p.body.toLowerCase().includes(query)));
                } else if (baseEndpoint === "/comments") {
                  items = items.filter((p) => p.name.toLowerCase().includes(query) || p.body.toLowerCase().includes(query) || p.email.toLowerCase().includes(query));
                } else if (baseEndpoint === "/todos") {
                  items = items.filter((p) => p.title.toLowerCase().includes(query));
                } else if (baseEndpoint === "/albums") {
                  items = items.filter((p) => p.title.toLowerCase().includes(query));
                } else if (baseEndpoint === "/photos") {
                  items = items.filter((p) => p.title.toLowerCase().includes(query));
                }
              }

              const total = items.length;
              const totalPages = Math.ceil(total / limit) || 1;
              const paginated = items.slice((page - 1) * limit, page * limit);

              return { data: paginated, pagination: { total, totalPages, currentPage: page, limit } };
            }
          }

          return fallbackData;
        } catch (fallbackError) {
          throw new Error(
            `Unable to reach backend at ${API_BASE}; JSONPlaceholder fallback also failed: ${fallbackError.message}`
          );
        }
      }

      throw new Error(`Unable to reach backend at ${API_BASE}. Start the backend server and refresh.`);
    }

    throw error;
  }
}

// ─── Posts API ─────────────────────────────────────────────────────────────────

const PostsAPI = {
  /**
   * Fetch paginated & searchable posts.
   * @param {Object} params - { page, limit, q }
   */
  getAll: ({ page = 1, limit = 10, q = "" } = {}) => {
    const qs = new URLSearchParams({ _page: page, _limit: limit, q }).toString();
    return apiFetch(`/posts?${qs}`);
  },

  /** Create a new post. */
  create: (data) =>
    apiFetch("/posts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Update a post by ID. */
  update: (id, data) =>
    apiFetch(`/posts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /** Delete a post by ID. */
  delete: (id) =>
    apiFetch(`/posts/${id}`, { method: "DELETE" }),
};

// ─── Comments API ──────────────────────────────────────────────────────────────
const CommentsAPI = {
  getAll: ({ page = 1, limit = 10, q = "", postId = "" } = {}) => {
    const qs = new URLSearchParams({ _page: page, _limit: limit, q, ...(postId && { postId }) }).toString();
    return apiFetch(`/comments?${qs}`);
  },
};

// ─── Albums API ────────────────────────────────────────────────────────────────
const AlbumsAPI = {
  getAll: ({ page = 1, limit = 10, q = "" } = {}) => {
    const qs = new URLSearchParams({ _page: page, _limit: limit, q }).toString();
    return apiFetch(`/albums?${qs}`);
  },
  getByUserId: (userId) => apiFetch(`/albums?userId=${userId}`),
};

// ─── Photos API ────────────────────────────────────────────────────────────────
const PhotosAPI = {
  getAll: ({ page = 1, limit = 12, q = "" } = {}) => {
    const qs = new URLSearchParams({ _page: page, _limit: limit, q }).toString();
    return apiFetch(`/photos?${qs}`);
  },
  getByAlbumId: (albumId) => apiFetch(`/photos?albumId=${albumId}`),
};

// ─── Todos API ─────────────────────────────────────────────────────────────────
const TodosAPI = {
  getAll: ({ page = 1, limit = 10, q = "", completed = "" } = {}) => {
    const params = { _page: page, _limit: limit, q };
    if (completed !== "") params.completed = completed;
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/todos?${qs}`);
  },
};

// ─── Users API ─────────────────────────────────────────────────────────────────
const UsersAPI = {
  getAll: ({ q = "" } = {}) => {
    const qs = new URLSearchParams({ q }).toString();
    return apiFetch(`/users?${qs}`);
  },
};

// ─── Post-specific helpers ─────────────────────────────────────────────────────
PostsAPI.getById = (id) => apiFetch(`/posts/${id}`);
PostsAPI.getByUserId = (userId) => apiFetch(`/posts?userId=${userId}`);

// ─── Comment-specific helpers ──────────────────────────────────────────────────
CommentsAPI.getByPostId = (postId) => apiFetch(`/comments?postId=${postId}`);

