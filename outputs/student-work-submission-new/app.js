const CONFIG = window.STUDENT_SUBMIT_CONFIG || {};
const STORAGE_KEY = 'projectflow_auth_v1';
const DEMO_KEY = 'projectflow_demo_data_v2';

const roleText = {
  student: 'นักเรียน',
  advisor: 'อาจารย์ที่ปรึกษา',
  co_advisor: 'อาจารย์ที่ปรึกษาร่วม',
  school_advisor: 'อาจารย์ที่ปรึกษาโรงเรียน',
  admin: 'ผู้ดูแลระบบ'
};

const requestTypes = {
  add_university_advisor: {
    label: 'เพิ่มอาจารย์ที่ปรึกษามหาวิทยาลัย',
    description: 'คำร้องประเภทนี้ปิดรับชั่วคราว',
    icon: '🏫',
    disabled: true
  },
  add_school_advisor: {
    label: 'เพิ่มอาจารย์ที่ปรึกษาโรงเรียน',
    description: 'คำร้องประเภทนี้ปิดรับชั่วคราว',
    icon: '🏫',
    disabled: true
  },
  withdraw_advisor: {
    label: 'ถอดถอนอาจารย์ที่ปรึกษา',
    description: 'คำร้องประเภทนี้ปิดรับชั่วคราว',
    icon: '🚫',
    disabled: true
  },
  project_name: {
    label: 'เปลี่ยนชื่อโครงงาน',
    description: 'ขอเปลี่ยนชื่อโครงงานภาษาไทยและ/หรืออังกฤษ',
    icon: '✏️'
  },
  project_branch: {
    label: 'เปลี่ยนสาขาโครงงาน',
    description: 'ขอเปลี่ยนสาขาหรือประเภทของโครงงาน',
    icon: '🔄'
  },
  other: {
    label: 'คำร้องอื่น ๆ',
    description: 'คำร้องอื่น ๆ ที่ไม่อยู่ในประเภทข้างต้น',
    icon: '📝'
  }
};

const state = {
  auth: null,
  dashboard: null,
  view: 'overview',
  requestWizard: {
    step: 1,
    type: '',
    payload: {},
    submitting: false
  }
};

const elements = {
  loginView: document.getElementById('loginView'),
  appView: document.getElementById('appView'),
  loginForm: document.getElementById('loginForm'),
  loginButton: document.getElementById('loginButton'),
  account: document.getElementById('account'),
  password: document.getElementById('password'),
  passwordModal: document.getElementById('passwordModal'),
  changePasswordForm: document.getElementById('changePasswordForm'),
  currentPassword: document.getElementById('currentPassword'),
  changeNewPassword: document.getElementById('changeNewPassword'),
  confirmNewPassword: document.getElementById('confirmNewPassword'),
  changePasswordButton: document.getElementById('changePasswordButton'),
  demoNotice: document.getElementById('demoNotice'),
  logoutButton: document.getElementById('logoutButton'),
  roleBadge: document.getElementById('roleBadge'),
  workspaceTitle: document.getElementById('workspaceTitle'),
  workspaceSubtitle: document.getElementById('workspaceSubtitle'),
  userInitial: document.getElementById('userInitial'),
  userName: document.getElementById('userName'),
  userEmail: document.getElementById('userEmail'),
  statsGrid: document.getElementById('statsGrid'),
  projectList: document.getElementById('projectList'),
  submissionList: document.getElementById('submissionList'),
  reviewQueue: document.getElementById('reviewQueue'),
  requestStatsGrid: document.getElementById('requestStatsGrid'),
  requestList: document.getElementById('requestList'),
  openRequestModalButton: document.getElementById('openRequestModalButton'),
  requestModal: document.getElementById('requestModal'),
  closeRequestModalButton: document.getElementById('closeRequestModalButton'),
  requestStepText: document.getElementById('requestStepText'),
  requestSteps: document.getElementById('requestSteps'),
  requestModalBody: document.getElementById('requestModalBody'),
  requestBackButton: document.getElementById('requestBackButton'),
  requestNextButton: document.getElementById('requestNextButton'),
  submitProject: document.getElementById('submitProject'),
  selectedProjectTitle: document.getElementById('selectedProjectTitle'),
  submitForm: document.getElementById('submitForm'),
  submitButton: document.getElementById('submitButton'),
  submissionFile: document.getElementById('submissionFile'),
  reminderButton: document.getElementById('reminderButton'),
  userForm: document.getElementById('userForm'),
  projectForm: document.getElementById('projectForm'),
  generateAccountsButton: document.getElementById('generateAccountsButton'),
  generatedCredential: document.getElementById('generatedCredential'),
  toast: document.getElementById('toast')
};

function boot() {
  const demoMode = isDemoMode();
  elements.demoNotice.textContent = demoMode ? 'โหมดทดสอบระบบ' : '';
  elements.demoNotice.classList.toggle('hidden', !demoMode);

  state.auth = getAuth();
  bindEvents();

  if (hasStoredAuth(state.auth)) {
    renderLoadingShell();
    showApp();
    loadDashboard({ restore: true });
  } else {
    showLogin();
  }
}

function bindEvents() {
  elements.loginForm.addEventListener('submit', handleLogin);
  elements.changePasswordForm.addEventListener('submit', handleChangePassword);
  elements.logoutButton.addEventListener('click', logout);
  elements.submitForm.addEventListener('submit', handleSubmitWork);
  elements.submitProject.addEventListener('change', updateSelectedProjectTitle);
  elements.openRequestModalButton.addEventListener('click', openRequestModal);
  elements.closeRequestModalButton.addEventListener('click', closeRequestModal);
  elements.requestBackButton.addEventListener('click', previousRequestStep);
  elements.requestNextButton.addEventListener('click', nextRequestStep);
  elements.requestModal.addEventListener('click', event => {
    if (event.target === elements.requestModal) closeRequestModal();
  });
  elements.requestModalBody.addEventListener('click', event => {
    const typeButton = event.target.closest('[data-request-type]');
    if (!typeButton) return;
    selectRequestType(typeButton.dataset.requestType);
  });
  elements.requestModalBody.addEventListener('change', event => {
    if (event.target.id === 'requestProjectId') updateRequestCurrentBranch();
  });
  elements.reminderButton.addEventListener('click', handleReminder);
  elements.userForm.addEventListener('submit', handleCreateUser);
  elements.projectForm.addEventListener('submit', handleCreateProject);
  elements.generateAccountsButton.addEventListener('click', handleGenerateStudentAccounts);

  document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => switchView(button.dataset.view));
  });

  document.addEventListener('click', event => {
    const actionButton = event.target.closest('[data-review-action]');
    if (actionButton) {
      const submissionId = actionButton.dataset.submissionId;
      const status = actionButton.dataset.reviewAction;
      reviewSubmission(submissionId, status);
      return;
    }

    const signButton = event.target.closest('[data-sign-request]');
    if (signButton) {
      signRequest(signButton.dataset.signRequest);
    }
  });
}

async function handleLogin(event) {
  event.preventDefault();
  setBusy(elements.loginButton, true, 'กำลังเข้าสู่ระบบ...');

  try {
    const result = await api('login', {
      account: elements.account.value.trim(),
      password: elements.password.value
    });
    state.auth = { token: result.token, user: result.user };
    saveAuth(state.auth);
    renderLoadingShell();
    showApp();
    const loaded = await loadDashboard({ restore: true });
    if (!loaded) return;
    if (state.auth.user?.mustChangePassword) {
      showPasswordModal();
      toast('กรุณาเปลี่ยนรหัสผ่านก่อนเริ่มใช้งานครั้งแรก');
    } else {
      toast(`ยินดีต้อนรับ ${result.user.name}`);
    }
  } catch (error) {
    toast(error.message, true);
  } finally {
    setBusy(elements.loginButton, false, 'เข้าสู่ระบบ');
  }
}

async function loadDashboard(options = {}) {
  try {
    state.dashboard = await api('dashboard');
    if (state.dashboard.user && state.auth) {
      state.auth.user = state.dashboard.user;
      saveAuth(state.auth);
    }
    render();
    maybeForcePasswordChange();
    return true;
  } catch (error) {
    if (options.restore || isAuthError(error)) {
      clearAuth();
      showLogin();
      toast('เซสชันหมดอายุหรือโหลดข้อมูลไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่', true);
      return false;
    }
    toast(error.message, true);
    return false;
  }
}

async function handleChangePassword(event) {
  event.preventDefault();
  const currentPassword = elements.currentPassword.value;
  const newPassword = elements.changeNewPassword.value;
  const confirmPassword = elements.confirmNewPassword.value;

  try {
    if (newPassword.length < 4) throw new Error('รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัว');
    if (newPassword !== confirmPassword) throw new Error('ยืนยันรหัสผ่านใหม่ไม่ตรงกัน');
    setBusy(elements.changePasswordButton, true, 'กำลังบันทึก...');
    const result = await api('changePassword', { currentPassword, newPassword });
    state.auth.user = result.user || { ...state.auth.user, mustChangePassword: false };
    saveAuth(state.auth);
    elements.changePasswordForm.reset();
    hidePasswordModal();
    toast('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
  } catch (error) {
    toast(error.message, true);
  } finally {
    setBusy(elements.changePasswordButton, false, 'บันทึกรหัสผ่านใหม่');
  }
}

async function handleSubmitWork(event) {
  event.preventDefault();
  setBusy(elements.submitButton, true, 'กำลังส่งงาน...');

  try {
    const selectedFile = elements.submissionFile.files[0];
    if (!selectedFile) throw new Error('กรุณาอัปโหลดไฟล์ PDF');
    if (!isPdfFile(selectedFile)) throw new Error('อัปโหลดได้เฉพาะไฟล์ PDF เท่านั้น');
    const filePayload = selectedFile ? await readFilePayload(selectedFile) : {};

    await api('submitWork', {
      projectId: elements.submitProject.value,
      workType: document.getElementById('workType').value,
      title: document.getElementById('submissionTitle').value.trim(),
      note: document.getElementById('studentNote').value.trim(),
      ...filePayload
    });
    elements.submitForm.reset();
    updateSelectedProjectTitle();
    toast('ส่งงานเรียบร้อยและแจ้งอาจารย์ทางอีเมลแล้ว');
    await loadDashboard();
    switchView('overview');
  } catch (error) {
    toast(error.message, true);
  } finally {
    setBusy(elements.submitButton, false, 'ส่งงานให้อาจารย์');
  }
}

async function reviewSubmission(submissionId, status) {
  const note = window.prompt(status === 'อนุมัติ' ? 'ข้อความถึงนักเรียน (ถ้ามี)' : 'ระบุสิ่งที่ต้องแก้ไข');
  if (note === null) return;

  try {
    await api('reviewSubmission', { submissionId, status, note });
    toast(status === 'อนุมัติ' ? 'อนุมัติงานและแจ้งนักเรียนแล้ว' : 'ส่งงานกลับให้นักเรียนแก้ไขแล้ว');
    await loadDashboard();
  } catch (error) {
    toast(error.message, true);
  }
}

async function handleReminder() {
  try {
    const result = await api('sendReminder', {});
    toast(`ส่งอีเมลเตือนแล้ว ${result.count || 0} รายการ`);
  } catch (error) {
    toast(error.message, true);
  }
}

async function handleCreateUser(event) {
  event.preventDefault();
  try {
    const result = await api('createUser', {
      userId: document.getElementById('newUserId').value.trim(),
      password: document.getElementById('newPassword').value,
      role: document.getElementById('newRole').value,
      name: document.getElementById('newName').value.trim(),
      email: document.getElementById('newEmail').value.trim(),
      studentId: document.getElementById('newStudentId').value.trim(),
      school: document.getElementById('newSchool').value.trim()
    });
    elements.userForm.reset();
    renderCredentials(result.credentials ? [result.credentials] : []);
    toast(result.credentials?.generated ? 'เพิ่มผู้ใช้งานและ Gen Password แล้ว' : 'เพิ่มผู้ใช้งานแล้ว');
    await loadDashboard();
  } catch (error) {
    toast(error.message, true);
  }
}

async function handleGenerateStudentAccounts() {
  try {
    const result = await api('generateStudentAccounts', {});
    renderCredentials(result.credentials || []);
    toast(`Gen Password นักเรียนแล้ว ${result.credentials?.length || 0} บัญชี`);
    await loadDashboard();
  } catch (error) {
    toast(error.message, true);
  }
}

async function handleCreateProject(event) {
  event.preventDefault();
  try {
    await api('createProject', {
      projectId: document.getElementById('newProjectId').value.trim(),
      title: document.getElementById('newProjectTitle').value.trim(),
      studentIds: document.getElementById('newProjectStudents').value.trim(),
      studentNames: document.getElementById('newProjectStudentNames').value.trim(),
      advisorId: document.getElementById('newAdvisorId').value.trim(),
      coAdvisorId: document.getElementById('newCoAdvisorId').value.trim(),
      schoolAdvisorId: document.getElementById('newSchoolAdvisorId').value.trim(),
      school: document.getElementById('newProjectSchool').value.trim(),
      dueDate: document.getElementById('newDueDate').value
    });
    elements.projectForm.reset();
    toast('เพิ่มโครงงานแล้ว');
    await loadDashboard();
  } catch (error) {
    toast(error.message, true);
  }
}

function renderCredentials(credentials) {
  if (!credentials.length) {
    elements.generatedCredential.classList.add('hidden');
    elements.generatedCredential.innerHTML = '';
    return;
  }

  elements.generatedCredential.classList.remove('hidden');
  elements.generatedCredential.innerHTML = `
    <strong>บัญชีที่สร้างล่าสุด</strong>
    <span>รหัสผ่านนักเรียนเป็นรหัสชั่วคราว 4 ตัว และต้องเปลี่ยนเมื่อเข้าใช้ครั้งแรก</span>
    ${credentials.map(item => `
      <div>
        ${escapeHtml(item.name || item.userId)}:
        USER <code>${escapeHtml(item.userId)}</code>
        PASS <code>${escapeHtml(item.password)}</code>
      </div>
    `).join('')}
  `;
}

function render() {
  const user = state.auth.user;
  const data = state.dashboard || {};
  const projects = data.projects || [];
  const submissions = data.submissions || [];
  const queue = data.reviewQueue || [];
  const requests = data.requests || [];

  elements.roleBadge.textContent = roleText[user.role] || user.role;
  elements.workspaceTitle.textContent = `สวัสดี ${user.name}`;
  elements.workspaceSubtitle.textContent = getSubtitle(user.role);
  elements.userName.textContent = user.name;
  elements.userEmail.textContent = user.email || user.userId || '-';
  elements.userInitial.textContent = (user.name || user.userId || 'U').trim().charAt(0).toUpperCase();

  renderStats(data.stats || deriveStats(projects, submissions, queue));
  renderProjects(projects);
  renderSubmissions(submissions);
  renderReviewQueue(queue);
  renderRequests(requests, data.requestStats || deriveRequestStats(requests));
  renderSubmitOptions(projects);
  applyRoleVisibility(user.role);
}

function renderStats(stats) {
  const items = [
    ['โครงงาน', stats.projects || 0],
    ['ส่งแล้ว', stats.submitted || 0],
    ['รอตรวจ', stats.pending || 0],
    ['อนุมัติแล้ว', stats.approved || 0]
  ];

  elements.statsGrid.innerHTML = items.map(([label, value]) => `
    <div class="stat-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join('');
}

function renderProjects(projects) {
  if (!projects.length) {
    elements.projectList.innerHTML = emptyState('ยังไม่มีโครงงานในบัญชีนี้');
    return;
  }

  elements.projectList.innerHTML = projects.map(project => {
    const projectCode = String(project.projectId || '').trim();
    return `
    <article class="project-card">
      <div class="project-card-head">
        <span class="project-code">${escapeHtml(project.projectId)}</span>
        <span class="status-chip ${statusClass(project.status)}">${escapeHtml(project.status || 'กำลังดำเนินการ')}</span>
      </div>
      <h3>${escapeHtml(project.title || project.projectId)}</h3>
      <p class="student-line">${escapeHtml(project.studentNames || project.studentIds || 'ยังไม่ระบุนักเรียน')}</p>
      <div class="advisor-grid">
        ${advisorBlock('อาจารย์ที่ปรึกษาหลัก', project.advisorName || project.advisorId)}
        ${advisorBlock('อาจารย์ที่ปรึกษาร่วม', project.coAdvisorName || project.coAdvisorId)}
        ${advisorBlock('อาจารย์ที่ปรึกษาโรงเรียน', project.schoolAdvisorName || project.schoolAdvisorId)}
      </div>
      <div class="meta-row">
        ${projectCode ? `<span class="pill project-id-pill">รหัสโครงงาน ${escapeHtml(projectCode)}</span>` : ''}
        ${project.dueDate ? `<span class="pill warning">กำหนด ${formatDate(project.dueDate)}</span>` : ''}
      </div>
    </article>
  `;
  }).join('');
}

function advisorBlock(label, value) {
  const name = String(value || '').trim();
  return `
    <div class="advisor-item ${name ? '' : 'is-empty'}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(name || 'ยังไม่ระบุ')}</strong>
    </div>
  `;
}

function renderSubmissions(submissions) {
  if (!submissions.length) {
    elements.submissionList.innerHTML = emptyState('ยังไม่มีประวัติการส่งงาน');
    return;
  }

  elements.submissionList.innerHTML = submissions.map(item => `
    <article class="submission-card">
      <div class="meta-row">
        <span class="pill ${statusClass(item.status)}">${escapeHtml(item.status || 'ส่งแล้ว')}</span>
        <span class="pill">${escapeHtml(item.workType || '-')}</span>
        <span class="pill">${formatDate(item.createdAt || item.updatedAt)}</span>
      </div>
      <h3>${escapeHtml(item.title || item.projectId)}</h3>
      <p>${escapeHtml(item.note || 'ไม่มีหมายเหตุ')}</p>
      ${item.reviewerNote ? `<p><strong>ข้อเสนอแนะ:</strong> ${escapeHtml(item.reviewerNote)}</p>` : ''}
      ${item.fileUrl ? `<a href="${escapeAttribute(item.fileUrl)}" target="_blank" rel="noopener">เปิดไฟล์งาน</a>` : ''}
    </article>
  `).join('');
}

function renderReviewQueue(queue) {
  if (!queue.length) {
    elements.reviewQueue.innerHTML = emptyState('ไม่มีงานรอตรวจตอนนี้ สงบเหมือนโต๊ะทำงานก่อนเปิดเทอม');
    return;
  }

  elements.reviewQueue.innerHTML = queue.map(item => `
    <article class="review-card">
      <div class="meta-row">
        <span class="pill ${statusClass(item.status)}">${escapeHtml(item.status)}</span>
        <span class="pill">${escapeHtml(item.workType || '-')}</span>
        <span class="pill">${formatDate(item.createdAt)}</span>
      </div>
      <h3>${escapeHtml(item.title || item.projectTitle || item.projectId)}</h3>
      <p>${escapeHtml(item.studentNames || item.studentId || '-')}</p>
      <p>${escapeHtml(item.note || 'ไม่มีหมายเหตุจากนักเรียน')}</p>
      <div class="review-actions">
        ${item.fileUrl ? `<a class="mini-button link" href="${escapeAttribute(item.fileUrl)}" target="_blank" rel="noopener">เปิดไฟล์</a>` : ''}
        <button class="mini-button approve" data-review-action="อนุมัติ" data-submission-id="${escapeAttribute(item.submissionId)}">อนุมัติ</button>
        <button class="mini-button revise" data-review-action="ขอแก้ไข" data-submission-id="${escapeAttribute(item.submissionId)}">ส่งแก้ไข</button>
      </div>
    </article>
  `).join('');
}

function renderRequests(requests, stats) {
  renderRequestStats(stats || deriveRequestStats(requests));

  if (!requests.length) {
    elements.requestList.innerHTML = `
      <div class="request-empty">
        <strong>ยังไม่มีคำร้องในหมวดนี้</strong>
        <span>เริ่มจากการกด “ยื่นคำร้องใหม่” เพื่อสร้างรายการแรก</span>
      </div>
    `;
    return;
  }

  elements.requestList.innerHTML = requests.map(request => {
    const payload = request.payloadData || {};
    const signatures = request.signaturesData || [];
    const signed = signatures.filter(item => item.status === 'signed').length;
    const total = signatures.length || 1;
    return `
      <article class="request-card">
        <div class="request-card-head">
          <span class="request-type">${escapeHtml(request.typeText || requestTypeLabel(request.requestType))}</span>
          <span class="pill ${requestStatusClass(request.status)}">${escapeHtml(request.status || 'รอดำเนินการ')}</span>
        </div>
        <h3>${escapeHtml(request.projectTitle || request.projectId)}</h3>
        <p>${escapeHtml(requestDetailText(request, payload))}</p>
        <div class="request-progress">
          <span style="width:${Math.round((signed / total) * 100)}%"></span>
        </div>
        <div class="request-meta">
          <span>ลายเซ็น ${escapeHtml(request.progressText || `${signed}/${total}`)}</span>
          <span>คิวถัดไป: ${escapeHtml(request.currentSignerName || 'ครบทุกลำดับ')}</span>
          <span>${formatDate(request.createdAt)}</span>
        </div>
        <div class="signature-list">
          ${signatures.map(signer => `
            <span class="${signer.status === 'signed' ? 'is-signed' : ''}">
              ${escapeHtml(signer.label)} · ${escapeHtml(signer.name || '-')}
            </span>
          `).join('')}
        </div>
        ${request.canSign ? `
          <button class="primary-button request-sign-button" type="button" data-sign-request="${escapeAttribute(request.requestId)}">
            เซ็นอิเล็กทรอนิกส์
          </button>
        ` : ''}
      </article>
    `;
  }).join('');
}

function renderRequestStats(stats) {
  const items = [
    ['ทั้งหมด', stats.total || 0],
    ['รอดำเนินการ', stats.pending || 0],
    ['อนุมัติแล้ว', stats.approved || 0],
    ['ปฏิเสธแล้ว', stats.rejected || 0]
  ];
  elements.requestStatsGrid.innerHTML = items.map(([label, value]) => `
    <div class="request-stat-card">
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
    </div>
  `).join('');
}

function deriveRequestStats(requests) {
  return {
    total: requests.length,
    pending: requests.filter(item => item.status === 'รอดำเนินการ').length,
    approved: requests.filter(item => item.status === 'อนุมัติแล้ว').length,
    rejected: requests.filter(item => item.status === 'ปฏิเสธแล้ว').length
  };
}

function requestDetailText(request, payload) {
  if (request.requestType === 'project_name') {
    return `ชื่อใหม่: ${payload.newTitleTh || payload.newTitleEn || '-'}`;
  }
  if (request.requestType === 'project_branch') {
    return `สาขาปัจจุบัน ${payload.currentBranch || '-'} → สาขาใหม่ ${payload.newBranch || '-'}`;
  }
  return payload.otherSubject || payload.otherDetail || 'คำร้องอื่น ๆ';
}

function requestTypeLabel(type) {
  return requestTypes[type]?.label || 'คำร้องทั่วไป';
}

function requestStatusClass(status) {
  if (status === 'อนุมัติแล้ว') return 'success';
  if (status === 'ปฏิเสธแล้ว') return 'danger';
  return 'warning';
}

function openRequestModal() {
  if (state.auth?.user?.role !== 'student') {
    toast('เฉพาะนักเรียนเท่านั้นที่ยื่นคำร้องใหม่ได้', true);
    return;
  }
  if (!(state.dashboard?.projects || []).length) {
    toast('ไม่พบโครงงานในบัญชีนี้', true);
    return;
  }
  state.requestWizard = {
    step: 1,
    type: '',
    payload: {},
    submitting: false
  };
  elements.requestModal.classList.remove('hidden');
  renderRequestModal();
}

function closeRequestModal() {
  elements.requestModal.classList.add('hidden');
}

function selectRequestType(type) {
  if (requestTypes[type]?.disabled) return;
  state.requestWizard.type = type;
  renderRequestModal();
}

function previousRequestStep() {
  if (state.requestWizard.step === 1) {
    closeRequestModal();
    return;
  }
  if (state.requestWizard.step === 4) {
    closeRequestModal();
    return;
  }
  state.requestWizard.step -= 1;
  renderRequestModal();
}

async function nextRequestStep() {
  try {
    if (state.requestWizard.step === 1) {
      if (!state.requestWizard.type) throw new Error('กรุณาเลือกประเภทคำร้อง');
      state.requestWizard.step = 2;
      renderRequestModal();
      return;
    }
    if (state.requestWizard.step === 2) {
      state.requestWizard.payload = collectRequestFormData();
      state.requestWizard.step = 3;
      renderRequestModal();
      return;
    }
    if (state.requestWizard.step === 3) {
      const signature = document.getElementById('ownerSignatureName').value.trim();
      const accepted = document.getElementById('ownerSignatureConfirm').checked;
      if (!signature) throw new Error('กรุณาพิมพ์ชื่อเพื่อเซ็นอิเล็กทรอนิกส์');
      if (!accepted) throw new Error('กรุณายืนยันการเซ็นอิเล็กทรอนิกส์');
      state.requestWizard.submitting = true;
      renderRequestModal();
      await api('createRequest', {
        ...state.requestWizard.payload,
        requestType: state.requestWizard.type,
        ownerSignature: signature
      });
      await loadDashboard();
      state.requestWizard.step = 4;
      state.requestWizard.submitting = false;
      renderRequestModal();
      toast('ยื่นคำร้องแล้ว และส่งอีเมลแจ้งผู้เซ็นลำดับถัดไป');
      return;
    }
    closeRequestModal();
  } catch (error) {
    state.requestWizard.submitting = false;
    renderRequestModal();
    toast(error.message, true);
  }
}

function renderRequestModal() {
  const step = state.requestWizard.step;
  elements.requestStepText.textContent = `ขั้นตอนที่ ${Math.min(step, 4)}/4`;
  elements.requestSteps.innerHTML = [1, 2, 3, 4].map(number => `
    <span class="${number < step ? 'done' : ''} ${number === step ? 'active' : ''}">${number < step ? '✓' : number}</span>
  `).join('');

  if (step === 1) {
    elements.requestModalBody.innerHTML = requestTypeStepMarkup();
    elements.requestBackButton.textContent = 'ยกเลิก';
    elements.requestNextButton.textContent = 'ถัดไป';
  }
  if (step === 2) {
    elements.requestModalBody.innerHTML = requestFormStepMarkup();
    elements.requestBackButton.textContent = 'ย้อนกลับ';
    elements.requestNextButton.textContent = 'ถัดไป';
    updateRequestCurrentBranch();
  }
  if (step === 3) {
    elements.requestModalBody.innerHTML = requestSignatureStepMarkup();
    elements.requestBackButton.textContent = 'ย้อนกลับ';
    elements.requestNextButton.textContent = state.requestWizard.submitting ? 'กำลังส่งคำร้อง...' : 'ส่งคำร้องและเซ็น';
  }
  if (step === 4) {
    elements.requestModalBody.innerHTML = `
      <div class="request-success">
        <strong>ส่งคำร้องเรียบร้อย</strong>
        <span>ระบบบันทึกลายเซ็นของผู้ยื่นคำร้องแล้ว และแจ้งผู้เซ็นลำดับถัดไปทางอีเมล</span>
      </div>
    `;
    elements.requestBackButton.textContent = 'ปิด';
    elements.requestNextButton.textContent = 'เสร็จสิ้น';
  }
  elements.requestNextButton.disabled = state.requestWizard.submitting;
}

function requestTypeStepMarkup() {
  const ordered = ['add_university_advisor', 'add_school_advisor', 'withdraw_advisor', 'project_name', 'project_branch', 'other'];
  return `
    <h3>เลือกประเภทคำร้องที่ต้องการยื่น</h3>
    <div class="request-warning">
      ขณะนี้ปิดรับคำร้องเพิ่ม/ถอดถอนอาจารย์ที่ปรึกษา คำร้องเปลี่ยนชื่อ เปลี่ยนสาขา และคำร้องอื่น ๆ ยังยื่นได้ตามปกติ
    </div>
    <div class="request-type-list">
      ${ordered.map(type => {
        const item = requestTypes[type];
        return `
          <button class="request-type-card ${state.requestWizard.type === type ? 'selected' : ''} ${item.disabled ? 'disabled' : ''}" type="button" data-request-type="${type}">
            <span>${item.icon}</span>
            <strong>${escapeHtml(item.label)}</strong>
            <small>${escapeHtml(item.description)}</small>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function requestFormStepMarkup() {
  const type = state.requestWizard.type;
  const payload = state.requestWizard.payload || {};
  const projects = state.dashboard?.projects || [];
  const selectedProjectId = payload.projectId || projects[0]?.projectId || '';
  return `
    <div class="request-selected-type">
      <span>${requestTypes[type]?.icon || '📝'}</span>
      <strong>${escapeHtml(requestTypeLabel(type))}</strong>
    </div>
    <label class="full-field">
      โครงงาน
      <select id="requestProjectId" required>
        ${projects.map(project => `
          <option value="${escapeAttribute(project.projectId)}" ${project.projectId === selectedProjectId ? 'selected' : ''}>
            ${escapeHtml(project.projectId)} — ${escapeHtml(project.title || project.projectId)}
          </option>
        `).join('')}
      </select>
    </label>
    <div class="request-owner-grid">
      <strong>ข้อมูลผู้ยื่นคำร้อง</strong>
      <label>คำนำหน้า * <input id="requestPrefix" value="${escapeAttribute(payload.prefix || '')}" placeholder="เช่น นาย / นางสาว" required></label>
      <label>รุ่น วมว. * <input id="requestClassLevel" value="${escapeAttribute(payload.classLevel || '')}" placeholder="เช่น 15" required></label>
      <label>เบอร์ติดต่อ * <input id="requestPhone" value="${escapeAttribute(payload.phone || '')}" placeholder="0818834211" required></label>
    </div>
    ${requestDynamicFieldsMarkup(type, payload, selectedProjectId)}
  `;
}

function requestDynamicFieldsMarkup(type, payload, projectId) {
  const project = (state.dashboard?.projects || []).find(item => item.projectId === projectId) || {};
  if (type === 'project_name') {
    return `
      <label class="full-field">ชื่อโครงงานใหม่ (ภาษาไทย)
        <input id="requestNewTitleTh" value="${escapeAttribute(payload.newTitleTh || '')}" placeholder="ชื่อโครงงานภาษาไทย">
      </label>
      <label class="full-field">ชื่อโครงงานใหม่ (ภาษาอังกฤษ)
        <input id="requestNewTitleEn" value="${escapeAttribute(payload.newTitleEn || '')}" placeholder="Project Name in English">
      </label>
      <label class="full-field">เหตุผล *
        <textarea id="requestReason" rows="4" placeholder="ระบุเหตุผลในการขอเปลี่ยนชื่อ..." required>${escapeHtml(payload.reason || '')}</textarea>
      </label>
    `;
  }
  if (type === 'project_branch') {
    return `
      <label class="full-field">สาขาปัจจุบัน (ดึงจากข้อมูลโครงงาน)
        <input id="requestCurrentBranch" value="${escapeAttribute(project.school || '')}" readonly>
      </label>
      <label class="full-field">สาขาใหม่ *
        <input id="requestNewBranch" value="${escapeAttribute(payload.newBranch || '')}" placeholder="สาขาวิชาที่ต้องการเปลี่ยน" required>
      </label>
      <label class="full-field">เหตุผล *
        <textarea id="requestReason" rows="4" placeholder="ระบุเหตุผลในการขอเปลี่ยนสาขา..." required>${escapeHtml(payload.reason || '')}</textarea>
      </label>
    `;
  }
  return `
    <label class="full-field">หัวข้อคำร้อง *
      <input id="requestOtherSubject" value="${escapeAttribute(payload.otherSubject || '')}" placeholder="ระบุหัวข้อคำร้อง" required>
    </label>
    <label class="full-field">รายละเอียดคำร้อง *
      <textarea id="requestOtherDetail" rows="5" placeholder="อธิบายรายละเอียดคำร้องและเหตุผล..." required>${escapeHtml(payload.otherDetail || '')}</textarea>
    </label>
  `;
}

function requestSignatureStepMarkup() {
  const user = state.auth?.user || {};
  return `
    <div class="signature-panel">
      <h3>เซ็นอิเล็กทรอนิกส์โดยผู้ยื่นคำร้อง</h3>
      <p>เมื่อเซ็นแล้ว ระบบจะส่งอีเมลแจ้งผู้เซ็นลำดับถัดไป และแสดงคำร้องในเมนูคำร้องทั่วไป</p>
      <div class="signature-flow">
        <span>ผู้ยื่น</span><span>เพื่อน</span><span>อาจารย์หลัก</span><span>อาจารย์ร่วม</span><span>อาจารย์โรงเรียน</span><span>admin</span>
      </div>
      <label class="full-field">พิมพ์ชื่อ-สกุลเพื่อเซ็น *
        <input id="ownerSignatureName" value="${escapeAttribute(user.name || '')}" required>
      </label>
      <label class="check-line">
        <input id="ownerSignatureConfirm" type="checkbox">
        <span>ข้าพเจ้าขอยืนยันว่าข้อมูลในคำร้องนี้ถูกต้อง และยอมรับการใช้ลายเซ็นอิเล็กทรอนิกส์</span>
      </label>
    </div>
  `;
}

function collectRequestFormData() {
  const type = state.requestWizard.type;
  const payload = {
    projectId: document.getElementById('requestProjectId').value,
    prefix: document.getElementById('requestPrefix').value.trim(),
    classLevel: document.getElementById('requestClassLevel').value.trim(),
    phone: document.getElementById('requestPhone').value.trim()
  };
  if (!payload.projectId || !payload.prefix || !payload.classLevel || !payload.phone) {
    throw new Error('กรุณากรอกข้อมูลผู้ยื่นคำร้องให้ครบ');
  }
  if (type === 'project_name') {
    payload.newTitleTh = document.getElementById('requestNewTitleTh').value.trim();
    payload.newTitleEn = document.getElementById('requestNewTitleEn').value.trim();
    payload.reason = document.getElementById('requestReason').value.trim();
    if (!payload.newTitleTh && !payload.newTitleEn) throw new Error('กรุณากรอกชื่อโครงงานใหม่');
    if (!payload.reason) throw new Error('กรุณาระบุเหตุผล');
  } else if (type === 'project_branch') {
    payload.newBranch = document.getElementById('requestNewBranch').value.trim();
    payload.reason = document.getElementById('requestReason').value.trim();
    if (!payload.newBranch) throw new Error('กรุณากรอกสาขาใหม่');
    if (!payload.reason) throw new Error('กรุณาระบุเหตุผล');
  } else {
    payload.otherSubject = document.getElementById('requestOtherSubject').value.trim();
    payload.otherDetail = document.getElementById('requestOtherDetail').value.trim();
    if (!payload.otherSubject || !payload.otherDetail) throw new Error('กรุณากรอกหัวข้อและรายละเอียดคำร้อง');
  }
  return payload;
}

function updateRequestCurrentBranch() {
  const branchInput = document.getElementById('requestCurrentBranch');
  const projectSelect = document.getElementById('requestProjectId');
  if (!branchInput || !projectSelect) return;
  const project = (state.dashboard?.projects || []).find(item => item.projectId === projectSelect.value);
  branchInput.value = project?.school || '';
}

async function signRequest(requestId) {
  const signature = window.prompt('พิมพ์ชื่อ-สกุลเพื่อเซ็นอิเล็กทรอนิกส์');
  if (signature === null) return;
  try {
    await api('signRequest', { requestId, signature: signature.trim() });
    toast('เซ็นคำร้องเรียบร้อย และแจ้งผู้เซ็นลำดับถัดไปแล้ว');
    await loadDashboard();
  } catch (error) {
    toast(error.message, true);
  }
}

function renderSubmitOptions(projects) {
  elements.submitProject.innerHTML = projects.map(project => `
    <option value="${escapeAttribute(project.projectId)}">${escapeHtml(project.projectId)} — ${escapeHtml(project.title || project.projectId)}</option>
  `).join('');
  updateSelectedProjectTitle();
}

function updateSelectedProjectTitle() {
  if (!elements.selectedProjectTitle) return;
  const selectedProjectId = elements.submitProject.value;
  const project = (state.dashboard?.projects || []).find(item => item.projectId === selectedProjectId);
  if (!project) {
    elements.selectedProjectTitle.classList.add('hidden');
    elements.selectedProjectTitle.innerHTML = '';
    return;
  }
  elements.selectedProjectTitle.classList.remove('hidden');
  elements.selectedProjectTitle.innerHTML = `
    <strong>${escapeHtml(project.title || project.projectId)}</strong>
    <small>รหัสโครงงาน ${escapeHtml(project.projectId)}</small>
  `;
}

function applyRoleVisibility(role) {
  const isStudent = role === 'student';
  const isReviewer = ['advisor', 'co_advisor', 'school_advisor', 'admin'].includes(role);
  const isAdmin = role === 'admin';

  document.querySelector('[data-view="submit"]').classList.toggle('hidden', !isStudent);
  document.querySelector('[data-view="review"]').classList.toggle('hidden', !isReviewer);
  document.querySelector('[data-view="admin"]').classList.toggle('hidden', !isAdmin);
  elements.openRequestModalButton.classList.toggle('hidden', !isStudent);

  if ((state.view === 'submit' && !isStudent) || (state.view === 'review' && !isReviewer) || (state.view === 'admin' && !isAdmin)) {
    switchView('overview');
  }
}

function switchView(view) {
  state.view = view;
  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.add('hidden'));
  document.getElementById(`${view}Panel`).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
}

async function api(action, payload = {}) {
  if (isDemoMode()) return demoApi(action, payload);

  const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action,
      token: state.auth?.token || '',
      payload
    })
  });
  const data = await response.json();
  if (!data.ok) throw new Error(data.message || 'ระบบไม่สามารถทำรายการได้');
  return data.data || {};
}

function readFilePayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve({
        fileName: file.name,
        fileMimeType: file.type || 'application/octet-stream',
        fileData: result.includes(',') ? result.split(',').pop() : result
      });
    };
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.readAsDataURL(file);
  });
}

function isPdfFile(file) {
  const fileName = String(file?.name || '').toLowerCase();
  return file?.type === 'application/pdf' || fileName.endsWith('.pdf');
}

function isDemoMode() {
  return CONFIG.DEMO_MODE || !CONFIG.APPS_SCRIPT_URL || CONFIG.APPS_SCRIPT_URL.includes('PASTE_');
}

function hasStoredAuth(auth) {
  return Boolean(auth && auth.token && auth.user);
}

function showApp() {
  elements.loginView.classList.add('hidden');
  elements.appView.classList.remove('hidden');
}

function showLogin() {
  elements.appView.classList.add('hidden');
  elements.loginView.classList.remove('hidden');
  hidePasswordModal();
}

function renderLoadingShell() {
  const user = state.auth?.user || {};
  elements.roleBadge.textContent = 'Loading';
  elements.workspaceTitle.textContent = 'กำลังโหลดข้อมูลของคุณ';
  elements.workspaceSubtitle.textContent = 'กำลังเตรียมข้อมูลการส่งโครงงาน';
  elements.userName.textContent = user.name || 'กำลังโหลด';
  elements.userEmail.textContent = user.email || user.userId || '-';
  elements.userInitial.textContent = (user.name || user.userId || 'U').trim().charAt(0).toUpperCase();
  elements.statsGrid.innerHTML = [1, 2, 3, 4].map(() => `
    <div class="stat-card skeleton-card">
      <span></span>
      <strong></strong>
    </div>
  `).join('');
  elements.projectList.innerHTML = loadingState('กำลังโหลดโครงงานและทีมอาจารย์ที่ปรึกษา');
  elements.submissionList.innerHTML = loadingState('กำลังโหลดประวัติการส่งงาน');
  elements.reviewQueue.innerHTML = loadingState('กำลังโหลดรายการตรวจงาน');
  elements.requestStatsGrid.innerHTML = [1, 2, 3, 4].map(() => `
    <div class="request-stat-card skeleton-card">
      <span></span>
      <strong></strong>
    </div>
  `).join('');
  elements.requestList.innerHTML = loadingState('กำลังโหลดรายการคำร้อง');
  renderSubmitOptions([]);
  applyRoleVisibility(user.role || 'student');
}

function loadingState(text) {
  return `
    <div class="loading-state">
      <span></span>
      <strong>${escapeHtml(text)}</strong>
      <small>รอสักครู่ ระบบกำลังจัดข้อมูลให้เรียบร้อย</small>
    </div>
  `;
}

function isAuthError(error) {
  return /เข้าสู่ระบบ|เซสชัน|หมดอายุ|token|session|ไม่ถูกต้อง/i.test(error.message || '');
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
  state.auth = null;
  state.dashboard = null;
  state.view = 'overview';
}

function maybeForcePasswordChange() {
  if (state.auth?.user?.mustChangePassword) {
    showPasswordModal();
  } else {
    hidePasswordModal();
  }
}

function showPasswordModal() {
  elements.passwordModal.classList.remove('hidden');
  window.setTimeout(() => elements.currentPassword.focus(), 80);
}

function hidePasswordModal() {
  elements.passwordModal.classList.add('hidden');
}

function logout() {
  clearAuth();
  window.location.reload();
}

function saveAuth(auth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch (error) {
    return null;
  }
}

function setBusy(button, busy, label) {
  button.disabled = busy;
  button.textContent = label;
}

function toast(message, error = false) {
  elements.toast.textContent = message;
  elements.toast.classList.toggle('error', error);
  elements.toast.classList.add('show');
  window.setTimeout(() => elements.toast.classList.remove('show'), 3600);
}

function getSubtitle(role) {
  if (role === 'student') return 'ส่งงานใหม่ ติดตามผลตรวจ และดูข้อเสนอแนะจากอาจารย์';
  if (role === 'admin') return 'จัดการผู้ใช้งาน โครงงาน และภาพรวมการส่งงานทั้งหมด';
  return 'ตรวจงาน อนุมัติ ส่งแก้ไข และแจ้งเตือนนักเรียนผ่านอีเมล';
}

function deriveStats(projects, submissions, queue) {
  return {
    projects: projects.length,
    submitted: submissions.length,
    pending: queue.length || submissions.filter(item => ['ส่งแล้ว', 'รอตรวจ'].includes(item.status)).length,
    approved: submissions.filter(item => item.status === 'อนุมัติ').length
  };
}

function statusClass(status) {
  if (status === 'อนุมัติ') return 'success';
  if (status === 'ขอแก้ไข') return 'danger';
  return 'warning';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function emptyState(text) {
  return `<div class="empty-state">${escapeHtml(text)}</div>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#096;');
}

function getDemoStore() {
  const existing = localStorage.getItem(DEMO_KEY);
  if (existing) return JSON.parse(existing);

  const now = new Date().toISOString();
  const data = {
    users: [
      { userId: 'admin@example.com', password: 'admin123', role: 'admin', name: 'ผู้ดูแลระบบ', email: 'admin@example.com', mustChangePassword: false },
      { userId: '68983244', password: '1234', role: 'student', name: 'ณภัทร ใจดี', email: 'student@example.com', studentId: '68983244', school: 'โรงเรียนตัวอย่าง', mustChangePassword: true },
      { userId: 'advisor@example.com', password: 'demo123', role: 'advisor', name: 'ดร. ปรียา เมธากุล', email: 'advisor@example.com' }
    ],
    projects: [
      {
        projectId: 'PF-001',
        title: 'ระบบแจ้งเตือนคุณภาพน้ำด้วย IoT',
        studentIds: '68983244',
        studentNames: 'ณภัทร ใจดี',
        advisorId: 'advisor@example.com',
        coAdvisorId: '',
        schoolAdvisorId: '',
        dueDate: '2026-08-15',
        status: 'กำลังดำเนินการ'
      }
    ],
    submissions: [
      {
        submissionId: `S-${Date.now()}`,
        projectId: 'PF-001',
        title: 'ข้อเสนอโครงงานฉบับแรก',
        workType: 'ข้อเสนอโครงงาน',
        fileUrl: 'https://drive.google.com/',
        note: 'ส่งให้อาจารย์ช่วยตรวจโครงร่างและวัตถุประสงค์',
        status: 'ส่งแล้ว',
        studentId: '68983244',
        studentNames: 'ณภัทร ใจดี',
        createdAt: now,
        updatedAt: now
      }
    ]
  };
  localStorage.setItem(DEMO_KEY, JSON.stringify(data));
  return data;
}

function setDemoStore(data) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(data));
}

async function demoApi(action, payload) {
  await new Promise(resolve => window.setTimeout(resolve, 180));
  const store = getDemoStore();

  if (action === 'login') {
    const account = String(payload.account || '').trim().toLowerCase();
    const user = store.users.find(item => [item.userId, item.email, item.studentId].filter(Boolean).map(String).map(value => value.toLowerCase()).includes(account));
    if (!user || user.password !== payload.password) throw new Error('บัญชีผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    const { password, ...safeUser } = user;
    return { token: `demo-${safeUser.userId}-${Date.now()}`, user: safeUser };
  }

  if (!state.auth) throw new Error('กรุณาเข้าสู่ระบบ');

  if (action === 'dashboard') {
    return demoDashboard(store, state.auth.user);
  }

  if (action === 'changePassword') {
    const user = findDemoUser(store, state.auth.user.userId);
    if (!user || user.password !== payload.currentPassword) throw new Error('รหัสผ่านเดิมไม่ถูกต้อง');
    if (!payload.newPassword || payload.newPassword.length < 4) throw new Error('รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัว');
    if (payload.newPassword === payload.currentPassword) throw new Error('กรุณาตั้งรหัสผ่านใหม่ที่ไม่ซ้ำกับรหัสเดิม');
    user.password = payload.newPassword;
    user.mustChangePassword = false;
    setDemoStore(store);
    const { password, ...safeUser } = user;
    return { user: safeUser };
  }

  if (action === 'submitWork') {
    const project = store.projects.find(item => item.projectId === payload.projectId);
    const now = new Date().toISOString();
    if (!payload.fileName || !String(payload.fileName).toLowerCase().endsWith('.pdf')) throw new Error('อัปโหลดได้เฉพาะไฟล์ PDF เท่านั้น');
    const fileUrl = `https://drive.google.com/demo/${encodeURIComponent(payload.fileName)}`;
    store.submissions.unshift({
      submissionId: `S-${Date.now()}`,
      projectId: payload.projectId,
      title: payload.title,
      workType: payload.workType,
      fileUrl,
      note: payload.note,
      status: 'ส่งแล้ว',
      studentId: state.auth.user.studentId || state.auth.user.userId,
      studentNames: state.auth.user.name,
      projectTitle: project?.title || payload.projectId,
      createdAt: now,
      updatedAt: now
    });
    setDemoStore(store);
    return { ok: true };
  }

  if (action === 'reviewSubmission') {
    const submission = store.submissions.find(item => item.submissionId === payload.submissionId);
    if (!submission) throw new Error('ไม่พบรายการส่งงาน');
    submission.status = payload.status;
    submission.reviewerNote = payload.note;
    submission.updatedAt = new Date().toISOString();
    setDemoStore(store);
    return { ok: true };
  }

  if (action === 'sendReminder') {
    return { count: demoDashboard(store, state.auth.user).reviewQueue.length };
  }

  if (action === 'createUser') {
    const normalized = normalizeNewUser(payload);
    if (findDemoUser(store, normalized.userId) || findDemoUser(store, normalized.email) || findDemoUser(store, normalized.studentId)) throw new Error('มีบัญชีนี้แล้ว');
    store.users.push(normalized);
    setDemoStore(store);
    return {
      credentials: {
        userId: normalized.userId,
        password: normalized.password,
        name: normalized.name,
        generated: normalized.generated
      }
    };
  }

  if (action === 'generateStudentAccounts') {
    const credentials = [];
    store.projects.forEach(project => {
      const ids = splitValues(project.studentIds);
      const names = splitValues(project.studentNames);
      ids.forEach((studentId, index) => {
        if (findDemoUser(store, studentId)) return;
        const password = generateDemoPassword();
        const user = {
          userId: studentId,
          password,
          role: 'student',
          name: names[index] || studentId,
          email: '',
          studentId,
          school: project.school || '',
          generated: true,
          mustChangePassword: true
        };
        store.users.push(user);
        credentials.push({ userId: studentId, password, name: user.name, generated: true, mustChangePassword: true });
      });
    });
    setDemoStore(store);
    return { credentials };
  }

  if (action === 'createProject') {
    if (store.projects.some(item => item.projectId === payload.projectId)) throw new Error('มีรหัสโครงงานนี้แล้ว');
    store.projects.push({ ...payload, status: 'กำลังดำเนินการ' });
    setDemoStore(store);
    return { ok: true };
  }

  throw new Error('ยังไม่รองรับคำสั่งนี้');
}

function normalizeNewUser(payload) {
  const role = payload.role || 'student';
  const generated = !payload.password;
  const password = payload.password || generateDemoPassword();
  const email = String(payload.email || '').trim();
  const studentId = String(payload.studentId || '').trim();

  if (role === 'student') {
    if (!studentId && !payload.userId) throw new Error('นักเรียนต้องมีรหัสนักเรียน');
    return {
      ...payload,
      userId: studentId || payload.userId,
      studentId: studentId || payload.userId,
      password,
      generated,
      mustChangePassword: true
    };
  }

  if (!email && !payload.userId) throw new Error('admin/อาจารย์ต้องใช้อีเมลเป็น USER');
  return {
    ...payload,
    userId: email || payload.userId,
    email: email || payload.userId,
    password,
    generated,
    mustChangePassword: false
  };
}

function findDemoUser(store, account) {
  const key = String(account || '').trim().toLowerCase();
  if (!key) return null;
  return store.users.find(item => [item.userId, item.email, item.studentId].filter(Boolean).map(String).map(value => value.toLowerCase()).includes(key)) || null;
}

function generateDemoPassword() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('');
}

function demoDashboard(store, user) {
  const projects = filterProjects(store.projects, user);
  const allowedIds = new Set(projects.map(item => item.projectId));
  const submissions = store.submissions.filter(item => user.role === 'admin' || allowedIds.has(item.projectId));
  const reviewQueue = ['advisor', 'co_advisor', 'school_advisor', 'admin'].includes(user.role)
    ? submissions.filter(item => ['ส่งแล้ว', 'รอตรวจ'].includes(item.status))
    : [];

  return {
    user,
    projects,
    submissions,
    reviewQueue,
    stats: deriveStats(projects, submissions, reviewQueue)
  };
}

function filterProjects(projects, user) {
  if (user.role === 'admin') return projects;
  if (user.role === 'student') {
    const key = user.studentId || user.userId;
    return projects.filter(project => splitValues(project.studentIds).includes(key));
  }
  if (user.role === 'advisor') return projects.filter(project => project.advisorId === user.userId);
  if (user.role === 'co_advisor') return projects.filter(project => project.coAdvisorId === user.userId);
  if (user.role === 'school_advisor') return projects.filter(project => project.schoolAdvisorId === user.userId || project.school === user.school);
  return [];
}

function splitValues(value) {
  return String(value || '').split(',').map(item => item.trim()).filter(Boolean);
}

boot();
