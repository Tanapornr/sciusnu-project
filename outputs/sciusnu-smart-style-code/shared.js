const AUTH_KEY = 'sciusnu.smart.auth';

function getApiUrl() {
  const url = window.SCIUS_CONFIG && window.SCIUS_CONFIG.APPS_SCRIPT_URL;
  if (!url || url === 'PASTE_APPS_SCRIPT_EXEC_URL_HERE') {
    throw new Error('กรุณาตั้งค่า APPS_SCRIPT_URL ใน config.js');
  }
  return url;
}

async function api(action, payload = {}) {
  const response = await fetch(getApiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify({ action, payload })
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.message || 'เกิดข้อผิดพลาด');
  }
  return data;
}

function saveAuth(auth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  } catch (error) {
    return null;
  }
}

function requireAuth(allowedRoles) {
  const auth = getAuth();
  if (!auth || !auth.token || !auth.user) {
    window.location.href = 'index.html';
    return null;
  }
  if (allowedRoles && allowedRoles.indexOf(auth.user.role) === -1) {
    window.location.href = auth.user.page || 'index.html';
    return null;
  }
  return auth;
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'index.html';
}

function setTopbarUser(user) {
  const node = document.getElementById('userLine');
  if (!node) {
    return;
  }
  const email = user.email ? ' · ' + escapeHtml(user.email) : '';
  node.innerHTML = '<strong>' + escapeHtml(user.name || user.studentId || '-') + '</strong> · ' +
    escapeHtml(user.roleLabel || user.role) + email;
}

function renderStats(node, stats) {
  const items = [
    ['ทั้งหมด', stats.total],
    ['รอตรวจ', stats.pending],
    ['ไม่อนุมัติ', stats.rejected],
    ['อนุมัติแล้ว', stats.approved]
  ];
  node.innerHTML = items.map(item => (
    '<div class="stat"><span class="stat-value">' + Number(item[1] || 0) +
    '</span><span class="stat-label">' + escapeHtml(item[0]) + '</span></div>'
  )).join('');
}

function statusBadge(status) {
  return '<span class="badge ' + statusClass(status) + '">' + escapeHtml(status || '-') + '</span>';
}

function statusClass(status) {
  if (status === 'อนุมัติแล้ว') {
    return 'status-approved';
  }
  if (status === 'ไม่อนุมัติ' || status === 'ต้องแก้ไข') {
    return 'status-rejected';
  }
  if (status === 'รอการตรวจอนุมัติ') {
    return 'status-resubmitted';
  }
  if (status === 'ยังไม่ส่ง') {
    return 'status-none';
  }
  return 'status-pending';
}

async function fileToPayload(input) {
  const file = input.files && input.files[0];
  if (!file) {
    return null;
  }

  const data = await readFileAsDataUrl(file);
  return {
    name: file.name,
    mimeType: file.type || 'application/pdf',
    data
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function fillSelect(select, values, placeholder) {
  const options = placeholder ? ['<option value="">' + escapeHtml(placeholder) + '</option>'] : [];
  select.innerHTML = options.concat(values.map(value =>
    '<option value="' + escapeAttr(value) + '">' + escapeHtml(value) + '</option>'
  )).join('');
}

function renderProjectCard(project) {
  const students = project.students.map(student =>
    escapeHtml(student.firstName + ' ' + student.lastName + ' (' + student.studentId + ')')
  ).join(', ');

  return '<article class="panel project-card">' +
    '<div class="panel-header"><span class="project-code">' + escapeHtml(project.projectCode) + '</span></div>' +
    '<div class="panel-body">' +
    '<div class="project-title">' + escapeHtml(project.projectTitle || '-') + '</div>' +
    '<div class="person-list">' +
    '<div class="person-row"><span class="person-role">นักเรียน</span><span class="person-name">' + (students || '-') + '</span></div>' +
    '<div class="person-row"><span class="person-role">ที่ปรึกษา</span><span class="person-name">' + escapeHtml(project.advisor.name || '-') + '</span></div>' +
    '<div class="person-row"><span class="person-role">ร่วม</span><span class="person-name">' + escapeHtml(project.coAdvisor.name || '-') + '</span></div>' +
    '<div class="person-row"><span class="person-role">โรงเรียน</span><span class="person-name">' + escapeHtml(project.schoolAdvisor.name || '-') + '</span></div>' +
    '</div>' +
    '</div>' +
    '</article>';
}

function submissionDetails(item) {
  return '<dl class="detail-grid compact-details">' +
    '<dt>ผู้ส่ง</dt><dd>' + escapeHtml(item.studentName || item.studentId) + '</dd>' +
    '<dt>โครงงาน</dt><dd>' + escapeHtml(item.projectCode) + '<br>' + escapeHtml(item.projectTitle || '-') + '</dd>' +
    '<dt>ประเภทงาน</dt><dd>' + escapeHtml(item.workType || '-') + '</dd>' +
    '<dt>ไฟล์เล่ม</dt><dd>' + fileLink(item.pdfUrl, 'เปิด PDF') + '</dd>' +
    '<dt>ลายเซ็น</dt><dd>' + fileLink(item.signatureUrl, 'เปิดไฟล์ลายเซ็น') + '</dd>' +
    '<dt>หมายเหตุ</dt><dd>' + escapeHtml(item.note || '-') + '</dd>' +
    '<dt>ผู้ตรวจ</dt><dd>' + escapeHtml(item.reviewerName || '-') + '</dd>' +
    '<dt>วันที่อัปเดต</dt><dd>' + escapeHtml(item.updatedAt || '-') + '</dd>' +
    '</dl>';
}

function fileLink(url, label) {
  if (!url) {
    return '-';
  }
  return '<a href="' + escapeAttr(url) + '" target="_blank" rel="noopener">' + escapeHtml(label) + '</a>';
}

function setButtonBusy(button, busy, text) {
  button.disabled = busy;
  if (text) {
    button.textContent = text;
  }
}

function toast(message, isError = false) {
  const node = document.getElementById('toast');
  if (!node) {
    alert(message);
    return;
  }
  node.textContent = message;
  node.classList.toggle('error', Boolean(isError));
  node.classList.add('show');
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => node.classList.remove('show'), 3600);
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#096;');
}
