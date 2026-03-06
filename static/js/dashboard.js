// ============================================================
// Blogs — Posts Manager
// ============================================================
const token = localStorage.getItem('token');
let allPosts       = [];
let currentFilter  = 'all';
let currentUser    = null;   // populated after /api/users/profile/ if logged in

// ── Helpers ──────────────────────────────────────────────────
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncate(str, max = 130) {
    if (!str) return 'No content preview available.';
    return str.length > max ? str.substring(0, max) + '...' : str;
}

function parseTags(tagsInput) {
    // tagsInput: comma-separated string → array of non-empty strings
    return tagsInput.split(',').map(t => t.trim()).filter(Boolean);
}

// ── Render Posts ─────────────────────────────────────────────
function renderPosts(posts) {
    const container = document.getElementById('posts-container');
    const skeleton  = document.getElementById('posts-skeleton');
    const empty     = document.getElementById('posts-empty');

    skeleton && skeleton.classList.add('hidden');

    if (!posts || posts.length === 0) {
        container.classList.add('hidden');
        empty && empty.classList.remove('hidden');
        return;
    }

    empty && empty.classList.add('hidden');
    container.innerHTML = posts.map(post => {
        const isOwner     = currentUser && post.author === currentUser.email;
        const statusColor = post.status === 'published'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-slate-100 text-slate-500';
        const tags = (post.tags && post.tags.length)
            ? post.tags.slice(0, 3).map(t => `<span class="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">${t.name || t}</span>`).join('')
            : '';
        // Edit / Delete only visible to the post author
        const ownerActions = isOwner ? `
            <button onclick="openEditModal(${post.id})"
                class="text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors">
                Edit
            </button>
            <button onclick="deletePost(${post.id})"
                class="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">
                Delete
            </button>` : '';
        return `
        <div class="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-3 card-hover">
            <div class="flex items-center justify-between">
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}">
                    ${post.status === 'published' ? '● Published' : '○ Draft'}
                </span>
                <span class="text-xs text-slate-400">${post.created_at ? formatDate(post.created_at) : ''}</span>
            </div>
            <h2 class="text-base font-bold text-slate-900 leading-snug line-clamp-2">${post.title}</h2>
            <p class="text-sm text-slate-500 leading-relaxed flex-1">${truncate(post.body)}</p>
            ${tags ? `<div class="flex flex-wrap gap-1">${tags}</div>` : ''}
            <div class="flex items-center justify-between pt-2 border-t border-slate-50 mt-auto">
                <span class="flex items-center gap-1.5 text-xs text-slate-400">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    ${post.author || 'Unknown'}
                </span>
                <div class="flex items-center gap-2">
                    <a href="/posts/${post.id}/"
                        class="text-xs text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors">
                        View
                    </a>
                    ${ownerActions}
                </div>
            </div>
        </div>`;
    }).join('');
    container.classList.remove('hidden');
    container.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';
}

// ── Filter Tabs ───────────────────────────────────────────────
function filterPosts(filter) {
    currentFilter = filter;
    ['all', 'published', 'draft'].forEach(f => {
        const tab = document.getElementById(`tab-${f}`);
        if (!tab) return;
        if (f === filter) {
            tab.className = 'px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-600 text-white transition-all';
        } else {
            tab.className = 'px-4 py-1.5 rounded-full text-sm font-medium text-slate-500 hover:bg-slate-100 transition-all';
        }
    });
    let filtered;
    if (filter === 'all') {
        filtered = allPosts;
    } else if (filter === 'published') {
        // If logged in: only the user's own published posts (matches IsAuthorOrReadOnly — only your content is writable)
        // If guest: all published posts (read-only view)
        filtered = currentUser
            ? allPosts.filter(p => p.status === 'published' && p.author === currentUser.email)
            : allPosts.filter(p => p.status === 'published');
    } else if (filter === 'draft') {
        // Only the logged-in user's own drafts
        filtered = allPosts.filter(p => p.status === 'draft' && currentUser && p.author === currentUser.email);
    } else {
        filtered = allPosts;
    }
    renderPosts(filtered);
}

// ── Search ────────────────────────────────────────────────────
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', function() {
        const q = this.value.toLowerCase();
        const base = currentFilter === 'all' ? allPosts : allPosts.filter(p => p.status === currentFilter);
        const filtered = base.filter(p =>
            (p.title && p.title.toLowerCase().includes(q)) ||
            (p.body  && p.body.toLowerCase().includes(q))
        );
        renderPosts(filtered);
    });
}

// ── Init: fetch current user (if logged in) then posts ───────
(function init() {
    const userPromise = token
        ? fetch('/api/users/profile/', { headers: { 'Authorization': 'Token ' + token } })
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        : Promise.resolve(null);

    userPromise.then(user => {
        currentUser = user;

        if (user) {
            // Logged-in: relabel Published → My Published, show Drafts tab, show FAB, update subtitle
            const publishedTab = document.getElementById('tab-published');
            if (publishedTab) publishedTab.textContent = 'My Published';
            const draftTab = document.getElementById('tab-draft');
            if (draftTab) draftTab.classList.remove('hidden');
            const writeBtn = document.getElementById('write-blog-btn');
            if (writeBtn) { writeBtn.classList.remove('hidden'); writeBtn.classList.add('flex'); }
            const subtitle = document.getElementById('page-subtitle');
            if (subtitle) subtitle.textContent = 'Browse all posts and manage your own';
        }

        return fetch('/api/posts/', {
            headers: token ? { 'Authorization': 'Token ' + token } : {}
        });
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
    })
    .then(data => {
        allPosts = Array.isArray(data) ? data : (data.results || []);
        renderPosts(allPosts);
    })
    .catch(err => {
        console.error('Error loading posts:', err);
        document.getElementById('posts-skeleton') && document.getElementById('posts-skeleton').classList.add('hidden');
        showToast('Could not load posts. Please refresh.', 'error');
    });
})();

// ── Delete Post ───────────────────────────────────────────────
function deletePost(id) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    fetch(`/api/posts/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Token ' + token }
    })
    .then(res => {
        if (!res.ok) throw new Error();
        allPosts = allPosts.filter(p => p.id !== id);
        filterPosts(currentFilter);
        showToast('Post deleted.', 'success');
    })
    .catch(() => showToast('Failed to delete post.', 'error'));
}

// ── New Post Modal ────────────────────────────────────────────
function openNewPostModal()  { document.getElementById('new-post-modal').classList.remove('hidden'); }
function closeNewPostModal() {
    document.getElementById('new-post-modal').classList.add('hidden');
    document.getElementById('new-post-form').reset();
}

// Auto-generate slug from title
const postTitle = document.getElementById('post-title');
const postSlug  = document.getElementById('post-slug');
if (postTitle && postSlug) {
    postTitle.addEventListener('input', function() {
        postSlug.value = this.value.toLowerCase().trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-');
    });
}

// New Post Submit
const newPostForm = document.getElementById('new-post-form');
if (newPostForm) {
    newPostForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const tagsRaw = document.getElementById('post-tags').value;
        const tags = parseTags(tagsRaw);
        fetch('/api/posts/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + token
            },
            body: JSON.stringify({
                title:  document.getElementById('post-title').value.trim(),
                slug:   document.getElementById('post-slug').value.trim(),
                body:   document.getElementById('post-body').value.trim(),
                status: document.getElementById('post-status').value,
                tags:   tags,
            })
        })
        .then(res => {
            if (!res.ok) return res.json().then(d => Promise.reject(d));
            return res.json();
        })
        .then(newPost => {
            allPosts.unshift(newPost);
            filterPosts(currentFilter);
            closeNewPostModal();
            showToast('Post created successfully!', 'success');
        })
        .catch(err => {
            const msg = typeof err === 'object' ? Object.values(err)[0] : 'Failed to create post.';
            showToast(Array.isArray(msg) ? msg[0] : msg, 'error');
        });
    });
}

// Close new-post modal on backdrop click
document.getElementById('new-post-modal') && document.getElementById('new-post-modal').addEventListener('click', function(e) {
    if (e.target === this) closeNewPostModal();
});

// ── Edit Post Modal ───────────────────────────────────────────
function openEditModal(id) {
    const post = allPosts.find(p => p.id === id);
    if (!post) return;
    document.getElementById('edit-post-id').value    = post.id;
    document.getElementById('edit-post-title').value = post.title;
    document.getElementById('edit-post-body').value  = post.body || '';
    document.getElementById('edit-post-status').value = post.status;
    document.getElementById('edit-post-tags').value  = (post.tags || []).join(', ');
    document.getElementById('edit-post-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-post-modal').classList.add('hidden');
}

const editPostForm = document.getElementById('edit-post-form');
if (editPostForm) {
    editPostForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('edit-post-id').value);
        const tagsRaw = document.getElementById('edit-post-tags').value;
        const tags = parseTags(tagsRaw);
        fetch(`/api/posts/${id}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + token
            },
            body: JSON.stringify({
                title:  document.getElementById('edit-post-title').value.trim(),
                body:   document.getElementById('edit-post-body').value.trim(),
                status: document.getElementById('edit-post-status').value,
                tags:   tags,
            })
        })
        .then(res => {
            if (!res.ok) return res.json().then(d => Promise.reject(d));
            return res.json();
        })
        .then(updated => {
            const idx = allPosts.findIndex(p => p.id === id);
            if (idx !== -1) allPosts[idx] = updated;
            filterPosts(currentFilter);
            closeEditModal();
            showToast('Post updated successfully!', 'success');
        })
        .catch(err => {
            const msg = typeof err === 'object' ? Object.values(err)[0] : 'Failed to update post.';
            showToast(Array.isArray(msg) ? msg[0] : msg, 'error');
        });
    });
}

// Close edit-post modal on backdrop click
document.getElementById('edit-post-modal') && document.getElementById('edit-post-modal').addEventListener('click', function(e) {
    if (e.target === this) closeEditModal();
});

