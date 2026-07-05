const AUTH_KEY = 'sciusnu.smart.auth';

function getApiUrl() {
  const url = window.SCIUS_CONFIG && window.SCIUS_CONFIG.APPS_SCRIPT_URL;
  if (!url || url === 'PASTE_APPS_SCRIPT_EXEC_URL_HERE') {
    throw new Error('กรุณาตั้งค่า APPS_SCRIPT_URL ใน config.js');
  }
  return url;
}

async function api(action, payload = {}) {
  if (action === 'login') {
    return legacyLogin(payload);
  }

  if (action === 'dashboard') {
    return legacyDashboard();
  }

  if (action === 'reviewSubmission') {
    return legacyReviewSubmission(payload);
  }

  if (action === 'submitProjectFile') {
    return legacySubmitProjectFile(payload);
  }

  if (action === 'submitRequest') {
    return legacySubmitRequest(payload);
  }

  if (action === 'reviewRequest' || action === 'sendPendingReminder') {
    return { ok: true, count: 0 };
  }

  throw new Error('ไม่รองรับคำสั่งนี้');
}

async function legacyLogin(payload) {
  const data = await postLegacy({
    action: 'login',
    username: payload.account,
    password: payload.password
  });

  if (data.status !== 'success') {
    throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ');
  }

  const role = normalizeRole(data.role, data.email);
  const user = {
    role,
    roleLabel: roleLabel(role),
    viewerType: role === 'viewer' ? 'viewer' : '',
    name: data.name || data.email || payload.account,
    email: data.email || '',
    studentId: data.studentId || '',
    projectCode: '',
    projectCodes: [],
    page: pageForRole(role)
  };

  return {
    ok: true,
    token: data.email || data.studentId || payload.account,
    user,
    page: user.page
  };
}

async function legacyDashboard() {
  const auth = getAuth();
  const data = await getLegacy();

  if (data.status !== 'success') {
    throw new Error(data.message || 'โหลดข้อมูลไม่สำเร็จ');
  }

  const projectsRaw = data.projects || [];
  const submissionsRaw = data.submissions || [];
  const user = auth && auth.user ? auth.user : {};
  const visibleProjects = filterProjectsForUser(projectsRaw, user);
  const visibleCodes = new Set(visibleProjects.map(project => getValue(project, ['รหัสโครงงาน', 'projectCode', 'projectId'])));
  const projects = groupProjects(visibleProjects);
  const submissions = submissionsRaw
    .filter(item => !visibleCodes.size || visibleCodes.has(getValue(item, ['รหัสโครงงาน', 'projectCode', 'projectId'])))
    .map(publicLegacySubmission)
    .sort((a, b) => String(b.updatedAtRaw).localeCompare(String(a.updatedAtRaw)));

  return {
    ok: true,
    session: user,
    projects,
    submissions,
    requests: submissions.filter(item => item.workType === 'แบบคำร้อง').map(item => ({
      id: item.id,
      timestamp: item.timestamp,
      studentId: item.studentId,
      studentName: item.studentName,
      projectCode: item.projectCode,
      requestType: item.workType,
      fileUrl: item.pdfUrl,
      status: item.status,
      studentNote: item.note,
      adminNote: '',
      reviewer: item.reviewerName,
      reviewedAt: item.reviewedAt,
      updatedAt: item.updatedAt,
      updatedAtRaw: item.updatedAtRaw
    })),
    workTypes: ['ข้อเสนอโครงงาน', 'รายงานความก้าวหน้า', 'รายงานฉบับสมบูรณ์', 'ไฟล์นำเสนอ', 'โปสเตอร์'],
    requestTypes: ['แบบคำร้อง', 'ขอส่งงานล่าช้า', 'คำร้องอื่น ๆ'],
    stats: buildLegacyStats(submissions),
    emailQuota: '-'
  };
}

async function legacyReviewSubmission(payload) {
  const auth = getAuth();
  const dashboard = await legacyDashboard();
  const submission = dashboard.submissions.find(item => item.id === payload.submissionId);
  if (!submission) {
    throw new Error('ไม่พบรายการส่งงาน');
  }

  const nextStatus = payload.decision === 'approve' ? 'อนุมัติ' : 'ไม่อนุมัติ';
  const data = await postLegacy({
    action: 'updateStatus',
    studentId: submission.studentId,
    workType: submission.workType,
    status: nextStatus,
    reason: payload.note || '',
    reviewerEmail: auth && auth.user ? auth.user.email : ''
  });

  if (data.status !== 'success') {
    throw new Error(data.message || 'บันทึกผลไม่สำเร็จ');
  }

  return legacyDashboard();
}

async function legacySubmitProjectFile(payload) {
  const auth = getAuth();
  const dashboard = await legacyDashboard();
  const project = dashboard.projects[0];
  const student = project && project.students
    ? project.students.find(item => item.studentId === auth.user.studentId) || project.students[0]
    : {};
  const pdfFile = payload.pdfFile || {};
  const signatureFile = payload.signatureFile || {};
  const data = await postLegacy({
    studentId: auth.user.studentId,
    firstName: student.firstName || '',
    lastName: student.lastName || '',
    projectId: project ? project.projectCode : '',
    workType: payload.workType,
    advisorName: project && project.advisor ? project.advisor.name : '',
    file1Data: pdfFile.data || '',
    file1Mime: pdfFile.mimeType || 'application/pdf',
    file2Data: signatureFile.data || '',
    file2Mime: signatureFile.mimeType || '',
    previousReason: payload.note || '',
    reason: payload.note || '',
    note: payload.note || ''
  });

  if (data.status !== 'success') {
    throw new Error(data.message || 'ส่งงานไม่สำเร็จ');
  }

  return legacyDashboard();
}

async function legacySubmitRequest(payload) {
  payload.workType = 'แบบคำร้อง';
  payload.pdfFile = payload.requestFile;
  return legacySubmitProjectFile(payload);
}

async function postLegacy(body) {
  const response = await fetch(getApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });
  return response.json();
}

async function getLegacy() {
  const response = await fetch(getApiUrl());
  return response.json();
}

function normalizeRole(role, email) {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'student' || value === 'admin') return value;
  if (value === 'advisor' || value === 'advisor_main' || value === 'main_advisor') return 'advisor';
  if (email) return 'viewer';
  return 'student';
}

function roleLabel(role) {
  return {
    student: 'นักเรียน',
    advisor: 'อาจารย์ที่ปรึกษาหลัก',
    viewer: 'ผู้ดูสถานะ',
    admin: 'แอดมิน'
  }[role] || role;
}

function pageForRole(role) {
  return {
    student: 'student.html',
    advisor: 'advisor.html',
    viewer: 'viewer.html',
    admin: 'admin.html'
  }[role] || 'student.html';
}

function filterProjectsForUser(projects, user) {
  if (!user || user.role === 'admin') return projects;
  if (user.role === 'student') {
    return projects.filter(project => getValue(project, ['รหัสนักเรียน', 'studentId']) === user.studentId);
  }
  const email = String(user.email || '').toLowerCase();
  return projects.filter(project => [
    'E-mail อ.ที่ปรึกษา',
    'E-mail อ.ที่ปรึกษาหลัก',
    'E-mail อ.ที่ปรึกษาร่วม',
    'E-mail อ.ที่ปรึกษาโรงเรียน',
    'advisorEmail',
    'coAdvisorEmail',
    'schoolAdvisorEmail'
  ].some(key => String(project[key] || '').toLowerCase() === email));
}

function groupProjects(rows) {
  const groups = new Map();
  rows.forEach(row => {
    const projectCode = getValue(row, ['รหัสโครงงาน', 'projectCode', 'projectId']);
    if (!projectCode) return;
    if (!groups.has(projectCode)) {
      groups.set(projectCode, {
        projectCode,
        projectTitle: getValue(row, ['ชื่อโครงงาน', 'ชื่อโครงงาน ', 'projectTitle']),
        students: [],
        advisor: {
          code: getValue(row, ['อ. ที่ปรึกษา EN', 'advisorCode']),
          name: getValue(row, ['อ. ที่ปรึกษา TH', 'อ.ที่ปรึกษาหลัก', 'advisorName']),
          email: getValue(row, ['E-mail อ.ที่ปรึกษา', 'E-mail อ.ที่ปรึกษาหลัก', 'advisorEmail'])
        },
        coAdvisor: {
          name: getValue(row, ['ที่ปรึกษาร่วม', 'coAdvisorName']),
          email: getValue(row, ['E-mail อ.ที่ปรึกษาร่วม', 'coAdvisorEmail'])
        },
        schoolAdvisor: {
          name: getValue(row, ['ที่ปรึกษา โรงเรียน', 'schoolAdvisorName']),
          email: getValue(row, ['E-mail อ.ที่ปรึกษาโรงเรียน', 'schoolAdvisorEmail'])
        }
      });
    }
    groups.get(projectCode).students.push({
      studentEmail: getValue(row, ['E-mail นักเรียน', 'studentEmail']),
      studentId: getValue(row, ['รหัสนักเรียน', 'studentId']),
      firstName: getValue(row, ['ชื่อ', 'firstName']),
      lastName: getValue(row, ['นามสกุล', 'lastName']),
      phone: getValue(row, ['เบอร์โทรศัพท์', 'phone'])
    });
  });
  return Array.from(groups.values());
}

function publicLegacySubmission(item) {
  const status = normalizeStatus(getValue(item, ['สถานะ', 'status']));
  const timestamp = getValue(item, ['Timestamp', 'timestamp', 'วันที่ส่ง']);
  const projectCode = getValue(item, ['รหัสโครงงาน', 'projectCode', 'projectId']);
  const studentId = getValue(item, ['รหัสนักเรียน', 'studentId']);
  const workType = getValue(item, ['ประเภทงาน', 'workType']);
  return {
    id: getValue(item, ['Submission ID', 'id']) || [projectCode, studentId, workType, timestamp].join('-'),
    relatedId: '',
    timestamp,
    studentId,
    studentName: [getValue(item, ['ชื่อ', 'firstName']), getValue(item, ['นามสกุล', 'lastName'])].filter(Boolean).join(' '),
    projectCode,
    projectTitle: getValue(item, ['ชื่อโครงงาน', 'ชื่อโครงงาน ', 'projectTitle']),
    workType,
    pdfUrl: getValue(item, ['URL ไฟล์เล่ม', 'fileUrl', 'URL']),
    signatureUrl: getValue(item, ['URL ลายเซ็น', 'signatureUrl']),
    status,
    advisorName: getValue(item, ['อ.ที่ปรึกษา', 'advisorName']),
    advisorEmail: getValue(item, ['E-mail อ.ที่ปรึกษา', 'advisorEmail']),
    note: getValue(item, ['หมายเหตุ', 'เหตุผล', 'reason', 'note']),
    reviewerName: getValue(item, ['ผู้ตรวจ', 'reviewerName']),
    reviewerEmail: getValue(item, ['E-mail ผู้ตรวจ', 'reviewerEmail']),
    reviewedAt: getValue(item, ['วันที่ตรวจ', 'reviewedAt']),
    revision: Number(getValue(item, ['ครั้งที่แก้ไข', 'revision']) || 0),
    phone: getValue(item, ['เบอร์โทรศัพท์', 'phone']),
    members: getValue(item, ['สมาชิก', 'members']),
    updatedAt: getValue(item, ['วันที่อัปเดต', 'updatedAt']) || timestamp,
    updatedAtRaw: getValue(item, ['วันที่อัปเดต', 'updatedAt']) || timestamp,
    canResubmit: status === 'ไม่อนุมัติ'
  };
}

function normalizeStatus(status) {
  const value = String(status || '').trim();
  if (value.includes('ไม่อนุมัติ') || value.includes('ต้องแก้')) return 'ไม่อนุมัติ';
  if (value.includes('อนุมัติ') && !value.includes('ไม่')) return 'อนุมัติแล้ว';
  if (value.includes('แก้ไข') || value.includes('ตรวจอนุมัติ')) return 'รอการตรวจอนุมัติ';
  if (!value) return 'ยังไม่ส่ง';
  return value;
}

function buildLegacyStats(submissions) {
  return {
    total: submissions.length,
    pending: submissions.filter(item => item.status === 'รอตรวจ' || item.status === 'รออนุมัติ' || item.status === 'รอการตรวจอนุมัติ').length,
    rejected: submissions.filter(item => item.status === 'ไม่อนุมัติ').length,
    approved: submissions.filter(item => item.status === 'อนุมัติแล้ว').length
  };
}

function getValue(object, keys) {
  for (const key of keys) {
    if (object && object[key] != null && object[key] !== '') return String(object[key]).trim();
  }
  return '';
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
