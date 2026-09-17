/**
 * ScholarDesk SIS - Client Application Logic
 * Implements Full-Stack CRUD SOP standard with Django REST API integration
 */

const API_BASE = '/api/students';

// Application State
let allStudents = [];
let deleteCandidate = null;
let currentSort = '-created_at';

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupEventListeners();
  checkBackendHealth();
});

function initApp() {
  fetchStudents();
  fetchStats();
}

function setupEventListeners() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearchBtn');

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    clearBtn.style.display = val ? 'block' : 'none';
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      applyFilters();
    }, 250);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    applyFilters();
  });

  // Real-time validation listeners on student form
  const fields = ['inputStudentId', 'inputEmail', 'inputFirstName', 'inputLastName', 'inputPhone', 'inputGpa', 'inputEnrollmentDate', 'inputDepartment', 'inputStatus'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => validateField(id));
      el.addEventListener('change', () => validateField(id));
    }
  });

  // Modal keyboard controls
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeStudentModal();
      closeDetailModal();
      closeDeleteModal();
    }
  });
}

// Check Backend Connectivity
async function checkBackendHealth() {
  const badge = document.getElementById('apiStatusBadge');
  try {
    const res = await fetch(`${API_BASE}/stats/`);
    if (res.ok) {
      badge.innerHTML = `<span class="status-dot online"></span><span class="status-label">Backend: Connected</span>`;
    } else {
      badge.innerHTML = `<span class="status-dot offline"></span><span class="status-label">Backend: Error (${res.status})</span>`;
    }
  } catch (err) {
    badge.innerHTML = `<span class="status-dot offline"></span><span class="status-label">Backend: Offline</span>`;
  }
}

// Tab Navigation
function switchMainTab(tabId) {
  document.querySelectorAll('.view-panel').forEach(p => p.style.display = 'none');
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));

  if (tabId === 'registry') {
    document.getElementById('viewRegistry').style.display = 'block';
    document.getElementById('tabRegistryBtn').classList.add('active');
  } else if (tabId === 'api') {
    document.getElementById('viewApi').style.display = 'block';
    document.getElementById('tabApiBtn').classList.add('active');
    loadEndpointPreset();
  } else if (tabId === 'sop') {
    document.getElementById('viewSop').style.display = 'block';
    document.getElementById('tabSopBtn').classList.add('active');
  }
}

// -----------------------------------------------------------------------------
// READ / FETCH & STATS
// -----------------------------------------------------------------------------
async function fetchStudents() {
  const tbody = document.getElementById('studentsTableBody');
  const emptyState = document.getElementById('emptyState');
  
  try {
    const params = new URLSearchParams();
    const search = document.getElementById('searchInput')?.value.trim();
    const dept = document.getElementById('filterDept')?.value;
    const statusVal = document.getElementById('filterStatus')?.value;
    const year = document.getElementById('filterYear')?.value;
    const ordering = document.getElementById('sortOrder')?.value || currentSort;

    if (search) params.append('search', search);
    if (dept) params.append('department', dept);
    if (statusVal) params.append('status', statusVal);
    if (year) params.append('year', year);
    if (ordering) params.append('ordering', ordering);

    const url = `${API_BASE}/?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const data = await res.json();
    allStudents = data;

    renderTable(data);
    updateCountSummary(data.length);
  } catch (err) {
    console.error("Fetch students error:", err);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="loading-cell text-danger">
          Failed to load students from server. Please verify backend service is running.
        </td>
      </tr>
    `;
  }
}

async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/stats/`);
    if (!res.ok) return;
    const stats = await res.json();

    document.getElementById('statTotalStudents').textContent = stats.total_students ?? 0;
    document.getElementById('statActiveStudents').textContent = stats.active_students ?? 0;
    
    const activePct = stats.total_students > 0 
      ? Math.round((stats.active_students / stats.total_students) * 100) 
      : 0;
    document.getElementById('statActivePercentage').textContent = `${activePct}% active roster`;
    
    document.getElementById('statAverageGpa').textContent = Number(stats.average_gpa).toFixed(2);
    document.getElementById('statTopDept').textContent = stats.top_department || 'None';
  } catch (err) {
    console.error("Fetch stats error:", err);
  }
}

function renderTable(students) {
  const tbody = document.getElementById('studentsTableBody');
  const emptyState = document.getElementById('emptyState');

  if (!students || students.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  tbody.innerHTML = students.map(s => {
    const gpaNum = parseFloat(s.gpa);
    let gpaClass = 'gpa-mid';
    if (gpaNum >= 3.7) gpaClass = 'gpa-high';
    else if (gpaNum < 3.0) gpaClass = 'gpa-low';

    const statusSlug = (s.enrollment_status || 'active').toLowerCase().replace(/\s+/g, '-');
    
    return `
      <tr id="row-student-${s.id}">
        <td>
          <span class="student-id-badge">${escapeHtml(s.student_id)}</span>
        </td>
        <td>
          <div class="student-name-group">
            <span class="student-name-full">${escapeHtml(s.first_name)} ${escapeHtml(s.last_name)}</span>
            <span class="student-email">${escapeHtml(s.email)}</span>
          </div>
        </td>
        <td>
          <div class="dept-tag">${escapeHtml(s.department)}</div>
          <div class="year-sub">${formatYear(s.year_of_study)} • Enrolled ${escapeHtml(s.enrollment_date)}</div>
        </td>
        <td>
          <div>${escapeHtml(s.phone)}</div>
        </td>
        <td style="text-align: center;">
          <span class="gpa-pill ${gpaClass}">${Number(s.gpa).toFixed(2)}</span>
        </td>
        <td>
          <span class="status-badge status-${statusSlug}">
            <span class="status-dot"></span>
            ${escapeHtml(s.enrollment_status)}
          </span>
        </td>
        <td>
          <div class="row-actions">
            <button class="btn btn-secondary btn-sm" onclick="viewStudentDetails(${s.id})" title="View complete dossier">
              View
            </button>
            <button class="btn btn-outline btn-sm" onclick="openEditModal(${s.id})" title="Edit student record">
              Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${s.id})" title="Remove record">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function updateCountSummary(visibleCount) {
  document.getElementById('visibleCount').textContent = visibleCount;
  document.getElementById('totalCount').textContent = allStudents.length;
}

function applyFilters() {
  fetchStudents();
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('clearSearchBtn').style.display = 'none';
  document.getElementById('filterDept').value = '';
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterYear').value = '';
  document.getElementById('sortOrder').value = '-created_at';
  fetchStudents();
}

// -----------------------------------------------------------------------------
// CREATE & UPDATE (FORM SUBMISSION & VALIDATION)
// -----------------------------------------------------------------------------
function openCreateModal() {
  clearValidationErrors();
  document.getElementById('studentForm').reset();
  document.getElementById('studentPk').value = '';
  document.getElementById('modalTitle').textContent = 'Enroll New Student';
  document.getElementById('btnSubmitStudent').textContent = 'Save Record';
  
  // Default enrollment date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('inputEnrollmentDate').value = today;

  document.getElementById('studentModal').classList.add('open');
  document.getElementById('inputStudentId').focus();
}

async function openEditModal(id) {
  clearValidationErrors();
  const student = allStudents.find(s => s.id === id);
  if (!student) {
    try {
      const res = await fetch(`${API_BASE}/${id}/`);
      if (!res.ok) throw new Error();
      populateEditForm(await res.json());
    } catch {
      showToast('Error', 'Unable to retrieve student record for editing.', 'error');
    }
    return;
  }
  populateEditForm(student);
}

function populateEditForm(s) {
  document.getElementById('studentPk').value = s.id;
  document.getElementById('modalTitle').textContent = `Edit Record: ${s.student_id}`;
  document.getElementById('btnSubmitStudent').textContent = 'Update Record';

  document.getElementById('inputStudentId').value = s.student_id;
  document.getElementById('inputEmail').value = s.email;
  document.getElementById('inputFirstName').value = s.first_name;
  document.getElementById('inputLastName').value = s.last_name;
  document.getElementById('inputPhone').value = s.phone;
  document.getElementById('inputEnrollmentDate').value = s.enrollment_date;
  document.getElementById('inputDepartment').value = s.department;
  document.getElementById('inputYear').value = s.year_of_study;
  document.getElementById('inputGpa').value = s.gpa;
  document.getElementById('inputStatus').value = s.enrollment_status;
  document.getElementById('inputAddress').value = s.address || '';

  document.getElementById('studentModal').classList.add('open');
}

function closeStudentModal() {
  document.getElementById('studentModal').classList.remove('open');
}

// Validation logic adhering to SOP Section 9
function validateField(fieldId) {
  const el = document.getElementById(fieldId);
  if (!el) return true;
  const val = el.value.trim();
  let errorMsg = '';

  switch (fieldId) {
    case 'inputStudentId':
      if (!val) errorMsg = 'Student ID is mandatory.';
      else if (!/^[A-Za-z0-9\-]{3,20}$/.test(val)) {
        errorMsg = 'ID must be 3-20 characters (letters, numbers, hyphens).';
      }
      setFieldError('student_id', errorMsg, el);
      break;

    case 'inputEmail':
      if (!val) errorMsg = 'Email address is mandatory.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        errorMsg = 'Please enter a valid email format (e.g. name@university.edu).';
      }
      setFieldError('email', errorMsg, el);
      break;

    case 'inputFirstName':
      if (!val) errorMsg = 'First name is required.';
      else if (val.length < 2) errorMsg = 'First name must be at least 2 characters.';
      setFieldError('first_name', errorMsg, el);
      break;

    case 'inputLastName':
      if (!val) errorMsg = 'Last name is required.';
      setFieldError('last_name', errorMsg, el);
      break;

    case 'inputPhone':
      if (!val) errorMsg = 'Phone number is required.';
      else {
        const cleaned = val.replace(/[\s\-\(\)\+]/g, '');
        if (cleaned.length < 7 || cleaned.length > 15) {
          errorMsg = 'Phone number must contain between 7 and 15 digits.';
        }
      }
      setFieldError('phone', errorMsg, el);
      break;

    case 'inputGpa':
      if (!val) errorMsg = 'Cumulative GPA is required.';
      else {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0.0 || num > 4.0) {
          errorMsg = 'GPA must be a numeric value between 0.00 and 4.00.';
        }
      }
      setFieldError('gpa', errorMsg, el);
      break;

    case 'inputEnrollmentDate':
      if (!val) errorMsg = 'Enrollment date is mandatory.';
      setFieldError('enrollment_date', errorMsg, el);
      break;

    case 'inputDepartment':
      if (!val) errorMsg = 'Please select an academic department.';
      setFieldError('department', errorMsg, el);
      break;

    case 'inputStatus':
      if (!val) errorMsg = 'Please select an enrollment status.';
      setFieldError('enrollment_status', errorMsg, el);
      break;
  }

  return !errorMsg;
}

function setFieldError(fieldName, message, el) {
  const errEl = document.getElementById(`err_${fieldName}`);
  if (errEl) {
    if (message) {
      errEl.textContent = message;
      errEl.classList.add('visible');
      if (el) el.classList.add('is-invalid');
    } else {
      errEl.textContent = '';
      errEl.classList.remove('visible');
      if (el) el.classList.remove('is-invalid');
    }
  }
}

function clearValidationErrors() {
  document.querySelectorAll('.error-feedback').forEach(el => {
    el.textContent = '';
    el.classList.remove('visible');
  });
  document.querySelectorAll('.is-invalid').forEach(el => {
    el.classList.remove('is-invalid');
  });
}

function validateAllFields() {
  const fields = ['inputStudentId', 'inputEmail', 'inputFirstName', 'inputLastName', 'inputPhone', 'inputGpa', 'inputEnrollmentDate', 'inputDepartment', 'inputStatus'];
  let isValid = true;
  fields.forEach(id => {
    if (!validateField(id)) {
      isValid = false;
    }
  });
  return isValid;
}

async function handleFormSubmit(event) {
  event.preventDefault();
  if (!validateAllFields()) {
    showToast('Validation Failed', 'Please correct the highlighted errors before saving.', 'error');
    return;
  }

  const pk = document.getElementById('studentPk').value;
  const isUpdate = Boolean(pk);

  const payload = {
    student_id: document.getElementById('inputStudentId').value.trim().toUpperCase(),
    email: document.getElementById('inputEmail').value.trim(),
    first_name: document.getElementById('inputFirstName').value.trim(),
    last_name: document.getElementById('inputLastName').value.trim(),
    phone: document.getElementById('inputPhone').value.trim(),
    enrollment_date: document.getElementById('inputEnrollmentDate').value,
    department: document.getElementById('inputDepartment').value,
    year_of_study: parseInt(document.getElementById('inputYear').value, 10),
    gpa: parseFloat(document.getElementById('inputGpa').value).toFixed(2),
    enrollment_status: document.getElementById('inputStatus').value,
    address: document.getElementById('inputAddress').value.trim()
  };

  const submitBtn = document.getElementById('btnSubmitStudent');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    const url = isUpdate ? `${API_BASE}/${pk}/` : `${API_BASE}/`;
    const method = isUpdate ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      // Map server-side validation errors back to fields
      if (typeof data === 'object') {
        let firstMsg = '';
        Object.keys(data).forEach(field => {
          const messages = Array.isArray(data[field]) ? data[field].join(' ') : data[field];
          const inputEl = document.querySelector(`[id*="${field}"]`) || document.getElementById(`input${capitalize(field)}`);
          setFieldError(field, messages, inputEl);
          if (!firstMsg) firstMsg = `${field}: ${messages}`;
        });
        showToast('Server Validation Error', firstMsg || 'Validation failed on server.', 'error');
      } else {
        showToast('Error', 'Server rejected request.', 'error');
      }
      return;
    }

    closeStudentModal();
    showToast('Success', isUpdate ? 'Student record updated successfully.' : 'New student enrolled successfully.', 'success');
    fetchStudents();
    fetchStats();
  } catch (err) {
    console.error("Form submit error:", err);
    showToast('Network Error', 'Failed to communicate with backend server.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = isUpdate ? 'Update Record' : 'Save Record';
  }
}

// -----------------------------------------------------------------------------
// READ ONE: STUDENT DETAIL DOSSIER
// -----------------------------------------------------------------------------
async function viewStudentDetails(id) {
  try {
    const res = await fetch(`${API_BASE}/${id}/`);
    if (!res.ok) throw new Error();
    const s = await res.json();

    const body = document.getElementById('detailModalBody');
    body.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.75rem;">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--color-text);">${escapeHtml(s.first_name)} ${escapeHtml(s.last_name)}</h3>
          <span class="student-id-badge" style="font-size: 0.85rem; margin-top: 4px;">${escapeHtml(s.student_id)}</span>
        </div>
        <div style="text-align: right;">
          <span class="status-badge status-${s.enrollment_status.toLowerCase().replace(/\s+/g, '-')}">
            ${escapeHtml(s.enrollment_status)}
          </span>
          <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 4px;">Cumulative GPA: <strong>${s.gpa}</strong></div>
        </div>
      </div>

      <div class="dossier-grid">
        <div class="dossier-item">
          <span class="dossier-label">Department</span>
          <span class="dossier-val">${escapeHtml(s.department)}</span>
        </div>
        <div class="dossier-item">
          <span class="dossier-label">Academic Year</span>
          <span class="dossier-val">${formatYear(s.year_of_study)}</span>
        </div>
        <div class="dossier-item">
          <span class="dossier-label">University Email</span>
          <span class="dossier-val">${escapeHtml(s.email)}</span>
        </div>
        <div class="dossier-item">
          <span class="dossier-label">Telephone</span>
          <span class="dossier-val">${escapeHtml(s.phone)}</span>
        </div>
        <div class="dossier-item">
          <span class="dossier-label">Enrollment Date</span>
          <span class="dossier-val">${escapeHtml(s.enrollment_date)}</span>
        </div>
        <div class="dossier-item">
          <span class="dossier-label">Database Record ID</span>
          <span class="dossier-val">#${s.id}</span>
        </div>
      </div>

      <div class="dossier-item" style="margin-top: 0.75rem;">
        <span class="dossier-label">Residential / Postal Address</span>
        <span class="dossier-val" style="font-weight: normal; font-size: 0.85rem;">
          ${s.address ? escapeHtml(s.address) : '<em>No address on record.</em>'}
        </span>
      </div>

      <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 1rem; text-align: right;">
        Record Created: ${new Date(s.created_at).toLocaleString()} • Last Modified: ${new Date(s.updated_at).toLocaleString()}
      </div>
    `;

    document.getElementById('btnEditFromDetail').onclick = () => {
      closeDetailModal();
      openEditModal(s.id);
    };

    document.getElementById('viewDetailModal').classList.add('open');
  } catch (err) {
    showToast('Error', 'Unable to retrieve dossier details.', 'error');
  }
}

function closeDetailModal() {
  document.getElementById('viewDetailModal').classList.remove('open');
}

// -----------------------------------------------------------------------------
// DELETE RECORD
// -----------------------------------------------------------------------------
function openDeleteModal(id) {
  const student = allStudents.find(s => s.id === id);
  if (!student) return;
  deleteCandidate = student;

  document.getElementById('deleteTargetName').textContent = `${student.first_name} ${student.last_name}`;
  document.getElementById('deleteTargetId').textContent = `ID: ${student.student_id} • ${student.department}`;

  document.getElementById('btnConfirmDelete').onclick = () => executeDelete(student.id);
  document.getElementById('deleteModal').classList.add('open');
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('open');
  deleteCandidate = null;
}

async function executeDelete(id) {
  const btn = document.getElementById('btnConfirmDelete');
  btn.disabled = true;
  btn.textContent = 'Deleting...';

  try {
    const res = await fetch(`${API_BASE}/${id}/`, {
      method: 'DELETE'
    });

    if (!res.ok && res.status !== 204) {
      throw new Error(`Delete failed with status ${res.status}`);
    }

    closeDeleteModal();
    showToast('Record Deleted', `Student record has been permanently removed.`, 'info');
    fetchStudents();
    fetchStats();
  } catch (err) {
    console.error("Delete error:", err);
    showToast('Error', 'Failed to delete student record.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Delete Record';
  }
}

// -----------------------------------------------------------------------------
// RESET SAMPLE DATA
// -----------------------------------------------------------------------------
async function resetSampleData() {
  const btn = document.getElementById('btnResetSample');
  btn.disabled = true;
  btn.textContent = 'Resetting...';

  try {
    const res = await fetch(`${API_BASE}/reset_sample_data/`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    showToast('Sample Data Seeded', data.message || '10 verified records loaded.', 'success');
    fetchStudents();
    fetchStats();
  } catch (err) {
    showToast('Error', 'Failed to seed sample records.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
      Reset Samples
    `;
  }
}

// -----------------------------------------------------------------------------
// EXPORT FUNCTIONALITY
// -----------------------------------------------------------------------------
function exportData(format) {
  if (format === 'csv') {
    window.location.href = `${API_BASE}/export_csv/`;
    showToast('Export Initiated', 'Downloading CSV spreadsheet file...', 'info');
  } else if (format === 'json') {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allStudents, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `students_registry_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    showToast('Export Complete', 'JSON payload exported successfully.', 'success');
  }
}

// -----------------------------------------------------------------------------
// INTERACTIVE REST API EXPLORER
// -----------------------------------------------------------------------------
const API_PRESETS = {
  list: {
    method: 'GET',
    url: '/api/students/',
    hasPayload: false
  },
  stats: {
    method: 'GET',
    url: '/api/students/stats/',
    hasPayload: false
  },
  retrieve: {
    method: 'GET',
    url: '/api/students/1/',
    hasPayload: false
  },
  create: {
    method: 'POST',
    url: '/api/students/',
    hasPayload: true,
    payload: {
      student_id: "STU-2024-099",
      first_name: "Rowan",
      last_name: "Sterling",
      email: "rowan.sterling@university.edu",
      phone: "+1 (555) 888-9999",
      department: "Data Science & AI",
      year_of_study: 1,
      gpa: 3.85,
      enrollment_status: "Active",
      enrollment_date: "2025-08-20",
      address: "100 Innovation Way, Boston, MA"
    }
  },
  update: {
    method: 'PUT',
    url: '/api/students/1/',
    hasPayload: true,
    payload: {
      student_id: "STU-2024-001",
      first_name: "Eleanor",
      last_name: "Vance-Updated",
      email: "eleanor.vance@university.edu",
      phone: "+1 (555) 234-5678",
      department: "Computer Science & Engineering",
      year_of_study: 4,
      gpa: 3.92,
      enrollment_status: "Active",
      enrollment_date: "2023-08-20",
      address: "412 College Avenue, Apt 3B, Cambridge, MA"
    }
  },
  patch: {
    method: 'PATCH',
    url: '/api/students/1/',
    hasPayload: true,
    payload: {
      enrollment_status: "Graduated",
      gpa: 3.95
    }
  },
  delete: {
    method: 'DELETE',
    url: '/api/students/1/',
    hasPayload: false
  },
  reset: {
    method: 'POST',
    url: '/api/students/reset_sample_data/',
    hasPayload: false
  }
};

function loadEndpointPreset() {
  const sel = document.getElementById('apiEndpointSelect').value;
  const config = API_PRESETS[sel];
  if (!config) return;

  const methodBadge = document.getElementById('apiMethodBadge');
  methodBadge.textContent = config.method;
  methodBadge.className = `method-badge method-${config.method}`;

  document.getElementById('apiEndpointUrl').value = config.url;

  const payloadGroup = document.getElementById('apiPayloadGroup');
  const payloadInput = document.getElementById('apiPayloadInput');

  if (config.hasPayload) {
    payloadGroup.style.display = 'block';
    payloadInput.value = JSON.stringify(config.payload, null, 2);
  } else {
    payloadGroup.style.display = 'none';
    payloadInput.value = '';
  }
}

async function executeApiTest() {
  const method = document.getElementById('apiMethodBadge').textContent.trim();
  const url = document.getElementById('apiEndpointUrl').value.trim();
  const payloadGroup = document.getElementById('apiPayloadGroup');
  const payloadInput = document.getElementById('apiPayloadInput');
  const resCode = document.getElementById('apiResponseCode');
  const resMeta = document.getElementById('apiResponseMeta');

  resMeta.textContent = 'Sending request...';
  resCode.textContent = 'Awaiting server response...';

  const startTime = performance.now();

  try {
    const options = {
      method: method,
      headers: {
        'Accept': 'application/json'
      }
    };

    if (payloadGroup.style.display !== 'none' && payloadInput.value.trim()) {
      options.headers['Content-Type'] = 'application/json';
      options.body = payloadInput.value.trim();
    }

    const res = await fetch(url, options);
    const duration = Math.round(performance.now() - startTime);

    let textBody;
    try {
      const json = await res.json();
      textBody = JSON.stringify(json, null, 2);
    } catch {
      textBody = await res.text() || '(Empty response body)';
    }

    resMeta.innerHTML = `Status: <strong>${res.status} ${res.statusText}</strong> • Time: ${duration}ms`;
    resCode.textContent = `HTTP/1.1 ${res.status} ${res.statusText}\nContent-Type: ${res.headers.get('content-type')}\n\n${textBody}`;

    // Refresh main data if modifying method
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      fetchStudents();
      fetchStats();
    }
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    resMeta.textContent = `Error • Time: ${duration}ms`;
    resCode.textContent = `Network / Execution Error:\n${err.message}`;
  }
}

// -----------------------------------------------------------------------------
// UTILITIES
// -----------------------------------------------------------------------------
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div>
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-msg">${escapeHtml(message)}</div>
    </div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function formatYear(yearNum) {
  switch (parseInt(yearNum, 10)) {
    case 1: return '1st Year (Freshman)';
    case 2: return '2nd Year (Sophomore)';
    case 3: return '3rd Year (Junior)';
    case 4: return '4th Year (Senior)';
    default: return `${yearNum}th Year`;
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
