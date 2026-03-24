/**
 * js/app.js
 * Main application controller.
 * Handles: navigation, section rendering, CRUD operations, modals, toasts.
 */

"use strict";

// ═══════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════
const state = {
  currentSection: "posts",
  posts:   { page: 1, limit: 10, q: "", total: 0, totalPages: 1 },
  albums:  { page: 1, limit: 10, q: "", total: 0, totalPages: 1 },
  photos:  { page: 1, limit: 12, q: "", total: 0, totalPages: 1 },
  todos:   { page: 1, limit: 10, q: "", completed: "", total: 0, totalPages: 1 },
  users:   { q: "" },
  editingPostId: null,   // null = creating, number = editing
  deletingPostId: null,
};

// ═══════════════════════════════════════════════════════════
//  DOM REFS
// ═══════════════════════════════════════════════════════════
const $ = (id) => document.getElementById(id);

const dom = {
  navLinks:      document.querySelectorAll(".nav-link"),
  navToggle:     $("navToggle"),
  navLinksList:  $("navLinks"),

  // Posts
  postsGrid:     $("postsGrid"),
  postsPagination: $("postsPagination"),
  postsSearch:   $("postsSearch"),
  postsLimit:    $("postsLimit"),
  openPostModal: $("openPostModal"),

  // Albums
  albumsGrid:    $("albumsGrid"),
  albumsPagination: $("albumsPagination"),
  albumsSearch:  $("albumsSearch"),
  albumsLimit:   $("albumsLimit"),

  // Photos
  photosGrid:    $("photosGrid"),
  photosPagination: $("photosPagination"),
  photosSearch:  $("photosSearch"),
  photosLimit:   $("photosLimit"),

  // Todos
  todosList:     $("todosList"),
  todosPagination: $("todosPagination"),
  todosSearch:   $("todosSearch"),
  todosTabs:     $("todosTabs"),
  todosLimit:    $("todosLimit"),

  // Users
  usersGrid:     $("usersGrid"),
  usersSearch:   $("usersSearch"),

  // Post Modal
  postModal:     $("postModal"),
  modalTitle:    $("modalTitle"),
  postId:        $("postId"),
  postTitle:     $("postTitle"),
  postBody:      $("postBody"),
  postImageUrl:  $("postImageUrl"),
  postUserId:    $("postUserId"),
  titleError:    $("titleError"),
  bodyError:     $("bodyError"),
  savePost:      $("savePost"),
  closeModal:    $("closeModal"),
  cancelModal:   $("cancelModal"),

  // Delete Modal
  deleteModal:   $("deleteModal"),
  closeDeleteModal: $("closeDeleteModal"),
  cancelDelete:  $("cancelDelete"),
  confirmDelete: $("confirmDelete"),

  // Post Detail
  postDetailModal: $("postDetailModal"),
  closeDetailModal: $("closeDetailModal"),
  closeDetailButton: $("closeDetailButton"),
  detailThumbnail: $("detailThumbnail"),
  detailTitle: $("detailTitle"),
  detailContent: $("detailContent"),
  detailUserId: $("detailUserId"),
  detailComments: $("detailComments"),

  // User posts modal
  userPostsModal: $("userPostsModal"),
  closeUserPostsModal: $("closeUserPostsModal"),
  closeUserPostsButton: $("closeUserPostsButton"),
  userPostsName: $("userPostsName"),
  userPostsId: $("userPostsId"),
  userPostsContent: $("userPostsContent"),
  userPostsModalBody: $("userPostsModalBody"),

  // User detail modal
  userDetailModal: $("userDetailModal"),
  closeUserDetailModal: $("closeUserDetailModal"),
  closeUserDetailButton: $("closeUserDetailButton"),
  userDetailModalTitle: $("userDetailModalTitle"),
  userDetailModalBody: $("userDetailModalBody"),
  userDetailContent: $("userDetailContent"),

  // UI
  toast:         $("toast"),
  toastIcon:     $("toastIcon"),
  toastMsg:      $("toastMsg"),
  loadingOverlay: $("loadingOverlay"),
};

function thumbnailUrl(item, seed, width = 260, height = 170) {
  if (!item) return `https://placehold.co/${width}x${height}/1e1e24/8a8790?text=No+Image`;
  if (item.imageUrl) return item.imageUrl;
  if (item.thumbnailUrl) return item.thumbnailUrl;
  if (item.url) return item.url;
  if (item.photoUrl) return item.photoUrl;
  if (item.avatarUrl) return item.avatarUrl;
  return `https://picsum.photos/seed/${seed || 'fallback'}/${width}/${height}`;
}


// ═══════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════

function showLoading() { dom.loadingOverlay.classList.add("active"); }
function hideLoading() { dom.loadingOverlay.classList.remove("active"); }

let toastTimer;
function showToast(msg, type = "success") {
  dom.toastMsg.textContent = msg;
  dom.toastIcon.textContent = type === "success" ? "✓" : "✕";
  dom.toast.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove("show"), 3200);
}

function openModal(id) { $(id).classList.add("open"); }
function closeModal(id) { $(id).classList.remove("open"); }

function debounce(fn, delay = 400) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

function initials(name = "?") {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function loaderHtml() {
  return `<div class="section-loader"><div class="mini-spinner"></div> Loading…</div>`;
}

function emptyHtml(icon, title, text) {
  return `<div class="empty-state">
    <div class="empty-state-icon">${icon}</div>
    <div class="empty-state-title">${title}</div>
    <div class="empty-state-text">${text}</div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════════

function switchSection(sectionName) {
  // Update nav links
  dom.navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.section === sectionName);
  });

  // Hide/show sections
  document.querySelectorAll(".section").forEach((sec) => {
    sec.classList.toggle("active", sec.id === `section-${sectionName}`);
  });

  state.currentSection = sectionName;
  dom.navLinksList.classList.remove("open");

  // Scroll past hero on first nav click
  const appShell = document.querySelector(".app-shell");
  appShell.scrollIntoView({ behavior: "smooth" });

  // Load data for section
  loadSection(sectionName);
}

async function loadSection(name) {
  switch (name) {
    case "posts":  loadPosts(); break;
    case "albums": loadAlbums(); break;
    case "photos": loadPhotos(); break;
    case "todos":  loadTodos(); break;
    case "users":  loadUsers(); break;
  }
}

// ═══════════════════════════════════════════════════════════
//  POSTS
// ═══════════════════════════════════════════════════════════

async function loadPosts() {
  dom.postsGrid.innerHTML = loaderHtml();
  dom.postsPagination.innerHTML = "";

  try {
    const { data, pagination } = await PostsAPI.getAll({
      page: state.posts.page,
      limit: state.posts.limit,
      q: state.posts.q,
    });

    state.posts.total = pagination.total;
    state.posts.totalPages = pagination.totalPages;

    if (!data.length) {
      dom.postsGrid.innerHTML = emptyHtml("📝", "No posts found", "Try a different search query.");
      return;
    }

    // Include thumbnails from photos API when available, for a richer post card experience
    let photos = [];
    try {
      const photosResponse = await PhotosAPI.getAll({ page: 1, limit: data.length });
      photos = (photosResponse.data || photosResponse) || [];
    } catch {
      photos = [];
    }

    const postsWithImages = data.map((post, index) => ({
      ...post,
      thumbnailUrl: post.thumbnailUrl || photos[index]?.thumbnailUrl || `https://picsum.photos/seed/post-${post.id}/600/320`,
      thumbnailTitle: post.title,
    }));

    dom.postsGrid.innerHTML = postsWithImages.map(renderPostCard).join("");
    renderPagination("posts", pagination);
    attachPostCardEvents();
  } catch (err) {
    dom.postsGrid.innerHTML = emptyHtml("⚠️", "Failed to load posts", err.message);
    showToast(`Error: ${err.message}`, "error");
  }
}

async function openPostDetail(postId) {
  if (!postId) return;

  try {
    showLoading();
    const post = await PostsAPI.getById(postId);
    const commentsResponse = await CommentsAPI.getByPostId(postId);
    const comments = commentsResponse.data || commentsResponse;

    const detailSrc = thumbnailUrl(post, `post-${postId}`, 900, 420);
    dom.detailThumbnail.innerHTML = `<img src="${detailSrc}" alt="Post thumbnail" loading="lazy" onerror="this.src='https://placehold.co/900x420/1e1e24/8a8790?text=No+Image'" />`;
    dom.detailTitle.textContent = post.title;
    dom.detailContent.textContent = post.body;
    dom.detailUserId.textContent = post.userId;

    if (comments && comments.length) {
      dom.detailComments.innerHTML = comments
        .slice(0, 20)
        .map((comment) => {
          const avatarUrl = `https://i.pravatar.cc/40?img=${(comment.id % 70) + 1}`;
          return `
          <div class="comment-item">
            <div class="comment-avatar">
              <img src="${avatarUrl}" alt="Avatar" loading="lazy" onerror="this.style.display='none'" />
            </div>
            <div class="comment-content">
              <div class="comment-head">
                <span class="comment-name">${escapeHtml(comment.name || comment.email || 'Anonymous')}</span>
                <span class="comment-email">${escapeHtml(comment.email || '')}</span>
              </div>
              <p class="comment-body">${escapeHtml(comment.body)}</p>
            </div>
          </div>
        `;
        })
        .join("");
    } else {
      dom.detailComments.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💬</div><div class="empty-state-title">No comments yet</div><div class="empty-state-text">Be the first to comment!</div></div>`;
    }

    // Make sure the detail modal starts at top when opened
    const detailModal = dom.postDetailModal;
    if (detailModal) {
      detailModal.scrollTop = 0;
    }
    openModal("postDetailModal");

    // Scroll page to posts section when detail is opened
    document.getElementById("section-posts")?.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    showToast(`Error loading post details: ${err.message}`, "error" );
  } finally {
    hideLoading();
  }
}

function closePostDetail() {
  closeModal("postDetailModal");
  dom.detailComments.innerHTML = "";
  dom.detailTitle.textContent = "";
  dom.detailContent.textContent = "";
  dom.detailUserId.textContent = "";
  dom.detailThumbnail.innerHTML = "";
}

async function openUserPosts(userId, userName) {
  if (!userId || !userName) return;

  try {
    showLoading();
    const postsResponse = await PostsAPI.getByUserId(userId);
    const posts = postsResponse.data || postsResponse;

    const albumsResponse = await AlbumsAPI.getByUserId(userId);
    const albums = albumsResponse.data || albumsResponse;

    const photosPromises = albums.map(album => PhotosAPI.getByAlbumId(album.id));
    const photosResponses = await Promise.all(photosPromises);
    const photos = photosResponses.flatMap(res => res.data || res);

    dom.userPostsName.textContent = userName;
    dom.userPostsId.textContent = userId;

    // Set up tabs
    const tabsContainer = dom.userPostsModalBody.querySelector('.user-posts-tabs');
    if (!tabsContainer) {
      showToast('Error: user posts tabs container not found', 'error');
      return;
    }
    tabsContainer.innerHTML = `
      <button class="tab-btn active" data-tab="posts">Posts (${posts.length})</button>
      <button class="tab-btn" data-tab="photos">Photos (${photos.length})</button>
    `;

    // Add tab click handlers
    tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        if (tab === 'posts') renderUserPostsTab(tab, posts, photos);
        else if (tab === 'photos') renderUserPostsTab(tab, photos);
      });
    });

    // Default to posts
    renderUserPostsTab('posts', posts, photos);

    // Compact toggle
    const compactToggle = document.getElementById('userPostsCompactToggle');
    if (compactToggle) {
      compactToggle.checked = false;
      compactToggle.addEventListener('change', () => {
        dom.userPostsContent.classList.toggle('compact', compactToggle.checked);
      });
    }

    // Show modal and ensure content starts at top
    dom.userPostsContent.scrollTop = 0;
    if (dom.userPostsModal) dom.userPostsModal.scrollTop = 0;

    openModal("userPostsModal");

    // Scroll page to users section when user modal opens
    document.getElementById("section-users")?.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    showToast(`Error loading user posts: ${err.message}`, "error");
  } finally {
    hideLoading();
  }
}

function renderUserPostsTab(tab, data, photos = []) {
  let html = '';
  if (tab === 'posts') {
    const photosByIndex = photos.length ? photos : [];
    html = data.map((post, i) => {
      const photo = photosByIndex[i % photosByIndex.length];
      const srcItem = photo || post;
      const imgSrc = thumbnailUrl(srcItem, `user-post-${post.id}`, 300, 180);
      const imgAlt = photo?.title ? `Photo: ${escapeAttr(photo.title)}` : `Thumbnail for ${escapeAttr(post.title)}`;
      return `
      <div class="post-item">
        <div class="post-thumbnail">
          <img src="${imgSrc}" alt="${imgAlt}" loading="lazy" onerror="this.src='https://placehold.co/300x180/1e1e24/8a8790?text=No+Image'" />
        </div>
        <div class="post-content">
          <div class="comment-head">
            <span class="comment-name">${escapeHtml(post.title)}</span>
          </div>
          <p class="comment-body">${escapeHtml(post.body)}</p>
          <div class="post-meta">By user ${post.userId}</div>
        </div>
      </div>
    `;
    }).join('');
  } else if (tab === 'photos') {
    html = data.map(photo => `<div class="photo-card" title="${escapeAttr(photo.title)}"><div class="photo-img-wrap"><img src="${photo.thumbnailUrl}" alt="${escapeAttr(photo.title)}" loading="lazy" onerror="this.src='https://placehold.co/150x150/1e1e24/8a8790?text=📷'" /></div><div class="photo-caption">${escapeHtml(photo.title)}</div></div>`).join('');
  } else if (tab === 'mixed') {
    const mixed = [];
    const postsData = data.posts || [];
    const photosData = data.photos || [];
    postsData.forEach((post, index) => {
      const photo = photosData[index % photosData.length] || null;
      const imgSrc = photo?.thumbnailUrl || `https://picsum.photos/seed/post-${post.id}/150/100`;
      mixed.push(`
        <div class="post-item">
          <div class="post-thumbnail">
            <img src="${imgSrc}" alt="${escapeAttr(photo?.title || post.title)}" loading="lazy" onerror="this.src='https://placehold.co/150x100/1e1e24/8a8790?text=No+Image'" />
          </div>
          <div class="post-content">
            <div class="comment-head"><span class="comment-name">${escapeHtml(post.title)}</span></div>
            <p class="comment-body">${escapeHtml(post.body)}</p>
            <div class="post-meta">By user ${post.userId}</div>
          </div>
        </div>
      `);
    });
    html = mixed.join('');
  }
  dom.userPostsContent.innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">📄</div><div class="empty-state-title">No content</div></div>';
}

function closeUserPosts() {
  closeModal("userPostsModal");
  dom.userPostsContent.innerHTML = "";
  dom.userPostsName.textContent = "";
  dom.userPostsId.textContent = "";
}

async function openUserDetail(userId, userName) {
  if (!userId) return;

  try {
    showLoading();
    const postsResponse = await PostsAPI.getByUserId(userId);
    const posts = postsResponse.data || postsResponse;

    const albumsResponse = await AlbumsAPI.getByUserId(userId);
    const albums = albumsResponse.data || albumsResponse;

    const photosPromises = albums.map(album => PhotosAPI.getByAlbumId(album.id));
    const photosResponses = await Promise.all(photosPromises);
    const photos = photosResponses.flatMap(res => res.data || res);

    const postIds = posts.map(p => p.id);
    const commentsPromises = postIds.map(id => CommentsAPI.getByPostId(id));
    const commentsResponses = await Promise.all(commentsPromises);
    const comments = commentsResponses.flatMap(res => res.data || res);

    dom.userDetailModalTitle.textContent = `Details for ${userName}`;

    // Set up tabs
    const tabsContainer = dom.userDetailModalBody.querySelector('.user-detail-tabs');
    tabsContainer.innerHTML = `
      <button class="tab-btn active" data-tab="posts">Posts (${posts.length})</button>
      <button class="tab-btn" data-tab="photos">Photos (${photos.length})</button>
      <button class="tab-btn" data-tab="comments">Comments (${comments.length})</button>
    `;

    // Add tab click handlers
    tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        if (tab === 'posts') renderUserDetailTab(tab, posts);
        else if (tab === 'photos') renderUserDetailTab(tab, photos);
        else if (tab === 'comments') renderUserDetailTab(tab, comments);
      });
    });

    // Default to posts
    renderUserDetailTab('posts', posts);

    openModal("userDetailModal");
  } catch (err) {
    showToast(`Error loading user details: ${err.message}`, "error");
  } finally {
    hideLoading();
  }
}

function renderUserDetailTab(tab, data) {
  let html = '';
  if (tab === 'posts') {
    html = data.map(post => {
      const thumb = thumbnailUrl(post, `user-post-${post.id}`, 84, 64);
      return `<div class="comment-item comment-item--with-thumb"><div class="post-list-thumb"><img src="${thumb}" alt="Thumb for ${escapeAttr(post.title)}" loading="lazy" onerror="this.src='https://placehold.co/84x64/1e1e24/8a8790?text=No+Image'" /></div><div><div class="comment-head"><span class="comment-name">${escapeHtml(post.title)}</span></div><p class="comment-body">${escapeHtml(post.body)}</p></div></div>`;
    }).join('');
  } else if (tab === 'photos') {
    html = data.map(photo => {
      const thumb = thumbnailUrl(photo, `user-photo-${photo.id}`, 150, 150);
      return `<div class="photo-card" title="${escapeAttr(photo.title)}"><div class="photo-img-wrap"><img src="${thumb}" alt="${escapeAttr(photo.title)}" loading="lazy" onerror="this.src='https://placehold.co/150x150/1e1e24/8a8790?text=📷'" /></div><div class="photo-caption">${escapeHtml(photo.title)}</div></div>`;
    }).join('');
  } else if (tab === 'comments') {
    html = data.map(comment => {
      const avatarUrl = `https://i.pravatar.cc/40?img=${(comment.id % 70) + 1}`;
      return `<div class="comment-item"><div class="comment-avatar"><img src="${avatarUrl}" alt="Avatar" loading="lazy" onerror="this.style.display='none'" /></div><div class="comment-content"><div class="comment-head"><span class="comment-name">${escapeHtml(comment.name || comment.email)}</span><span class="comment-email">${escapeHtml(comment.email)}</span></div><p class="comment-body">${escapeHtml(comment.body)}</p></div></div>`;
    }).join('');
  }
  dom.userDetailContent.innerHTML = html || '<div class="empty-state"><div class="empty-state-icon">📄</div><div class="empty-state-title">No content</div></div>';
}

function closeUserDetail() {
  closeModal("userDetailModal");
  dom.userDetailContent.innerHTML = "";
}

function renderPostCard(post) {
  const isCustom = post.isCustom;
  const thumbnail = thumbnailUrl(post, `post-${post.id}`, 600, 320);
  const thumbAlt = post.thumbnailTitle ? `Photo: ${escapeAttr(post.thumbnailTitle)}` : `Thumbnail for ${escapeAttr(post.title)}`;
  return `
  <article class="post-card" data-post-id="${post.id}">
    <div class="post-thumbnail">
      <img src="${thumbnail}" alt="${thumbAlt}" loading="lazy" onerror="this.src='https://placehold.co/600x320/1e1e24/8a8790?text=No+Image'" />
    </div>
    <div class="post-card-inner">
      <div class="post-card-meta">
        <span class="post-id-badge">#${post.id}</span>
        ${isCustom ? '<span class="post-custom-badge">✦ custom</span>' : ""}
        <div class="post-card-actions">
          <button class="btn-icon edit" title="Edit" data-action="edit" data-id="${post.id}"
            data-title="${escapeAttr(post.title)}"
            data-body="${escapeAttr(post.body)}"
            data-userid="${post.userId}">✎</button>
          <button class="btn-icon del" title="Delete" data-action="delete" data-id="${post.id}">✕</button>
        </div>
      </div>
      <h3 class="post-card-title">${escapeHtml(post.title)}</h3>
      <p class="post-card-body">${escapeHtml(post.body)}</p>
      <div class="post-card-footer">
        <div class="user-avatar">${post.userId}</div>
        <span class="post-card-user">User ${post.userId}</span>
        ${post.createdAt ? `<span style="margin-left:auto;font-size:0.68rem;color:var(--text-faint);font-family:var(--font-mono)">${new Date(post.createdAt).toLocaleDateString()}</span>` : ""}
      </div>
    </div>
  </article>`;
}

function attachPostCardEvents() {
  dom.postsGrid.querySelectorAll("[data-action='edit']").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditPostModal(btn.dataset);
    });
  });

  dom.postsGrid.querySelectorAll("[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openDeleteModal(parseInt(btn.dataset.id));
    });
  });

  dom.postsGrid.querySelectorAll(".post-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-action='edit']") || e.target.closest("[data-action='delete']")) return;
      const postId = parseInt(card.dataset.postId);
      openPostDetail(postId);
    });
  });
}

// ─── Post Modal ────────────────────────────────────────────
function openCreatePostModal() {
  state.editingPostId = null;
  dom.modalTitle.textContent = "New Post";
  dom.postId.value = "";
  dom.postTitle.value = "";
  dom.postBody.value = "";
  dom.postImageUrl.value = "";
  dom.postUserId.value = 1;
  dom.titleError.textContent = "";
  dom.bodyError.textContent = "";
  openModal("postModal");
}

function openEditPostModal({ id, title, body, userid, imageUrl }) {
  state.editingPostId = parseInt(id);
  dom.modalTitle.textContent = "Edit Post";
  dom.postId.value = id;
  dom.postTitle.value = title;
  dom.postBody.value = body;
  dom.postImageUrl.value = imageUrl || "";
  dom.postUserId.value = userid;
  dom.titleError.textContent = "";
  dom.bodyError.textContent = "";
  openModal("postModal");
}

async function savePostHandler() {
  const title = dom.postTitle.value.trim();
  const body = dom.postBody.value.trim();
  const userId = parseInt(dom.postUserId.value) || 1;

  // Validate
  let valid = true;
  if (!title) { dom.titleError.textContent = "Title is required."; valid = false; }
  else dom.titleError.textContent = "";
  if (!body) { dom.bodyError.textContent = "Body is required."; valid = false; }
  else dom.bodyError.textContent = "";
  if (!valid) return;

  showLoading();
  const imageUrl = dom.postImageUrl.value.trim();
  try {
    if (state.editingPostId) {
      await PostsAPI.update(state.editingPostId, { title, body, userId, imageUrl });
      showToast("Post updated successfully ✓");
    } else {
      await PostsAPI.create({ title, body, userId, imageUrl });
      showToast("Post created successfully ✓");
      state.posts.page = 1; // go back to first page to see new post
    }
    closeModal("postModal");
    loadPosts();
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  } finally {
    hideLoading();
  }
}

// ─── Delete Modal ──────────────────────────────────────────
function openDeleteModal(id) {
  state.deletingPostId = id;
  openModal("deleteModal");
}

async function deletePostHandler() {
  if (!state.deletingPostId) return;
  showLoading();
  try {
    await PostsAPI.delete(state.deletingPostId);
    showToast("Post deleted.");
    closeModal("deleteModal");
    state.deletingPostId = null;
    // Go to page 1 if we just deleted the last item on this page
    if (state.posts.page > 1) state.posts.page = 1;
    loadPosts();
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  } finally {
    hideLoading();
  }
}

// ═══════════════════════════════════════════════════════════
//  ALBUMS
// ═══════════════════════════════════════════════════════════

const albumEmojis = ["🎵","🎸","🎺","🎷","🥁","🎹","🎻","🎤","🎧","🎼"];

async function loadAlbums() {
  dom.albumsGrid.innerHTML = loaderHtml();
  dom.albumsPagination.innerHTML = "";
  try {
    const { data, pagination } = await AlbumsAPI.getAll({
      page: state.albums.page, limit: state.albums.limit, q: state.albums.q,
    });

    if (!data.length) {
      dom.albumsGrid.innerHTML = emptyHtml("💿", "No albums found", "Try a different search.");
      return;
    }

    // For album thumbnails we use the first photo in each album as visual hint
    const albumPhotos = await Promise.all(data.map(async (album) => {
      try {
        const photosResp = await PhotosAPI.getByAlbumId(album.id);
        const photos = photosResp.data || photosResp;
        return photos.length ? photos[0].thumbnailUrl : null;
      } catch {
        return null;
      }
    }));

    dom.albumsGrid.innerHTML = data.map((album, index) => {
      const thumbUrl = albumPhotos[index] || `https://picsum.photos/seed/album-${album.id}/260/170`;
      return `
      <div class="album-card">
        <div class="album-thumb-wrap">
          <img src="${thumbUrl}" alt="Album thumbnail" loading="lazy" onerror="this.src='https://placehold.co/260x170/1e1e24/8a8790?text=Album'" />
        </div>
        <div class="album-info">
          <div class="album-title">${escapeHtml(album.title)}</div>
          <div class="album-meta">Album #${album.id} · <span class="album-user" data-user-id="${album.userId}">User ${album.userId}</span></div>
        </div>
      </div>`;
    }).join("");

    renderPagination("albums", pagination);

    // Add click handlers for album users
    dom.albumsGrid.querySelectorAll(".album-user").forEach((userEl) => {
      userEl.addEventListener("click", () => {
        const userId = parseInt(userEl.dataset.userId);
        openUserDetail(userId, `User ${userId}`);
      });
    });
  } catch (err) {
    dom.albumsGrid.innerHTML = emptyHtml("⚠️", "Failed to load albums", err.message);
    showToast(`Error: ${err.message}`, "error");
  }
}

// ═══════════════════════════════════════════════════════════
//  PHOTOS
// ═══════════════════════════════════════════════════════════

async function loadPhotos() {
  dom.photosGrid.innerHTML = loaderHtml();
  dom.photosPagination.innerHTML = "";
  try {
    const { data, pagination } = await PhotosAPI.getAll({
      page: state.photos.page, limit: state.photos.limit, q: state.photos.q,
    });

    if (!data.length) {
      dom.photosGrid.innerHTML = emptyHtml("🖼️", "No photos found", "Try a different search.");
      return;
    }

    dom.photosGrid.innerHTML = data.map((photo) => {
      const src = thumbnailUrl(photo, `photo-${photo.id}`, 150, 150);
      return `
      <div class="photo-card" title="${escapeAttr(photo.title)}">
        <div class="photo-img-wrap">
          <img
            src="${src}"
            alt="${escapeAttr(photo.title)}"
            loading="lazy"
            onerror="this.src='https://placehold.co/150x150/1e1e24/8a8790?text=📷'"
          />
        </div>
        <div class="photo-caption">${escapeHtml(photo.title)}</div>
      </div>`;
    }).join("");

    renderPagination("photos", pagination);
  } catch (err) {
    dom.photosGrid.innerHTML = emptyHtml("⚠️", "Failed to load photos", err.message);
    showToast(`Error: ${err.message}`, "error");
  }
}

// ═══════════════════════════════════════════════════════════
//  TODOS
// ═══════════════════════════════════════════════════════════

async function loadTodos() {
  dom.todosList.innerHTML = loaderHtml();
  dom.todosPagination.innerHTML = "";
  try {
    const { data, pagination } = await TodosAPI.getAll({
      page: state.todos.page,
      limit: state.todos.limit,
      q: state.todos.q,
      completed: state.todos.completed,
    });

    if (!data.length) {
      dom.todosList.innerHTML = emptyHtml("✅", "No todos found", "Adjust filters or search.");
      return;
    }

    dom.todosList.innerHTML = data.map((todo) => `
      <div class="todo-item ${todo.completed ? "completed" : ""}">
        <div class="todo-checkbox">${todo.completed ? "✓" : ""}</div>
        <span class="todo-text">${escapeHtml(todo.title)}</span>
        <span class="todo-user-id">User ${todo.userId}</span>
      </div>`).join("");

    renderPagination("todos", pagination);
  } catch (err) {
    dom.todosList.innerHTML = emptyHtml("⚠️", "Failed to load todos", err.message);
    showToast(`Error: ${err.message}`, "error");
  }
}

// ═══════════════════════════════════════════════════════════
//  USERS
// ═══════════════════════════════════════════════════════════

async function loadUsers() {
  dom.usersGrid.innerHTML = loaderHtml();
  try {
    const { data } = await UsersAPI.getAll({ q: state.users.q });

    if (!data.length) {
      dom.usersGrid.innerHTML = emptyHtml("👥", "No users found", "Try a different search.");
      return;
    }

    dom.usersGrid.innerHTML = data.map((user) => {
      const avatarUrl = `https://i.pravatar.cc/120?img=${(user.id % 70) + 1}`;
      return `
      <div class="user-card" data-user-id="${user.id}" data-user-name="${escapeAttr(user.name)}">
        <div class="user-card-header">
          <div class="user-big-avatar">
            <img src="${avatarUrl}" alt="${escapeAttr(user.name)}" loading="lazy" onerror="this.style.display='none'" />
            <span class="fallback-avatar">${initials(user.name)}</span>
          </div>
          <div>
            <div class="user-name">${escapeHtml(user.name)}</div>
            <div class="user-username">@${escapeHtml(user.username)}</div>
          </div>
        </div>
        <div class="user-details">
          <div class="user-detail">
            <span class="user-detail-icon">✉</span>
            <span class="user-detail-text">
              <a href="mailto:${escapeAttr(user.email)}">${escapeHtml(user.email)}</a>
            </span>
          </div>
          <div class="user-detail">
            <span class="user-detail-icon">☎</span>
            <span class="user-detail-text">${escapeHtml(user.phone)}</span>
          </div>
          <div class="user-detail">
            <span class="user-detail-icon">🌐</span>
            <span class="user-detail-text">
              <a href="https://${escapeAttr(user.website)}" target="_blank">${escapeHtml(user.website)}</a>
            </span>
          </div>
          <div class="user-detail">
            <span class="user-detail-icon">🏢</span>
            <span class="user-detail-text">${escapeHtml(user.company?.name || "—")}</span>
          </div>
          <div class="user-detail">
            <span class="user-detail-icon">📍</span>
            <span class="user-detail-text">${escapeHtml(user.address?.city || "—")}, ${escapeHtml(user.address?.zipcode || "")}</span>
          </div>
        </div>
        <button class="btn btn-primary user-posts-btn" type="button">View posts</button>
      </div>`;
    }).join("");

    dom.usersGrid.querySelectorAll(".user-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".user-posts-btn")) {
          const userId = parseInt(card.dataset.userId);
          const userName = card.dataset.userName;
          openUserPosts(userId, userName);
        }
      });
    });
  } catch (err) {
    dom.usersGrid.innerHTML = emptyHtml("⚠️", "Failed to load users", err.message);
    showToast(`Error: ${err.message}`, "error");
  }
}

// ═══════════════════════════════════════════════════════════
//  PAGINATION
// ═══════════════════════════════════════════════════════════

function renderPagination(section, { total, totalPages, currentPage, limit }) {
  const container = $(`${section}Pagination`);
  if (totalPages <= 1) { container.innerHTML = ""; return; }

  const pages = [];

  // Show up to 5 page numbers around current
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);
  if (currentPage <= 3) end = Math.min(5, totalPages);
  if (currentPage >= totalPages - 2) start = Math.max(1, totalPages - 4);

  pages.push(`
    <button class="page-btn" ${currentPage === 1 ? "disabled" : ""}
      data-section="${section}" data-page="${currentPage - 1}">‹</button>`);

  if (start > 1) {
    pages.push(`<button class="page-btn" data-section="${section}" data-page="1">1</button>`);
    if (start > 2) pages.push(`<span class="page-info">…</span>`);
  }

  for (let i = start; i <= end; i++) {
    pages.push(`<button class="page-btn ${i === currentPage ? "active" : ""}"
      data-section="${section}" data-page="${i}">${i}</button>`);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push(`<span class="page-info">…</span>`);
    pages.push(`<button class="page-btn" data-section="${section}" data-page="${totalPages}">${totalPages}</button>`);
  }

  pages.push(`
    <button class="page-btn" ${currentPage === totalPages ? "disabled" : ""}
      data-section="${section}" data-page="${currentPage + 1}">›</button>`);

  pages.push(`<span class="page-info">${total} total</span>`);

  container.innerHTML = pages.join("");

  container.querySelectorAll(".page-btn:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pg = parseInt(btn.dataset.page);
      const sec = btn.dataset.section;
      state[sec].page = pg;
      loadSection(sec);
    });
  });
}

// ═══════════════════════════════════════════════════════════
//  SECURITY HELPERS
// ═══════════════════════════════════════════════════════════

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str = "") {
  return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ═══════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ═══════════════════════════════════════════════════════════

// ─── Navigation ────────────────────────────────────────────
dom.navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    switchSection(link.dataset.section);
  });
});

dom.navToggle.addEventListener("click", () => {
  dom.navLinksList.classList.toggle("open");
});

// ─── Posts ─────────────────────────────────────────────────
dom.openPostModal.addEventListener("click", openCreatePostModal);
dom.savePost.addEventListener("click", savePostHandler);
dom.closeModal.addEventListener("click", () => closeModal("postModal"));
dom.cancelModal.addEventListener("click", () => closeModal("postModal"));
dom.postModal.addEventListener("click", (e) => {
  if (e.target === dom.postModal) closeModal("postModal");
});

// Post detail modal controls
if (dom.closeDetailModal) dom.closeDetailModal.addEventListener("click", closePostDetail);
if (dom.closeDetailButton) dom.closeDetailButton.addEventListener("click", closePostDetail);
dom.postDetailModal.addEventListener("click", (e) => {
  if (e.target === dom.postDetailModal) closePostDetail();
});

// User posts modal controls
if (dom.closeUserPostsModal) dom.closeUserPostsModal.addEventListener("click", closeUserPosts);
if (dom.closeUserPostsButton) dom.closeUserPostsButton.addEventListener("click", closeUserPosts);
dom.userPostsModal.addEventListener("click", (e) => {
  if (e.target === dom.userPostsModal) closeUserPosts();
});

// User detail modal controls
if (dom.closeUserDetailModal) dom.closeUserDetailModal.addEventListener("click", closeUserDetail);
if (dom.closeUserDetailButton) dom.closeUserDetailButton.addEventListener("click", closeUserDetail);
dom.userDetailModal.addEventListener("click", (e) => {
  if (e.target === dom.userDetailModal) closeUserDetail();
});

dom.postsSearch.addEventListener("input", debounce(() => {
  state.posts.q = dom.postsSearch.value;
  state.posts.page = 1;
  loadPosts();
}));

dom.postsLimit.addEventListener("change", () => {
  state.posts.limit = parseInt(dom.postsLimit.value);
  state.posts.page = 1;
  loadPosts();
});

// ─── Delete Modal ──────────────────────────────────────────
dom.confirmDelete.addEventListener("click", deletePostHandler);
dom.cancelDelete.addEventListener("click", () => closeModal("deleteModal"));
dom.closeDeleteModal.addEventListener("click", () => closeModal("deleteModal"));
dom.deleteModal.addEventListener("click", (e) => {
  if (e.target === dom.deleteModal) closeModal("deleteModal");
});

// ─── Albums ────────────────────────────────────────────────
dom.albumsSearch.addEventListener("input", debounce(() => {
  state.albums.q = dom.albumsSearch.value;
  state.albums.page = 1;
  loadAlbums();
}));

dom.albumsLimit.addEventListener("change", () => {
  state.albums.limit = parseInt(dom.albumsLimit.value);
  state.albums.page = 1;
  loadAlbums();
});

// ─── Photos ────────────────────────────────────────────────
dom.photosSearch.addEventListener("input", debounce(() => {
  state.photos.q = dom.photosSearch.value;
  state.photos.page = 1;
  loadPhotos();
}));

dom.photosLimit.addEventListener("change", () => {
  state.photos.limit = parseInt(dom.photosLimit.value);
  state.photos.page = 1;
  loadPhotos();
});

// ─── Todos ─────────────────────────────────────────────────
dom.todosSearch.addEventListener("input", debounce(() => {
  state.todos.q = dom.todosSearch.value;
  state.todos.page = 1;
  loadTodos();
}));

dom.todosTabs.addEventListener("click", (e) => {
  const tab = e.target.closest(".filter-tab");
  if (!tab) return;
  dom.todosTabs.querySelectorAll(".filter-tab").forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
  const filter = tab.dataset.filter;
  state.todos.completed = filter === "all" ? "" : filter;
  state.todos.page = 1;
  loadTodos();
});

dom.todosLimit.addEventListener("change", () => {
  state.todos.limit = parseInt(dom.todosLimit.value);
  state.todos.page = 1;
  loadTodos();
});

// ─── Users ─────────────────────────────────────────────────
dom.usersSearch.addEventListener("input", debounce(() => {
  state.users.q = dom.usersSearch.value;
  loadUsers();
}));

// ─── Keyboard shortcuts ────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal("postModal");
    closeModal("deleteModal");
  }
  // Ctrl/Cmd + N to open new post modal
  if ((e.ctrlKey || e.metaKey) && e.key === "n" && state.currentSection === "posts") {
    e.preventDefault();
    openCreatePostModal();
  }
});

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════
(function init() {
  // Scroll-based navbar elevation
  window.addEventListener("scroll", () => {
    const navbar = document.getElementById("navbar");
    navbar.style.borderBottomColor = window.scrollY > 10
      ? "rgba(255,255,255,0.12)"
      : "rgba(255,255,255,0.08)";
  });

  // Auto-load posts on start
  loadPosts();

  console.log(`
  ╔══════════════════════════════════╗
  ║   Blogosphere App — Loaded ✦    ║
  ║   Ctrl+N: New post               ║
  ║   ESC: Close modal               ║
  ╚══════════════════════════════════╝
  `);
})();
