// ============================================================
// Profile Page — JS
// ============================================================
const token = localStorage.getItem('token');

function populateProfile(data) {
    // Avatar initials
    const avatarEl = document.getElementById('avatar-display');
    if (data.avatar) {
        avatarEl.innerHTML = `<img src="${data.avatar}" alt="avatar" class="w-full h-full object-cover" />`;
    } else {
        const initial = (data.username || data.email || 'U').charAt(0).toUpperCase();
        avatarEl.textContent = initial;
    }

    document.getElementById('display-username').textContent = data.username || '';
    document.getElementById('display-email').textContent    = data.email || '';
    document.getElementById('display-bio').textContent      = data.bio || 'No bio added yet.';

    document.getElementById('field-username').value = data.username || '';
    document.getElementById('field-email').value    = data.email    || '';
    document.getElementById('field-bio').value      = data.bio      || '';

    document.title = `${data.username || data.email} — BlogSpace`;
}

// ── Load profile ──────────────────────────────────────────────
fetch('/api/users/profile/', {
    headers: { 'Authorization': 'Token ' + token }
})
.then(r => {
    if (!r.ok) throw new Error('Unauthorized');
    return r.json();
})
.then(data => {
    document.getElementById('profile-loading').classList.add('hidden');
    document.getElementById('profile-card').classList.remove('hidden');
    populateProfile(data);
})
.catch(() => {
    localStorage.removeItem('token');
    window.location.href = '/login/';
});

// ── Save profile ──────────────────────────────────────────────
const profileForm = document.getElementById('profile-form');
if (profileForm) {
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const btn     = document.getElementById('save-btn');
        const btnText = document.getElementById('save-btn-text');
        const spinner = document.getElementById('save-spinner');
        const errBox  = document.getElementById('profile-error');

        btn.disabled = true;
        btnText.textContent = 'Saving...';
        spinner.classList.remove('hidden');
        errBox.classList.add('hidden');

        const payload = {
            username: document.getElementById('field-username').value.trim(),
            email:    document.getElementById('field-email').value.trim(),
            bio:      document.getElementById('field-bio').value.trim(),
        };

        const newPassword = document.getElementById('field-password').value;
        if (newPassword) payload.password = newPassword;

        fetch('/api/users/profile/', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Token ' + token
            },
            body: JSON.stringify(payload)
        })
        .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d)))
        .then(updated => {
            populateProfile(updated);
            document.getElementById('field-password').value = '';
            showToast('Profile updated successfully!', 'success');
        })
        .catch(err => {
            const firstErr = err && typeof err === 'object' ? Object.values(err)[0] : null;
            const msg = firstErr ? (Array.isArray(firstErr) ? firstErr[0] : firstErr) : 'Failed to update profile.';
            errBox.textContent = msg;
            errBox.classList.remove('hidden');
        })
        .finally(() => {
            btn.disabled = false;
            btnText.textContent = 'Save Changes';
            spinner.classList.add('hidden');
        });
    });
}
