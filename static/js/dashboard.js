// ============================================================
// Dashboard — Posts Loader
// ============================================================
const token = localStorage.getItem('token');
let allPosts = [];
let currentFilter = 'all';

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncate(str, max = 130) {
    if (!str) return 'No content preview available.';
    return str.length > max ? str.substring(0, max) + '...' : str;
}

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
        const statusColor = post.status === 'published'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-slate-100 text-slate-500';
        const tags = (post.tags && post.tags.length)
            ? post.tags.slice(0, 3).map(t => `<span class="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">${t.name || t}</span>`).join('')
            : '';
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
                    ${post.author_name || 'Unknown'}
                </span>
                <button onclick="deletePost(${post.id})"
                    class="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">
                    Delete
                </button>
            </div>
        </div>`;
    }).join('');
    container.classList.remove('hidden');
    container.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';
}

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
    const filtered = filter === 'all' ? allPosts : allPosts.filter(p => p.status === filter);
    renderPosts(filtered);
}

function updateStats(posts) {
    const total     = posts.length;
    const published = posts.filter(p => p.status === 'published').length;
    const drafts    = total - published;
    const authors   = new Set(posts.map(p => p.author)).size;
    const el = id => document.getElementById(id);
    el('stat-total')     && (el('stat-total').textContent     = total);
    el('stat-published') && (el('stat-published').textContent = published);
    el('stat-drafts')    && (el('stat-drafts').textContent    = drafts);
    el('stat-authors')   && (el('stat-authors').textContent   = authors);
}

// Search
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

// Fetch posts
fetch('/api/posts/', {
    headers: { 'Authorization': 'Token ' + token }
})
.then(res => {
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
})
.then(data => {
    allPosts = data;
    updateStats(data);
    renderPosts(data);
})
.catch(err => {
    console.error('Error loading posts:', err);
    document.getElementById('posts-skeleton') && document.getElementById('posts-skeleton').classList.add('hidden');
    showToast('Could not load posts. Please refresh.', 'error');
});

// Delete Post
function deletePost(id) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    fetch(`/api/posts/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Token ' + token }
    })
    .then(res => {
        if (!res.ok) throw new Error();
        allPosts = allPosts.filter(p => p.id !== id);
        updateStats(allPosts);
        filterPosts(currentFilter);
        showToast('Post deleted.', 'success');
    })
    .catch(() => showToast('Failed to delete post.', 'error'));
}

// New Post Modal
function openNewPostModal()  { document.getElementById('new-post-modal').classList.remove('hidden'); }
function closeNewPostModal() { document.getElementById('new-post-modal').classList.add('hidden'); }

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
            })
        })
        .then(res => {
            if (!res.ok) return res.json().then(d => Promise.reject(d));
            return res.json();
        })
        .then(newPost => {
            allPosts.unshift(newPost);
            updateStats(allPosts);
            filterPosts(currentFilter);
            closeNewPostModal();
            newPostForm.reset();
            showToast('Post created successfully!', 'success');
        })
        .catch(err => {
            const msg = typeof err === 'object' ? Object.values(err)[0] : 'Failed to create post.';
            showToast(Array.isArray(msg) ? msg[0] : msg, 'error');
        });
    });
}

// Close modal on backdrop click
document.getElementById('new-post-modal') && document.getElementById('new-post-modal').addEventListener('click', function(e) {
    if (e.target === this) closeNewPostModal();
});