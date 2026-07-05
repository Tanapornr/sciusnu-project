const CONFIG = {
  SPREADSHEET_ID: '14Zs2kyIE8B3DpwvX78l8_IHqtQVYdWP6AZCaS_F0XRc',
  MASTER_SHEET: 'sheet1',
  SUBMISSIONS_SHEET: 'Submissions',
  REQUESTS_SHEET: 'Requests',
  EMAIL_LOG_SHEET: 'Email_Log',
  APP_NAME: 'SCIUSNU SMART',
  TIMEZONE: 'Asia/Bangkok',
  DRIVE_FOLDER_NAME: 'SCIUSNU SMART Uploads',
  DRIVE_FOLDER_ID: '',
  ADMIN_EMAILS: ['admin@example.com'],
  ADMIN_PASSWORD: '123456',
  SESSION_TTL_SECONDS: 21600
};

const ROLE = {
  STUDENT: 'student',
  ADVISOR: 'advisor',
  VIEWER: 'viewer',
  ADMIN: 'admin'
};

const STATUS = {
  NOT_SUBMITTED: 'ยังไม่ส่ง',
  PENDING: 'รอตรวจ',
  RESUBMITTED: 'รอการตรวจอนุมัติ',
  REJECTED: 'ไม่อนุมัติ',
  APPROVED: 'อนุมัติแล้ว'
};

const SUBMISSION_HEADERS = [
  'Timestamp',
  'Submission ID',
  'Related Submission ID',
  'รหัสนักเรียน',
  'ชื่อ',
  'นามสกุล',
  'รหัสโครงงาน',
  'ชื่อโครงงาน',
  'ประเภทงาน',
  'URL ไฟล์เล่ม',
  'URL ลายเซ็น',
  'สถานะ',
  'อ.ที่ปรึกษา',
  'E-mail อ.ที่ปรึกษา',
  'หมายเหตุ',
  'ผู้ตรวจ',
  'E-mail ผู้ตรวจ',
  'วันที่ตรวจ',
  'ครั้งที่แก้ไข',
  'เบอร์โทรศัพท์',
  'สมาชิก',
  'วันที่อัปเดต'
];

const REQUEST_HEADERS = [
  'Timestamp',
  'Request ID',
  'รหัสนักเรียน',
  'ชื่อ',
  'นามสกุล',
  'รหัสโครงงาน',
  'ประเภทคำร้อง',
  'URL ไฟล์คำร้อง',
  'สถานะ',
  'หมายเหตุจากนักเรียน',
  'หมายเหตุแอดมิน',
  'ผู้ตรวจ',
  'วันที่ตรวจ',
  'วันที่อัปเดต'
];

const EMAIL_LOG_HEADERS = [
  'Timestamp',
  'Reference ID',
  'Event',
  'To',
  'Cc',
  'Subject',
  'Result',
  'Detail'
];

const SUBMISSION_COL = {
  TIMESTAMP: 1,
  ID: 2,
  RELATED_ID: 3,
  STUDENT_ID: 4,
  FIRST_NAME: 5,
  LAST_NAME: 6,
  PROJECT_CODE: 7,
  PROJECT_TITLE: 8,
  WORK_TYPE: 9,
  PDF_URL: 10,
  SIGNATURE_URL: 11,
  STATUS: 12,
  ADVISOR_NAME: 13,
  ADVISOR_EMAIL: 14,
  NOTE: 15,
  REVIEWER_NAME: 16,
  REVIEWER_EMAIL: 17,
  REVIEWED_AT: 18,
  REVISION: 19,
  PHONE: 20,
  MEMBERS: 21,
  UPDATED_AT: 22
};

const REQUEST_COL = {
  TIMESTAMP: 1,
  ID: 2,
  STUDENT_ID: 3,
  FIRST_NAME: 4,
  LAST_NAME: 5,
  PROJECT_CODE: 6,
  REQUEST_TYPE: 7,
  FILE_URL: 8,
  STATUS: 9,
  STUDENT_NOTE: 10,
  ADMIN_NOTE: 11,
  REVIEWER: 12,
  REVIEWED_AT: 13,
  UPDATED_AT: 14
};

function doGet() {
  return jsonOutput_({
    ok: true,
    app: CONFIG.APP_NAME,
    message: 'API is running. Use doPost with an action.'
  });
}

function setupSystem() {
  return apiSetup_();
}

function doPost(e) {
  try {
    const request = parseRequest_(e);
    const action = clean_(request.action);
    const payload = request.payload || {};

    ensureSheets_();

    const handlers = {
      setup: apiSetup_,
      login: apiLogin_,
      dashboard: apiDashboard_,
      submitProjectFile: apiSubmitProjectFile_,
      reviewSubmission: apiReviewSubmission_,
      submitRequest: apiSubmitRequest_,
      reviewRequest: apiReviewRequest_,
      sendPendingReminder: apiSendPendingReminder_
    };

    if (!handlers[action]) {
      throw new Error('ไม่พบ action: ' + action);
    }

    return jsonOutput_(handlers[action](payload));
  } catch (error) {
    return jsonOutput_({
      ok: false,
      message: error.message || String(error)
    });
  }
}

function apiSetup_() {
  ensureSheets_();
  return {
    ok: true,
    message: 'ตั้งค่าชีตระบบเรียบร้อย',
    spreadsheetUrl: SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getUrl()
  };
}

function apiLogin_(payload) {
  const account = normalize_(payload.account || payload.email);
  const password = clean_(payload.password);

  if (!account || !password) {
    throw new Error('กรุณากรอกบัญชีผู้ใช้และรหัสผ่าน');
  }

  const directory = readDirectory_();

  if (CONFIG.ADMIN_EMAILS.map(normalize_).indexOf(account) !== -1 && password === CONFIG.ADMIN_PASSWORD) {
    return createLoginResponse_({
      role: ROLE.ADMIN,
      roleLabel: 'แอดมิน',
      name: 'Admin',
      email: account,
      page: 'admin.html',
      projectCodes: directory.projects.map(project => project.projectCode)
    });
  }

  const studentRecord = directory.records.find(record => {
    return (normalize_(record.studentId) === account || normalize_(record.studentEmail) === account) &&
      record.studentPassword === password;
  });

  if (studentRecord) {
    return createLoginResponse_({
      role: ROLE.STUDENT,
      roleLabel: 'นักเรียน',
      name: studentRecord.firstName + ' ' + studentRecord.lastName,
      email: studentRecord.studentEmail,
      studentId: studentRecord.studentId,
      projectCode: studentRecord.projectCode,
      page: 'student.html',
      projectCodes: [studentRecord.projectCode]
    });
  }

  const advisorProjects = directory.projects.filter(project => {
    const advisor = project.advisor;
    return reviewerMatches_(advisor, account) && advisor.password === password;
  });

  if (advisorProjects.length > 0) {
    const advisor = advisorProjects[0].advisor;
    return createLoginResponse_({
      role: ROLE.ADVISOR,
      roleLabel: 'อาจารย์ที่ปรึกษาหลัก',
      name: advisor.name || advisor.code || advisor.email,
      email: advisor.email,
      page: 'advisor.html',
      projectCodes: advisorProjects.map(project => project.projectCode)
    });
  }

  const coAdvisorProjects = directory.projects.filter(project => {
    return reviewerMatches_(project.coAdvisor, account) && project.coAdvisor.password === password;
  });

  if (coAdvisorProjects.length > 0) {
    const viewer = coAdvisorProjects[0].coAdvisor;
    return createLoginResponse_({
      role: ROLE.VIEWER,
      roleLabel: 'อาจารย์ที่ปรึกษาร่วม',
      viewerType: 'coAdvisor',
      name: viewer.name || viewer.email,
      email: viewer.email,
      page: 'viewer.html',
      projectCodes: coAdvisorProjects.map(project => project.projectCode)
    });
  }

  const schoolAdvisorProjects = directory.projects.filter(project => {
    return reviewerMatches_(project.schoolAdvisor, account) && project.schoolAdvisor.password === password;
  });

  if (schoolAdvisorProjects.length > 0) {
    const viewer = schoolAdvisorProjects[0].schoolAdvisor;
    return createLoginResponse_({
      role: ROLE.VIEWER,
      roleLabel: 'อาจารย์ที่ปรึกษาโรงเรียน',
      viewerType: 'schoolAdvisor',
      name: viewer.name || viewer.email,
      email: viewer.email,
      page: 'viewer.html',
      projectCodes: schoolAdvisorProjects.map(project => project.projectCode)
    });
  }

  throw new Error('บัญชีผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
}

function apiDashboard_(payload) {
  const session = requireSession_(payload.token);
  const directory = readDirectory_();
  const submissions = readSubmissions_();
  const requests = readRequests_();
  const visibleProjectCodes = session.role === ROLE.ADMIN
    ? directory.projects.map(project => project.projectCode)
    : session.projectCodes || [];

  const projects = directory.projects
    .filter(project => visibleProjectCodes.indexOf(project.projectCode) !== -1)
    .map(project => publicProject_(project));

  const visibleSubmissions = submissions
    .filter(item => visibleProjectCodes.indexOf(item.projectCode) !== -1)
    .map(item => publicSubmission_(item))
    .sort((a, b) => String(b.updatedAtRaw).localeCompare(String(a.updatedAtRaw)));

  const visibleRequests = requests
    .filter(item => session.role === ROLE.ADMIN || visibleProjectCodes.indexOf(item.projectCode) !== -1)
    .map(item => publicRequest_(item))
    .sort((a, b) => String(b.updatedAtRaw).localeCompare(String(a.updatedAtRaw)));

  return {
    ok: true,
    session: publicSession_(session),
    projects: projects,
    submissions: visibleSubmissions,
    requests: visibleRequests,
    workTypes: ['ข้อเสนอโครงงาน', 'รายงานความก้าวหน้า', 'รายงานฉบับสมบูรณ์', 'ไฟล์นำเสนอ', 'โปสเตอร์'],
    requestTypes: ['ขอเปลี่ยนหัวข้อโครงงาน', 'ขอเปลี่ยนอาจารย์ที่ปรึกษา', 'ขอส่งงานล่าช้า', 'คำร้องอื่น ๆ'],
    stats: buildStats_(visibleSubmissions),
    emailQuota: MailApp.getRemainingDailyQuota()
  };
}

function apiSubmitProjectFile_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const session = requireSession_(payload.token);
    if (session.role !== ROLE.STUDENT) {
      throw new Error('เฉพาะนักเรียนเท่านั้นที่ส่งงานได้');
    }

    const directory = readDirectory_();
    const project = directory.projectsByCode[session.projectCode];
    if (!project) {
      throw new Error('ไม่พบข้อมูลโครงงาน');
    }

    const student = project.students.find(item => item.studentId === session.studentId);
    if (!student) {
      throw new Error('ไม่พบข้อมูลนักเรียน');
    }

    const workType = clean_(payload.workType);
    const phone = clean_(payload.phone) || student.phone;
    const note = clean_(payload.note);
    const relatedId = clean_(payload.relatedSubmissionId);
    const pdfFile = payload.pdfFile;
    const signatureFile = payload.signatureFile;

    if (!workType) {
      throw new Error('กรุณาเลือกประเภทงาน');
    }
    if (!pdfFile || !pdfFile.data) {
      throw new Error('กรุณาแนบไฟล์ PDF');
    }
    if (!/pdf/i.test(clean_(pdfFile.mimeType || pdfFile.name))) {
      throw new Error('กรุณาแนบไฟล์ PDF เท่านั้น');
    }

    let relatedSubmission = null;
    let revision = 0;
    let nextStatus = STATUS.PENDING;

    if (relatedId) {
      relatedSubmission = findSubmission_(relatedId);
      if (!relatedSubmission) {
        throw new Error('ไม่พบรายการเดิมที่ต้องแก้ไข');
      }
      if (relatedSubmission.projectCode !== project.projectCode) {
        throw new Error('ไม่สามารถส่งแก้ไขรายการของโครงงานอื่นได้');
      }
      if (relatedSubmission.status !== STATUS.REJECTED) {
        throw new Error('ส่งไฟล์แก้ไขได้เฉพาะรายการที่ไม่อนุมัติ');
      }
      revision = Number(relatedSubmission.revision || 0) + 1;
      nextStatus = STATUS.RESUBMITTED;
    }

    const now = new Date();
    const submissionId = makeId_('SUB', project.projectCode);
    const folder = getUploadFolder_();
    const pdfUrl = saveFile_(folder, pdfFile, submissionId + '-project.pdf');
    const signatureUrl = signatureFile && signatureFile.data
      ? saveFile_(folder, signatureFile, submissionId + '-signature.pdf')
      : '';
    const members = project.students.map(item => item.firstName + ' ' + item.lastName).join(', ');

    const sheet = getOrCreateSheet_(CONFIG.SUBMISSIONS_SHEET, SUBMISSION_HEADERS);
    sheet.appendRow([
      now,
      submissionId,
      relatedId,
      student.studentId,
      student.firstName,
      student.lastName,
      project.projectCode,
      project.projectTitle,
      workType,
      pdfUrl,
      signatureUrl,
      nextStatus,
      project.advisor.name,
      project.advisor.email,
      relatedSubmission ? relatedSubmission.note : note,
      '',
      '',
      '',
      revision,
      phone,
      members,
      now
    ]);

    notifyProjectSubmitted_(project, {
      id: submissionId,
      workType: workType,
      pdfUrl: pdfUrl,
      signatureUrl: signatureUrl,
      status: nextStatus,
      note: relatedSubmission ? relatedSubmission.note : note,
      revision: revision,
      studentName: student.firstName + ' ' + student.lastName,
      studentId: student.studentId
    });

    return apiDashboard_({ token: payload.token });
  } finally {
    lock.releaseLock();
  }
}

function apiReviewSubmission_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const session = requireSession_(payload.token);
    if ([ROLE.ADVISOR, ROLE.ADMIN].indexOf(session.role) === -1) {
      throw new Error('เฉพาะอาจารย์ที่ปรึกษาหลักหรือแอดมินเท่านั้นที่อนุมัติได้');
    }

    const submissionId = clean_(payload.submissionId);
    const decision = clean_(payload.decision);
    const note = clean_(payload.note);
    const submission = findSubmission_(submissionId);

    if (!submission) {
      throw new Error('ไม่พบรายการส่งงาน');
    }
    if (session.role !== ROLE.ADMIN && (session.projectCodes || []).indexOf(submission.projectCode) === -1) {
      throw new Error('คุณไม่มีสิทธิ์ตรวจโครงงานนี้');
    }
    if (decision !== 'approve' && decision !== 'reject') {
      throw new Error('กรุณาเลือกอนุมัติหรือไม่อนุมัติ');
    }
    if (decision === 'reject' && !note) {
      throw new Error('กรุณากรอกหมายเหตุเมื่อไม่อนุมัติ');
    }

    const directory = readDirectory_();
    const project = directory.projectsByCode[submission.projectCode];
    const now = new Date();
    const nextStatus = decision === 'approve' ? STATUS.APPROVED : STATUS.REJECTED;
    const sheet = getOrCreateSheet_(CONFIG.SUBMISSIONS_SHEET, SUBMISSION_HEADERS);

    sheet.getRange(submission.rowNumber, SUBMISSION_COL.STATUS).setValue(nextStatus);
    sheet.getRange(submission.rowNumber, SUBMISSION_COL.NOTE).setValue(note || submission.note || '');
    sheet.getRange(submission.rowNumber, SUBMISSION_COL.REVIEWER_NAME).setValue(session.name);
    sheet.getRange(submission.rowNumber, SUBMISSION_COL.REVIEWER_EMAIL).setValue(session.email);
    sheet.getRange(submission.rowNumber, SUBMISSION_COL.REVIEWED_AT).setValue(now);
    sheet.getRange(submission.rowNumber, SUBMISSION_COL.UPDATED_AT).setValue(now);

    notifySubmissionReviewed_(project, submission, session, nextStatus, note);

    return apiDashboard_({ token: payload.token });
  } finally {
    lock.releaseLock();
  }
}

function apiSubmitRequest_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const session = requireSession_(payload.token);
    if (session.role !== ROLE.STUDENT) {
      throw new Error('เฉพาะนักเรียนเท่านั้นที่ส่งคำร้องได้');
    }

    const directory = readDirectory_();
    const project = directory.projectsByCode[session.projectCode];
    const student = project.students.find(item => item.studentId === session.studentId);
    const requestType = clean_(payload.requestType);
    const note = clean_(payload.note);
    const requestFile = payload.requestFile;

    if (!requestType) {
      throw new Error('กรุณาเลือกประเภทคำร้อง');
    }
    if (!requestFile || !requestFile.data) {
      throw new Error('กรุณาแนบไฟล์คำร้อง PDF');
    }

    const now = new Date();
    const requestId = makeId_('REQ', project.projectCode);
    const fileUrl = saveFile_(getUploadFolder_(), requestFile, requestId + '-request.pdf');
    const sheet = getOrCreateSheet_(CONFIG.REQUESTS_SHEET, REQUEST_HEADERS);

    sheet.appendRow([
      now,
      requestId,
      student.studentId,
      student.firstName,
      student.lastName,
      project.projectCode,
      requestType,
      fileUrl,
      STATUS.PENDING,
      note,
      '',
      '',
      '',
      now
    ]);

    notifyRequestSubmitted_(project, {
      id: requestId,
      requestType: requestType,
      fileUrl: fileUrl,
      note: note,
      studentName: student.firstName + ' ' + student.lastName
    });

    return apiDashboard_({ token: payload.token });
  } finally {
    lock.releaseLock();
  }
}

function apiReviewRequest_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const session = requireSession_(payload.token);
    if (session.role !== ROLE.ADMIN) {
      throw new Error('เฉพาะแอดมินเท่านั้นที่ตรวจคำร้องได้');
    }

    const requestId = clean_(payload.requestId);
    const decision = clean_(payload.decision);
    const note = clean_(payload.note);
    const request = findRequest_(requestId);

    if (!request) {
      throw new Error('ไม่พบคำร้อง');
    }
    if (decision !== 'approve' && decision !== 'reject') {
      throw new Error('กรุณาเลือกอนุมัติหรือไม่อนุมัติ');
    }

    const nextStatus = decision === 'approve' ? STATUS.APPROVED : STATUS.REJECTED;
    const now = new Date();
    const sheet = getOrCreateSheet_(CONFIG.REQUESTS_SHEET, REQUEST_HEADERS);

    sheet.getRange(request.rowNumber, REQUEST_COL.STATUS).setValue(nextStatus);
    sheet.getRange(request.rowNumber, REQUEST_COL.ADMIN_NOTE).setValue(note || '');
    sheet.getRange(request.rowNumber, REQUEST_COL.REVIEWER).setValue(session.name);
    sheet.getRange(request.rowNumber, REQUEST_COL.REVIEWED_AT).setValue(now);
    sheet.getRange(request.rowNumber, REQUEST_COL.UPDATED_AT).setValue(now);

    const directory = readDirectory_();
    notifyRequestReviewed_(directory.projectsByCode[request.projectCode], request, session, nextStatus, note);

    return apiDashboard_({ token: payload.token });
  } finally {
    lock.releaseLock();
  }
}

function apiSendPendingReminder_(payload) {
  const session = requireSession_(payload.token);
  if (session.role !== ROLE.ADMIN) {
    throw new Error('เฉพาะแอดมินเท่านั้นที่ส่งแจ้งเตือนรวมได้');
  }

  const directory = readDirectory_();
  let count = 0;

  readSubmissions_()
    .filter(item => item.status === STATUS.PENDING || item.status === STATUS.RESUBMITTED)
    .forEach(item => {
      const project = directory.projectsByCode[item.projectCode];
      if (!project || !project.advisor.email) {
        return;
      }

      sendEmail_(
        item.id,
        'pending-reminder',
        [project.advisor.email],
        viewerEmails_(project),
        '[SCIUSNU SMART] แจ้งเตือนงานรอตรวจ ' + item.projectCode,
        emailHtml_('แจ้งเตือนงานรอตรวจ', [
          ['รหัสโครงงาน', item.projectCode],
          ['ชื่อโครงงาน', item.projectTitle],
          ['ประเภทงาน', item.workType],
          ['ผู้ส่ง', item.firstName + ' ' + item.lastName],
          ['สถานะ', item.status],
          ['ไฟล์งาน', link_(item.pdfUrl, 'เปิดไฟล์')]
        ])
      );
      count += 1;
    });

  return {
    ok: true,
    count: count
  };
}

function createLoginResponse_(session) {
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('session:' + token, JSON.stringify(session), CONFIG.SESSION_TTL_SECONDS);
  return {
    ok: true,
    token: token,
    user: publicSession_(session),
    page: session.page
  };
}

function requireSession_(token) {
  const raw = CacheService.getScriptCache().get('session:' + clean_(token));
  if (!raw) {
    throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  }
  return JSON.parse(raw);
}

function publicSession_(session) {
  return {
    role: session.role,
    roleLabel: session.roleLabel,
    viewerType: session.viewerType || '',
    name: session.name || '',
    email: session.email || '',
    studentId: session.studentId || '',
    projectCode: session.projectCode || '',
    projectCodes: session.projectCodes || [],
    page: session.page
  };
}

function readDirectory_() {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(CONFIG.MASTER_SHEET);
  if (!sheet) {
    throw new Error('ไม่พบชีตหลัก: ' + CONFIG.MASTER_SHEET);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { records: [], projects: [], projectsByCode: {} };
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 24).getDisplayValues();
  const records = values.map(row => ({
    studentEmail: clean_(row[0]),
    studentId: clean_(row[1]),
    firstName: clean_(row[2]),
    lastName: clean_(row[3]),
    major: clean_(row[4]),
    projectCode: clean_(row[5]),
    advisorCode: clean_(row[6]),
    advisorEmail: clean_(row[8]),
    advisorName: clean_(row[9]),
    advisorUnit: clean_(row[10]),
    advisorFaculty: clean_(row[11]),
    coAdvisorEmail: clean_(row[12]),
    coAdvisorName: clean_(row[13]),
    coAdvisorUnit: clean_(row[14]),
    schoolAdvisorEmail: clean_(row[15]),
    schoolAdvisorName: clean_(row[16]),
    projectTitle: clean_(row[17]),
    studentPassword: clean_(row[18]),
    phone: clean_(row[19]),
    advisorPassword: clean_(row[21]),
    coAdvisorPassword: clean_(row[22]),
    schoolAdvisorPassword: clean_(row[23])
  })).filter(record => record.studentId || record.projectCode);

  const projectsByCode = {};

  records.forEach(record => {
    if (!record.projectCode) {
      return;
    }

    if (!projectsByCode[record.projectCode]) {
      projectsByCode[record.projectCode] = {
        projectCode: record.projectCode,
        projectTitle: record.projectTitle,
        students: [],
        advisor: emptyReviewer_(),
        coAdvisor: emptyReviewer_(),
        schoolAdvisor: emptyReviewer_()
      };
    }

    const project = projectsByCode[record.projectCode];
    project.projectTitle = project.projectTitle || record.projectTitle;
    project.students.push({
      studentEmail: record.studentEmail,
      studentId: record.studentId,
      firstName: record.firstName,
      lastName: record.lastName,
      major: record.major,
      phone: record.phone
    });

    fillReviewer_(project.advisor, {
      code: record.advisorCode,
      name: record.advisorName,
      email: record.advisorEmail,
      password: record.advisorPassword,
      unit: record.advisorUnit,
      faculty: record.advisorFaculty
    });
    fillReviewer_(project.coAdvisor, {
      name: record.coAdvisorName,
      email: record.coAdvisorEmail,
      password: record.coAdvisorPassword,
      unit: record.coAdvisorUnit
    });
    fillReviewer_(project.schoolAdvisor, {
      name: record.schoolAdvisorName,
      email: record.schoolAdvisorEmail,
      password: record.schoolAdvisorPassword
    });
  });

  const projects = Object.keys(projectsByCode).map(code => projectsByCode[code]);
  return {
    records: records,
    projects: projects,
    projectsByCode: projectsByCode
  };
}

function readSubmissions_() {
  const sheet = getOrCreateSheet_(CONFIG.SUBMISSIONS_SHEET, SUBMISSION_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  return sheet.getRange(2, 1, lastRow - 1, SUBMISSION_HEADERS.length)
    .getValues()
    .map((row, index) => ({
      rowNumber: index + 2,
      timestamp: row[SUBMISSION_COL.TIMESTAMP - 1],
      id: clean_(row[SUBMISSION_COL.ID - 1]),
      relatedId: clean_(row[SUBMISSION_COL.RELATED_ID - 1]),
      studentId: clean_(row[SUBMISSION_COL.STUDENT_ID - 1]),
      firstName: clean_(row[SUBMISSION_COL.FIRST_NAME - 1]),
      lastName: clean_(row[SUBMISSION_COL.LAST_NAME - 1]),
      projectCode: clean_(row[SUBMISSION_COL.PROJECT_CODE - 1]),
      projectTitle: clean_(row[SUBMISSION_COL.PROJECT_TITLE - 1]),
      workType: clean_(row[SUBMISSION_COL.WORK_TYPE - 1]),
      pdfUrl: clean_(row[SUBMISSION_COL.PDF_URL - 1]),
      signatureUrl: clean_(row[SUBMISSION_COL.SIGNATURE_URL - 1]),
      status: clean_(row[SUBMISSION_COL.STATUS - 1]),
      advisorName: clean_(row[SUBMISSION_COL.ADVISOR_NAME - 1]),
      advisorEmail: clean_(row[SUBMISSION_COL.ADVISOR_EMAIL - 1]),
      note: clean_(row[SUBMISSION_COL.NOTE - 1]),
      reviewerName: clean_(row[SUBMISSION_COL.REVIEWER_NAME - 1]),
      reviewerEmail: clean_(row[SUBMISSION_COL.REVIEWER_EMAIL - 1]),
      reviewedAt: row[SUBMISSION_COL.REVIEWED_AT - 1],
      revision: Number(row[SUBMISSION_COL.REVISION - 1] || 0),
      phone: clean_(row[SUBMISSION_COL.PHONE - 1]),
      members: clean_(row[SUBMISSION_COL.MEMBERS - 1]),
      updatedAt: row[SUBMISSION_COL.UPDATED_AT - 1]
    }))
    .filter(item => item.id);
}

function readRequests_() {
  const sheet = getOrCreateSheet_(CONFIG.REQUESTS_SHEET, REQUEST_HEADERS);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  return sheet.getRange(2, 1, lastRow - 1, REQUEST_HEADERS.length)
    .getValues()
    .map((row, index) => ({
      rowNumber: index + 2,
      timestamp: row[REQUEST_COL.TIMESTAMP - 1],
      id: clean_(row[REQUEST_COL.ID - 1]),
      studentId: clean_(row[REQUEST_COL.STUDENT_ID - 1]),
      firstName: clean_(row[REQUEST_COL.FIRST_NAME - 1]),
      lastName: clean_(row[REQUEST_COL.LAST_NAME - 1]),
      projectCode: clean_(row[REQUEST_COL.PROJECT_CODE - 1]),
      requestType: clean_(row[REQUEST_COL.REQUEST_TYPE - 1]),
      fileUrl: clean_(row[REQUEST_COL.FILE_URL - 1]),
      status: clean_(row[REQUEST_COL.STATUS - 1]),
      studentNote: clean_(row[REQUEST_COL.STUDENT_NOTE - 1]),
      adminNote: clean_(row[REQUEST_COL.ADMIN_NOTE - 1]),
      reviewer: clean_(row[REQUEST_COL.REVIEWER - 1]),
      reviewedAt: row[REQUEST_COL.REVIEWED_AT - 1],
      updatedAt: row[REQUEST_COL.UPDATED_AT - 1]
    }))
    .filter(item => item.id);
}

function findSubmission_(submissionId) {
  return readSubmissions_().find(item => item.id === clean_(submissionId)) || null;
}

function findRequest_(requestId) {
  return readRequests_().find(item => item.id === clean_(requestId)) || null;
}

function publicProject_(project) {
  return {
    projectCode: project.projectCode,
    projectTitle: project.projectTitle,
    students: project.students,
    advisor: publicReviewer_(project.advisor),
    coAdvisor: publicReviewer_(project.coAdvisor),
    schoolAdvisor: publicReviewer_(project.schoolAdvisor)
  };
}

function publicReviewer_(reviewer) {
  return {
    code: reviewer.code || '',
    name: reviewer.name || '',
    email: reviewer.email || '',
    unit: reviewer.unit || '',
    faculty: reviewer.faculty || ''
  };
}

function publicSubmission_(item) {
  return {
    id: item.id,
    relatedId: item.relatedId,
    timestamp: formatDate_(item.timestamp),
    studentId: item.studentId,
    studentName: item.firstName + ' ' + item.lastName,
    projectCode: item.projectCode,
    projectTitle: item.projectTitle,
    workType: item.workType,
    pdfUrl: item.pdfUrl,
    signatureUrl: item.signatureUrl,
    status: item.status,
    advisorName: item.advisorName,
    advisorEmail: item.advisorEmail,
    note: item.note,
    reviewerName: item.reviewerName,
    reviewerEmail: item.reviewerEmail,
    reviewedAt: formatDate_(item.reviewedAt),
    revision: item.revision,
    phone: item.phone,
    members: item.members,
    updatedAt: formatDate_(item.updatedAt),
    updatedAtRaw: toIso_(item.updatedAt || item.timestamp),
    canResubmit: item.status === STATUS.REJECTED
  };
}

function publicRequest_(item) {
  return {
    id: item.id,
    timestamp: formatDate_(item.timestamp),
    studentId: item.studentId,
    studentName: item.firstName + ' ' + item.lastName,
    projectCode: item.projectCode,
    requestType: item.requestType,
    fileUrl: item.fileUrl,
    status: item.status,
    studentNote: item.studentNote,
    adminNote: item.adminNote,
    reviewer: item.reviewer,
    reviewedAt: formatDate_(item.reviewedAt),
    updatedAt: formatDate_(item.updatedAt),
    updatedAtRaw: toIso_(item.updatedAt || item.timestamp)
  };
}

function buildStats_(submissions) {
  return {
    total: submissions.length,
    pending: submissions.filter(item => item.status === STATUS.PENDING || item.status === STATUS.RESUBMITTED).length,
    rejected: submissions.filter(item => item.status === STATUS.REJECTED).length,
    approved: submissions.filter(item => item.status === STATUS.APPROVED).length
  };
}

function ensureSheets_() {
  getOrCreateSheet_(CONFIG.SUBMISSIONS_SHEET, SUBMISSION_HEADERS);
  getOrCreateSheet_(CONFIG.REQUESTS_SHEET, REQUEST_HEADERS);
  getOrCreateSheet_(CONFIG.EMAIL_LOG_SHEET, EMAIL_LOG_HEADERS);
}

function getOrCreateSheet_(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e8f0fe');
  sheet.setFrozenRows(1);
  return sheet;
}

function getUploadFolder_() {
  if (CONFIG.DRIVE_FOLDER_ID) {
    return DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  }

  const folders = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
}

function saveFile_(folder, fileObject, fallbackName) {
  const bytes = Utilities.base64Decode(stripDataUrl_(fileObject.data));
  const name = cleanFileName_(fileObject.name || fallbackName);
  const mimeType = clean_(fileObject.mimeType) || MimeType.PDF;
  const blob = Utilities.newBlob(bytes, mimeType, name);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function notifyProjectSubmitted_(project, submission) {
  const subject = '[SCIUSNU SMART] มีงานใหม่รอตรวจ ' + project.projectCode;
  const html = emailHtml_(
    submission.revision > 0 ? 'นักเรียนส่งไฟล์แก้ไข' : 'นักเรียนส่งงานใหม่',
    [
      ['รหัสโครงงาน', project.projectCode],
      ['ชื่อโครงงาน', project.projectTitle],
      ['ผู้ส่ง', submission.studentName + ' (' + submission.studentId + ')'],
      ['ประเภทงาน', submission.workType],
      ['สถานะ', submission.status],
      ['ครั้งที่แก้ไข', String(submission.revision)],
      ['ไฟล์งาน', link_(submission.pdfUrl, 'เปิดไฟล์ PDF')],
      ['ลายเซ็น', submission.signatureUrl ? link_(submission.signatureUrl, 'เปิดไฟล์ลายเซ็น') : '-'],
      ['หมายเหตุ', submission.note || '-']
    ]
  );

  sendEmail_(submission.id, 'project-submitted', [project.advisor.email], viewerEmails_(project), subject, html);
  sendEmail_(submission.id, 'student-confirmation', studentEmails_(project), [], '[SCIUSNU SMART] ระบบรับไฟล์แล้ว', html);
}

function notifySubmissionReviewed_(project, submission, reviewer, nextStatus, note) {
  const subject = '[SCIUSNU SMART] ผลการพิจารณางาน ' + submission.projectCode + ': ' + nextStatus;
  const html = emailHtml_('ผลการพิจารณางาน', [
    ['รหัสโครงงาน', submission.projectCode],
    ['ชื่อโครงงาน', submission.projectTitle],
    ['ประเภทงาน', submission.workType],
    ['ผลการพิจารณา', nextStatus],
    ['ผู้ตรวจ', reviewer.name],
    ['หมายเหตุ', note || '-'],
    ['ไฟล์งาน', link_(submission.pdfUrl, 'เปิดไฟล์ PDF')]
  ]);

  sendEmail_(submission.id, 'submission-reviewed', studentEmails_(project), reviewerEmails_(project), subject, html);
}

function notifyRequestSubmitted_(project, request) {
  const html = emailHtml_('มีคำร้องใหม่', [
    ['รหัสโครงงาน', project.projectCode],
    ['ชื่อโครงงาน', project.projectTitle],
    ['ผู้ส่ง', request.studentName],
    ['ประเภทคำร้อง', request.requestType],
    ['ไฟล์คำร้อง', link_(request.fileUrl, 'เปิดไฟล์คำร้อง')],
    ['หมายเหตุ', request.note || '-']
  ]);

  sendEmail_(request.id, 'request-submitted', CONFIG.ADMIN_EMAILS, studentEmails_(project), '[SCIUSNU SMART] มีคำร้องใหม่รอตรวจ', html);
}

function notifyRequestReviewed_(project, request, reviewer, nextStatus, note) {
  const html = emailHtml_('ผลการพิจารณาคำร้อง', [
    ['รหัสโครงงาน', request.projectCode],
    ['ประเภทคำร้อง', request.requestType],
    ['ผลการพิจารณา', nextStatus],
    ['ผู้ตรวจ', reviewer.name],
    ['หมายเหตุ', note || '-'],
    ['ไฟล์คำร้อง', link_(request.fileUrl, 'เปิดไฟล์คำร้อง')]
  ]);

  sendEmail_(request.id, 'request-reviewed', studentEmails_(project), reviewerEmails_(project), '[SCIUSNU SMART] ผลการพิจารณาคำร้อง: ' + nextStatus, html);
}

function sendEmail_(referenceId, event, toList, ccList, subject, html) {
  const to = uniqueEmails_(toList);
  const cc = uniqueEmails_(ccList).filter(email => to.indexOf(email) === -1);

  if (to.length === 0) {
    logEmail_(referenceId, event, '', cc.join(','), subject, 'SKIPPED', 'ไม่มีอีเมลผู้รับ');
    return false;
  }

  try {
    MailApp.sendEmail({
      to: to.join(','),
      cc: cc.join(','),
      subject: subject,
      htmlBody: html,
      body: stripHtml_(html),
      name: CONFIG.APP_NAME
    });
    logEmail_(referenceId, event, to.join(','), cc.join(','), subject, 'SENT', '');
    return true;
  } catch (error) {
    logEmail_(referenceId, event, to.join(','), cc.join(','), subject, 'FAILED', error.message);
    return false;
  }
}

function logEmail_(referenceId, event, to, cc, subject, result, detail) {
  getOrCreateSheet_(CONFIG.EMAIL_LOG_SHEET, EMAIL_LOG_HEADERS).appendRow([
    new Date(),
    referenceId || '',
    event || '',
    to || '',
    cc || '',
    subject || '',
    result || '',
    detail || ''
  ]);
}

function emailHtml_(title, rows) {
  const rowHtml = rows.map(row => {
    return '<tr><th style="text-align:left;background:#eef2ff;border:1px solid #dbe3ef;padding:8px;width:170px;">' +
      escapeHtml_(row[0]) +
      '</th><td style="border:1px solid #dbe3ef;padding:8px;">' +
      row[1] +
      '</td></tr>';
  }).join('');

  return '<div style="font-family:Arial,Tahoma,sans-serif;color:#111827;line-height:1.55;">' +
    '<h2 style="margin:0 0 4px;">' + CONFIG.APP_NAME + '</h2>' +
    '<h3 style="margin:0 0 14px;color:#1d4ed8;">' + escapeHtml_(title) + '</h3>' +
    '<table style="border-collapse:collapse;width:100%;max-width:760px;">' + rowHtml + '</table>' +
    '<p style="color:#64748b;font-size:12px;margin-top:16px;">อีเมลนี้ส่งโดยระบบอัตโนมัติ</p>' +
    '</div>';
}

function link_(url, label) {
  if (!url) {
    return '-';
  }
  return '<a href="' + escapeHtml_(url) + '">' + escapeHtml_(label) + '</a>';
}

function studentEmails_(project) {
  return project.students.map(student => student.studentEmail);
}

function viewerEmails_(project) {
  return [project.coAdvisor.email, project.schoolAdvisor.email];
}

function reviewerEmails_(project) {
  return [project.advisor.email, project.coAdvisor.email, project.schoolAdvisor.email];
}

function fillReviewer_(target, source) {
  Object.keys(source).forEach(key => {
    if (!target[key] && clean_(source[key])) {
      target[key] = clean_(source[key]);
    }
  });
}

function emptyReviewer_() {
  return {
    code: '',
    name: '',
    email: '',
    password: '',
    unit: '',
    faculty: ''
  };
}

function reviewerMatches_(reviewer, account) {
  return [reviewer.email, reviewer.name, reviewer.code]
    .map(normalize_)
    .filter(Boolean)
    .indexOf(account) !== -1;
}

function parseRequest_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }
  return JSON.parse(e.postData.contents);
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function makeId_(prefix, projectCode) {
  return [
    prefix,
    clean_(projectCode).replace(/[^a-zA-Z0-9-]/g, ''),
    Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyyMMddHHmmss'),
    Utilities.getUuid().slice(0, 6).toUpperCase()
  ].join('-');
}

function stripDataUrl_(value) {
  return String(value || '').replace(/^data:[^;]+;base64,/, '');
}

function cleanFileName_(value) {
  return clean_(value).replace(/[\\/:*?"<>|]+/g, '-');
}

function uniqueEmails_(values) {
  return unique_((values || [])
    .join(',')
    .split(',')
    .map(item => clean_(item).toLowerCase())
    .filter(isEmail_));
}

function unique_(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function isEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean_(value));
}

function clean_(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function normalize_(value) {
  return clean_(value).toLowerCase();
}

function formatDate_(value) {
  const date = toDate_(value);
  if (!date) {
    return '';
  }
  return Utilities.formatDate(date, CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm');
}

function toIso_(value) {
  const date = toDate_(value);
  return date ? date.toISOString() : '';
}

function toDate_(value) {
  if (!value) {
    return null;
  }
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return value;
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function escapeHtml_(value) {
  return clean_(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stripHtml_(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}
