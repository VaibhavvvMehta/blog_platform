// ============================================================
// Toast Notification System
// ============================================================
function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const icons = {
        success: `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`,
        error:   `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`,
        info:    `<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    };
    toast.className = `toast toast-${type} flex items-center gap-2`;
    toast.innerHTML = (icons[type] || icons.info) + `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 280);
    }, duration);
}

// ============================================================
// Login Form Handler
// ============================================================
const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email    = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const errorBox  = document.getElementById('login-error');
        const errorText = document.getElementById('login-error-text');
        const btn       = document.getElementById('login-btn');
        const btnText   = document.getElementById('login-btn-text');
        const spinner   = document.getElementById('login-spinner');

        errorBox && errorBox.classList.add('hidden');

        if (!email || !password) {
            if (errorBox && errorText) {
                errorText.textContent = 'Please fill in all fields.';
                errorBox.classList.remove('hidden');
            }
            return;
        }

        // Loading state
        if (btn) btn.disabled = true;
        if (btnText) btnText.textContent = 'Signing in...';
        if (spinner) spinner.classList.remove('hidden');

        fetch('/api/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password: password })
        })
        .then(response => {
            if (!response.ok) throw new Error('Invalid credentials');
            return response.json();
        })
        .then(data => {
            localStorage.setItem('token', data.token);
            showToast('Welcome back! Redirecting...', 'success');
            setTimeout(() => window.location.href = '/dashboard/', 800);
        })
        .catch(() => {
            if (errorBox && errorText) {
                errorText.textContent = 'Invalid email or password. Please try again.';
                errorBox.classList.remove('hidden');
            }
            if (btn) btn.disabled = false;
            if (btnText) btnText.textContent = 'Sign In';
            if (spinner) spinner.classList.add('hidden');
        });
    });
}

// ============================================================
// Logout
// ============================================================
function logout() {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login/'; return; }

    fetch('/api/users/logout/', {
        method: 'POST',
        headers: { 'Authorization': 'Token ' + token }
    })
    .finally(() => {
        localStorage.removeItem('token');
        showToast('Logged out successfully.', 'info');
        setTimeout(() => window.location.href = '/login/', 600);
    });
}