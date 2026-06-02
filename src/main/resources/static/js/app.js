const API_BASE = 'http://localhost:8080/api';
let currentUser = null;
let selectedRole = 'ADMIN';
let studentsForAttendance = [];

// ─── INIT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loginForm')) initAuth();
    else if (document.getElementById('sidebarMenu')) initDashboard();
});

// ─── AUTH ────────────────────────────────────────────────────────────────────
function initAuth() {
    document.querySelectorAll('.role-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            selectedRole = tab.dataset.role;
            document.getElementById('registerLink').classList.toggle('hidden', selectedRole === 'ADMIN');
        });
    });
    document.getElementById('registerLink').classList.add('hidden');

    document.getElementById('toggleRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginPanel').classList.add('hidden');
        document.getElementById('registerPanel').classList.remove('hidden');
        document.getElementById('registerSubtitle').textContent = `Join as ${capitalize(selectedRole)}`;
    });

    document.getElementById('toggleLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('registerPanel').classList.add('hidden');
        document.getElementById('loginPanel').classList.remove('hidden');
    });

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errDiv = document.getElementById('errorMessage');
        errDiv.classList.add('hidden');
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                const user = await res.json();
                if (user.role !== selectedRole) {
                    errDiv.textContent = `This account is not a ${capitalize(selectedRole)} account.`;
                    errDiv.classList.remove('hidden');
                    return;
                }
                localStorage.setItem('user', JSON.stringify(user));
                window.location.href = 'dashboard.html';
            } else {
                errDiv.textContent = 'Invalid credentials. Please try again.';
                errDiv.classList.remove('hidden');
            }
        } catch (err) { console.error(err); }
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            username: document.getElementById('reg-username').value,
            email: document.getElementById('reg-email').value,
            passwordHash: document.getElementById('reg-password').value,
            linkedinProfileUrl: document.getElementById('reg-linkedin').value || null,
            role: selectedRole
        };
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert('Registration successful! Please sign in.');
                document.getElementById('toggleLogin').click();
            } else {
                const text = await res.text();
                const errDiv = document.getElementById('regErrorMessage');
                errDiv.textContent = text;
                errDiv.classList.remove('hidden');
            }
        } catch (err) { console.error(err); }
    });
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function initDashboard() {
    const userStr = localStorage.getItem('user');
    if (!userStr) { window.location.href = 'index.html'; return; }
    currentUser = JSON.parse(userStr);

    document.getElementById('welcomeUser').textContent = `Hi, ${currentUser.username}`;
    const roleTag = document.getElementById('roleTag');
    roleTag.textContent = capitalize(currentUser.role);
    roleTag.className = `role-tag role-${currentUser.role.toLowerCase()}`;

    buildSidebar();
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });

    // Admin: Add User form
    document.getElementById('addUserForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            username: document.getElementById('newUsername').value,
            email: document.getElementById('newEmail').value,
            passwordHash: document.getElementById('newPassword').value,
            branch: document.getElementById('newBranch').value,
            section: document.getElementById('newSection').value,
            role: document.getElementById('newUserRole').value
        };
        const res = await fetch(`${API_BASE}/users`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeModal('addUserModal');
            e.target.reset();
            loadUsers();
            showToast('User added successfully!');
        } else {
            const text = await res.text();
            document.getElementById('addUserError').textContent = text;
            document.getElementById('addUserError').classList.remove('hidden');
        }
    });

    // Edit User form
    document.getElementById('editUserForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editUserId').value;
        const payload = {
            username: document.getElementById('editUsername').value,
            email: document.getElementById('editEmail').value,
            branch: document.getElementById('editBranch').value,
            section: document.getElementById('editSection').value
        };
        const res = await fetch(`${API_BASE}/users/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) { closeModal('editUserModal'); loadUsers(); showToast('User updated!'); }
    });

    // Create Event form
    document.getElementById('createEventForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const poster = document.getElementById('eventPoster').files[0];
        let res;
        if (poster) {
            const fd = new FormData();
            fd.append('title', document.getElementById('eventTitle').value);
            fd.append('type', document.getElementById('eventType').value);
            fd.append('eventDate', document.getElementById('eventDate').value);
            fd.append('linkedinLink', document.getElementById('eventLink').value);
            fd.append('description', document.getElementById('eventDescription').value);
            fd.append('poster', poster);
            res = await fetch(`${API_BASE}/events/with-poster`, { method: 'POST', body: fd });
        } else {
            res = await fetch(`${API_BASE}/events`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: document.getElementById('eventTitle').value,
                    type: document.getElementById('eventType').value,
                    eventDate: document.getElementById('eventDate').value,
                    linkedinLink: document.getElementById('eventLink').value,
                    description: document.getElementById('eventDescription').value
                })
            });
        }
        if (res.ok) {
            closeModal('eventModal');
            e.target.reset();
            loadAdminEvents();
            showToast('Event created successfully!');
        }
    });

    navigateTo('overview');
}

function buildSidebar() {
    const menu = document.getElementById('sidebarMenu');
    const items = {
        ADMIN: [
            { label: '📊 Overview', target: 'overview' },
            { label: '👥 Manage Users', target: 'manageUsers' },
            { label: '📅 Manage Events', target: 'manageEvents' }
        ],
        TEACHER: [
            { label: '📊 Overview', target: 'overview' },
            { label: '📅 Events', target: 'manageEvents' },
            { label: '✅ Mark Attendance', target: 'markAttendance' },
            { label: '📝 Update Marks', target: 'updateMarks' }
        ],
        STUDENT: [
            { label: '📊 Overview', target: 'overview' },
            { label: '📅 Events', target: 'studentEvents' },
            { label: '✅ My Attendance', target: 'myAttendance' },
            { label: '📝 My Marks', target: 'myMarks' }
        ]
    };
    (items[currentUser.role] || []).forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.label;
        li.dataset.target = item.target;
        li.addEventListener('click', () => navigateTo(item.target));
        menu.appendChild(li);
    });
}

function navigateTo(target) {
    document.querySelectorAll('.sidebar-menu li').forEach(li => {
        li.classList.toggle('active', li.dataset.target === target);
    });
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    const section = document.getElementById(target);
    if (section) section.classList.remove('hidden');

    if (target === 'overview') loadOverview();
    if (target === 'manageUsers') loadUsers();
    if (target === 'manageEvents') loadAdminEvents();
    if (target === 'markAttendance') loadEventsForAttendance();
    if (target === 'updateMarks') loadStudentsForMarks();
    if (target === 'studentEvents') loadStudentEvents();
    if (target === 'myAttendance') loadMyAttendance();
    if (target === 'myMarks') loadMyMarks();
}

// ─── OVERVIEW ────────────────────────────────────────────────────────────────
async function loadOverview() {
    const container = document.getElementById('overviewStats');
    container.innerHTML = '';
    const events = await apiFetch(`${API_BASE}/events`);

    const stats = [
        { label: 'Total Events', value: events.length },
        { label: 'Hackathons', value: events.filter(e => e.type === 'HACKATHON').length }
    ];

    if (currentUser.role === 'ADMIN') {
        const users = await apiFetch(`${API_BASE}/users`);
        stats.push({ label: 'Total Students', value: users.filter(u => u.role === 'STUDENT').length });
        stats.push({ label: 'Total Teachers', value: users.filter(u => u.role === 'TEACHER').length });
    } else if (currentUser.role === 'STUDENT') {
        const records = await apiFetch(`${API_BASE}/attendance/student/${currentUser.id}`);
        const rate = events.length > 0 ? Math.min(100, Math.round((records.length / events.length) * 100)) : 0;
        stats.push({ label: 'Attendance Rate', value: `${rate}%` });
        stats.push({ label: 'My Marks', value: currentUser.marks ?? '--' });
    }

    stats.forEach(s => {
        container.innerHTML += `<div class="stat-card"><h3>${s.label}</h3><p class="stat-value">${s.value}</p></div>`;
    });
}

// ─── ADMIN: USERS ────────────────────────────────────────────────────────────
async function loadUsers() {
    const role = document.getElementById('userRoleFilter')?.value || 'STUDENT';
    const users = await apiFetch(`${API_BASE}/users/role/${role}`);
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    if (!users.length) { tbody.innerHTML = '<tr><td colspan="6">No users found.</td></tr>'; return; }
    users.forEach(u => {
        tbody.innerHTML += `
        <tr>
            <td>${u.username}</td>
            <td>${u.email}</td>
            <td>${u.branch || '--'}</td>
            <td>${u.section || '--'}</td>
            <td>${u.marks ?? '--'}</td>
            <td>
                <button class="btn-small btn-primary" onclick="openEditUser(${u.id},'${u.username}','${u.email}','${u.branch||''}','${u.section||''}')">Edit</button>
                <button class="btn-small btn-danger" onclick="deleteUser(${u.id})">Delete</button>
            </td>
        </tr>`;
    });
}

function openEditUser(id, username, email, branch, section) {
    document.getElementById('editUserId').value = id;
    document.getElementById('editUsername').value = username;
    document.getElementById('editEmail').value = email;
    document.getElementById('editBranch').value = branch;
    document.getElementById('editSection').value = section;
    openModal('editUserModal');
}

async function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
    if (res.ok) { loadUsers(); showToast('User deleted.'); }
}

// ─── ADMIN + TEACHER: EVENTS ─────────────────────────────────────────────────
async function loadAdminEvents() {
    const events = await apiFetch(`${API_BASE}/events`);
    const list = document.getElementById('adminEventsList');
    list.innerHTML = '';
    if (!events.length) { list.innerHTML = '<p style="color:var(--text-secondary)">No events yet.</p>'; return; }
    events.forEach(evt => {
        const badgeClass = evt.type === 'HACKATHON' ? 'badge-hackathon' : evt.type === 'CHALLENGE' ? 'badge-challenge' : 'badge-regular';
        list.innerHTML += `
        <div class="event-card">
            ${evt.posterUrl ? `<img src="${evt.posterUrl}" alt="poster" class="event-poster">` : ''}
            <span class="event-badge ${badgeClass}">${evt.type}</span>
            <h3>${evt.title}</h3>
            <p class="event-date">${new Date(evt.eventDate).toLocaleString()}</p>
            <p style="font-size:0.9rem;color:var(--text-secondary)">${evt.description || ''}</p>
            <div class="event-actions">
                ${evt.linkedinLink ? `<a href="${evt.linkedinLink}" target="_blank" class="btn-linkedin">LinkedIn</a>` : ''}
                ${currentUser.role === 'ADMIN' ? `<button class="btn-small btn-danger" onclick="deleteEvent(${evt.id})">Delete</button>` : ''}
            </div>
        </div>`;
    });
}

async function deleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
    if (res.ok) { loadAdminEvents(); showToast('Event deleted.'); }
}

// ─── TEACHER: MARK ATTENDANCE ────────────────────────────────────────────────
async function loadEventsForAttendance() {
    const events = await apiFetch(`${API_BASE}/events`);
    const sel = document.getElementById('attendanceEventSelect');
    sel.innerHTML = '<option value="">-- Select Event --</option>';
    events.forEach(e => sel.innerHTML += `<option value="${e.id}">${e.title}</option>`);
}

async function loadStudentsForAttendance() {
    const eventId = document.getElementById('attendanceEventSelect').value;
    if (!eventId) { alert('Please select an event.'); return; }
    studentsForAttendance = await apiFetch(`${API_BASE}/users/role/STUDENT`);
    const container = document.getElementById('attendanceMarkTable');
    if (!studentsForAttendance.length) { container.innerHTML = '<p>No students found.</p>'; return; }
    let html = `<table class="glass-table"><thead><tr><th>Name</th><th>Email</th><th>Branch</th><th>Section</th><th>Status</th></tr></thead><tbody>`;
    studentsForAttendance.forEach(s => {
        html += `<tr>
            <td>${s.username}</td><td>${s.email}</td><td>${s.branch||'--'}</td><td>${s.section||'--'}</td>
            <td>
                <select id="att_${s.id}">
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                </select>
            </td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
    document.getElementById('submitAttendanceBtn').style.display = 'block';
}

async function submitBulkAttendance() {
    const eventId = document.getElementById('attendanceEventSelect').value;
    const promises = studentsForAttendance.map(s => {
        const status = document.getElementById(`att_${s.id}`)?.value || 'ABSENT';
        return fetch(`${API_BASE}/attendance/mark`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: s.id, eventId: parseInt(eventId), status })
        });
    });
    await Promise.all(promises);
    showToast('Attendance submitted successfully!');
    document.getElementById('submitAttendanceBtn').style.display = 'none';
    document.getElementById('attendanceMarkTable').innerHTML = '';
}

// ─── TEACHER: UPDATE MARKS ───────────────────────────────────────────────────
async function loadStudentsForMarks() {
    const students = await apiFetch(`${API_BASE}/users/role/STUDENT`);
    const tbody = document.getElementById('marksTableBody');
    tbody.innerHTML = '';
    students.forEach(s => {
        tbody.innerHTML += `
        <tr>
            <td>${s.username}</td><td>${s.email}</td><td>${s.branch||'--'}</td><td>${s.section||'--'}</td>
            <td>${s.marks ?? '--'}</td>
            <td>
                <input type="number" id="marks_${s.id}" value="${s.marks||''}" placeholder="Enter marks" style="width:100px;padding:0.3rem;background:rgba(0,0,0,0.2);border:1px solid var(--glass-border);border-radius:6px;color:var(--text-primary)">
                <button class="btn-small btn-primary" onclick="saveMarks(${s.id})">Save</button>
            </td>
        </tr>`;
    });
}

async function saveMarks(userId) {
    const marks = parseFloat(document.getElementById(`marks_${userId}`).value);
    if (isNaN(marks)) { alert('Enter valid marks'); return; }
    const res = await fetch(`${API_BASE}/users/${userId}/marks`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marks })
    });
    if (res.ok) showToast('Marks updated!');
}

// ─── STUDENT: EVENTS ─────────────────────────────────────────────────────────
async function loadStudentEvents() {
    const events = await apiFetch(`${API_BASE}/events`);
    const list = document.getElementById('studentEventsList');
    list.innerHTML = '';
    if (!events.length) { list.innerHTML = '<p style="color:var(--text-secondary)">No events available.</p>'; return; }
    events.forEach(evt => {
        const badgeClass = evt.type === 'HACKATHON' ? 'badge-hackathon' : evt.type === 'CHALLENGE' ? 'badge-challenge' : 'badge-regular';
        list.innerHTML += `
        <div class="event-card">
            ${evt.posterUrl ? `<img src="${evt.posterUrl}" alt="poster" class="event-poster">` : ''}
            <span class="event-badge ${badgeClass}">${evt.type}</span>
            <h3>${evt.title}</h3>
            <p class="event-date">${new Date(evt.eventDate).toLocaleString()}</p>
            <p style="font-size:0.9rem;color:var(--text-secondary)">${evt.description || ''}</p>
            <div class="event-actions">
                <button class="btn-primary btn-small mark-btn" data-id="${evt.id}" onclick="markAttendance(${evt.id}, this)">Mark Present</button>
                ${evt.linkedinLink ? `<a href="${evt.linkedinLink}" target="_blank" class="btn-linkedin">LinkedIn</a>` : ''}
            </div>
        </div>`;
    });
}

async function markAttendance(eventId, btn) {
    const res = await fetch(`${API_BASE}/attendance/mark`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, eventId, status: 'PRESENT' })
    });
    if (res.ok) {
        btn.textContent = 'Marked ✓';
        btn.disabled = true;
        btn.style.opacity = 0.5;
        showToast('Attendance marked!');
    }
}

// ─── STUDENT: MY ATTENDANCE ──────────────────────────────────────────────────
async function loadMyAttendance() {
    const records = await apiFetch(`${API_BASE}/attendance/student/${currentUser.id}`);
    const tbody = document.getElementById('attendanceRecords');
    tbody.innerHTML = '';
    if (!records.length) { tbody.innerHTML = '<tr><td colspan="3">No records found.</td></tr>'; return; }
    records.forEach(rec => {
        tbody.innerHTML += `
        <tr>
            <td>${rec.event?.title || 'Unknown'}</td>
            <td>${new Date(rec.timestamp).toLocaleString()}</td>
            <td><span style="color:var(--success);font-weight:600">${rec.status}</span></td>
        </tr>`;
    });
}

// ─── STUDENT: MY MARKS ───────────────────────────────────────────────────────
async function loadMyMarks() {
    const res = await fetch(`${API_BASE}/users/${currentUser.id}`);
    if (res.ok) {
        const user = await res.json();
        document.getElementById('myMarksValue').textContent = user.marks ?? 'Not assigned yet';
    }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
async function apiFetch(url) {
    try { const res = await fetch(url); return res.ok ? await res.json() : []; }
    catch { return []; }
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function capitalize(str) { return str.charAt(0) + str.slice(1).toLowerCase(); }

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}
