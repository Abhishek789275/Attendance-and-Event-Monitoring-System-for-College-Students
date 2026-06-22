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

    // Theme setup
    if (currentUser.themePreference === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) themeBtn.textContent = '☀️';
    }
    
    document.getElementById('themeToggleBtn')?.addEventListener('click', async () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        document.getElementById('themeToggleBtn').textContent = newTheme === 'light' ? '☀️' : '🌙';
        
        currentUser.themePreference = newTheme;
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        try {
            await fetch(`${API_BASE}/users/${currentUser.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ themePreference: newTheme })
            });
        } catch (err) { console.error('Failed to save theme to DB', err); }
    });
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });

    // Initialize Flatpickr for Event Date
    if (typeof flatpickr !== 'undefined') {
        flatpickr("#eventDate", {
            enableTime: true,
            dateFormat: "Y-m-d\\TH:i",
            minDate: "today",
            time_24hr: true
        });
    }

    // Admin: Add Student form
    document.getElementById('addStudentForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            username: document.getElementById('sNewUsername').value,
            email: document.getElementById('sNewEmail').value,
            passwordHash: document.getElementById('sNewPassword').value,
            usn: document.getElementById('sNewUsn').value,
            branch: document.getElementById('sNewBranch').value,
            section: document.getElementById('sNewSection').value,
            year: document.getElementById('sNewYear').value,
            role: 'STUDENT'
        };
        const res = await fetch(`${API_BASE}/users`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            e.target.reset();
            showToast('Student added successfully!');
        } else {
            const text = await res.text();
            document.getElementById('addStudentError').textContent = text;
            document.getElementById('addStudentError').classList.remove('hidden');
        }
    });

    // Admin: Add Faculty form
    document.getElementById('addFacultyForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            username: document.getElementById('fNewUsername').value,
            email: document.getElementById('fNewEmail').value,
            passwordHash: document.getElementById('fNewPassword').value,
            usn: document.getElementById('fNewUsn').value,
            branch: document.getElementById('fNewBranch').value,
            subject: document.getElementById('fNewSubject').value,
            isHod: document.getElementById('fNewIsHod').checked,
            role: 'TEACHER'
        };
        const res = await fetch(`${API_BASE}/users`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            e.target.reset();
            showToast('Faculty added successfully!');
        } else {
            const text = await res.text();
            document.getElementById('addFacultyError').textContent = text;
            document.getElementById('addFacultyError').classList.remove('hidden');
        }
    });

    // Edit User form
    document.getElementById('editUserForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editUserId').value;
        const payload = {
            username: document.getElementById('editUsername').value,
            email: document.getElementById('editEmail').value,
            usn: document.getElementById('editUsn').value,
            branch: document.getElementById('editBranch').value,
            section: document.getElementById('editSection').value,
            year: document.getElementById('editYear').value,
            subject: document.getElementById('editSubject').value,
            isHod: document.getElementById('editIsHod').checked
        };
        const res = await fetch(`${API_BASE}/users/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) { closeModal('editUserModal'); renderStudentsByYear(); renderFacultyByBranch(); showToast('User updated!'); }
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

    // Update Profile form
    document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            email: document.getElementById('profileEmail').value,
            phoneNumber: document.getElementById('profilePhone').value,
            linkedinProfileUrl: document.getElementById('profileLinkedin').value
        };
        const res = await fetch(`${API_BASE}/users/${currentUser.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const updatedUser = await res.json();
            localStorage.setItem('user', JSON.stringify(updatedUser));
            currentUser = updatedUser;
            showToast('Profile updated successfully!');
        }
    });

    // Student Registration Confirmation form
    document.getElementById('studentRegistrationForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const eventId = document.getElementById('regEventId').value;
        const status = document.getElementById('regEventStatus').value;
        
        // Update user profile with entered details
        const updatePayload = {
            username: document.getElementById('regConfirmName').value,
            usn: document.getElementById('regConfirmUsn').value,
            email: document.getElementById('regConfirmEmail').value,
            phoneNumber: document.getElementById('regConfirmPhone').value
        };
        const updateRes = await fetch(`${API_BASE}/users/${currentUser.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
        });
        if (updateRes.ok) {
            currentUser = await updateRes.json();
            localStorage.setItem('user', JSON.stringify(currentUser));
        }
        
        // Mark attendance
        const res = await fetch(`${API_BASE}/attendance/mark`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, eventId: parseInt(eventId), status })
        });
        if (res.ok) {
            closeModal('studentRegistrationModal');
            showToast('Registration successful!');
            loadStudentEvents();
        } else {
            showToast('Failed to register or already registered.');
        }
    });

    const defaultTarget = currentUser.role === 'TEACHER' ? 'facultyDashboard' : 'overview';
    navigateTo(defaultTarget);
}

function buildSidebar() {
    const menu = document.getElementById('sidebarMenu');
    const items = {
        ADMIN: [
            { label: '📊 Overview', target: 'overview' },
            { label: '➕ Add Student', target: 'addStudent' },
            { label: '➕ Add Faculty', target: 'addFaculty' },
            { label: '🎓 Manage Students', target: 'manageStudents' },
            { label: '👨‍🏫 Manage Faculty', target: 'manageFaculty' }
        ],
        TEACHER: [
            { label: '👨‍🏫 Faculty Dashboard', target: 'facultyDashboard' }
        ],
        STUDENT: [
            { label: '📊 Overview', target: 'overview' },
            { label: '📅 Events', target: 'studentEvents' },
            { label: '✅ My Attendance', target: 'myAttendance' },
            { label: '📝 My Marks', target: 'myMarks' },
            { label: '👤 My Profile', target: 'myProfile' }
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
    if (target === 'addStudent') {}  // static form, no load needed
    if (target === 'addFaculty') {}  // static form, no load needed
    if (target === 'manageStudents') renderStudentsByYear();
    if (target === 'manageFaculty') renderFacultyByBranch();
    if (target === 'manageUsers') renderStudentsByYear();
    if (target === 'manageEvents') loadAdminEvents();
    if (target === 'studentEvents') loadStudentEvents();
    if (target === 'myAttendance') loadMyAttendance();
    if (target === 'myMarks') loadMyMarks();
    if (target === 'myProfile') loadProfile();
    
    if (target === 'facultyDashboard') initFacultyDashboard();
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

async function renderStudentsByYear() {
    let students = await apiFetch(`${API_BASE}/users/role/STUDENT`);
    students.sort((a, b) => (a.username || '').localeCompare(b.username || ''));

    const yearFilter = document.getElementById('msYearFilter')?.value;
    const secFilter = document.getElementById('msSectionFilter')?.value;

    if (yearFilter) students = students.filter(s => s.year === yearFilter);
    if (secFilter) students = students.filter(s => s.section === secFilter);

    const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    const yearTabs = document.getElementById('yearTabs');
    const container = document.getElementById('yearSectionsContainer');
    yearTabs.innerHTML = '';
    container.innerHTML = '';

    let activeSet = false;
    years.forEach((year, yi) => {
        const yearStudents = students.filter(s => s.year === year);
        if (!yearStudents.length && students.length > 0) return;

        // Group by section
        const sections = {};
        yearStudents.forEach(s => {
            const sec = s.section || 'Unassigned';
            if (!sections[sec]) sections[sec] = [];
            sections[sec].push(s);
        });

        const tabId = `year_tab_${yi}`;
        const contentId = `year_content_${yi}`;
        const isActive = !activeSet;
        if (isActive) activeSet = true;

        // Tab button
        yearTabs.innerHTML += `<button class="year-tab-btn ${isActive ? 'active' : ''}" onclick="switchYearTab('${tabId}','${contentId}')" id="${tabId}">${year} <span class="year-count">${yearStudents.length}</span></button>`;

        // Content panel
        let html = `<div id="${contentId}" class="year-content ${isActive ? '' : 'hidden'}">`;

        if (!yearStudents.length) {
            html += `<p style="color:var(--text-secondary);padding:1rem">No students in ${year}.</p>`;
        } else {
            Object.keys(sections).sort().forEach(sec => {
                html += `
                <div class="section-group">
                    <div class="section-group-header">
                        <span>Section: <strong>${sec}</strong></span>
                        <span class="year-count">${sections[sec].length} students</span>
                    </div>
                    <div class="table-container">
                        <table class="glass-table">
                            <thead><tr><th>Name</th><th>USN</th><th>Email</th><th>Branch</th><th>Marks</th><th>Actions</th></tr></thead>
                            <tbody>`;
                sections[sec].forEach(u => {
                    html += `<tr>
                        <td>${u.username}</td>
                        <td>${u.usn || '--'}</td>
                        <td>${u.email}</td>
                        <td>${u.branch || '--'}</td>
                        <td>${u.marks ?? '--'}</td>
                        <td>
                            <button class="btn-small btn-primary" onclick="openEditUser(${u.id},'${u.username}','${u.email}','${u.branch||''}','${u.section||''}','${u.usn||''}','${u.year||''}','${u.subject||''}')">Edit</button>
                            <button class="btn-small btn-danger" onclick="deleteUser(${u.id})">Delete</button>
                        </td>
                    </tr>`;
                });
                html += `</tbody></table></div></div>`;
            });
        }
        html += `</div>`;
        container.innerHTML += html;
    });

    // Students with no year assigned
    const noYear = students.filter(s => !s.year || !years.includes(s.year));
    if (noYear.length) {
        const tabId = 'year_tab_ny';
        const contentId = 'year_content_ny';
        const isActive = !activeSet;
        yearTabs.innerHTML += `<button class="year-tab-btn ${isActive ? 'active' : ''}" onclick="switchYearTab('${tabId}','${contentId}')" id="${tabId}">Unassigned <span class="year-count">${noYear.length}</span></button>`;
        let html = `<div id="${contentId}" class="year-content ${isActive ? '' : 'hidden'}"><div class="section-group"><div class="section-group-header"><span>No Year Assigned</span><span class="year-count">${noYear.length} students</span></div><div class="table-container"><table class="glass-table"><thead><tr><th>Name</th><th>USN</th><th>Email</th><th>Branch</th><th>Section</th><th>Marks</th><th>Actions</th></tr></thead><tbody>`;
        noYear.forEach(u => {
            html += `<tr><td>${u.username}</td><td>${u.usn||'--'}</td><td>${u.email}</td><td>${u.branch||'--'}</td><td>${u.section||'--'}</td><td>${u.marks??'--'}</td><td><button class="btn-small btn-primary" onclick="openEditUser(${u.id},'${u.username}','${u.email}','${u.branch||''}','${u.section||''}','${u.usn||''}','${u.year||''}','${u.subject||''}')">Edit</button> <button class="btn-small btn-danger" onclick="deleteUser(${u.id})">Delete</button></td></tr>`;
        });
        html += `</tbody></table></div></div></div>`;
        container.innerHTML += html;
    }

    if (!yearTabs.innerHTML) {
        container.innerHTML = '<p style="color:var(--text-secondary)">No students found. Add students to get started.</p>';
    }
}

function switchYearTab(tabId, contentId) {
    document.querySelectorAll('.year-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.year-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(tabId)?.classList.add('active');
    document.getElementById(contentId)?.classList.remove('hidden');
}

async function renderFacultyByBranch() {
    let teachers = await apiFetch(`${API_BASE}/users/role/TEACHER`);
    const branchFilter = document.getElementById('mfBranchFilter')?.value;
    if (branchFilter) teachers = teachers.filter(t => t.branch === branchFilter);

    const container = document.getElementById('facultyBranchContainer');
    container.innerHTML = '';

    if (!teachers.length) {
        container.innerHTML = '<p style="color:var(--text-secondary)">No faculty found for the selected criteria.</p>';
        return;
    }

    // Group by branch
    const branches = {};
    teachers.forEach(t => {
        const branch = t.branch || 'Unassigned';
        if (!branches[branch]) branches[branch] = [];
        branches[branch].push(t);
    });

    Object.keys(branches).sort().forEach(branch => {
        const list = branches[branch];
        
        // Sort list: HOD first, then alphabetical by name
        list.sort((a, b) => {
            if (a.isHod && !b.isHod) return -1;
            if (!a.isHod && b.isHod) return 1;
            return (a.username || '').localeCompare(b.username || '');
        });

        let html = `
        <div class="section-group" style="margin-bottom:2rem;">
            <div class="section-group-header" style="background:rgba(139,92,246,0.1);border-color:rgba(139,92,246,0.3);">
                <span>🏛️ Branch: <strong style="color:#c4b5fd">${branch}</strong></span>
                <span class="year-count">${list.length} faculty</span>
            </div>
            <div class="table-container">
                <table class="glass-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>ID (USN)</th>
                            <th>Subject</th>
                            <th>Branch</th>
                            <th style="text-align:right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        list.forEach(t => {
            const trStyle = t.isHod ? `background: rgba(139, 92, 246, 0.15); border-left: 4px solid var(--accent-primary);` : ``;
            const nameDisplay = t.isHod ? `<strong>👑 ${t.username} <span style="color:var(--accent-primary)">(HOD)</span></strong>` : t.username;

            html += `
            <tr style="${trStyle}">
                <td>
                    <div style="display:flex;flex-direction:column;">
                        <span>${nameDisplay}</span>
                        <span style="font-size:0.8rem;color:var(--text-secondary)">${t.email}</span>
                    </div>
                </td>
                <td>${t.usn || '--'}</td>
                <td>${t.subject || '--'}</td>
                <td>${t.branch || '--'}</td>
                <td style="text-align:right">
                    <button class="btn-small btn-primary" onclick="openEditFaculty(${t.id},'${esc(t.username)}','${esc(t.email)}','${esc(t.branch||'')}','${esc(t.usn||'')}','${esc(t.subject||'')}',${t.isHod})">Edit</button>
                    <button class="btn-small btn-danger" onclick="deleteUser(${t.id})">Delete</button>
                </td>
            </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        </div>
        `;
        container.innerHTML += html;
    });
}

function esc(str) { return (str || '').replace(/'/g, "\\'"); }

function openEditFaculty(id, username, email, branch, usn, subject, isHod) {
    document.getElementById('editUserId').value = id;
    document.getElementById('editUsername').value = username;
    document.getElementById('editEmail').value = email;
    document.getElementById('editUsn').value = usn || '';
    document.getElementById('editBranch').value = branch || '';
    document.getElementById('editSection').value = '';
    document.getElementById('editYear').value = '';
    document.getElementById('editSubject').value = subject || '';
    document.getElementById('editIsHod').checked = isHod || false;
    openModal('editUserModal');
}

function openEditUser(id, username, email, branch, section, usn, year, subject) {
    document.getElementById('editUserId').value = id;
    document.getElementById('editUsername').value = username;
    document.getElementById('editEmail').value = email;
    document.getElementById('editUsn').value = usn || '';
    document.getElementById('editBranch').value = branch || '';
    document.getElementById('editSection').value = section || '';
    document.getElementById('editYear').value = year || '';
    document.getElementById('editSubject').value = subject || '';
    openModal('editUserModal');
}

async function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
    if (res.ok) { renderStudentsByYear(); renderFacultyByBranch(); showToast('User deleted.'); }
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
                ${currentUser.role === 'ADMIN' ? `<button class="btn-small btn-primary" onclick="viewEventRegistrations(${evt.id}, '${evt.title.replace(/'/g, "\\'")}')">Registrations</button> <button class="btn-small btn-danger" onclick="deleteEvent(${evt.id})">Delete</button>` : ''}
            </div>
        </div>`;
    });
}

async function deleteEvent(id) {
    if (!confirm('Delete this event? All associated registrations will also be deleted.')) return;
    const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
    if (res.ok) { loadAdminEvents(); showToast('Event deleted.'); }
}

async function viewEventRegistrations(eventId, eventTitle) {
    document.getElementById('viewRegEventTitle').textContent = eventTitle;
    const tbody = document.getElementById('registrationsTableBody');
    tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    openModal('viewRegistrationsModal');

    const records = await apiFetch(`${API_BASE}/attendance/event/${eventId}`);
    window.currentRegistrationsData = records;
    tbody.innerHTML = '';
    if (!records.length) {
        tbody.innerHTML = '<tr><td colspan="5">No registrations found.</td></tr>';
        return;
    }
    records.forEach(r => {
        const u = r.user;
        tbody.innerHTML += `
        <tr>
            <td>${u.username}</td>
            <td>${u.usn || '--'}</td>
            <td>${u.email}</td>
            <td>${u.phoneNumber || '--'}</td>
            <td><span class="role-tag role-student">${r.status}</span></td>
        </tr>`;
    });
}

window.downloadRegistrationsCSV = function() {
    if (!window.currentRegistrationsData || window.currentRegistrationsData.length === 0) {
        showToast('No registrations to export.');
        return;
    }
    const headers = ['Name', 'USN', 'Email', 'Phone Number', 'Status'];
    let csvContent = headers.join(',') + '\\n';

    window.currentRegistrationsData.forEach(r => {
        const u = r.user;
        const row = [
            `"${u.username || ''}"`,
            `"${u.usn || ''}"`,
            `"${u.email || ''}"`,
            `"${u.phoneNumber || ''}"`,
            `"${r.status || ''}"`
        ];
        csvContent += row.join(',') + '\\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Event_Registrations.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// ─── FACULTY DASHBOARD ────────────────────────────────────────────────────────
let facChartPie = null;
let facChartLine = null;

async function initFacultyDashboard() {
    // Set Header Info
    document.getElementById('facName').textContent = currentUser.username || 'Teacher';
    document.getElementById('facDept').textContent = currentUser.branch ? `Department of ${currentUser.branch}` : 'Faculty Department';
    
    const d = new Date();
    document.getElementById('facCurrentDate').textContent = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('facAttDate').value = d.toISOString().split('T')[0];

    // Setup Tabs
    document.querySelectorAll('.fac-tab-btn').forEach(btn => {
        // Prevent duplicate listener binding
        if (btn.dataset.bound) return;
        btn.dataset.bound = 'true';
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.fac-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.fac-tab-content').forEach(c => c.classList.remove('active', 'hidden'));
            document.querySelectorAll('.fac-tab-content').forEach(c => c.classList.add('hidden'));
            
            e.target.classList.add('active');
            const targetId = e.target.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');
            document.getElementById(targetId).classList.add('active');

            if (targetId === 'facTabAnalytics') {
                setTimeout(initFacCharts, 100);
            }
        });
    });

    // Subject Dropdown mock update
    const subjSel = document.getElementById('facSubjectSelect');
    if (!subjSel.dataset.bound) {
        subjSel.dataset.bound = 'true';
        subjSel.addEventListener('change', (e) => {
            if (e.target.value === 'CS771_B') {
                document.getElementById('facTotStd').textContent = '45';
                document.getElementById('facAbove').textContent = '30';
                document.getElementById('facBelow').textContent = '15';
                document.getElementById('facOverall').textContent = '78%';
            } else {
                document.getElementById('facTotStd').textContent = '60';
                document.getElementById('facAbove').textContent = '45';
                document.getElementById('facBelow').textContent = '15';
                document.getElementById('facOverall').textContent = '82%';
            }
        });
    }
    // Trigger initial stats
    subjSel.dispatchEvent(new Event('change'));

    // Load Students Mock
    renderFacStudents();
    renderFacMarks();
}

async function renderFacStudents() {
    let students = await apiFetch(`${API_BASE}/users/role/STUDENT`);
    if (!students.length) {
        students = [
            { id: 1, username: 'Omkar', usn: '21AI001', branch: 'AI', att: 65 },
            { id: 2, username: 'Rahul', usn: '21AI045', branch: 'AI', att: 72 },
            { id: 3, username: 'Aditi', usn: '21CS102', branch: 'CSE', att: 88 }
        ];
    } else {
        students.forEach((s, i) => {
            s.att = 60 + (i * 5) % 40; // mock percentage 60-100
        });
    }

    const container = document.getElementById('facStudentAttList');
    container.innerHTML = '';
    
    students.forEach(s => {
        const isWarning = s.att < 75;
        const warningBadge = isWarning ? `<span style="background: rgba(239,68,68,0.2); color: #fca5a5; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-left: 0.5rem;">⚠️ Warning</span>` : '';
        
        container.innerHTML += `
        <div class="student-att-card">
            <div class="student-info">
                <span class="student-name">${s.username} ${warningBadge}</span>
                <span class="student-meta">${s.usn || 'No USN'} • ${s.branch || 'No Branch'} • <span style="color: ${isWarning ? 'var(--warning)' : 'var(--success)'}; font-weight: 600;">Attendance: ${s.att}%</span></span>
            </div>
            <div class="student-att-actions">
                <button class="btn-att btn-att-present" onclick="showToast('Marked Present')">✅ Present</button>
                <button class="btn-att btn-att-absent" onclick="showToast('Marked Absent')">❌ Absent</button>
                <button class="btn-att btn-att-late" onclick="showToast('Marked Late')">🕒 Late</button>
                <button class="btn-att btn-att-leave" onclick="showToast('Marked Leave')">📄 Leave</button>
            </div>
        </div>`;
    });
}

function facBulkMark(status) {
    showToast(`Bulk marked ${status} for all filtered students.`);
}

async function renderFacMarks() {
    const students = await apiFetch(`${API_BASE}/users/role/STUDENT`);
    const tbody = document.getElementById('facMarksTableBody');
    tbody.innerHTML = '';
    if (!students.length) { tbody.innerHTML = '<tr><td colspan="4">No students found.</td></tr>'; return; }
    students.forEach(s => {
        tbody.innerHTML += `
        <tr>
            <td>${s.username}</td><td>${s.usn || '--'}</td>
            <td>${s.marks ?? '--'}</td>
            <td>
                <input type="number" id="facMark_${s.id}" value="${s.marks||''}" style="width:80px;padding:0.3rem;background:rgba(0,0,0,0.2);border:1px solid var(--glass-border);border-radius:6px;color:var(--text-primary);">
                <button class="btn-small btn-primary" onclick="saveMarks(${s.id}, 'facMark_${s.id}')">Save</button>
            </td>
        </tr>`;
    });
}

async function saveMarks(userId, inputId) {
    const inputEl = document.getElementById(inputId || `marks_${userId}`);
    const marks = parseFloat(inputEl?.value);
    if (isNaN(marks)) { alert('Enter valid marks'); return; }
    const res = await fetch(`${API_BASE}/users/${userId}/marks`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marks })
    });
    if (res.ok) showToast('Marks updated!');
}

function initFacCharts() {
    if (typeof Chart === 'undefined') return;

    const ctxPie = document.getElementById('facPieChart');
    if (ctxPie && !facChartPie) {
        facChartPie = new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: ['Present', 'Absent', 'Leave'],
                datasets: [{
                    data: [82, 12, 6],
                    backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#f8fafc' } } } }
        });
    }

    const ctxLine = document.getElementById('facLineChart');
    if (ctxLine && !facChartLine) {
        facChartLine = new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Attendance %',
                    data: [85, 80, 88, 82],
                    borderColor: '#4fd1c5',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(79, 209, 197, 0.1)'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 50, max: 100, ticks: { color: '#94a3b8' } }, x: { ticks: { color: '#94a3b8' } } } }
        });
    }

    facLoadWorkload();
}

async function facGenerateQR() {
    const modal = document.getElementById('qrModal');
    const qrImage = document.getElementById('qrImage');
    const placeholder = document.getElementById('qrPlaceholder');
    const timerText = document.getElementById('qrTimer');
    
    modal.classList.remove('hidden');
    qrImage.style.display = 'none';
    placeholder.style.display = 'block';
    placeholder.textContent = 'Generating...';

    // Mock an event ID based on current selection
    const mockEventId = 1; 
    
    try {
        const res = await fetch(`${API_BASE}/events/${mockEventId}/generate-qr`, { method: 'POST' });
        if (res.ok) {
            const data = await res.json();
            // Use an external API to generate the QR code image from the token
            qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.token)}`;
            qrImage.onload = () => {
                placeholder.style.display = 'none';
                qrImage.style.display = 'block';
            };
            
            // Start countdown
            let timeLeft = 60;
            const timer = setInterval(() => {
                timeLeft--;
                timerText.textContent = `Expires in ${timeLeft}s`;
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    timerText.textContent = 'Expired';
                    qrImage.style.opacity = '0.3';
                }
            }, 1000);
        } else {
            placeholder.textContent = 'Failed to generate QR';
        }
    } catch (err) {
        console.error(err);
        placeholder.textContent = 'Error';
    }
}

let facChartWorkload = null;

async function facLoadWorkload() {
    try {
        const res = await fetch(`${API_BASE}/analytics/faculty-workload/${currentUser.id}`);
        if (!res.ok) return;
        const data = await res.json();
        
        document.getElementById('wlClasses').textContent = data.classesConducted;
        document.getElementById('wlHours').textContent = data.weeklyTeachingHours;
        document.getElementById('wlStudents').textContent = data.totalStudentStrength;
        document.getElementById('wlSubjects').textContent = data.subjectsAssigned;

        const ctx = document.getElementById('facWorkloadChart');
        if (ctx && !facChartWorkload) {
            facChartWorkload = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.monthlyTrend.map(d => d.month),
                    datasets: [{
                        label: 'Teaching Hours',
                        data: data.monthlyTrend.map(d => d.hours),
                        backgroundColor: '#8b5cf6',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { color: '#94a3b8' } },
                        x: { ticks: { color: '#94a3b8' } }
                    }
                }
            });
        }
    } catch (err) {
        console.error('Failed to load workload analytics', err);
    }
}

// ─── STUDENT: EVENTS ─────────────────────────────────────────────────────────
async function loadStudentEvents() {
    const events = await apiFetch(`${API_BASE}/events`);
    const list = document.getElementById('studentEventsList');
    list.innerHTML = '';
    if (!events.length) { list.innerHTML = '<p style="color:var(--text-secondary)">No events available.</p>'; return; }
    events.forEach(evt => {
        const badgeClass = evt.type === 'HACKATHON' ? 'badge-hackathon' : evt.type === 'CHALLENGE' ? 'badge-challenge' : evt.type === 'EXAM' ? 'badge-challenge' : 'badge-regular';
        const isRegistration = ['HACKATHON', 'CHALLENGE', 'EXAM'].includes(evt.type);
        const actionText = isRegistration ? 'Register' : 'Mark Present';
        const actionStatus = isRegistration ? 'REGISTERED' : 'PRESENT';
        const escapedTitle = evt.title.replace(/'/g, "\\'");
        const onClickAction = isRegistration ? `confirmRegistration(${evt.id}, '${escapedTitle}', '${actionStatus}')` : `markAttendance(${evt.id}, '${actionStatus}', this)`;
        
        list.innerHTML += `
        <div class="event-card">
            ${evt.posterUrl ? `<img src="${evt.posterUrl}" alt="poster" class="event-poster">` : ''}
            <span class="event-badge ${badgeClass}">${evt.type}</span>
            <h3>${evt.title}</h3>
            <p class="event-date">${new Date(evt.eventDate).toLocaleString()}</p>
            <p style="font-size:0.9rem;color:var(--text-secondary)">${evt.description || ''}</p>
            <div class="event-actions">
                <button class="btn-primary btn-small mark-btn" data-id="${evt.id}" onclick="${onClickAction}">${actionText}</button>
                ${evt.linkedinLink ? `<a href="${evt.linkedinLink}" target="_blank" class="btn-linkedin">LinkedIn</a>` : ''}
            </div>
        </div>`;
    });
}

function confirmRegistration(eventId, eventTitle, status) {
    document.getElementById('registrationEventTitle').textContent = eventTitle;
    document.getElementById('regEventId').value = eventId;
    document.getElementById('regEventStatus').value = status;
    document.getElementById('regConfirmName').value = '';
    document.getElementById('regConfirmUsn').value = '';
    document.getElementById('regConfirmEmail').value = '';
    document.getElementById('regConfirmPhone').value = '';
    openModal('studentRegistrationModal');
}

async function markAttendance(eventId, status, btn) {
    const res = await fetch(`${API_BASE}/attendance/mark`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, eventId, status: status })
    });
    if (res.ok) {
        btn.textContent = status === 'REGISTERED' ? 'Registered ✓' : 'Marked ✓';
        btn.disabled = true;
        btn.style.opacity = 0.5;
        showToast(status === 'REGISTERED' ? 'Successfully registered!' : 'Attendance marked!');
    }
}

// ─── STUDENT: MY ATTENDANCE ──────────────────────────────────────────────────
async function loadMyAttendance() {
    const records = await apiFetch(`${API_BASE}/attendance/student/${currentUser.id}`);
    const tbody = document.getElementById('attendanceRecords');
    tbody.innerHTML = '';
    if (!records.length) { 
        tbody.innerHTML = '<tr><td colspan="3">No records found.</td></tr>'; 
    } else {
        records.forEach(rec => {
            tbody.innerHTML += `
            <tr>
                <td>${rec.event?.title || 'Unknown'}</td>
                <td>${new Date(rec.timestamp).toLocaleString()}</td>
                <td><span style="color:var(--success);font-weight:600">${rec.status}</span></td>
            </tr>`;
        });
    }

    // Mock subject data for the Dashboard UI
    const subjectData = {
        'CS770_A': { attended: 10, total: 20 },
        'CS771_B': { attended: 18, total: 20 },
        'CS772_C': { attended: 13, total: 20 }
    };

    const subjectSelect = document.getElementById('attSubjectSelect');
    
    if (subjectSelect) {
        // Bind change event if not already bound
        if (!subjectSelect.dataset.bound) {
            subjectSelect.addEventListener('change', updateAttendanceMetrics);
            subjectSelect.dataset.bound = 'true';
        }
        
        // Initial render
        updateAttendanceMetrics();
    }

    function updateAttendanceMetrics() {
        const selected = subjectSelect.value;
        const data = subjectData[selected] || { attended: 0, total: 0 };
        
        document.getElementById('attSubjectTitle').textContent = `${selected} Attendance Details`;
        
        const attended = data.attended;
        const total = data.total;
        const missed = total - attended;
        const rate = total > 0 ? Math.round((attended / total) * 100) : 0;
        
        // Animate numbers
        animateValue('attRate', rate, '%');
        animateValue('attAttended', attended, '');
        animateValue('attTotal', total, '');
        animateValue('attMissed', missed, '');
        
        // Progress bar
        const progressBar = document.getElementById('attProgressBar');
        if (progressBar) {
            setTimeout(() => {
                progressBar.style.width = `${rate}%`;
                // Change progress bar color based on rate
                if (rate >= 75) progressBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
                else if (rate >= 60) progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
                else progressBar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
            }, 100);
        }
        
        // Trend
        document.getElementById('attTrend').textContent = `${rate}% / 100%`;
        
        // Status Badge
        const badge = document.getElementById('attStatusBadge');
        if (badge) {
            badge.className = 'status-badge';
            if (rate >= 75) {
                badge.classList.add('safe');
                badge.innerHTML = '🟢 Safe (Above 75%)';
            } else if (rate >= 60) {
                badge.classList.add('warning');
                badge.innerHTML = '🟠 Warning (60% - 74%)';
            } else {
                badge.classList.add('critical');
                badge.innerHTML = '🔴 Critical (Below 60%)';
            }
        }
        
        // Prediction Calculator
        const predictionEl = document.getElementById('attPrediction');
        if (predictionEl) {
            if (rate >= 75) {
                predictionEl.textContent = 'You are maintaining safe attendance.';
            } else {
                const needed = (3 * total) - (4 * attended);
                predictionEl.textContent = `${Math.max(1, Math.ceil(needed))} consecutive classes needed to reach 75%`;
            }
        }
    }
    
    function animateValue(id, end, suffix) {
        const obj = document.getElementById(id);
        if (!obj) return;
        const duration = 1000;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * end) + suffix;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
}

// ─── STUDENT: MY MARKS ───────────────────────────────────────────────────────
async function loadMyMarks() {
    const res = await fetch(`${API_BASE}/users/${currentUser.id}`);
    if (res.ok) {
        const user = await res.json();
        document.getElementById('myMarksSubject').textContent = user.subject || 'Not assigned';
        document.getElementById('myMarksValue').textContent = user.marks ?? 'Not assigned yet';
    }
}

// ─── STUDENT: MY PROFILE ──────────────────────────────────────────────────────
async function loadProfile() {
    const res = await fetch(`${API_BASE}/users/${currentUser.id}`);
    if (res.ok) {
        const user = await res.json();
        document.getElementById('profileUsername').value = user.username || '';
        document.getElementById('profileUsn').value = user.usn || '';
        document.getElementById('profileBranch').value = user.branch || '';
        document.getElementById('profileSection').value = user.section || '';
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('profilePhone').value = user.phoneNumber || '';
        document.getElementById('profileLinkedin').value = user.linkedinProfileUrl || '';
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
