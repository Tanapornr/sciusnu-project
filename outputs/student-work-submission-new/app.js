const CONFIG = window.STUDENT_SUBMIT_CONFIG || {};
const STORAGE_KEY = 'projectflow_auth_v1';
const DEMO_KEY = 'projectflow_demo_data_v2';
const DEFAULT_VIEW = document.body.dataset.defaultView || '';

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
  defaultViewApplied: false,
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
  enhanceLoginView();
  const demoMode = isDemoMode();
  elements.demoNotice.textContent = demoMode ? 'โหมดทดสอบระบบ' : '';
  elements.demoNotice.classList.toggle('hidden', !demoMode);

  state.auth = getAuth();
  bindEvents();
  setupGoogleAuth();

  if (hasStoredAuth(state.auth)) {
    renderLoadingShell();
    showApp();
    loadDashboard({ restore: true });
  } else {
    showLogin();
  }
}

function enhanceLoginView() {
  const hero = document.querySelector('.login-hero');
  const loginCard = document.querySelector('.login-card');
  if (!hero || !loginCard || loginCard.dataset.enhanced === 'true') return;

  hero.innerHTML = `
    <div class="sat-brand">
      <span class="sat-atom" aria-hidden="true">
        <i></i>
        <b></b>
      </span>
      <div>
        <strong>ววม.</strong>
        <small>ศูนย์มหาวิทยาลัยนเรศวร</small>
      </div>
    </div>
    <div class="login-hero-copy">
      <h1>
        <span>ระบบสารสนเทศเพื่อติดตาม</span>
        <strong>การส่งงานโครงงานของนักเรียน</strong>
        <em>โครงการ ววม. ศูนย์มหาวิทยาลัยนเรศวร</em>
      </h1>
      <div class="orange-rule"></div>
      <p>ระบบที่ช่วยอำนวยความสะดวกในการติดตาม ตรวจสอบ และประเมินความก้าวหน้าการส่งงานโครงงานของนักเรียนได้อย่างมีประสิทธิภาพ</p>
    </div>
    <div class="login-illustration" aria-hidden="true">
      <span class="illus-orbit"></span>
      <span class="illus-cloud">☁</span>
      <span class="illus-folder">▰</span>
      <span class="illus-chart">◖</span>
      <div class="illus-laptop">
        <span></span>
        <b></b>
        <i></i>
      </div>
      <span class="illus-clock">◷</span>
    </div>
  `;

  const cardIntro = loginCard.querySelector(':scope > div');
  if (cardIntro) {
    cardIntro.className = 'login-card-head';
    cardIntro.innerHTML = `
      <div class="login-lock" aria-hidden="true">🔒</div>
      <h2>เข้าสู่ระบบ</h2>
    `;
  }

  const accountLabel = elements.account?.closest('label');
  const passwordLabel = elements.password?.closest('label');
  if (accountLabel) {
    accountLabel.classList.add('login-field', 'user-field');
    accountLabel.childNodes[0].textContent = '';
    elements.account.placeholder = 'ชื่อผู้ใช้ (Username)';
  }
  if (passwordLabel) {
    passwordLabel.classList.add('login-field', 'password-field');
    passwordLabel.childNodes[0].textContent = '';
    elements.password.placeholder = 'รหัสผ่าน (Password)';
  }

  if (elements.loginForm && !document.getElementById('loginOptions')) {
    passwordLabel?.insertAdjacentHTML('afterend', `
      <div id="loginOptions" class="login-options">
        <label class="remember-row">
          <input type="checkbox" aria-label="จดจำฉัน">
          <span>จดจำฉัน</span>
        </label>
        <a href="mailto:sat@nu.ac.th">ลืมรหัสผ่าน?</a>
      </div>
    `);
    elements.loginButton.insertAdjacentHTML('afterend', `
      <div class="login-divider"><span>หรือ</span></div>
      <div class="google-login-area">
        <div id="googleSignInButton" class="google-signin-button"></div>
        <button id="googleLoginFallback" class="school-login-button google-fallback" type="button">เข้าสู่ระบบด้วย Gmail</button>
        <small id="googleLoginHint">สำหรับอาจารย์และผู้ดูแลระบบที่มีอีเมลในระบบ</small>
      </div>
    `);
    loginCard.querySelector('#googleLoginFallback')?.addEventListener('click', () => {
      if (isDemoMode()) {
        handleDemoGoogleLogin();
        return;
      }
      if (!CONFIG.GOOGLE_CLIENT_ID) {
        toast('ยังไม่ได้ตั้งค่า GOOGLE_CLIENT_ID สำหรับ Gmail Auth', true);
        return;
      }
      toast('กำลังโหลด Google Login กรุณารอสักครู่');
    });
  }

  if (!document.getElementById('loginFooter')) {
    const footer = document.createElement('footer');
    footer.id = 'loginFooter';
    footer.className = 'login-footer';
    footer.innerHTML = `
      <span>📍 โครงการ ววม. ศูนย์มหาวิทยาลัยนเรศวร 99 หมู่ 9 ต.ท่าโพธิ์ อ.เมือง จ.พิษณุโลก 65000</span>
      <span>🌐 www.sat.nu.ac.th</span>
      <span>✉ sat@nu.ac.th</span>
    `;
    elements.loginView.appendChild(footer);
  }

  loginCard.dataset.enhanced = 'true';
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
    const photoTrigger = event.target.closest('[data-photo-trigger]');
    if (photoTrigger) {
      triggerProfilePhotoPicker();
      return;
    }

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
      return;
    }

    const switchButton = event.target.closest('[data-switch-view]');
    if (switchButton) {
      switchView(switchButton.dataset.switchView);
      return;
    }

    const passwordButton = event.target.closest('[data-open-password-modal]');
    if (passwordButton) {
      showPasswordModal();
    }
  });
}

function setupGoogleAuth() {
  const buttonSlot = document.getElementById('googleSignInButton');
  const fallback = document.getElementById('googleLoginFallback');
  const hint = document.getElementById('googleLoginHint');
  if (!buttonSlot || !fallback) return;

  if (!CONFIG.GOOGLE_CLIENT_ID) {
    buttonSlot.classList.add('hidden');
    fallback.classList.remove('hidden');
    if (hint) hint.textContent = 'ต้องตั้งค่า GOOGLE_CLIENT_ID ก่อนใช้งาน Gmail Auth';
    return;
  }

  loadExternalScript('https://accounts.google.com/gsi/client')
    .then(() => {
      window.google.accounts.id.initialize({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        ux_mode: 'popup'
      });
      fallback.classList.add('hidden');
      buttonSlot.classList.remove('hidden');
      window.google.accounts.id.renderButton(buttonSlot, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'signin_with',
        logo_alignment: 'left',
        width: Math.min(360, buttonSlot.offsetWidth || 360)
      });
      if (hint) hint.textContent = 'ระบบจะตรวจอีเมล Gmail กับบัญชีใน Google Sheet';
    })
    .catch(() => {
      buttonSlot.classList.add('hidden');
      fallback.classList.remove('hidden');
      if (hint) hint.textContent = 'โหลด Google Login ไม่สำเร็จ กรุณาใช้รหัสผ่านหรือรีเฟรชหน้า';
    });
}

function loadExternalScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      if (window.google?.accounts?.id) resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function handleGoogleCredential(response) {
  try {
    if (!response?.credential) throw new Error('ไม่พบข้อมูลยืนยันตัวตนจาก Google');
    const result = await api('googleLogin', { credential: response.credential });
    await enterAuthenticatedSession(result, 'google');
    toast(`ยินดีต้อนรับ ${result.user.name} ผ่าน Gmail`);
  } catch (error) {
    toast(error.message, true);
  }
}

async function handleDemoGoogleLogin() {
  try {
    const email = elements.account.value.trim();
    if (!email) throw new Error('กรุณากรอกอีเมลในช่องชื่อผู้ใช้ก่อน');
    const result = await api('googleLogin', { email });
    await enterAuthenticatedSession(result, 'google');
    toast(`ยินดีต้อนรับ ${result.user.name} ผ่าน Gmail`);
  } catch (error) {
    toast(error.message, true);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  setBusy(elements.loginButton, true, 'กำลังเข้าสู่ระบบ...');

  try {
    const result = await api('login', {
      account: elements.account.value.trim(),
      password: elements.password.value
    });
    const loaded = await enterAuthenticatedSession(result, 'password');
    if (loaded && state.auth.user?.mustChangePassword) toast('กรุณาเปลี่ยนรหัสผ่านก่อนเริ่มใช้งานครั้งแรก');
    if (loaded && !state.auth.user?.mustChangePassword) toast(`ยินดีต้อนรับ ${result.user.name}`);
  } catch (error) {
    toast(error.message, true);
  } finally {
    setBusy(elements.loginButton, false, 'เข้าสู่ระบบ');
  }
}

async function enterAuthenticatedSession(result, provider) {
  state.auth = { token: result.token, user: result.user, provider };
  saveAuth(state.auth);
  renderLoadingShell();
  showApp();
  const loaded = await loadDashboard({ restore: true });
  if (!loaded) return false;
  if (provider === 'google') hidePasswordModal();
  return true;
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
    if (projectHasSubmission(elements.submitProject.value)) {
      throw new Error('โครงงานนี้ส่งงานแล้ว ไม่สามารถส่งซ้ำได้');
    }
    const selectedFile = elements.submissionFile.files[0];
    if (!selectedFile) throw new Error('กรุณาอัปโหลดไฟล์ PDF');
    if (!isPdfFile(selectedFile)) throw new Error('อัปโหลดได้เฉพาะไฟล์ PDF เท่านั้น');
    const filePayload = selectedFile ? await readFilePayload(selectedFile) : {};

    await api('submitWork', {
      projectId: elements.submitProject.value,
      workType: document.getElementById('workType').value,
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
    updateSelectedProjectTitle();
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
  const user = state.dashboard?.user || state.auth.user;
  const data = state.dashboard || {};
  const projects = data.projects || [];
  const submissions = data.submissions || [];
  const queue = data.reviewQueue || [];
  const requests = data.requests || [];

  elements.roleBadge.textContent = roleText[user.role] || user.role;
  elements.workspaceTitle.textContent = `สวัสดี ${user.name}`;
  elements.workspaceSubtitle.textContent = getSubtitle(user.role);
  elements.userName.textContent = user.name;
  elements.userEmail.textContent = user.role === 'student'
    ? (user.school || user.email || `รหัส ${user.studentId || user.userId || '-'}`)
    : (user.email || user.userId || '-');
  renderProfileShell(user, projects);
  applyStudentShell(user.role);

  if (user.role === 'student') {
    renderStudentDashboard(data);
  } else {
    renderStats(data.stats || deriveStats(projects, submissions, queue));
    renderProjects(projects);
    renderSubmissions(submissions);
  }
  renderReviewQueue(queue);
  renderRequests(requests, data.requestStats || deriveRequestStats(requests));
  renderSubmitOptions(projects);
  applyRoleVisibility(user.role);
  applyDefaultView();
}

function applyStudentShell(role) {
  const isStudent = role === 'student';
  elements.appView.classList.toggle('student-shell', isStudent);
  document.body.classList.toggle('student-page', isStudent);
  updateStudentNavigation(isStudent);
  updateStudentBrand(isStudent);
  updateStudentTopbar(isStudent);
}

function updateStudentNavigation(isStudent) {
  const nav = document.querySelector('.nav-list');
  if (!nav) return;
  nav.classList.toggle('student-nav', isStudent);
  if (!isStudent) {
    document.querySelectorAll('[data-student-extra-nav]').forEach(item => item.remove());
    const overview = nav.querySelector('[data-view="overview"]');
    const submit = nav.querySelector('[data-view="submit"]');
    const requests = nav.querySelector('[data-view="requests"]');
    if (overview) overview.textContent = 'ภาพรวม';
    if (submit) submit.textContent = 'ส่งงาน';
    if (requests) requests.textContent = 'คำร้องทั่วไป';
    return;
  }

  const labels = {
    overview: '⌂ หน้าหลัก',
    submit: '▧ รายการส่งงาน',
    requests: '☷ คำร้องทั่วไป'
  };
  Object.entries(labels).forEach(([view, label]) => {
    const button = nav.querySelector(`[data-view="${view}"]`);
    if (button) button.textContent = label;
  });

  nav.querySelector('[data-view="review"]')?.classList.add('hidden');
  nav.querySelector('[data-view="admin"]')?.classList.add('hidden');
  if (!nav.querySelector('[data-student-extra-nav]')) {
    nav.insertAdjacentHTML('beforeend', `
      <button class="nav-item student-extra-nav" type="button" data-student-extra-nav>□ ปฏิทินกำหนดการ</button>
      <button class="nav-item student-extra-nav" type="button" data-student-extra-nav>◇ ประกาศ/ข่าวสาร</button>
      <button class="nav-item student-extra-nav" type="button" data-student-extra-nav>⇩ ดาวน์โหลดเอกสาร</button>
      <button class="nav-item student-extra-nav" type="button" data-student-extra-nav>☏ ติดต่อสอบถาม</button>
    `);
  }
}

function updateStudentBrand(isStudent) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  const mark = sidebar.querySelector('.brand-mark');
  const title = sidebar.querySelector('.brand-line strong');
  const subtitle = sidebar.querySelector('.brand-line span');
  if (isStudent) {
    if (mark) mark.textContent = 'ววม.';
    if (title) title.textContent = 'ววม.';
    if (subtitle) subtitle.textContent = 'ศูนย์มหาวิทยาลัยนเรศวร';
    return;
  }
  if (mark) mark.textContent = 'PF';
  if (title) title.textContent = 'ProjectFlow';
  if (subtitle) subtitle.textContent = 'Student submission';
}

function updateStudentTopbar(isStudent) {
  const topbar = document.querySelector('.topbar');
  const profilePill = document.querySelector('.profile-pill');
  if (!topbar) return;
  if (!isStudent) {
    document.getElementById('studentBellButton')?.remove();
    return;
  }
  if (!document.getElementById('studentBellButton') && profilePill) {
    profilePill.insertAdjacentHTML('beforebegin', `
      <button id="studentBellButton" class="student-bell-button" type="button" aria-label="การแจ้งเตือน">
        <span>🔔</span>
        <b>3</b>
      </button>
    `);
  }
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

function renderStudentDashboard(data) {
  const user = data.user || state.auth.user || {};
  const projects = data.projects || [];
  const submissions = data.submissions || [];
  const project = projects[0] || {};
  const overviewPanel = document.getElementById('overviewPanel');
  if (!overviewPanel) return;

  const displayName = user.name || 'นักเรียน';
  overviewPanel.innerHTML = `
    <div class="student-dashboard">
      <section class="student-greeting">
        <p>สวัสดีครับ,</p>
        <h1>${escapeHtml(displayName)}</h1>
        <strong>ยินดีต้อนรับเข้าสู่ระบบ</strong>
      </section>

      <section class="student-dashboard-grid">
        ${studentProfilePanel(user)}
        ${studentSummaryPanel(submissions)}
        ${studentProjectPanel(project, user)}
        ${studentCalendarPanel(project)}
        ${studentSubmissionTable(submissions, project)}
      </section>
    </div>
  `;
}

function studentProfilePanel(user) {
  const studentId = user.studentId || user.userId || '-';
  const email = user.email || '-';
  const passwordDate = user.passwordUpdatedAt ? dateOnlyLabel(user.passwordUpdatedAt) : 'ยังไม่มีข้อมูล';
  return `
    <article class="student-card student-profile-card">
      <button class="student-photo-button" type="button" data-photo-trigger aria-label="เปลี่ยนรูปนักเรียน">
        ${avatarMarkup(user.photoUrl, user.name || studentId, 'student-profile-photo')}
        <span class="student-camera-badge">📷</span>
      </button>
      <div class="student-profile-info">
        ${studentInfoRow('✉', email, 'อีเมล')}
        ${studentInfoRow('⌁', passwordDate, 'เปลี่ยนรหัสผ่านล่าสุด')}
        ${studentInfoRow('▦', studentId, 'รหัสนักเรียน')}
      </div>
      <div class="student-profile-actions">
        <button class="student-outline-button" type="button" data-photo-trigger>แก้ไขข้อมูลส่วนตัว</button>
        <button class="student-muted-button" type="button" data-open-password-modal>เปลี่ยนรหัสผ่าน</button>
      </div>
    </article>
  `;
}

function studentInfoRow(icon, value, label) {
  return `
    <div class="student-info-row">
      <span>${escapeHtml(icon)}</span>
      <div>
        <strong>${escapeHtml(value || '-')}</strong>
        <small>${escapeHtml(label)}</small>
      </div>
    </div>
  `;
}

function studentSummaryPanel(submissions) {
  const summary = studentSubmissionSummary(submissions);
  return `
    <article class="student-card student-work-overview-card">
      <h2>ภาพรวมการส่งงาน</h2>
      <div class="student-donut-wrap">
        <div class="student-donut" style="--sent-end:${summary.sentEnd}deg; --pending-end:${summary.pendingEnd}deg;">
          <span>${summary.total}</span>
          <small>รายการ</small>
        </div>
        <div class="student-donut-legend">
          ${studentLegendRow('sent', 'ส่งแล้ว', summary.sent)}
          ${studentLegendRow('pending', 'รอตรวจสอบ', summary.pending)}
          ${studentLegendRow('missing', 'ยังไม่ส่ง', summary.missing)}
        </div>
      </div>
      <button class="student-orange-button" type="button" data-switch-view="submit">ดูรายการส่งงานทั้งหมด</button>
    </article>
  `;
}

function studentLegendRow(type, label, value) {
  return `
    <div class="student-legend-row">
      <span class="student-dot ${escapeAttribute(type)}"></span>
      <strong>${escapeHtml(label)}</strong>
      <small>${escapeHtml(value)} รายการ</small>
    </div>
  `;
}

function studentSubmissionSummary(submissions) {
  const total = Math.max(4, submissions.length);
  const approved = submissions.filter(item => item.status === 'อนุมัติ').length;
  const pending = submissions.filter(item => ['ส่งแล้ว', 'รอตรวจ', 'รอตรวจสอบ'].includes(item.status)).length;
  const submittedOther = Math.max(submissions.length - approved - pending, 0);
  const sent = approved + submittedOther;
  const missing = Math.max(total - sent - pending, 0);
  const sentEnd = Math.round((sent / total) * 360);
  const pendingEnd = Math.round(((sent + pending) / total) * 360);
  return { total, sent, pending, missing, sentEnd, pendingEnd };
}

function studentProjectPanel(project, user) {
  const hasProject = Boolean(project.projectId || project.title);
  const title = project.title || 'ยังไม่มีโครงงานในบัญชีนี้';
  const status = project.status || (hasProject ? 'กำลังดำเนินการ' : 'รอข้อมูลโครงงาน');
  const dueLabel = project.dueDate ? dateOnlyLabel(project.dueDate) : 'ยังไม่กำหนด';
  const students = projectStudentsForDashboard(project, user);
  const advisors = projectAdvisorsForDashboard(project);
  return `
    <article class="student-card student-project-card">
      <div class="student-card-head">
        <h2>โครงงานของฉัน</h2>
      </div>
      <div class="student-project-layout">
        <div class="student-project-main">
          <span class="student-document-icon">▤</span>
          <div>
            <h3>${escapeHtml(title)}</h3>
            <p>
              ${project.projectId ? `<span>รหัสโครงงาน ${escapeHtml(project.projectId)}</span>` : ''}
              <span>ประเภท : ${escapeHtml(project.type || project.category || 'โครงงานวิทยาศาสตร์')}</span>
            </p>
            <div class="student-project-status">
              <span>สถานะปัจจุบัน</span>
              <strong>${escapeHtml(status)}</strong>
            </div>
            <div class="student-next-due">
              <span>กำหนดส่งถัดไป</span>
              <strong>${escapeHtml(dueLabel)}</strong>
            </div>
            <button class="student-outline-button compact" type="button" data-switch-view="submit">ดูรายละเอียดโครงงาน</button>
          </div>
        </div>

        <div class="student-project-members">
          <h4>สมาชิกในกลุ่ม (${students.length || 1} คน)</h4>
          <div class="student-mini-list">
            ${students.map(student => `
              <div class="student-mini-person">
                ${avatarMarkup(student.photoUrl, student.name || student.studentId, 'student-mini-avatar')}
                <div>
                  <strong>${escapeHtml(student.name || student.studentId)}</strong>
                  <small>${escapeHtml(student.studentId || 'นักเรียน')}</small>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="student-project-advisors">
          <h4>อาจารย์ที่ปรึกษา</h4>
          <div class="student-mini-list">
            ${advisors.map(advisor => `
              <div class="student-mini-person">
                <span class="student-advisor-avatar">👤</span>
                <div>
                  <strong>${escapeHtml(advisor.name || 'ยังไม่ระบุ')}</strong>
                  <small>${escapeHtml(advisor.role)}</small>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </article>
  `;
}

function projectStudentsForDashboard(project, user) {
  if (project.students && project.students.length) return project.students;
  const ids = splitValues(project.studentIds);
  const names = splitValues(project.studentNames);
  if (ids.length || names.length) {
    return (ids.length ? ids : names).map((studentId, index) => ({
      studentId: ids[index] || studentId,
      name: names[index] || studentId,
      photoUrl: ''
    }));
  }
  return [{
    studentId: user.studentId || user.userId || '',
    name: user.name || 'นักเรียน',
    photoUrl: user.photoUrl || ''
  }];
}

function projectAdvisorsForDashboard(project) {
  return [
    { role: 'อาจารย์ที่ปรึกษาหลัก', name: project.advisorName || project.advisorId },
    { role: 'อาจารย์ที่ปรึกษาร่วม', name: project.coAdvisorName || project.coAdvisorId },
    { role: 'อาจารย์ที่ปรึกษาโรงเรียน', name: project.schoolAdvisorName || project.schoolAdvisorId },
    { role: 'แอดมินระบบ', name: 'เจ้าหน้าที่โครงการ' }
  ];
}

function studentCalendarPanel(project) {
  const items = studentScheduleItems(project);
  return `
    <article class="student-card student-calendar-card">
      <div class="student-card-head inline">
        <h2>ปฏิทินกำหนดการ</h2>
        <button type="button">ดูทั้งหมด</button>
      </div>
      <div class="student-calendar-list">
        ${items.map(item => {
          const parts = thaiDateParts(item.date);
          return `
            <div class="student-calendar-item">
              <div class="student-calendar-date">
                <span>${escapeHtml(parts.month)}</span>
                <strong>${escapeHtml(parts.day)}</strong>
              </div>
              <div>
                <strong>${escapeHtml(item.title)}</strong>
                <small>${escapeHtml(parts.label)}</small>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </article>
  `;
}

function studentSubmissionTable(submissions, project) {
  const rows = studentSubmissionRows(submissions, project);
  return `
    <article class="student-card student-submission-card">
      <h2>รายการส่งงานล่าสุด</h2>
      <div class="student-table-wrap">
        <table class="student-submission-table">
          <thead>
            <tr>
              <th>รายการส่งงาน</th>
              <th>กำหนดส่ง</th>
              <th>สถานะ</th>
              <th>วันที่ส่ง</th>
              <th>การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                <td>
                  <div class="student-file-cell">
                    <span class="student-file-icon ${escapeAttribute(row.iconClass)}">${escapeHtml(row.icon)}</span>
                    <strong>${escapeHtml(row.title)}</strong>
                  </div>
                </td>
                <td>${escapeHtml(row.due)}</td>
                <td><span class="student-row-status ${escapeAttribute(row.state)}">${escapeHtml(row.status)}</span></td>
                <td>${escapeHtml(row.submittedAt)}</td>
                <td>${row.action}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </article>
  `;
}

function studentSubmissionRows(submissions, project) {
  const schedules = studentScheduleItems(project);
  const stages = [
    { title: 'เค้าโครงโครงงาน (Proposal)', keywords: ['ข้อเสนอโครงงาน', 'โครงร่าง', 'proposal'], icon: '▣', iconClass: 'doc' },
    { title: 'ความก้าวหน้า ครั้งที่ 1', keywords: ['รายงานความก้าวหน้า', 'progress', 'ความก้าวหน้า'], icon: '▣', iconClass: 'slide' },
    { title: 'บทที่ 1-3', keywords: ['บทที่ 1-3', 'บทที่ 1', 'chapter'], icon: '▣', iconClass: 'word' },
    { title: 'เล่มสมบูรณ์', keywords: ['รูปเล่มสมบูรณ์', 'รายงานฉบับสมบูรณ์', 'final'], icon: '▣', iconClass: 'pdf' }
  ];

  return stages.map((stage, index) => {
    const submission = findSubmissionByKeywords(submissions, stage.keywords);
    const dueParts = thaiDateParts(schedules[index]?.date);
    const status = submission ? displaySubmissionStatus(submission.status) : 'ยังไม่ส่ง';
    const state = submission ? submissionState(submission) : 'missing';
    return {
      title: stage.title,
      due: dueParts.label,
      status,
      state,
      submittedAt: submission ? formatDate(submission.createdAt || submission.updatedAt) : '-',
      icon: stage.icon,
      iconClass: stage.iconClass,
      action: studentSubmissionAction(submission)
    };
  });
}

function studentSubmissionAction(submission) {
  if (!submission) {
    return '<button class="student-table-button" type="button" data-switch-view="submit">ส่งงาน</button>';
  }
  if (submission.canViewFile !== false && submission.fileUrl) {
    return `<a class="student-table-button muted" href="${escapeAttribute(submission.fileUrl)}" target="_blank" rel="noopener">ดูผลการตรวจสอบ</a>`;
  }
  return '<span class="student-table-empty">-</span>';
}

function studentScheduleItems(project) {
  const finalDate = parseDateValue(project.dueDate) || addDays(new Date(), 60);
  return [
    { title: 'ส่งความก้าวหน้า ครั้งที่ 1', date: addDays(finalDate, -60) },
    { title: 'ส่งบทที่ 1-3', date: addDays(finalDate, -40) },
    { title: 'นำเสนอความก้าวหน้า', date: addDays(finalDate, -20) },
    { title: 'ส่งเล่มสมบูรณ์', date: finalDate }
  ];
}

function thaiDateParts(value) {
  const date = parseDateValue(value);
  if (!date) return { day: '--', month: '-', label: 'ยังไม่กำหนด' };
  return {
    day: new Intl.DateTimeFormat('th-TH', { day: '2-digit' }).format(date),
    month: new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(date).replace('.', ''),
    label: new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
  };
}

function dateOnlyLabel(value) {
  const date = parseDateValue(value);
  if (!date) return value || '-';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function parseDateValue(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function renderProfileShell(user, projects) {
  ensureProfileShell();
  const photoUrl = user.photoUrl || '';
  const initial = userInitialText(user);
  setAvatarContent(elements.userInitial, photoUrl, initial, user.name || 'ผู้ใช้งาน');

  const profilePill = document.querySelector('.profile-pill');
  if (profilePill) {
    profilePill.classList.toggle('can-change-photo', user.role === 'student');
    profilePill.toggleAttribute('data-photo-trigger', user.role === 'student');
    profilePill.title = user.role === 'student' ? 'คลิกเพื่อเปลี่ยนรูปโปรไฟล์' : '';
  }

  const welcomeCard = document.getElementById('studentWelcomeCard');
  if (!welcomeCard) return;
  const isStudent = user.role === 'student';
  welcomeCard.classList.add('hidden');
  if (!isStudent) return;

  const studentId = user.studentId || user.userId || '-';
  const project = (projects || [])[0] || {};
  setAvatarContent(document.getElementById('welcomeAvatar'), photoUrl, initial, user.name || 'นักเรียน');
  document.getElementById('welcomeName').textContent = user.name || 'นักเรียน';
  document.getElementById('welcomeStudentId').textContent = `ID: ${studentId}`;
  document.getElementById('welcomeProjectHint').textContent = project.projectId
    ? `โครงงาน ${project.projectId}`
    : 'กดรูปเพื่อเปลี่ยนรูปโปรไฟล์';
}

function ensureProfileShell() {
  if (!document.getElementById('profilePhotoInput')) {
    const input = document.createElement('input');
    input.id = 'profilePhotoInput';
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.hidden = true;
    input.addEventListener('change', handleProfilePhotoChange);
    document.body.appendChild(input);
  }
}

function setAvatarContent(target, photoUrl, fallback, altText) {
  if (!target) return;
  if (photoUrl) {
    target.classList.add('has-photo');
    target.innerHTML = `<img src="${escapeAttribute(photoUrl)}" alt="${escapeAttribute(altText || 'รูปโปรไฟล์')}">`;
    return;
  }
  target.classList.remove('has-photo');
  target.textContent = fallback || 'U';
}

function userInitialText(user) {
  return (user?.name || user?.userId || 'U').trim().charAt(0).toUpperCase();
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
      ${projectStudentStrip(project)}
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

function projectStudentStrip(project) {
  const students = project.students || [];
  if (!students.length) return '';
  return `
    <div class="project-student-strip">
      ${students.slice(0, 4).map(student => `
        <span class="project-student-chip">
          ${avatarMarkup(student.photoUrl, student.name || student.studentId, 'project-student-avatar')}
          <span>
            <strong>${escapeHtml(student.name || student.studentId)}</strong>
            <small>${escapeHtml(student.studentId || student.userId || '')}</small>
          </span>
        </span>
      `).join('')}
    </div>
  `;
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
  updateOverviewSubmissionTitle();
  const stages = buildSubmissionStages(submissions);
  const recent = submissions.slice(0, 2);

  elements.submissionList.innerHTML = `
    <article class="submission-status-panel">
      <div class="submission-status-head">
        <span class="status-truck" aria-hidden="true">🚚</span>
        <h3>สถานะการส่งงาน</h3>
      </div>
      <ol class="submission-step-list">
        ${stages.map((stage, index) => `
          <li class="submission-step ${stage.state}">
            <span class="step-marker">${stage.state === 'approved' ? '✓' : index + 1}</span>
            <div>
              <strong>${escapeHtml(stage.title)}</strong>
              <small>${escapeHtml(stage.label)}</small>
            </div>
          </li>
        `).join('')}
      </ol>
      ${recent.length ? `
        <div class="recent-submissions">
          ${recent.map(item => `
            <div class="recent-submission-row">
              <span class="pill ${statusClass(item.status)}">${escapeHtml(displaySubmissionStatus(item.status))}</span>
              <div>
                <strong>${escapeHtml(item.workType || item.title || item.projectId)}</strong>
                <small>${formatDate(item.createdAt || item.updatedAt)}${item.reviewerNote ? ` · ${escapeHtml(item.reviewerNote)}` : ''}</small>
              </div>
              ${item.canViewFile !== false && item.fileUrl ? `<a href="${escapeAttribute(item.fileUrl)}" target="_blank" rel="noopener">เปิดไฟล์</a>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </article>
  `;
}

function updateOverviewSubmissionTitle() {
  const heading = elements.submissionList?.closest('.panel-card')?.querySelector('h2');
  const eyebrow = elements.submissionList?.closest('.panel-card')?.querySelector('.eyebrow');
  if (heading) heading.textContent = 'สถานะการส่งงาน';
  if (eyebrow) eyebrow.textContent = 'Status';
}

function buildSubmissionStages(submissions) {
  const stageDefinitions = [
    { title: 'โครงร่าง (Proposal)', keywords: ['ข้อเสนอโครงงาน', 'โครงร่าง', 'proposal'] },
    { title: 'รายงานความก้าวหน้า', keywords: ['รายงานความก้าวหน้า', 'progress'] },
    { title: 'รายงานฉบับสมบูรณ์', keywords: ['รูปเล่มสมบูรณ์', 'รายงานฉบับสมบูรณ์', 'final'] }
  ];

  return stageDefinitions.map(stage => {
    const submission = findSubmissionByKeywords(submissions, stage.keywords);
    const state = submissionState(submission);
    return {
      title: stage.title,
      state,
      label: submission ? displaySubmissionStatus(submission.status) : 'ยังไม่ส่งงาน'
    };
  });
}

function findSubmissionByKeywords(submissions, keywords) {
  return (submissions || []).find(item => {
    const text = `${item.workType || ''} ${item.title || ''}`.toLowerCase();
    return keywords.some(keyword => text.includes(keyword.toLowerCase()));
  });
}

function submissionState(submission) {
  if (!submission) return 'waiting';
  const status = String(submission.status || '');
  if (status === 'อนุมัติ') return 'approved';
  if (status === 'ขอแก้ไข') return 'revision';
  return 'submitted';
}

function displaySubmissionStatus(status) {
  if (status === 'อนุมัติ') return 'อนุมัติแล้ว';
  if (status === 'ขอแก้ไข') return 'ส่งกลับแก้ไข';
  if (!status) return 'รอตรวจ';
  return status;
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
      ${studentInfoCard(item)}
      <p>${escapeHtml(item.note || 'ไม่มีหมายเหตุจากนักเรียน')}</p>
      <div class="review-actions">
        ${item.canViewFile !== false && item.fileUrl ? `<a class="mini-button link" href="${escapeAttribute(item.fileUrl)}" target="_blank" rel="noopener">เปิดไฟล์</a>` : ''}
        ${item.canReview !== false ? `
          <button class="mini-button approve" data-review-action="อนุมัติ" data-submission-id="${escapeAttribute(item.submissionId)}">อนุมัติ</button>
          <button class="mini-button revise" data-review-action="ขอแก้ไข" data-submission-id="${escapeAttribute(item.submissionId)}">ส่งแก้ไข</button>
        ` : `<span class="review-status-only">ดูสถานะได้เท่านั้น</span>`}
      </div>
    </article>
  `).join('');
}

function studentInfoCard(item) {
  const name = item.studentNames || item.studentId || 'นักเรียน';
  const studentId = item.studentId || '-';
  const meta = [
    `รหัส ${studentId}`,
    item.studentPhone ? `โทร ${item.studentPhone}` : '',
    item.studentSchool || ''
  ].filter(Boolean).join(' · ');
  return `
    <div class="student-review-profile">
      ${avatarMarkup(item.studentPhotoUrl, name, 'student-review-avatar')}
      <div>
        <strong>${escapeHtml(name)}</strong>
        <small>${escapeHtml(meta || '-')}</small>
      </div>
    </div>
  `;
}

function avatarMarkup(photoUrl, name, className) {
  const initial = String(name || 'U').trim().charAt(0).toUpperCase();
  return `
    <span class="${escapeAttribute(className || 'avatar-mark')} ${photoUrl ? 'has-photo' : ''}">
      ${photoUrl ? `<img src="${escapeAttribute(photoUrl)}" alt="${escapeAttribute(name || 'รูปโปรไฟล์')}">` : escapeHtml(initial)}
    </span>
  `;
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
        <div class="request-owner-line">
          <span>เจ้าของเรื่อง</span>
          <strong>${escapeHtml(request.requesterName || '-')}</strong>
          <small>${escapeHtml(request.requesterId || '')}</small>
        </div>
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
              <small>${signer.status === 'signed' ? `เซ็นแล้ว: ${escapeHtml(signer.signature || signer.signedName || signer.name || '-')}` : 'รอเซ็น'}</small>
            </span>
          `).join('')}
        </div>
        ${request.pdfUrl ? `
          <a class="mini-button link request-pdf-link" href="${escapeAttribute(request.pdfUrl)}" target="_blank" rel="noopener">
            เปิด PDF คำร้องพร้อมลายเซ็น
          </a>
        ` : ''}
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

function currentRequestProject(projectId) {
  return (state.dashboard?.projects || []).find(item => item.projectId === projectId) || {};
}

function requestDocumentDetailText(type, payload, project) {
  if (type === 'project_name') {
    return `ขอเปลี่ยนชื่อจาก “${project.title || '-'}” เป็น “${payload.newTitleTh || payload.newTitleEn || '-'}”`;
  }
  if (type === 'project_branch') {
    return `ขอเปลี่ยนรหัส/สาขาโครงงานจาก “${payload.currentBranch || project.school || '-'}” เป็น “${payload.newBranch || '-'}”`;
  }
  return payload.otherDetail || payload.otherSubject || '-';
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
      const signature = state.auth?.user?.name || '';
      const signatureImage = readSignaturePad('ownerSignaturePad');
      const accepted = document.getElementById('ownerSignatureConfirm').checked;
      if (!signature) throw new Error('ไม่พบชื่อผู้ยื่นคำร้องในบัญชีผู้ใช้');
      if (!signatureImage) throw new Error('กรุณาเซ็นในช่องลายเซ็นอิเล็กทรอนิกส์');
      if (!accepted) throw new Error('กรุณายืนยันการเซ็นอิเล็กทรอนิกส์');
      state.requestWizard.submitting = true;
      renderRequestModal();
      await api('createRequest', {
        ...state.requestWizard.payload,
        requestType: state.requestWizard.type,
        ownerSignature: signature,
        ownerSignatureImage: signatureImage
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
    requestAnimationFrame(() => prepareSignaturePads(elements.requestModalBody));
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
  const user = state.auth?.user || {};
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
      <strong>ข้อมูลผู้ยื่นคำร้อง (ดึงจากบัญชีผู้ใช้)</strong>
      ${requestOwnerReadonlyField('ชื่อ-นามสกุล', user.name || '-')}
      ${requestOwnerReadonlyField('รหัสนักเรียน', user.studentId || user.userId || '-')}
      ${requestOwnerReadonlyField('เบอร์ติดต่อ', user.phone || 'ยังไม่มีข้อมูลในชีต')}
    </div>
    ${requestDynamicFieldsMarkup(type, payload, selectedProjectId)}
  `;
}

function requestOwnerReadonlyField(label, value) {
  return `
    <div class="owner-readonly-field">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || '-')}</strong>
    </div>
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
      ${requestSignatureDocumentMarkup()}
      <div class="signature-auto-name">
        <span>ลายเซ็นผู้ยื่นคำร้อง</span>
        <strong>${escapeHtml(user.name || '-')}</strong>
        <small>ระบบดึงชื่อจากบัญชีที่เข้าสู่ระบบ ไม่ต้องพิมพ์ชื่อซ้ำ</small>
      </div>
      <div class="signature-pad-card">
        <div>
          <strong>ช่องเซ็นอิเล็กทรอนิกส์</strong>
          <span>ใช้เมาส์ ปากกา หรือแตะหน้าจอเพื่อเซ็นในกรอบนี้</span>
        </div>
        <canvas id="ownerSignaturePad" class="signature-canvas" data-signature-pad width="640" height="190" aria-label="ช่องเซ็นอิเล็กทรอนิกส์"></canvas>
        <button class="mini-button link" type="button" data-signature-clear="#ownerSignaturePad">ล้างลายเซ็น</button>
      </div>
      <label class="check-line">
        <input id="ownerSignatureConfirm" type="checkbox">
        <span>ข้าพเจ้าขอยืนยันว่าข้อมูลในคำร้องนี้ถูกต้อง และยอมรับการใช้ลายเซ็นอิเล็กทรอนิกส์</span>
      </label>
    </div>
  `;
}

function requestSignatureDocumentMarkup() {
  const user = state.auth?.user || {};
  const payload = state.requestWizard.payload || {};
  const project = currentRequestProject(payload.projectId);
  const ownerId = user.studentId || user.userId || '-';
  return `
    <section class="request-document" aria-label="เอกสารคำร้อง">
      <div class="request-document-title">
        <span>เอกสารคำร้อง</span>
        <strong>${escapeHtml(requestTypeLabel(state.requestWizard.type))}</strong>
      </div>
      <div class="request-document-grid">
        <div>
          <small>เจ้าของเรื่อง</small>
          <strong>${escapeHtml(user.name || '-')}</strong>
          <span>${escapeHtml(ownerId)}${user.phone ? ` · ${escapeHtml(user.phone)}` : ''}</span>
        </div>
        <div>
          <small>โครงงาน</small>
          <strong>${escapeHtml(project.projectId || payload.projectId || '-')}</strong>
          <span>${escapeHtml(project.title || '-')}</span>
        </div>
      </div>
      <p>${escapeHtml(requestDocumentDetailText(state.requestWizard.type, payload, project))}</p>
      <div class="signature-stamp">
        <small>ลงชื่อผู้ยื่นคำร้อง</small>
        <strong>${escapeHtml(user.name || '-')}</strong>
        <span>ระบบใช้ชื่อจากบัญชีที่เข้าสู่ระบบเป็นลายเซ็นอิเล็กทรอนิกส์</span>
      </div>
    </section>
  `;
}

function collectRequestFormData() {
  const type = state.requestWizard.type;
  const user = state.auth?.user || {};
  const payload = {
    projectId: document.getElementById('requestProjectId').value,
    requesterName: user.name || '',
    requesterStudentId: user.studentId || user.userId || '',
    phone: user.phone || ''
  };
  if (!payload.projectId) {
    throw new Error('กรุณาเลือกโครงงาน');
  }
  if (!payload.requesterName) {
    throw new Error('ไม่พบชื่อผู้ยื่นคำร้องในบัญชีผู้ใช้');
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

function prepareSignaturePads(root = document) {
  root.querySelectorAll('[data-signature-pad]').forEach(canvas => setupSignaturePad(canvas));
  root.querySelectorAll('[data-signature-clear]').forEach(button => {
    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => {
      const canvas = root.querySelector(button.dataset.signatureClear) || document.querySelector(button.dataset.signatureClear);
      canvas?.signaturePad?.clear();
    });
  });
}

function setupSignaturePad(canvas) {
  if (!canvas || canvas.signaturePad) return;
  const context = canvas.getContext('2d');
  let drawing = false;
  let hasInk = false;

  const paintBackground = () => {
    context.save();
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();
  };

  const resetStyle = () => {
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#0f172a';
  };

  paintBackground();
  resetStyle();

  const pointFromEvent = event => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const start = event => {
    event.preventDefault();
    drawing = true;
    hasInk = true;
    const point = pointFromEvent(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const move = event => {
    if (!drawing) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const end = event => {
    if (!drawing) return;
    event.preventDefault();
    drawing = false;
  };

  canvas.addEventListener('pointerdown', start);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointerleave', end);
  canvas.signaturePad = {
    clear() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      paintBackground();
      resetStyle();
      hasInk = false;
    },
    dataUrl() {
      return hasInk ? canvas.toDataURL('image/png') : '';
    }
  };
}

function readSignaturePad(id) {
  const canvas = typeof id === 'string' ? document.getElementById(id) : id;
  return canvas?.signaturePad?.dataUrl() || '';
}

function openSignatureCapture(title) {
  return new Promise(resolve => {
    const modal = document.createElement('div');
    modal.className = 'signature-capture-modal';
    modal.innerHTML = `
      <section class="signature-capture-card glass-card">
        <header>
          <div>
            <span class="eyebrow">Signature</span>
            <h2>${escapeHtml(title)}</h2>
            <p>เซ็นในกรอบด้านล่างเพื่อยืนยันคำร้องแบบอิเล็กทรอนิกส์</p>
          </div>
          <button class="icon-button" type="button" data-signature-cancel aria-label="ปิด">×</button>
        </header>
        <canvas id="signerSignaturePad" class="signature-canvas" data-signature-pad width="640" height="190" aria-label="ช่องเซ็นอิเล็กทรอนิกส์"></canvas>
        <div class="signature-capture-actions">
          <button class="secondary-button" type="button" data-signature-clear="#signerSignaturePad">ล้างลายเซ็น</button>
          <button class="primary-button" type="button" data-signature-confirm>ยืนยันลายเซ็น</button>
        </div>
      </section>
    `;
    document.body.appendChild(modal);
    prepareSignaturePads(modal);

    const close = value => {
      modal.remove();
      resolve(value);
    };

    modal.addEventListener('click', event => {
      if (event.target === modal || event.target.closest('[data-signature-cancel]')) {
        close('');
        return;
      }
      if (event.target.closest('[data-signature-confirm]')) {
        const signatureImage = readSignaturePad(modal.querySelector('#signerSignaturePad'));
        if (!signatureImage) {
          toast('กรุณาเซ็นในช่องลายเซ็นก่อนยืนยัน', true);
          return;
        }
        close(signatureImage);
      }
    });
  });
}

async function signRequest(requestId) {
  const signature = state.auth?.user?.name || '';
  if (!signature) {
    toast('ไม่พบชื่อผู้เซ็นในบัญชีผู้ใช้', true);
    return;
  }
  const signatureImage = await openSignatureCapture(`เซ็นโดย ${signature}`);
  if (!signatureImage) return;
  try {
    await api('signRequest', { requestId, signature, signatureImage });
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
  const submitted = projectHasSubmission(selectedProjectId);
  if (!project) {
    elements.selectedProjectTitle.classList.add('hidden');
    elements.selectedProjectTitle.innerHTML = '';
    elements.submitButton.disabled = true;
    return;
  }
  elements.selectedProjectTitle.classList.remove('hidden');
  elements.selectedProjectTitle.classList.toggle('is-submitted', submitted);
  elements.selectedProjectTitle.innerHTML = `
    <strong>${escapeHtml(project.title || project.projectId)}</strong>
    <small>รหัสโครงงาน ${escapeHtml(project.projectId)}${submitted ? ' · ส่งงานแล้ว' : ''}</small>
  `;
  elements.submitButton.disabled = submitted;
  elements.submitButton.textContent = submitted ? 'ส่งงานแล้ว' : 'ส่งงานให้อาจารย์';
}

function projectHasSubmission(projectId) {
  if (!projectId) return false;
  return (state.dashboard?.submissions || []).some(item => item.projectId === projectId);
}

function applyRoleVisibility(role) {
  const isStudent = role === 'student';
  const isReviewer = ['advisor', 'admin'].includes(role);
  const isAdmin = role === 'admin';

  document.querySelector('[data-view="submit"]').classList.toggle('hidden', !isStudent);
  document.querySelector('[data-view="review"]').classList.toggle('hidden', !isReviewer);
  document.querySelector('[data-view="admin"]').classList.toggle('hidden', !isAdmin);
  elements.openRequestModalButton.classList.toggle('hidden', !isStudent);

  if ((state.view === 'submit' && !isStudent) || (state.view === 'review' && !isReviewer) || (state.view === 'admin' && !isAdmin)) {
    switchView('overview');
  }
}

function applyDefaultView() {
  if (state.defaultViewApplied || !DEFAULT_VIEW) return;
  const button = document.querySelector(`[data-view="${DEFAULT_VIEW}"]`);
  const panel = document.getElementById(`${DEFAULT_VIEW}Panel`);
  if (!button || !panel || button.classList.contains('hidden')) return;
  state.defaultViewApplied = true;
  switchView(DEFAULT_VIEW);
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

function triggerProfilePhotoPicker() {
  const user = state.auth?.user;
  if (!user || user.role !== 'student') return;
  const input = document.getElementById('profilePhotoInput');
  if (input) input.click();
}

async function handleProfilePhotoChange(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;

  try {
    if (!file.type.startsWith('image/')) throw new Error('กรุณาเลือกไฟล์รูปภาพ');
    const payload = await readImagePayload(file);
    const result = await api('updateProfilePhoto', payload);
    state.auth.user = result.user;
    if (state.dashboard) state.dashboard.user = result.user;
    syncDashboardPhoto(result.user);
    saveAuth(state.auth);
    render();
    toast('เปลี่ยนรูปโปรไฟล์เรียบร้อยแล้ว');
  } catch (error) {
    toast(error.message, true);
  }
}

function readImagePayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 360;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        const x = (size - width) / 2;
        const y = (size - height) / 2;
        context.fillStyle = '#f8fafc';
        context.fillRect(0, 0, size, size);
        context.drawImage(image, x, y, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
        resolve({
          fileName: file.name || `profile-${Date.now()}.jpg`,
          fileMimeType: 'image/jpeg',
          fileData: dataUrl.split(',').pop()
        });
      };
      image.onerror = () => reject(new Error('อ่านรูปภาพไม่สำเร็จ'));
      image.src = String(reader.result || '');
    };
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.readAsDataURL(file);
  });
}

function syncDashboardPhoto(user) {
  if (!state.dashboard || !user) return;
  const keys = [user.userId, user.studentId, user.email].filter(Boolean).map(value => String(value).toLowerCase());
  (state.dashboard.projects || []).forEach(project => {
    (project.students || []).forEach(student => {
      const studentKeys = [student.userId, student.studentId].filter(Boolean).map(value => String(value).toLowerCase());
      if (studentKeys.some(key => keys.includes(key))) student.photoUrl = user.photoUrl || '';
    });
  });
  (state.dashboard.submissions || []).forEach(submission => {
    const submissionKey = String(submission.studentId || '').toLowerCase();
    if (keys.includes(submissionKey)) submission.studentPhotoUrl = user.photoUrl || '';
  });
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
  ensureProfileShell();
  setAvatarContent(elements.userInitial, user.photoUrl || '', userInitialText(user), user.name || 'ผู้ใช้งาน');
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
  if (state.auth?.provider === 'google') {
    hidePasswordModal();
    return;
  }
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
  if (['co_advisor', 'school_advisor'].includes(role)) return 'ติดตามสถานะการส่งงานและเซ็นคำร้องตามลำดับที่ได้รับมอบหมาย';
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
      { userId: '68983244', password: '1234', role: 'student', name: 'ณภัทร ใจดี', email: 'student@example.com', studentId: '68983244', school: 'โรงเรียนตัวอย่าง', phone: '0818834211', photoUrl: '', mustChangePassword: true },
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

  if (action === 'googleLogin') {
    const email = String(payload.email || '').trim().toLowerCase();
    const user = store.users.find(item => String(item.email || '').trim().toLowerCase() === email);
    if (!user) throw new Error('อีเมล Gmail นี้ยังไม่มีสิทธิ์ในระบบ');
    const { password, ...safeUser } = user;
    safeUser.mustChangePassword = false;
    return { token: `demo-google-${safeUser.userId}-${Date.now()}`, user: safeUser };
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
    user.passwordUpdatedAt = new Date().toISOString();
    setDemoStore(store);
    const { password, ...safeUser } = user;
    return { user: safeUser };
  }

  if (action === 'updateProfilePhoto') {
    const user = findDemoUser(store, state.auth.user.userId);
    if (!user || user.role !== 'student') throw new Error('เฉพาะนักเรียนเท่านั้นที่เปลี่ยนรูปโปรไฟล์ได้');
    user.photoUrl = `data:${payload.fileMimeType || 'image/jpeg'};base64,${payload.fileData}`;
    setDemoStore(store);
    const { password, ...safeUser } = user;
    return { user: safeUser };
  }

  if (action === 'submitWork') {
    const project = store.projects.find(item => item.projectId === payload.projectId);
    const now = new Date().toISOString();
    if (store.submissions.some(item => item.projectId === payload.projectId)) throw new Error('โครงงานนี้ส่งงานแล้ว ไม่สามารถส่งซ้ำได้');
    if (!payload.fileName || !String(payload.fileName).toLowerCase().endsWith('.pdf')) throw new Error('อัปโหลดได้เฉพาะไฟล์ PDF เท่านั้น');
    const fileUrl = `https://drive.google.com/demo/${encodeURIComponent(payload.fileName)}`;
    store.submissions.unshift({
      submissionId: `S-${Date.now()}`,
      projectId: payload.projectId,
      title: project?.title || payload.workType || 'ไฟล์โครงงาน',
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
  const projects = filterProjects(store.projects, user).map(project => ({
    ...project,
    students: splitValues(project.studentIds).map((studentId, index) => {
      const student = findDemoUser(store, studentId) || {};
      const names = splitValues(project.studentNames);
      return {
        studentId,
        userId: student.userId || studentId,
        name: student.name || names[index] || studentId,
        photoUrl: student.photoUrl || '',
        phone: student.phone || '',
        school: student.school || project.school || ''
      };
    })
  }));
  const allowedIds = new Set(projects.map(item => item.projectId));
  const submissions = store.submissions.filter(item => user.role === 'admin' || allowedIds.has(item.projectId)).map(item => {
    const project = projects.find(projectItem => projectItem.projectId === item.projectId) || {};
    const student = findDemoUser(store, item.studentId) || {};
    const canReview = user.role === 'admin' || (user.role === 'advisor' && project.advisorId === user.userId);
    const canViewFile = user.role === 'admin' || user.role === 'student' || canReview;
    return {
      ...item,
      studentPhotoUrl: student.photoUrl || '',
      studentPhone: student.phone || '',
      studentSchool: student.school || project.school || '',
      canReview,
      canViewFile,
      fileUrl: canViewFile ? item.fileUrl : ''
    };
  });
  const reviewQueue = ['advisor', 'admin'].includes(user.role)
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
