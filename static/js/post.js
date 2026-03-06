// ============================================================
// Post Detail Page — JS
// ============================================================
const token       = localStorage.getItem('token');
let currentPost   = null;
let currentUser   = null;   // logged-in user's email (=username field)
let allComments   = [];

// ── Helpers ──────────────────────────────────────────────────
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;')
              .replace(/</g,'&lt;')
              .replace(/>/g,'&gt;')
              .replace(/"/g,'&quot;')
              .replace(/\n/g,'<br>');
}

function parseTags(str) {
    return str.split(',').map(t => t.trim()).filter(Boolean);
}

// ── Fetch current user (needed to show owner controls) ───────
function loadCurrentUser() {
    if (!token) return Promise.resolve(null);
    return fetch('/api/users/profile/', {
        headers: { 'Authorization': 'Token ' + token }
    })
    .then(r => r.ok ? r.json() : null)
    .then(data => { currentUser = data; return data; })
    .catch(() => null);
}

// ── Render Post ───────────────────────────────────────────────
function renderPost(post) {
    currentPost = post;

    document.getElementById('post-loading').classList.add('hidden');
    document.getElementById('post-content').classList.remove('hidden');

    // Title
    document.getElementById('post-title').textContent = post.title;

    // Body — render newlines as paragraphs
    const bodyEl = document.getElementById('post-body');
    const paras = (post.body || '').split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    if (paras.length) {
        bodyEl.innerHTML = paras.map(p => `<p>${escapeHtml(p).replace(/<br>/g, '\n')}</p>`).join('');
    } else {
        bodyEl.innerHTML = `<p class="text-slate-400 italic">No content.</p>`;
    }

    // Author
    document.getElementById('post-author').innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
        ${escapeHtml(post.author) || 'Anonymous'}`;

    // Date
    document.getElementById('post-date').innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        ${post.created_at ? formatDate(post.created_at) : ''}`;

    // Status badge
    const badge = document.getElementById('post-status-badge');
    if (post.status === 'published') {
        badge.textContent = '● Published';
        badge.className = 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700';
    } else {
        badge.textContent = '○ Draft';
        badge.className = 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500';
    }

    // Tags
    const tagsEl = document.getElementById('post-tags');
    if (post.tags && post.tags.length) {
        tagsEl.innerHTML = post.tags.map(t =>
            `<span class="bg-indigo-50 text-indigo-600 text-xs font-medium px-3 py-1 rounded-full">${t.name || t}</span>`
        ).join('');
    }

    // Owner controls: show if token exists and author matches logged-in user
    if (currentUser && post.author === currentUser.email) {
        const actions = document.getElementById('post-owner-actions');
        actions.classList.remove('hidden');
        actions.classList.add('flex');
    }

    // Document title
    document.title = `${post.title} — BlogSpace`;
}

// ── Render Comments ───────────────────────────────────────────
function renderComments(comments) {
    allComments = comments;
    const container = document.getElementById('comments-container');
    const empty     = document.getElementById('comments-empty');
    const countEl   = document.getElementById('comment-count');

    const total = comments.reduce((acc, c) => acc + 1 + (c.replies ? c.replies.length : 0), 0);
    countEl.textContent = total ? `(${total})` : '';

    if (!comments || comments.length === 0) {
        container.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');
    container.innerHTML = comments.map(c => buildCommentHTML(c, false)).join('');
}

function buildCommentHTML(comment, isReply) {
    const isOwn = currentUser && comment.author === currentUser.email;
    const ownerActions = isOwn ? `
        <button onclick="openCommentEditModal(${comment.id}, \`${escapeForAttr(comment.body)}\`)"
            class="text-xs text-slate-400 hover:text-indigo-600 transition-colors">Edit</button>
        <button onclick="deleteComment(${comment.id})"
            class="text-xs text-slate-400 hover:text-red-500 transition-colors">Delete</button>` : '';

    const replyBtn = token ? `
        <button onclick="toggleReplyForm(${comment.id})"
            class="text-xs text-indigo-500 hover:text-indigo-700 transition-colors">Reply</button>` : '';

    // Build inline reply form (hidden by default)
    const replyForm = token ? `
        <div id="reply-form-${comment.id}" class="hidden mt-3">
            <form onsubmit="submitReply(event, ${comment.id})" class="flex gap-2">
                <input type="text" id="reply-input-${comment.id}" placeholder="Write a reply..."
                    class="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-indigo-400 transition-colors" />
                <button type="submit" class="btn-primary px-3 py-2 rounded-lg text-white text-xs font-semibold whitespace-nowrap">Send</button>
            </form>
        </div>` : '';

    const replies = (comment.replies && comment.replies.length)
        ? `<div class="reply-indent">${comment.replies.map(r => buildCommentHTML(r, true)).join('')}</div>`
        : '';

    return `
        <div id="comment-${comment.id}" class="${isReply ? 'mt-3' : 'bg-white border border-slate-100 rounded-2xl p-5'} ${isReply ? '' : 'shadow-sm'}">
            <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        ${(comment.author || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <span class="text-sm font-semibold text-slate-800">${escapeHtml(comment.author) || 'Anonymous'}</span>
                        <span class="text-xs text-slate-400 ml-2">${comment.created_at ? formatDate(comment.created_at) : ''}</span>
                    </div>
                </div>
                <div class="flex items-center gap-3 text-xs text-slate-400">
                    ${ownerActions}
                    ${replyBtn}
                </div>
            </div>
            <p class="text-sm text-slate-600 mt-2 leading-relaxed">${escapeHtml(comment.body)}</p>
            ${replyForm}
            ${replies}
        </div>`;
}

function escapeForAttr(str) {
    return (str || '').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

// ── Toggle reply form ─────────────────────────────────────────
function toggleReplyForm(commentId) {
    const form = document.getElementById(`reply-form-${commentId}`);
    if (!form) return;
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
        form.querySelector('input') && form.querySelector('input').focus();
    }
}

// ── Submit reply ──────────────────────────────────────────────
function submitReply(event, parentId) {
    event.preventDefault();
    const input = document.getElementById(`reply-input-${parentId}`);
    const body  = input ? input.value.trim() : '';
    if (!body) return;

    fetch('/api/comments/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Token ' + token
        },
        body: JSON.stringify({ post: POST_ID, body, parent: parentId })
    })
    .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d)))
    .then(() => {
        loadComments();
        showToast('Reply posted!', 'success');
    })
    .catch(() => showToast('Failed to post reply.', 'error'));
}

// ── Comment form submit ───────────────────────────────────────
const commentForm = document.getElementById('comment-form');
if (commentForm) {
    commentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const body = document.getElementById('comment-body').value.trim();
        if (!body) return;

        fetch('/api/comments/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + token
            },
            body: JSON.stringify({ post: POST_ID, body })
        })
        .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d)))
        .then(() => {
            document.getElementById('comment-body').value = '';
            loadComments();
            showToast('Comment posted!', 'success');
        })
        .catch(() => showToast('Failed to post comment.', 'error'));
    });
}

// ── Delete comment ────────────────────────────────────────────
function deleteComment(id) {
    if (!confirm('Delete this comment?')) return;
    fetch(`/api/comments/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Token ' + token }
    })
    .then(r => {
        if (!r.ok) throw new Error();
        loadComments();
        showToast('Comment deleted.', 'success');
    })
    .catch(() => showToast('Failed to delete comment.', 'error'));
}

// ── Edit comment modal ────────────────────────────────────────
function openCommentEditModal(id, body) {
    document.getElementById('edit-comment-id').value   = id;
    document.getElementById('edit-comment-body').value = body;
    document.getElementById('comment-edit-modal').classList.remove('hidden');
}

function closeCommentEditModal() {
    document.getElementById('comment-edit-modal').classList.add('hidden');
}

const commentEditForm = document.getElementById('comment-edit-form');
if (commentEditForm) {
    commentEditForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const id   = document.getElementById('edit-comment-id').value;
        const body = document.getElementById('edit-comment-body').value.trim();
        if (!body) return;

        fetch(`/api/comments/${id}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + token
            },
            body: JSON.stringify({ body })
        })
        .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d)))
        .then(() => {
            closeCommentEditModal();
            loadComments();
            showToast('Comment updated.', 'success');
        })
        .catch(() => showToast('Failed to update comment.', 'error'));
    });
}

// backdrop close
document.getElementById('comment-edit-modal') && document.getElementById('comment-edit-modal').addEventListener('click', function(e) {
    if (e.target === this) closeCommentEditModal();
});

// ── Post Edit modal ───────────────────────────────────────────
function openPostEditModal() {
    if (!currentPost) return;
    document.getElementById('edit-title').value  = currentPost.title;
    document.getElementById('edit-body').value   = currentPost.body || '';
    document.getElementById('edit-status').value = currentPost.status;
    document.getElementById('edit-tags').value   = (currentPost.tags || []).join(', ');
    document.getElementById('post-edit-modal').classList.remove('hidden');
}

function closePostEditModal() {
    document.getElementById('post-edit-modal').classList.add('hidden');
}

const postEditForm = document.getElementById('post-edit-form');
if (postEditForm) {
    postEditForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const tagsRaw = document.getElementById('edit-tags').value;
        fetch(`/api/posts/${POST_ID}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + token
            },
            body: JSON.stringify({
                title:  document.getElementById('edit-title').value.trim(),
                body:   document.getElementById('edit-body').value.trim(),
                status: document.getElementById('edit-status').value,
                tags:   parseTags(tagsRaw),
            })
        })
        .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d)))
        .then(updated => {
            closePostEditModal();
            renderPost(updated);
            showToast('Post updated!', 'success');
        })
        .catch(() => showToast('Failed to update post.', 'error'));
    });
}

document.getElementById('post-edit-modal') && document.getElementById('post-edit-modal').addEventListener('click', function(e) {
    if (e.target === this) closePostEditModal();
});

// ── Delete current post ───────────────────────────────────────
function deleteCurrentPost() {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    fetch(`/api/posts/${POST_ID}/`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Token ' + token }
    })
    .then(r => {
        if (!r.ok) throw new Error();
        showToast('Post deleted.', 'success');
        setTimeout(() => window.location.href = '/dashboard/', 800);
    })
    .catch(() => showToast('Failed to delete post.', 'error'));
}

// ── Load comments ─────────────────────────────────────────────
function loadComments() {
    fetch(`/api/comments/?post=${POST_ID}`, {
        headers: token ? { 'Authorization': 'Token ' + token } : {}
    })
    .then(r => r.ok ? r.json() : [])
    .then(data => renderComments(Array.isArray(data) ? data : (data.results || [])))
    .catch(() => {});
}

// ── Init ──────────────────────────────────────────────────────
(function init() {
    // Show comment form or login nudge
    if (token) {
        document.getElementById('comment-form-wrap') && document.getElementById('comment-form-wrap').classList.remove('hidden');
    } else {
        document.getElementById('comment-login-nudge') && document.getElementById('comment-login-nudge').classList.remove('hidden');
    }

    // Load current user first, then post + comments in parallel
    loadCurrentUser().then(() => {
        Promise.all([
            fetch(`/api/posts/${POST_ID}/`, {
                headers: token ? { 'Authorization': 'Token ' + token } : {}
            }).then(r => {
                if (!r.ok) throw new Error('Post not found');
                return r.json();
            }),
            fetch(`/api/comments/?post=${POST_ID}`, {
                headers: token ? { 'Authorization': 'Token ' + token } : {}
            }).then(r => r.ok ? r.json() : []).then(d => Array.isArray(d) ? d : (d.results || []))
        ])
        .then(([post, comments]) => {
            renderPost(post);
            renderComments(comments);
        })
        .catch(err => {
            document.getElementById('post-loading').innerHTML = `
                <div class="text-center py-20">
                    <p class="text-slate-500 text-lg font-semibold">Post not found.</p>
                    <a href="/dashboard/" class="mt-4 inline-block text-indigo-600 hover:underline text-sm">← Back to Dashboard</a>
                </div>`;
        });
    });
})();
