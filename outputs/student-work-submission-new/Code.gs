var SETTINGS = {
  spreadsheetId: PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '14Zs2kyIE8B3DpwvX78l8_IHqtQVYdWP6AZCaS_F0XRc',
  driveFolderId: PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID') || '1a2663IC5L_fkFE28AkUojDPVca8ITi8W',
  adminEmail: PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || 'admin@example.com',
  googleClientId: PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID') || '',
  webUrl: PropertiesService.getScriptProperties().getProperty('WEB_URL') || 'https://sciusnu-project.vercel.app',
  prefix: 'NEW_',
  appName: 'ProjectFlow'
};

var SHEETS = {
  users: {
    name: 'Users',
    headers: ['userId', 'password', 'role', 'name', 'email', 'studentId', 'school', 'active', 'createdAt', 'updatedAt', 'mustChangePassword', 'passwordUpdatedAt', 'phone', 'photoUrl', 'photoFileId']
  },
  students: {
    name: 'Students',
    headers: ['studentId', 'userId', 'prefix', 'name', 'email', 'phone', 'school', 'classLevel', 'room', 'photoUrl', 'projectIds', 'active', 'createdAt', 'updatedAt', 'note']
  },
  projects: {
    name: 'Projects',
    headers: ['projectId', 'title', 'studentIds', 'studentNames', 'advisorId', 'coAdvisorId', 'schoolAdvisorId', 'school', 'dueDate', 'status', 'createdAt', 'updatedAt']
  },
  experts: {
    name: 'Experts',
    headers: ['expertId', 'name', 'email', 'phone', 'organization', 'expertise', 'expertRole', 'photoUrl', 'active', 'createdAt', 'updatedAt', 'note']
  },
  projectExperts: {
    name: 'ProjectExperts',
    headers: ['projectExpertId', 'projectId', 'expertId', 'expertRole', 'responsibility', 'assignedAt', 'active', 'note']
  },
  progressSteps: {
    name: 'ProgressSteps',
    headers: ['processId', 'stepOrder', 'title', 'description', 'workType', 'requiredFileType', 'defaultStatus', 'sortOrder', 'active']
  },
  projectProgress: {
    name: 'ProjectProgress',
    headers: ['projectProgressId', 'projectId', 'processId', 'status', 'percent', 'dueDate', 'startedAt', 'submittedAt', 'reviewedAt', 'completedAt', 'ownerId', 'reviewerId', 'submissionId', 'note', 'updatedAt']
  },
  submissions: {
    name: 'Submissions',
    headers: ['submissionId', 'projectId', 'studentId', 'studentNames', 'title', 'workType', 'fileUrl', 'note', 'status', 'reviewerId', 'reviewerName', 'reviewerNote', 'createdAt', 'updatedAt', 'fileName', 'driveFileId']
  },
  requests: {
    name: 'Requests',
    headers: ['requestId', 'projectId', 'requesterId', 'requesterName', 'requestType', 'typeText', 'status', 'payload', 'signatures', 'currentSignerId', 'currentSignerName', 'currentSignerRole', 'createdAt', 'updatedAt', 'completedAt', 'pdfUrl', 'pdfFileId']
  },
  audit: {
    name: 'AuditLog',
    headers: ['time', 'actor', 'action', 'detail']
  }
};

var DATA_OPTIONS = {
  projectStatus: ['กำลังดำเนินการ', 'ส่งงานแล้ว', 'รอตรวจ', 'อนุมัติ', 'ขอแก้ไข', 'เสร็จสิ้น'],
  progressStatus: ['not_started', 'in_progress', 'submitted', 'reviewing', 'revision', 'approved', 'completed'],
  expertRole: ['advisor', 'co_advisor', 'school_advisor', 'external_expert', 'content_expert', 'methodology_expert'],
  workType: ['ข้อเสนอโครงงาน', 'รายงานความก้าวหน้า', 'บทที่ 1-3', 'รูปเล่มสมบูรณ์', 'สไลด์นำเสนอ']
};

var DEFAULT_PROGRESS_STEPS = [
  { processId: 'proposal', stepOrder: 1, title: 'โครงร่าง (Proposal)', description: 'ส่งและตรวจโครงร่างโครงงาน', workType: 'ข้อเสนอโครงงาน', requiredFileType: 'pdf', defaultStatus: 'not_started', sortOrder: 1, active: 'TRUE' },
  { processId: 'progress_1', stepOrder: 2, title: 'รายงานความก้าวหน้า', description: 'ส่งรายงานความก้าวหน้ารอบแรก', workType: 'รายงานความก้าวหน้า', requiredFileType: 'pdf', defaultStatus: 'not_started', sortOrder: 2, active: 'TRUE' },
  { processId: 'chapter_1_3', stepOrder: 3, title: 'บทที่ 1-3', description: 'ส่งเอกสารบทที่ 1-3 เพื่อให้อาจารย์ตรวจ', workType: 'บทที่ 1-3', requiredFileType: 'pdf', defaultStatus: 'not_started', sortOrder: 3, active: 'TRUE' },
  { processId: 'final_report', stepOrder: 4, title: 'รายงานฉบับสมบูรณ์', description: 'ส่งเล่มสมบูรณ์ของโครงงาน', workType: 'รูปเล่มสมบูรณ์', requiredFileType: 'pdf', defaultStatus: 'not_started', sortOrder: 4, active: 'TRUE' },
  { processId: 'presentation', stepOrder: 5, title: 'สไลด์นำเสนอ', description: 'ส่งไฟล์สำหรับการนำเสนอหรือสอบป้องกัน', workType: 'สไลด์นำเสนอ', requiredFileType: 'pdf', defaultStatus: 'not_started', sortOrder: 5, active: 'TRUE' }
];

function doGet() {
  ensureSheets_();
  return json_({
    ok: true,
    data: {
      app: SETTINGS.appName,
      message: 'ProjectFlow Apps Script is ready',
      sheets: Object.keys(SHEETS).map(function (key) { return sheetName_(SHEETS[key].name); }),
      options: DATA_OPTIONS
    }
  });
}

function doPost(e) {
  try {
    ensureSheets_();
    var request = parseRequest_(e);
    var result = route_(request);
    return json_({ ok: true, data: result || {} });
  } catch (error) {
    return json_({ ok: false, message: error.message || String(error) });
  }
}

function authorizeProjectFlow_() {
  ensureSheets_();
  DriveApp.getFolderById(SETTINGS.driveFolderId).getName();
  var authDoc = DocumentApp.create('ProjectFlow authorization check');
  authDoc.getBody().appendParagraph('Authorization check for PDF generation');
  authDoc.saveAndClose();
  DriveApp.getFileById(authDoc.getId()).setTrashed(true);
  MailApp.getRemainingDailyQuota();
  return {
    ok: true,
    app: SETTINGS.appName,
    spreadsheetId: SETTINGS.spreadsheetId,
    driveFolderId: SETTINGS.driveFolderId
  };
}

function route_(request) {
  var action = request.action;
  var payload = request.payload || {};

  if (action === 'login') return login_(payload);
  if (action === 'googleLogin') return googleLogin_(payload);

  var user = requireUser_(request.token);
  if (action === 'changePassword') return changePassword_(user, payload);
  if (action === 'updateProfilePhoto') return updateProfilePhoto_(user, payload);
  if (action === 'dashboard') return dashboard_(user);
  if (action === 'submitWork') return submitWork_(user, payload);
  if (action === 'reviewSubmission') return reviewSubmission_(user, payload);
  if (action === 'createRequest') return createRequest_(user, payload);
  if (action === 'signRequest') return signRequest_(user, payload);
  if (action === 'sendReminder') return sendReminder_(user, payload);
  if (action === 'createUser') return createUser_(user, payload);
  if (action === 'createProject') return createProject_(user, payload);
  if (action === 'generateStudentAccounts') return generateStudentAccounts_(user);
  if (action === 'syncSourceData') return syncSourceData_(user);
  if (action === 'repairStudentPasswords') return repairStudentPasswords_(user);

  throw new Error('ไม่พบคำสั่งที่ต้องการ');
}

function login_(payload) {
  var account = String(payload.account || '').trim().toLowerCase();
  var password = String(payload.password || '');
  if (!account || !password) throw new Error('กรุณากรอกบัญชีผู้ใช้และรหัสผ่าน');

  var user = findUser_(account);
  if (!user || String(user.password || '') !== password || !isActive_(user)) {
    throw new Error('บัญชีผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }

  audit_(user.userId, 'login', user.role);
  return {
    token: createToken_(user),
    user: safeUser_(user)
  };
}

function googleLogin_(payload) {
  var googleUser = verifyGoogleToken_(payload.credential);
  var email = String(googleUser.email || '').trim().toLowerCase();
  if (!email) throw new Error('ไม่พบอีเมลจากบัญชี Google');

  var user = findUser_(email);
  if (!user || !isActive_(user)) {
    throw new Error('อีเมล Gmail นี้ยังไม่มีสิทธิ์ในระบบ กรุณาติดต่อผู้ดูแลระบบ');
  }

  var safeUser = safeUser_(user);
  safeUser.mustChangePassword = false;
  safeUser.authProvider = 'google';
  audit_(user.userId, 'googleLogin', email);
  return {
    token: createToken_(user),
    user: safeUser
  };
}

function verifyGoogleToken_(credential) {
  var idToken = String(credential || '').trim();
  if (!idToken) throw new Error('ไม่พบ token จาก Google');
  if (!SETTINGS.googleClientId) {
    throw new Error('ยังไม่ได้ตั้งค่า GOOGLE_CLIENT_ID ใน Apps Script');
  }

  var response = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), {
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('ไม่สามารถยืนยันตัวตนกับ Google ได้');
  }

  var profile = JSON.parse(response.getContentText());
  if (String(profile.aud || '') !== SETTINGS.googleClientId) {
    throw new Error('Google Client ID ไม่ตรงกับระบบนี้');
  }
  if (String(profile.email_verified || '') !== 'true') {
    throw new Error('อีเมล Google ยังไม่ได้รับการยืนยัน');
  }
  return profile;
}

function changePassword_(user, payload) {
  var currentPassword = String(payload.currentPassword || '');
  var newPassword = String(payload.newPassword || '');
  if (!currentPassword || !newPassword) throw new Error('กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่');
  if (String(user.password || '') !== currentPassword) throw new Error('รหัสผ่านเดิมไม่ถูกต้อง');
  if (newPassword.length < 4) throw new Error('รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัว');
  if (newPassword === currentPassword) throw new Error('กรุณาตั้งรหัสผ่านใหม่ที่ไม่ซ้ำกับรหัสเดิม');

  var now = new Date().toISOString();
  updateRowById_(SHEETS.users, 'userId', user.userId, {
    password: newPassword,
    mustChangePassword: 'FALSE',
    updatedAt: now,
    passwordUpdatedAt: now
  });
  audit_(user.userId, 'changePassword', user.role);

  return {
    user: safeUser_(findUser_(user.userId))
  };
}

function updateProfilePhoto_(user, payload) {
  if (user.role !== 'student') throw new Error('เฉพาะนักเรียนเท่านั้นที่เปลี่ยนรูปโปรไฟล์ได้');
  if (!payload.fileData) throw new Error('กรุณาเลือกรูปภาพ');

  var mimeType = String(payload.fileMimeType || '').toLowerCase();
  var allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.indexOf(mimeType) === -1) throw new Error('รองรับเฉพาะไฟล์รูป JPG, PNG หรือ WEBP');

  var storedFile = storeProfilePhoto_(user, payload);
  var now = new Date().toISOString();
  updateRowById_(SHEETS.users, 'userId', user.userId, {
    photoUrl: storedFile.url,
    photoFileId: storedFile.id,
    updatedAt: now
  });

  if (user.photoFileId && user.photoFileId !== storedFile.id) {
    try {
      DriveApp.getFileById(user.photoFileId).setTrashed(true);
    } catch (error) {
      // ไม่หยุดการทำงาน ถ้าลบรูปเก่าไม่ได้
    }
  }

  audit_(user.userId, 'updateProfilePhoto', storedFile.id);
  return {
    user: safeUser_(findUser_(user.userId))
  };
}

function dashboard_(user) {
  var users = readRows_(SHEETS.users);
  var students = readRows_(SHEETS.students);
  var experts = readRows_(SHEETS.experts);
  var projectExperts = readRows_(SHEETS.projectExperts);
  var progressSteps = readRows_(SHEETS.progressSteps);
  var projectProgress = readRows_(SHEETS.projectProgress);
  var projectContext = {
    users: users,
    students: students,
    experts: experts,
    projectExperts: projectExperts,
    progressSteps: progressSteps,
    projectProgress: projectProgress
  };
  var projects = filterProjectsForUser_(readRows_(SHEETS.projects), user).map(function (project) {
    return enrichProject_(project, projectContext);
  });
  var projectIds = projects.map(function (project) { return project.projectId; });
  var submissions = readRows_(SHEETS.submissions).filter(function (submission) {
    return user.role === 'admin' || projectIds.indexOf(submission.projectId) !== -1;
  }).map(function (submission) {
    return enrichSubmission_(submission, projects, user, users);
  });
  submissions.sort(function (a, b) {
    return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
  });

  var canReview = ['advisor', 'admin'].indexOf(user.role) !== -1;
  var reviewQueue = canReview ? submissions.filter(function (submission) {
    return submission.canReview && ['ส่งแล้ว', 'รอตรวจ'].indexOf(String(submission.status || '')) !== -1;
  }) : [];
  var requests = filterRequestsForUser_(readRows_(SHEETS.requests), user, projects, users);
  var requestStats = requestStats_(requests);

  return {
    user: safeUser_(user),
    projects: projects,
    submissions: submissions,
    reviewQueue: reviewQueue,
    requests: requests,
    requestStats: requestStats,
    options: DATA_OPTIONS,
    stats: {
      projects: projects.length,
      submitted: submissions.length,
      pending: reviewQueue.length,
      approved: submissions.filter(function (submission) { return submission.status === 'อนุมัติ'; }).length
    }
  };
}

function submitWork_(user, payload) {
  if (user.role !== 'student') throw new Error('เฉพาะนักเรียนเท่านั้นที่ส่งงานได้');

  var project = readRows_(SHEETS.projects).filter(function (item) {
    return item.projectId === payload.projectId;
  })[0];
  if (!project) throw new Error('ไม่พบโครงงาน');

  var studentKey = String(user.studentId || user.userId || '');
  if (split_(project.studentIds).indexOf(studentKey) === -1) {
    throw new Error('บัญชีนี้ไม่ได้อยู่ในโครงงานที่เลือก');
  }

  var submitted = readRows_(SHEETS.submissions).some(function (submission) {
    return String(submission.projectId) === String(project.projectId);
  });
  if (submitted) throw new Error('โครงงานนี้ส่งงานแล้ว ไม่สามารถส่งซ้ำได้');

  if (!payload.fileData) throw new Error('กรุณาอัปโหลดไฟล์ PDF');
  validatePdfPayload_(payload);

  var now = new Date().toISOString();
  payload.title = project.title || payload.workType || 'ไฟล์โครงงาน';
  var storedFile = storeSubmissionFile_(project, payload, user);
  var submission = {
    submissionId: 'SUB-' + Utilities.getUuid(),
    projectId: project.projectId,
    studentId: studentKey,
    studentNames: user.name,
    title: payload.title,
    workType: payload.workType || 'ส่งงาน',
    fileUrl: storedFile.url,
    fileName: storedFile.name,
    driveFileId: storedFile.id,
    note: payload.note || '',
    status: 'ส่งแล้ว',
    reviewerId: '',
    reviewerName: '',
    reviewerNote: '',
    createdAt: now,
    updatedAt: now
  };

  appendRow_(SHEETS.submissions, submission);
  markProjectProgressFromSubmission_(project, submission, 'submitted', now, user);
  updateRowById_(SHEETS.projects, 'projectId', project.projectId, { status: 'ส่งงานแล้ว', updatedAt: now });
  notifyReviewers_(project, submission);
  audit_(user.userId, 'submitWork', submission.submissionId);
  return { submissionId: submission.submissionId };
}

function reviewSubmission_(user, payload) {
  if (['advisor', 'admin'].indexOf(user.role) === -1) {
    throw new Error('บัญชีนี้ไม่มีสิทธิ์ตรวจงาน');
  }

  var submissions = readRows_(SHEETS.submissions);
  var submission = submissions.filter(function (item) { return item.submissionId === payload.submissionId; })[0];
  if (!submission) throw new Error('ไม่พบรายการส่งงาน');

  var project = readRows_(SHEETS.projects).filter(function (item) { return item.projectId === submission.projectId; })[0];
  if (!project) throw new Error('ไม่พบโครงงานของรายการนี้');

  if (!canReviewSubmission_(user, project)) {
    throw new Error('บัญชีนี้ไม่มีสิทธิ์ตรวจโครงงานนี้');
  }

  var status = payload.status === 'อนุมัติ' ? 'อนุมัติ' : 'ขอแก้ไข';
  var now = new Date().toISOString();
  updateRowById_(SHEETS.submissions, 'submissionId', submission.submissionId, {
    status: status,
    reviewerId: user.userId,
    reviewerName: user.name,
    reviewerNote: payload.note || '',
    updatedAt: now
  });
  markProjectProgressFromReview_(project, submission, status, now, user, payload.note || '');
  updateRowById_(SHEETS.projects, 'projectId', project.projectId, {
    status: status === 'อนุมัติ' ? 'ผ่านการตรวจล่าสุด' : 'รอแก้ไข',
    updatedAt: now
  });

  notifyStudents_(project, submission, status, payload.note || '', user);
  audit_(user.userId, 'reviewSubmission', submission.submissionId + ' ' + status);
  return { submissionId: submission.submissionId, status: status };
}

function createRequest_(user, payload) {
  if (user.role !== 'student') throw new Error('เฉพาะนักเรียนเท่านั้นที่ยื่นคำร้องได้');

  var requestType = String(payload.requestType || '').trim();
  if (['project_name', 'project_branch', 'other'].indexOf(requestType) === -1) {
    throw new Error('กรุณาเลือกประเภทคำร้องที่เปิดใช้งาน');
  }

  var ownerSignature = String(user.name || payload.ownerSignature || '').trim();
  var ownerSignatureImage = String(payload.ownerSignatureImage || '').trim();
  if (!ownerSignature) {
    throw new Error('ไม่พบชื่อผู้ยื่นคำร้องในบัญชีผู้ใช้');
  }
  if (!ownerSignatureImage) {
    throw new Error('กรุณาเซ็นในช่องลายเซ็นอิเล็กทรอนิกส์');
  }

  var projects = readRows_(SHEETS.projects);
  var project = projects.filter(function (item) { return item.projectId === payload.projectId; })[0];
  if (!project) throw new Error('ไม่พบโครงงาน');

  var studentKey = String(user.studentId || user.userId || '');
  if (split_(project.studentIds).indexOf(studentKey) === -1) {
    throw new Error('บัญชีนี้ไม่ได้อยู่ในโครงงานที่เลือก');
  }

  validateRequestPayload_(requestType, payload, project);

  var now = new Date().toISOString();
  var users = readRows_(SHEETS.users);
  var signatures = buildRequestSigners_(project, user, users, now, ownerSignature, ownerSignatureImage);
  var nextSigner = nextUnsignedSigner_(signatures);
  var requestPayload = {
    requesterName: user.name || '',
    requesterEmail: user.email || '',
    requesterStudentId: studentKey,
    prefix: '',
    classLevel: '',
    phone: user.phone || payload.phone || '',
    newTitleTh: payload.newTitleTh || '',
    newTitleEn: payload.newTitleEn || '',
    currentBranch: project.school || '',
    newBranch: payload.newBranch || '',
    otherSubject: payload.otherSubject || '',
    otherDetail: payload.otherDetail || '',
    reason: payload.reason || ''
  };
  var request = {
    requestId: 'REQ-' + Utilities.getUuid(),
    projectId: project.projectId,
    requesterId: studentKey,
    requesterName: user.name,
    requestType: requestType,
    typeText: requestTypeText_(requestType),
    status: nextSigner ? 'รอดำเนินการ' : 'อนุมัติแล้ว',
    payload: JSON.stringify(requestPayload),
    signatures: JSON.stringify(signatures),
    currentSignerId: nextSigner ? nextSigner.userId : '',
    currentSignerName: nextSigner ? nextSigner.name : '',
    currentSignerRole: nextSigner ? nextSigner.role : '',
    createdAt: now,
    updatedAt: now,
    completedAt: nextSigner ? '' : now
  };

  appendRow_(SHEETS.requests, request);
  if (nextSigner) {
    notifyRequestSigner_(request, nextSigner, project);
  } else {
    applyRequestEffect_(request, project);
    var createdPdf = generateRequestPdf_(request, project, users);
    request.pdfUrl = createdPdf.url;
    request.pdfFileId = createdPdf.id;
    updateRowById_(SHEETS.requests, 'requestId', request.requestId, {
      pdfUrl: createdPdf.url,
      pdfFileId: createdPdf.id
    });
    notifyRequestCompleted_(request, project, users);
  }
  audit_(user.userId, 'createRequest', request.requestId + ' ' + request.typeText);
  return enrichRequest_(request, project, user, users);
}

function signRequest_(user, payload) {
  var requestId = String(payload.requestId || '').trim();
  var signature = String(user.name || payload.signature || '').trim();
  var signatureImage = String(payload.signatureImage || '').trim();
  if (!requestId) throw new Error('ไม่พบเลขคำร้อง');
  if (!signature) throw new Error('ไม่พบชื่อผู้เซ็นในบัญชีผู้ใช้');
  if (!signatureImage) throw new Error('กรุณาเซ็นในช่องลายเซ็นอิเล็กทรอนิกส์');

  var requests = readRows_(SHEETS.requests);
  var request = requests.filter(function (item) { return item.requestId === requestId; })[0];
  if (!request) throw new Error('ไม่พบคำร้อง');
  if (request.status !== 'รอดำเนินการ') throw new Error('คำร้องนี้ไม่ได้อยู่ในสถานะรอเซ็น');

  var projects = readRows_(SHEETS.projects);
  var project = projects.filter(function (item) { return item.projectId === request.projectId; })[0];
  if (!project) throw new Error('ไม่พบโครงงานของคำร้องนี้');

  var signatures = parseSignatures_(request.signatures);
  var currentSigner = nextUnsignedSigner_(signatures);
  if (!currentSigner) throw new Error('คำร้องนี้ไม่มีผู้รอเซ็น');
  if (!signerMatchesUser_(currentSigner, user)) {
    throw new Error('ยังไม่ถึงลำดับการเซ็นของบัญชีนี้');
  }

  var now = new Date().toISOString();
  currentSigner.status = 'signed';
  currentSigner.signedAt = now;
  currentSigner.signature = signature;
  currentSigner.signatureImage = signatureImage;
  currentSigner.signedBy = user.userId;
  currentSigner.signedName = user.name;

  var nextSigner = nextUnsignedSigner_(signatures);
  var updates = {
    signatures: JSON.stringify(signatures),
    updatedAt: now
  };
  var users = readRows_(SHEETS.users);

  if (nextSigner) {
    updates.currentSignerId = nextSigner.userId;
    updates.currentSignerName = nextSigner.name;
    updates.currentSignerRole = nextSigner.role;
    notifyRequestSigner_(request, nextSigner, project);
  } else {
    updates.status = 'อนุมัติแล้ว';
    updates.currentSignerId = '';
    updates.currentSignerName = '';
    updates.currentSignerRole = '';
    updates.completedAt = now;
    request.status = updates.status;
    request.signatures = updates.signatures;
    request.completedAt = now;
    request.currentSignerId = '';
    request.currentSignerName = '';
    request.currentSignerRole = '';
    applyRequestEffect_(request, project);
    var pdf = generateRequestPdf_(request, project, users);
    updates.pdfUrl = pdf.url;
    updates.pdfFileId = pdf.id;
    request.pdfUrl = pdf.url;
    request.pdfFileId = pdf.id;
    notifyRequestCompleted_(request, project, users);
  }

  updateRowById_(SHEETS.requests, 'requestId', request.requestId, updates);
  audit_(user.userId, 'signRequest', request.requestId);
  return { requestId: request.requestId, status: updates.status || request.status };
}

function sendReminder_(user) {
  if (['advisor', 'admin'].indexOf(user.role) === -1) {
    throw new Error('บัญชีนี้ไม่มีสิทธิ์ส่งแจ้งเตือน');
  }

  var projects = filterProjectsForUser_(readRows_(SHEETS.projects), user);
  var projectIds = projects.map(function (project) { return project.projectId; });
  var pending = readRows_(SHEETS.submissions).filter(function (submission) {
    return projectIds.indexOf(submission.projectId) !== -1 && ['ส่งแล้ว', 'รอตรวจ', 'ขอแก้ไข'].indexOf(submission.status) !== -1;
  });

  var count = 0;
  pending.forEach(function (submission) {
    var project = projects.filter(function (item) { return item.projectId === submission.projectId; })[0];
    count += sendStudentReminder_(project, submission);
  });

  audit_(user.userId, 'sendReminder', String(count));
  return { count: count };
}

function createUser_(user, payload) {
  requireAdmin_(user);
  var normalized = normalizeNewUser_(payload);
  if (findUser_(normalized.userId) || findUser_(normalized.email) || findUser_(normalized.studentId)) throw new Error('มีบัญชีนี้แล้ว');

  var now = new Date().toISOString();
  appendRow_(SHEETS.users, {
    userId: normalized.userId,
    password: normalized.password,
    role: normalized.role,
    name: normalized.name,
    email: normalized.email || '',
    studentId: normalized.studentId || '',
    school: normalized.school || '',
    phone: normalized.phone || '',
    active: 'TRUE',
    mustChangePassword: normalized.mustChangePassword ? 'TRUE' : 'FALSE',
    createdAt: now,
    updatedAt: now,
    passwordUpdatedAt: ''
  });
  if (normalized.role === 'student') upsertStudentProfile_(normalized, '');
  if (['advisor', 'co_advisor', 'school_advisor'].indexOf(normalized.role) !== -1) upsertExpertFromUser_(normalized);
  sendCredentialEmail_(normalized);
  audit_(user.userId, 'createUser', normalized.userId);
  return {
    userId: normalized.userId,
    credentials: {
      userId: normalized.userId,
      password: normalized.password,
      name: normalized.name,
      generated: normalized.generated,
      mustChangePassword: normalized.mustChangePassword
    }
  };
}

function createProject_(user, payload) {
  requireAdmin_(user);
  if (!payload.projectId || !payload.title) throw new Error('กรุณากรอกรหัสและชื่อโครงงาน');
  var projects = readRows_(SHEETS.projects);
  if (projects.some(function (project) { return project.projectId === payload.projectId; })) {
    throw new Error('มีรหัสโครงงานนี้แล้ว');
  }

  var now = new Date().toISOString();
  appendRow_(SHEETS.projects, {
    projectId: payload.projectId,
    title: payload.title,
    studentIds: payload.studentIds || '',
    studentNames: payload.studentNames || '',
    advisorId: payload.advisorId || '',
    coAdvisorId: payload.coAdvisorId || '',
    schoolAdvisorId: payload.schoolAdvisorId || '',
    school: payload.school || '',
    dueDate: payload.dueDate || '',
    status: 'กำลังดำเนินการ',
    createdAt: now,
    updatedAt: now
  });
  ensureProjectExpertLinks_();
  ensureProjectProgressRows_();
  audit_(user.userId, 'createProject', payload.projectId);
  return { projectId: payload.projectId };
}

function generateStudentAccounts_(user) {
  requireAdmin_(user);
  var projects = readRows_(SHEETS.projects);
  var credentials = [];

  projects.forEach(function (project) {
    var ids = split_(project.studentIds);
    var names = split_(project.studentNames);
    ids.forEach(function (studentId, index) {
      if (findUser_(studentId)) return;
      var now = new Date().toISOString();
      var password = generateStudentPassword_();
      var student = {
        userId: studentId,
        password: password,
        role: 'student',
        name: names[index] || studentId,
        email: '',
        studentId: studentId,
        school: project.school || '',
        phone: '',
        active: 'TRUE',
        mustChangePassword: 'TRUE',
        createdAt: now,
        updatedAt: now,
        passwordUpdatedAt: ''
      };
      appendRow_(SHEETS.users, student);
      upsertStudentProfile_(student, project.projectId);
      credentials.push({
        userId: student.userId,
        password: password,
        name: student.name,
        generated: true,
        mustChangePassword: true
      });
    });
  });

  audit_(user.userId, 'generateStudentAccounts', String(credentials.length));
  return { credentials: credentials };
}

function syncSourceData_(user) {
  requireAdmin_(user);
  return syncSourceDataFromSheet1_();
}

function repairStudentPasswords_(user) {
  requireAdmin_(user);
  return repairStudentPasswordDisplay_();
}

function syncSourceDataManual_() {
  ensureSheets_();
  return syncSourceDataFromSheet1_();
}

function syncSourceDataManual() {
  return syncSourceDataManual_();
}

function syncSourceDataFromSheet1_() {
  var spreadsheet = SpreadsheetApp.openById(SETTINGS.spreadsheetId);
  var source = spreadsheet.getSheetByName('sheet1');
  if (!source) throw new Error('ไม่พบแท็บ sheet1');

  var values = source.getDataRange().getValues();
  if (values.length <= 1) throw new Error('sheet1 ยังไม่มีข้อมูลนำเข้า');
  var sourceHeaders = values[0].map(function (value) { return clean_(value).toLowerCase(); });

  ensureSheets_();
  var now = new Date().toISOString();
  var users = readRows_(SHEETS.users);
  var existingUsers = {};
  users.forEach(function (item) {
    [item.userId, item.email, item.studentId].forEach(function (value) {
      if (value) existingUsers[String(value).trim().toLowerCase()] = true;
    });
  });

  var projects = readRows_(SHEETS.projects);
  var existingProjects = {};
  projects.forEach(function (project) {
    if (project.projectId) existingProjects[String(project.projectId).trim()] = true;
  });

  var groupedProjects = {};
  var staff = {};
  var createdStudents = 0;
  var createdStaff = 0;

  values.slice(1).forEach(function (row) {
    var studentEmail = clean_(row[0]);
    var studentId = clean_(row[1]);
    var firstName = clean_(row[2]);
    var lastName = clean_(row[3]);
    var major = clean_(row[4]);
    var studentPhone = phoneFromSourceRow_(row, sourceHeaders);
    var projectId = clean_(row[5]);
    var advisorEmail = clean_(row[8]);
    var advisorName = clean_(row[9]);
    var advisorOrg = clean_(row[10]) || clean_(row[11]);
    var coAdvisorEmail = clean_(row[12]);
    var coAdvisorName = clean_(row[13]);
    var coAdvisorOrg = clean_(row[14]);
    var schoolAdvisorEmail = clean_(row[15]);
    var schoolAdvisorName = clean_(row[16]);
    var title = clean_(row[17]);
    if (!studentId || !projectId) return;

    var studentName = [firstName, lastName].filter(Boolean).join(' ') || studentId;
    if (!existingUsers[String(studentId).toLowerCase()]) {
      appendRow_(SHEETS.users, {
        userId: studentId,
        password: generateStudentPassword_(),
        role: 'student',
        name: studentName,
        email: studentEmail,
        studentId: studentId,
        school: major,
        phone: studentPhone,
        active: 'TRUE',
        createdAt: now,
        updatedAt: now,
        mustChangePassword: 'TRUE',
        passwordUpdatedAt: ''
      });
      existingUsers[String(studentId).toLowerCase()] = true;
      if (studentEmail) existingUsers[String(studentEmail).toLowerCase()] = true;
      createdStudents += 1;
    }
    upsertStudentProfile_({
      userId: studentId,
      role: 'student',
      name: studentName,
      email: studentEmail,
      studentId: studentId,
      school: major,
      phone: studentPhone,
      active: 'TRUE',
      createdAt: now,
      updatedAt: now
    }, projectId);

    var advisorId = collectStaff_(staff, existingUsers, 'advisor', advisorName, advisorEmail, advisorOrg, projectId);
    var coAdvisorId = collectStaff_(staff, existingUsers, 'co_advisor', coAdvisorName, coAdvisorEmail, coAdvisorOrg, projectId);
    var schoolAdvisorId = collectStaff_(staff, existingUsers, 'school_advisor', schoolAdvisorName, schoolAdvisorEmail, '', projectId);

    if (!groupedProjects[projectId]) {
      groupedProjects[projectId] = {
        projectId: projectId,
        title: title || projectId,
        studentIds: [],
        studentNames: [],
        advisorId: advisorId,
        coAdvisorId: coAdvisorId,
        schoolAdvisorId: schoolAdvisorId,
        school: major,
        dueDate: '',
        status: 'กำลังดำเนินการ',
        createdAt: now,
        updatedAt: now
      };
    }
    groupedProjects[projectId].studentIds.push(studentId);
    groupedProjects[projectId].studentNames.push(studentName);
    groupedProjects[projectId].advisorId = groupedProjects[projectId].advisorId || advisorId;
    groupedProjects[projectId].coAdvisorId = groupedProjects[projectId].coAdvisorId || coAdvisorId;
    groupedProjects[projectId].schoolAdvisorId = groupedProjects[projectId].schoolAdvisorId || schoolAdvisorId;
  });

  Object.keys(staff).forEach(function (key) {
    var item = staff[key];
    if (existingUsers[String(item.userId).toLowerCase()]) return;
    appendRow_(SHEETS.users, {
      userId: item.userId,
      password: generatePassword_(),
      role: item.role,
      name: item.name,
      email: item.email,
      studentId: '',
      school: item.school,
      phone: '',
      active: 'TRUE',
      createdAt: now,
      updatedAt: now,
      mustChangePassword: item.email ? 'FALSE' : 'TRUE',
      passwordUpdatedAt: ''
    });
    upsertExpertFromUser_({
      userId: item.userId,
      role: item.role,
      name: item.name,
      email: item.email,
      school: item.school,
      phone: '',
      active: 'TRUE',
      createdAt: now,
      updatedAt: now
    });
    existingUsers[String(item.userId).toLowerCase()] = true;
    if (item.email) existingUsers[String(item.email).toLowerCase()] = true;
    createdStaff += 1;
  });

  var createdProjects = 0;
  Object.keys(groupedProjects).forEach(function (projectId) {
    if (existingProjects[projectId]) return;
    var project = groupedProjects[projectId];
    project.studentIds = unique_(project.studentIds).join(', ');
    project.studentNames = unique_(project.studentNames).join(', ');
    appendRow_(SHEETS.projects, project);
    ensureProjectExpertLinks_();
    ensureProjectProgressRows_();
    existingProjects[projectId] = true;
    createdProjects += 1;
  });

  var missingEmailRows = Object.keys(staff).map(function (key) { return staff[key]; }).filter(function (item) {
    return !item.email;
  });
  writeMissingAdvisorEmails_(spreadsheet, missingEmailRows);
  audit_('system', 'syncSourceData', 'students=' + createdStudents + ', staff=' + createdStaff + ', projects=' + createdProjects);

  return {
    createdStudents: createdStudents,
    createdStaff: createdStaff,
    createdProjects: createdProjects,
    missingAdvisorEmails: missingEmailRows.length
  };
}

function normalizeNewUser_(payload) {
  var role = payload.role || 'student';
  var password = payload.password || (role === 'student' ? generateStudentPassword_() : generatePassword_());
  var generated = !payload.password;
  var email = String(payload.email || '').trim();
  var studentId = String(payload.studentId || '').trim();
  var phone = String(payload.phone || '').trim();
  var mustChangePassword = role === 'student';

  if (!payload.name) throw new Error('กรุณากรอกชื่อ-สกุล');

  if (role === 'student') {
    var studentUser = studentId || String(payload.userId || '').trim();
    if (!studentUser) throw new Error('นักเรียนต้องมีรหัสนักเรียน');
    return {
      userId: studentUser,
      password: password,
      role: role,
      name: payload.name,
      email: email,
      studentId: studentUser,
      school: payload.school || '',
      phone: phone,
      generated: generated,
      mustChangePassword: mustChangePassword
    };
  }

  var staffUser = email || String(payload.userId || '').trim();
  if (!staffUser) throw new Error('admin/อาจารย์ต้องใช้อีเมลเป็น USER');
  return {
    userId: staffUser,
    password: password,
    role: role,
    name: payload.name,
    email: staffUser,
    studentId: '',
    school: payload.school || '',
    phone: phone,
    generated: generated,
    mustChangePassword: false
  };
}

function storeSubmissionFile_(project, payload, user) {
  validatePdfPayload_(payload);
  var root = DriveApp.getFolderById(SETTINGS.driveFolderId);
  var projectFolder = getOrCreateFolder_(root, sanitizeFileName_(project.projectId + ' - ' + project.title));
  var bytes = Utilities.base64Decode(payload.fileData);
  var originalName = payload.fileName || 'submission-file';
  var safeName = sanitizeFileName_(project.projectId + ' - ' + payload.title + ' - ' + originalName);
  if (!/\.pdf$/i.test(safeName)) safeName += '.pdf';
  var blob = Utilities.newBlob(bytes, 'application/pdf', safeName);
  var file = projectFolder.createFile(blob);
  file.setDescription('Uploaded by ' + user.name + ' via ' + SETTINGS.appName);
  return {
    id: file.getId(),
    name: file.getName(),
    url: file.getUrl()
  };
}

function storeProfilePhoto_(user, payload) {
  var root = DriveApp.getFolderById(SETTINGS.driveFolderId);
  var profileFolder = getOrCreateFolder_(root, '_profile_photos');
  var bytes = Utilities.base64Decode(payload.fileData);
  if (bytes.length > 4 * 1024 * 1024) throw new Error('รูปภาพต้องมีขนาดไม่เกิน 4 MB');

  var extension = profilePhotoExtension_(payload.fileMimeType);
  var owner = user.studentId || user.userId || 'student';
  var safeName = sanitizeFileName_('profile-' + owner + '-' + Date.now()) + extension;
  var blob = Utilities.newBlob(bytes, payload.fileMimeType, safeName);
  var file = profileFolder.createFile(blob);
  file.setDescription('Profile photo of ' + user.name + ' in ' + SETTINGS.appName);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (error) {
    // ถ้าองค์กรปิดการแชร์สาธารณะ ระบบยังเก็บรูปไว้ใน Drive ได้
  }
  return {
    id: file.getId(),
    name: file.getName(),
    url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w320'
  };
}

function profilePhotoExtension_(mimeType) {
  var type = String(mimeType || '').toLowerCase();
  if (type === 'image/png') return '.png';
  if (type === 'image/webp') return '.webp';
  return '.jpg';
}

function validatePdfPayload_(payload) {
  var fileName = String(payload.fileName || '').toLowerCase();
  var mimeType = String(payload.fileMimeType || '').toLowerCase();
  if (!payload.fileData || (mimeType !== 'application/pdf' && !/\.pdf$/i.test(fileName))) {
    throw new Error('อัปโหลดได้เฉพาะไฟล์ PDF เท่านั้น');
  }
}

function getOrCreateFolder_(parent, name) {
  var folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function sanitizeFileName_(value) {
  return String(value || 'file').replace(/[\\/:*?"<>|#%{}~&]/g, '-').slice(0, 160);
}

function sendCredentialEmail_(user) {
  if (!user.email) return;
  var body = [
    'เรียน ' + user.name,
    '',
    'บัญชีของคุณถูกสร้างในระบบ ' + SETTINGS.appName,
    'USER: ' + user.userId,
    'PASSWORD: ' + user.password,
    ''
  ];
  if (user.mustChangePassword) {
    body.push('เมื่อเข้าสู่ระบบครั้งแรก กรุณาเปลี่ยนรหัสผ่านใหม่ก่อนเริ่มใช้งาน');
    body.push('');
  }
  body.push('กรุณาเก็บรหัสผ่านนี้ไว้เป็นความลับ');
  MailApp.sendEmail(
    user.email,
    '[' + SETTINGS.appName + '] ข้อมูลเข้าสู่ระบบ',
    body.join('\n')
  );
}

function notifyReviewers_(project, submission) {
  var users = readRows_(SHEETS.users);
  var reviewerIds = [project.advisorId].filter(Boolean);
  var recipients = users.filter(function (user) {
    return (reviewerIds.indexOf(user.userId) !== -1 || reviewerIds.indexOf(user.email) !== -1) && user.email;
  });
  var subject = '[' + SETTINGS.appName + '] มีงานใหม่รอตรวจ: ' + submission.title;
  var body = [
    'เรียนอาจารย์',
    '',
    'นักเรียนส่งงานใหม่ในโครงงาน: ' + project.title,
    'ประเภทงาน: ' + submission.workType,
    'ผู้ส่ง: ' + submission.studentNames,
    'ลิงก์ไฟล์: ' + submission.fileUrl,
    '',
    'หมายเหตุ: ' + (submission.note || '-')
  ].join('\n');

  recipients.forEach(function (recipient) {
    MailApp.sendEmail(recipient.email, subject, body);
  });
}

function notifyStudents_(project, submission, status, note, reviewer) {
  var users = readRows_(SHEETS.users);
  var studentIds = split_(project.studentIds);
  var recipients = users.filter(function (user) {
    var key = String(user.studentId || user.userId || '');
    return studentIds.indexOf(key) !== -1 && user.email;
  });
  var subject = '[' + SETTINGS.appName + '] ผลการตรวจงาน: ' + status;
  var body = [
    'เรียน นักเรียน',
    '',
    'อาจารย์ตรวจงาน "' + submission.title + '" แล้ว',
    'โครงงาน: ' + project.title,
    'สถานะ: ' + status,
    'ผู้ตรวจ: ' + reviewer.name,
    '',
    'ข้อเสนอแนะ: ' + (note || '-')
  ].join('\n');

  recipients.forEach(function (recipient) {
    MailApp.sendEmail(recipient.email, subject, body);
  });
}

function sendStudentReminder_(project, submission) {
  var users = readRows_(SHEETS.users);
  var studentIds = split_(project.studentIds);
  var count = 0;
  users.forEach(function (user) {
    var key = String(user.studentId || user.userId || '');
    if (studentIds.indexOf(key) === -1 || !user.email) return;
    MailApp.sendEmail(
      user.email,
      '[' + SETTINGS.appName + '] แจ้งเตือนงานที่ต้องติดตาม',
      [
        'เรียน ' + user.name,
        '',
        'กรุณาติดตามงานในโครงงาน: ' + project.title,
        'รายการล่าสุด: ' + submission.title,
        'สถานะ: ' + submission.status,
        '',
        'หากได้รับการส่งแก้ไข กรุณาปรับปรุงและส่งใหม่ในระบบ'
      ].join('\n')
    );
    count += 1;
  });
  return count;
}

function filterRequestsForUser_(requests, user, projects, users) {
  var projectMap = {};
  projects.forEach(function (project) {
    projectMap[project.projectId] = project;
  });

  return requests.map(function (request) {
    return enrichRequest_(request, projectMap[request.projectId] || {}, user, users);
  }).filter(function (request) {
    if (user.role === 'admin') return true;
    if (String(request.requesterId) === String(user.studentId || user.userId || '')) return true;
    return request.signaturesData.some(function (signer) {
      return signerMatchesUser_(signer, user);
    });
  }).sort(function (a, b) {
    return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
  });
}

function requestStats_(requests) {
  return {
    total: requests.length,
    pending: requests.filter(function (request) { return request.status === 'รอดำเนินการ'; }).length,
    approved: requests.filter(function (request) { return request.status === 'อนุมัติแล้ว'; }).length,
    rejected: requests.filter(function (request) { return request.status === 'ปฏิเสธแล้ว'; }).length
  };
}

function enrichRequest_(request, project, user, users) {
  var payload = parseJson_(request.payload, {});
  var signatures = parseSignatures_(request.signatures);
  var currentSigner = nextUnsignedSigner_(signatures);
  var signedCount = signatures.filter(function (signer) { return signer.status === 'signed'; }).length;
  request.payloadData = payload;
  request.signaturesData = signatures;
  request.projectTitle = project.title || request.projectId;
  request.projectCode = project.projectId || request.projectId;
  request.currentBranch = project.school || payload.currentBranch || '';
  request.typeText = request.typeText || requestTypeText_(request.requestType);
  request.currentSignerName = currentSigner ? currentSigner.name : request.currentSignerName;
  request.currentSignerRole = currentSigner ? currentSigner.role : request.currentSignerRole;
  request.canSign = request.status === 'รอดำเนินการ' && currentSigner && signerMatchesUser_(currentSigner, user);
  request.progressText = signedCount + '/' + signatures.length;
  request.nextSignerLabel = currentSigner ? currentSigner.label : '';
  return request;
}

function validateRequestPayload_(requestType, payload, project) {
  if (!payload.projectId) throw new Error('กรุณาเลือกโครงงาน');
  if (requestType === 'project_name') {
    if (!payload.newTitleTh && !payload.newTitleEn) throw new Error('กรุณากรอกชื่อโครงงานใหม่');
    if (!payload.reason) throw new Error('กรุณาระบุเหตุผล');
  }
  if (requestType === 'project_branch') {
    if (!payload.newBranch) throw new Error('กรุณากรอกสาขาใหม่');
    if (String(payload.newBranch || '').trim() === String(project.school || '').trim()) {
      throw new Error('สาขาใหม่ต้องไม่ซ้ำกับสาขาปัจจุบัน');
    }
    if (!payload.reason) throw new Error('กรุณาระบุเหตุผล');
  }
  if (requestType === 'other') {
    if (!payload.otherSubject || !payload.otherDetail) throw new Error('กรุณากรอกหัวข้อและรายละเอียดคำร้อง');
  }
}

function buildRequestSigners_(project, requester, users, now, ownerSignature, ownerSignatureImage) {
  var signatures = [];
  var seen = {};

  function addSigner(role, label, account, fallbackName, fallbackEmail, fallbackStudentId, signed) {
    var resolved = resolveSigner_(account, users, fallbackName, fallbackEmail, fallbackStudentId);
    var key = signerIdentityKey_(resolved);
    if (!key || seen[key]) return;
    seen[key] = true;
    signatures.push({
      role: role,
      label: label,
      userId: resolved.userId || '',
      email: resolved.email || '',
      studentId: resolved.studentId || '',
      name: resolved.name || fallbackName || resolved.userId || resolved.email || '',
      status: signed ? 'signed' : 'pending',
      signedAt: signed ? now : '',
      signature: signed ? (ownerSignature || requester.name) : '',
      signatureImage: signed ? (ownerSignatureImage || '') : '',
      signedBy: signed ? requester.userId : '',
      signedName: signed ? requester.name : ''
    });
  }

  addSigner('owner', 'ผู้ยื่นคำร้อง', requester.userId, requester.name, requester.email, requester.studentId, true);

  var requesterKey = String(requester.studentId || requester.userId || '');
  var studentIds = split_(project.studentIds);
  var studentNames = split_(project.studentNames);
  studentIds.forEach(function (studentId, index) {
    if (String(studentId) === requesterKey) return;
    addSigner('peer', 'เพื่อนร่วมโครงงาน', studentId, studentNames[index] || studentId, '', studentId, false);
  });

  addSigner('advisor', 'อาจารย์ที่ปรึกษาหลัก', project.advisorId, advisorName_(project.advisorId, users), '', '', false);
  addSigner('co_advisor', 'อาจารย์ที่ปรึกษาร่วม', project.coAdvisorId, advisorName_(project.coAdvisorId, users), '', '', false);
  addSigner('school_advisor', 'อาจารย์ที่ปรึกษาโรงเรียน', project.schoolAdvisorId, advisorName_(project.schoolAdvisorId, users), '', '', false);

  var admin = findAdminUser_(users);
  addSigner('admin', 'ผู้ดูแลระบบ', admin.userId, admin.name, admin.email, '', false);

  return signatures;
}

function resolveSigner_(account, users, fallbackName, fallbackEmail, fallbackStudentId) {
  var user = findUserInList_(users, account) || findUserInList_(users, fallbackStudentId) || findUserInList_(users, fallbackEmail);
  if (user) {
    return {
      userId: user.userId || '',
      email: user.email || '',
      studentId: user.studentId || '',
      name: user.name || fallbackName || user.userId || user.email || ''
    };
  }
  return {
    userId: account || fallbackStudentId || fallbackEmail || fallbackName || '',
    email: fallbackEmail || '',
    studentId: fallbackStudentId || '',
    name: fallbackName || account || fallbackEmail || fallbackStudentId || ''
  };
}

function findUserInList_(users, account) {
  var key = String(account || '').trim().toLowerCase();
  if (!key) return null;
  return users.filter(function (user) {
    return [user.userId, user.email, user.studentId].filter(Boolean).map(function (value) {
      return String(value).trim().toLowerCase();
    }).indexOf(key) !== -1;
  })[0] || null;
}

function findAdminUser_(users) {
  return users.filter(function (user) {
    return user.role === 'admin' && isActive_(user);
  })[0] || {
    userId: SETTINGS.adminEmail,
    email: SETTINGS.adminEmail,
    name: 'ผู้ดูแลระบบ'
  };
}

function signerIdentityKey_(signer) {
  return String(signer.userId || signer.email || signer.studentId || signer.name || '').trim().toLowerCase();
}

function signerMatchesUser_(signer, user) {
  if (signer.role === 'admin' && user.role === 'admin') return true;
  var userKeys = [user.userId, user.email, user.studentId].filter(Boolean).map(function (value) {
    return String(value).trim().toLowerCase();
  });
  var signerKeys = [signer.userId, signer.email, signer.studentId].filter(Boolean).map(function (value) {
    return String(value).trim().toLowerCase();
  });
  return signerKeys.some(function (key) { return userKeys.indexOf(key) !== -1; });
}

function nextUnsignedSigner_(signatures) {
  return signatures.filter(function (signer) {
    return signer.status !== 'signed';
  })[0] || null;
}

function parseSignatures_(value) {
  var signatures = parseJson_(value, []);
  return Array.isArray(signatures) ? signatures : [];
}

function parseJson_(value, fallback) {
  if (!value) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function requestTypeText_(type) {
  var map = {
    project_name: 'เปลี่ยนชื่อโครงงาน',
    project_branch: 'เปลี่ยนสาขาโครงงาน',
    other: 'คำร้องอื่น ๆ'
  };
  return map[type] || 'คำร้องทั่วไป';
}

function applyRequestEffect_(request, project) {
  var payload = parseJson_(request.payload, {});
  var now = new Date().toISOString();
  if (request.requestType === 'project_name') {
    var newTitle = buildProjectTitle_(payload);
    if (newTitle) {
      updateRowById_(SHEETS.projects, 'projectId', request.projectId, {
        title: newTitle,
        updatedAt: now
      });
    }
  }
  if (request.requestType === 'project_branch' && payload.newBranch) {
    updateRowById_(SHEETS.projects, 'projectId', request.projectId, {
      school: payload.newBranch,
      updatedAt: now
    });
  }
}

function buildProjectTitle_(payload) {
  var thai = String(payload.newTitleTh || '').trim();
  var english = String(payload.newTitleEn || '').trim();
  if (thai && english) return thai + ' / ' + english;
  return thai || english || '';
}

function generateRequestPdf_(request, project, users) {
  var payload = parseJson_(request.payload, {});
  var signatures = parseSignatures_(request.signatures);
  var root = DriveApp.getFolderById(SETTINGS.driveFolderId);
  var requestFolder = getOrCreateFolder_(root, 'คำร้องทั่วไป');
  var docTitle = sanitizeFileName_(request.requestId + ' - ' + request.typeText);
  var doc = DocumentApp.create(docTitle);
  var body = doc.getBody();

  body.appendParagraph('แบบคำร้องออนไลน์').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(SETTINGS.appName + ' | ' + request.requestId);
  body.appendParagraph('');
  body.appendTable([
    ['ประเภทคำร้อง', request.typeText || requestTypeText_(request.requestType)],
    ['สถานะ', request.status || 'อนุมัติแล้ว'],
    ['วันที่ยื่นคำร้อง', formatThaiDateTime_(request.createdAt)],
    ['วันที่อนุมัติครบ', formatThaiDateTime_(request.completedAt || request.updatedAt)],
    ['เจ้าของเรื่อง', request.requesterName || payload.requesterName || '-'],
    ['รหัสนักเรียน', request.requesterId || payload.requesterStudentId || '-'],
    ['เบอร์ติดต่อ', payload.phone || '-'],
    ['รหัสโครงงาน', project.projectId || request.projectId],
    ['ชื่อโครงงาน', project.title || request.projectId],
    ['รายละเอียดคำร้อง', requestPdfDetail_(request, payload, project)]
  ]);

  body.appendParagraph('');
  body.appendParagraph('ลำดับลายเซ็นอิเล็กทรอนิกส์').setHeading(DocumentApp.ParagraphHeading.HEADING2);
  var signatureTable = body.appendTable([['ลำดับ', 'บทบาท', 'ชื่อผู้เซ็น', 'ลายเซ็น', 'วันเวลา']]);
  signatures.forEach(function (signer, index) {
    var row = signatureTable.appendTableRow();
    row.appendTableCell(String(index + 1));
    row.appendTableCell(signer.label || signer.role || '-');
    row.appendTableCell(signer.name || '-');
    appendSignatureToCell_(row.appendTableCell(''), signer);
    row.appendTableCell(formatThaiDateTime_(signer.signedAt));
  });
  body.appendParagraph('');
  body.appendParagraph('เอกสารนี้สร้างโดยระบบอัตโนมัติหลังผู้เกี่ยวข้องเซ็นครบทุกลำดับ');

  doc.saveAndClose();
  var docFile = DriveApp.getFileById(doc.getId());
  var pdfBlob = docFile.getAs(MimeType.PDF).setName(docTitle + '.pdf');
  var pdfFile = requestFolder.createFile(pdfBlob);
  pdfFile.setDescription('Approved request PDF generated by ' + SETTINGS.appName + ' for ' + request.requestId);
  docFile.setTrashed(true);

  return {
    id: pdfFile.getId(),
    url: pdfFile.getUrl(),
    name: pdfFile.getName()
  };
}

function appendSignatureToCell_(cell, signer) {
  var imageBlob = signatureImageBlob_(signer.signatureImage, signer.name || signer.signedName || 'signature');
  if (imageBlob) {
    var image = cell.appendImage(imageBlob);
    image.setWidth(120);
  }
  cell.appendParagraph(signer.signature || signer.signedName || '-');
}

function signatureImageBlob_(dataUrl, name) {
  var match = String(dataUrl || '').match(/^data:image\/png;base64,(.+)$/);
  if (!match) return null;
  return Utilities.newBlob(
    Utilities.base64Decode(match[1]),
    'image/png',
    sanitizeFileName_((name || 'signature') + '.png')
  );
}

function requestPdfDetail_(request, payload, project) {
  if (request.requestType === 'project_name') {
    return 'ขอเปลี่ยนชื่อโครงงานจาก "' + (project.title || '-') + '" เป็น "' + buildProjectTitle_(payload) + '" เหตุผล: ' + (payload.reason || '-');
  }
  if (request.requestType === 'project_branch') {
    return 'ขอเปลี่ยนสาขาจาก "' + (payload.currentBranch || project.school || '-') + '" เป็น "' + (payload.newBranch || '-') + '" เหตุผล: ' + (payload.reason || '-');
  }
  return (payload.otherSubject || '-') + ' — ' + (payload.otherDetail || '-');
}

function formatThaiDateTime_(value) {
  if (!value) return '-';
  var date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return Utilities.formatDate(date, 'Asia/Bangkok', 'dd/MM/yyyy HH:mm');
}

function notifyRequestSigner_(request, signer, project) {
  if (!signer.email) return;
  var payload = parseJson_(request.payload, {});
  var subject = '[' + SETTINGS.appName + '] คำร้องรอการเซ็น: ' + request.typeText;
  var body = [
    'เรียน ' + signer.name,
    '',
    'มีคำร้องออนไลน์รอการเซ็นอิเล็กทรอนิกส์',
    'ประเภทคำร้อง: ' + request.typeText,
    'โครงงาน: ' + (project.title || request.projectId),
    'ผู้ยื่นคำร้อง: ' + request.requesterName,
    'เหตุผล/รายละเอียด: ' + (payload.reason || payload.otherDetail || '-'),
    '',
    'กรุณาเข้าสู่ระบบเพื่อเซ็นคำร้อง:',
    SETTINGS.webUrl
  ].join('\n');
  MailApp.sendEmail(signer.email, subject, body);
}

function notifyRequestCompleted_(request, project, users) {
  var requester = findUserInList_(users, request.requesterId);
  if (!requester || !requester.email) return;
  MailApp.sendEmail(
    requester.email,
    '[' + SETTINGS.appName + '] คำร้องอนุมัติแล้ว: ' + request.typeText,
    [
      'เรียน ' + (requester.name || request.requesterName),
      '',
      'คำร้องของคุณได้รับการเซ็นครบทุกลำดับแล้ว',
      'ประเภทคำร้อง: ' + request.typeText,
      'โครงงาน: ' + (project.title || request.projectId),
      request.pdfUrl ? 'ไฟล์ PDF คำร้องพร้อมลายเซ็น: ' + request.pdfUrl : '',
      '',
      'ระบบได้ปรับข้อมูลที่เกี่ยวข้องให้อัตโนมัติแล้ว (หากเป็นคำร้องเปลี่ยนชื่อหรือสาขาโครงงาน)'
    ].filter(function (line) { return line !== ''; }).join('\n')
  );
}

function enrichSubmission_(submission, projects, user, users) {
  var project = projects.filter(function (item) { return item.projectId === submission.projectId; })[0] || {};
  var student = findSubmissionStudent_(submission, project, users || []);
  submission.projectTitle = project.title || submission.projectId;
  submission.dueDate = project.dueDate || '';
  if (!submission.studentNames) submission.studentNames = student.name || project.studentNames || submission.studentId || '';
  submission.studentPhotoUrl = student.photoUrl || '';
  submission.studentPhone = student.phone || '';
  submission.studentSchool = student.school || project.school || '';
  submission.canViewFile = canViewSubmissionFile_(user, project);
  submission.canReview = canReviewSubmission_(user, project);
  if (!submission.canViewFile) {
    submission.fileUrl = '';
    submission.fileName = '';
    submission.driveFileId = '';
  }
  return submission;
}

function canViewSubmissionFile_(user, project) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'student') {
    var studentKey = String(user.studentId || user.userId || '');
    return split_(project.studentIds).indexOf(studentKey) !== -1;
  }
  return canReviewSubmission_(user, project);
}

function canReviewSubmission_(user, project) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'advisor') return false;
  var userKeys = [user.userId, user.email].filter(Boolean).map(function (value) {
    return String(value).trim().toLowerCase();
  });
  var advisorKeys = [project.advisorId].filter(Boolean).map(function (value) {
    return String(value).trim().toLowerCase();
  });
  return advisorKeys.some(function (key) { return userKeys.indexOf(key) !== -1; });
}

function enrichProject_(project, context) {
  var projectContext = normalizeProjectContext_(context);
  project.advisorName = advisorName_(project.advisorId, projectContext.users);
  project.coAdvisorName = advisorName_(project.coAdvisorId, projectContext.users);
  project.schoolAdvisorName = advisorName_(project.schoolAdvisorId, projectContext.users);
  project.advisorProfiles = advisorProfiles_(project, projectContext.users);
  project.students = projectStudents_(project, projectContext.users, projectContext.students);
  project.experts = projectExperts_(project, projectContext.experts, projectContext.projectExperts);
  var progress = projectProgress_(project, projectContext.progressSteps, projectContext.projectProgress);
  project.progressSteps = progress.steps;
  project.progressCurrent = progress.current;
  project.progressPercent = progress.percent;
  project.progressStatusText = progress.statusText;
  return project;
}

function normalizeProjectContext_(context) {
  if (Array.isArray(context)) {
    return { users: context, students: [], experts: [], projectExperts: [], progressSteps: [], projectProgress: [] };
  }
  return {
    users: context && context.users ? context.users : [],
    students: context && context.students ? context.students : [],
    experts: context && context.experts ? context.experts : [],
    projectExperts: context && context.projectExperts ? context.projectExperts : [],
    progressSteps: context && context.progressSteps ? context.progressSteps : [],
    projectProgress: context && context.projectProgress ? context.projectProgress : []
  };
}

function projectStudents_(project, users, studentProfiles) {
  var ids = split_(project.studentIds);
  var names = split_(project.studentNames);
  return ids.map(function (studentId, index) {
    var student = findUserInList_(users, studentId) || {};
    var studentProfile = findStudentProfile_(studentProfiles || [], studentId) || {};
    return {
      studentId: studentProfile.studentId || student.studentId || studentId,
      userId: studentProfile.userId || student.userId || studentId,
      prefix: studentProfile.prefix || '',
      name: studentProfile.name || student.name || names[index] || studentId,
      email: studentProfile.email || student.email || '',
      photoUrl: studentProfile.photoUrl || student.photoUrl || '',
      phone: studentProfile.phone || student.phone || '',
      school: studentProfile.school || student.school || project.school || '',
      classLevel: studentProfile.classLevel || '',
      room: studentProfile.room || ''
    };
  });
}

function findStudentProfile_(students, account) {
  var key = String(account || '').trim().toLowerCase();
  if (!key) return null;
  return students.filter(function (student) {
    return [student.studentId, student.userId, student.email].filter(Boolean).map(function (value) {
      return String(value).trim().toLowerCase();
    }).indexOf(key) !== -1;
  })[0] || null;
}

function advisorProfiles_(project, users) {
  return [
    advisorProfile_(project.advisorId, users, 'อาจารย์ที่ปรึกษาหลัก', project.advisorName),
    advisorProfile_(project.coAdvisorId, users, 'อาจารย์ที่ปรึกษาร่วม', project.coAdvisorName),
    advisorProfile_(project.schoolAdvisorId, users, 'อาจารย์ที่ปรึกษาโรงเรียน', project.schoolAdvisorName)
  ].filter(function (profile) {
    return profile.name || profile.email || profile.userId;
  });
}

function advisorProfile_(account, users, roleLabel, fallbackName) {
  var user = findUserInList_(users, account) || {};
  return {
    userId: user.userId || account || '',
    role: roleLabel,
    name: user.name || fallbackName || account || '',
    email: user.email || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(account || '')) ? account : ''),
    phone: user.phone || '',
    school: user.school || '',
    photoUrl: user.photoUrl || ''
  };
}

function projectExperts_(project, experts, projectExpertRows) {
  var links = (projectExpertRows || []).filter(function (link) {
    return String(link.projectId || '') === String(project.projectId || '') && String(link.active || 'TRUE').toUpperCase() !== 'FALSE';
  });
  return links.map(function (link) {
    var expert = findExpert_(experts || [], link.expertId) || {};
    return {
      projectExpertId: link.projectExpertId || '',
      expertId: link.expertId || expert.expertId || '',
      role: link.expertRole || expert.expertRole || 'external_expert',
      roleText: expertRoleText_(link.expertRole || expert.expertRole),
      name: expert.name || link.expertId || '',
      email: expert.email || '',
      phone: expert.phone || '',
      organization: expert.organization || '',
      expertise: expert.expertise || '',
      responsibility: link.responsibility || '',
      photoUrl: expert.photoUrl || ''
    };
  });
}

function findExpert_(experts, expertId) {
  var key = String(expertId || '').trim().toLowerCase();
  if (!key) return null;
  return experts.filter(function (expert) {
    return [expert.expertId, expert.email, expert.name].filter(Boolean).map(function (value) {
      return String(value).trim().toLowerCase();
    }).indexOf(key) !== -1;
  })[0] || null;
}

function projectProgress_(project, progressSteps, projectProgressRows) {
  var steps = activeProgressSteps_(progressSteps);
  var rows = {};
  (projectProgressRows || []).forEach(function (row) {
    if (String(row.projectId || '') === String(project.projectId || '')) rows[row.processId] = row;
  });

  var enriched = steps.map(function (step) {
    var row = rows[step.processId] || {};
    var status = row.status || step.defaultStatus || 'not_started';
    return {
      processId: step.processId,
      stepOrder: Number(step.stepOrder || step.sortOrder || 0),
      title: step.title,
      description: step.description || '',
      workType: step.workType || '',
      requiredFileType: step.requiredFileType || 'pdf',
      status: status,
      statusText: progressStatusText_(status),
      percent: Number(row.percent || progressPercentFromStatus_(status)),
      dueDate: row.dueDate || (step.processId === 'final_report' ? project.dueDate : ''),
      startedAt: row.startedAt || '',
      submittedAt: row.submittedAt || '',
      reviewedAt: row.reviewedAt || '',
      completedAt: row.completedAt || '',
      submissionId: row.submissionId || '',
      note: row.note || ''
    };
  });

  var current = enriched.filter(function (step) {
    return ['approved', 'completed'].indexOf(step.status) === -1;
  })[0] || enriched[enriched.length - 1] || {};
  var percent = enriched.length
    ? Math.round(enriched.reduce(function (sum, step) { return sum + Number(step.percent || 0); }, 0) / enriched.length)
    : 0;

  return {
    steps: enriched,
    current: current,
    percent: percent,
    statusText: current.statusText || 'ยังไม่เริ่ม'
  };
}

function activeProgressSteps_(progressSteps) {
  var source = progressSteps && progressSteps.length ? progressSteps : DEFAULT_PROGRESS_STEPS;
  return source.filter(function (step) {
    return String(step.active || 'TRUE').toUpperCase() !== 'FALSE';
  }).sort(function (a, b) {
    return Number(a.sortOrder || a.stepOrder || 0) - Number(b.sortOrder || b.stepOrder || 0);
  });
}

function progressStatusText_(status) {
  var map = {
    not_started: 'ยังไม่เริ่ม',
    in_progress: 'กำลังดำเนินการ',
    submitted: 'ส่งแล้ว',
    reviewing: 'รอตรวจสอบ',
    revision: 'ส่งกลับแก้ไข',
    approved: 'อนุมัติแล้ว',
    completed: 'เสร็จสิ้น'
  };
  return map[status] || status || 'ยังไม่เริ่ม';
}

function progressPercentFromStatus_(status) {
  var map = {
    not_started: 0,
    in_progress: 30,
    submitted: 55,
    reviewing: 70,
    revision: 50,
    approved: 100,
    completed: 100
  };
  return map[status] === undefined ? 0 : map[status];
}

function expertRoleText_(role) {
  var map = {
    advisor: 'อาจารย์ที่ปรึกษาหลัก',
    co_advisor: 'อาจารย์ที่ปรึกษาร่วม',
    school_advisor: 'อาจารย์ที่ปรึกษาโรงเรียน',
    external_expert: 'ผู้เชี่ยวชาญภายนอก',
    content_expert: 'ผู้เชี่ยวชาญด้านเนื้อหา',
    methodology_expert: 'ผู้เชี่ยวชาญด้านวิธีวิจัย'
  };
  return map[role] || role || 'ผู้เชี่ยวชาญ';
}

function markProjectProgressFromSubmission_(project, submission, status, now, actor) {
  var processId = processIdFromWorkType_(submission.workType || submission.title);
  if (!project.projectId || !processId) return;
  ensureProjectProgressRows_();
  var progressId = project.projectId + '-' + processId;
  var progressStatus = status === 'submitted' ? 'reviewing' : status;
  var dueDate = processId === 'final_report' ? (project.dueDate || '') : '';
  upsertRowById_(SHEETS.projectProgress, 'projectProgressId', progressId, {
    projectProgressId: progressId,
    projectId: project.projectId,
    processId: processId,
    status: progressStatus,
    percent: progressPercentFromStatus_(progressStatus),
    dueDate: dueDate,
    startedAt: now,
    submittedAt: now,
    reviewedAt: '',
    completedAt: '',
    ownerId: actor.userId || actor.studentId || '',
    reviewerId: '',
    submissionId: submission.submissionId || '',
    note: submission.note || '',
    updatedAt: now
  });
}

function markProjectProgressFromReview_(project, submission, reviewStatus, now, reviewer, note) {
  var processId = processIdFromWorkType_(submission.workType || submission.title);
  if (!project.projectId || !processId) return;
  var progressId = project.projectId + '-' + processId;
  var progressStatus = reviewStatus === 'อนุมัติ' ? 'approved' : (reviewStatus === 'ขอแก้ไข' ? 'revision' : 'reviewing');
  var completedAt = progressStatus === 'approved' ? now : '';
  var dueDate = processId === 'final_report' ? (project.dueDate || '') : '';
  upsertRowById_(SHEETS.projectProgress, 'projectProgressId', progressId, {
    projectProgressId: progressId,
    projectId: project.projectId,
    processId: processId,
    status: progressStatus,
    percent: progressPercentFromStatus_(progressStatus),
    dueDate: dueDate,
    reviewedAt: now,
    completedAt: completedAt,
    reviewerId: reviewer.userId || reviewer.email || '',
    submissionId: submission.submissionId || '',
    note: note || '',
    updatedAt: now
  });
}

function processIdFromWorkType_(value) {
  var text = String(value || '').toLowerCase();
  if (/ข้อเสนอ|โครงร่าง|proposal/.test(text)) return 'proposal';
  if (/ความก้าว|progress/.test(text)) return 'progress_1';
  if (/บทที่\\s*1|1-3|chapter/.test(text)) return 'chapter_1_3';
  if (/สมบูรณ์|final|เล่ม/.test(text)) return 'final_report';
  if (/สไลด์|นำเสนอ|presentation|slide/.test(text)) return 'presentation';
  return '';
}

function findSubmissionStudent_(submission, project, users) {
  var keys = [submission.studentId].concat(split_(project.studentIds || ''));
  for (var index = 0; index < keys.length; index += 1) {
    var student = findUserInList_(users, keys[index]);
    if (student) return student;
  }
  return {};
}

function advisorName_(account, users) {
  var key = String(account || '').trim().toLowerCase();
  if (!key) return '';
  var user = users.filter(function (item) {
    return [item.userId, item.email].filter(Boolean).map(function (value) {
      return String(value).trim().toLowerCase();
    }).indexOf(key) !== -1;
  })[0];
  return user && user.name ? user.name : account;
}

function filterProjectsForUser_(projects, user) {
  if (user.role === 'admin') return projects;
  if (user.role === 'student') {
    var studentKey = String(user.studentId || user.userId || '');
    return projects.filter(function (project) {
      return split_(project.studentIds).indexOf(studentKey) !== -1;
    });
  }
  if (user.role === 'advisor') {
    return projects.filter(function (project) { return project.advisorId === user.userId || project.advisorId === user.email; });
  }
  if (user.role === 'co_advisor') {
    return projects.filter(function (project) { return project.coAdvisorId === user.userId || project.coAdvisorId === user.email; });
  }
  if (user.role === 'school_advisor') {
    return projects.filter(function (project) {
      return project.schoolAdvisorId === user.userId || project.schoolAdvisorId === user.email || (user.school && project.school === user.school);
    });
  }
  return [];
}

function requireAdmin_(user) {
  if (user.role !== 'admin') throw new Error('เฉพาะผู้ดูแลระบบเท่านั้น');
}

function requireUser_(token) {
  var data = readToken_(token);
  var user = findUser_(data.userId);
  if (!user || !isActive_(user)) throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  return user;
}

function createToken_(user) {
  var body = Utilities.base64EncodeWebSafe(JSON.stringify({
    userId: user.userId,
    exp: Date.now() + 1000 * 60 * 60 * 12
  }));
  var signature = sign_(body);
  return body + '.' + signature;
}

function readToken_(token) {
  if (!token || token.indexOf('.') === -1) throw new Error('กรุณาเข้าสู่ระบบ');
  var parts = token.split('.');
  if (sign_(parts[0]) !== parts[1]) throw new Error('เซสชันไม่ถูกต้อง');
  var data = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
  if (Date.now() > Number(data.exp || 0)) throw new Error('เซสชันหมดอายุ');
  return data;
}

function sign_(value) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(value, getSecret_()));
}

function getSecret_() {
  var properties = PropertiesService.getScriptProperties();
  var secret = properties.getProperty('PROJECTFLOW_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid();
    properties.setProperty('PROJECTFLOW_SECRET', secret);
  }
  return secret;
}

function findUser_(account) {
  var key = String(account || '').trim().toLowerCase();
  return readRows_(SHEETS.users).filter(function (user) {
    return [user.userId, user.email, user.studentId].filter(Boolean).map(function (value) {
      return String(value).trim().toLowerCase();
    }).indexOf(key) !== -1;
  })[0] || null;
}

function safeUser_(user) {
  return {
    userId: user.userId,
    role: user.role,
    name: user.name,
    email: user.email,
    studentId: user.studentId,
    school: user.school,
    phone: user.phone,
    photoUrl: user.photoUrl,
    passwordUpdatedAt: user.passwordUpdatedAt,
    mustChangePassword: toBoolean_(user.mustChangePassword)
  };
}

function isActive_(user) {
  return String(user.active || 'TRUE').toUpperCase() !== 'FALSE';
}

function toBoolean_(value) {
  return value === true || String(value || '').toUpperCase() === 'TRUE';
}

function parseRequest_(e) {
  var text = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  return JSON.parse(text);
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureSheets_() {
  Object.keys(SHEETS).forEach(function (key) {
    getSheet_(SHEETS[key]);
  });

  if (readRows_(SHEETS.users).length === 0) {
    var now = new Date().toISOString();
    appendRow_(SHEETS.users, {
      userId: SETTINGS.adminEmail,
      password: 'admin123',
      role: 'admin',
      name: 'ผู้ดูแลระบบ',
      email: SETTINGS.adminEmail,
      studentId: '',
      school: '',
      phone: '',
      active: 'TRUE',
      mustChangePassword: 'FALSE',
      createdAt: now,
      updatedAt: now,
      passwordUpdatedAt: ''
    });
  }
  seedProgressSteps_();
  seedStudentsFromUsers_();
  seedExpertsFromUsers_();
  ensureProjectExpertLinks_();
  ensureProjectProgressRows_();
  formatDataSheets_();
}

function getSheet_(definition) {
  var spreadsheet = SpreadsheetApp.openById(SETTINGS.spreadsheetId);
  var name = sheetName_(definition.name);
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);

  var headerRange = sheet.getRange(1, 1, 1, definition.headers.length);
  var current = headerRange.getValues()[0];
  var hasHeader = current.some(function (value) { return value; });
  if (!hasHeader) {
    headerRange.setValues([definition.headers]);
    sheet.setFrozenRows(1);
  } else {
    var missing = definition.headers.filter(function (header) {
      return current.indexOf(header) === -1;
    });
    if (missing.length) {
      var headerCount = current.reduce(function (count, value, index) {
        return value ? index + 1 : count;
      }, 0);
      sheet.getRange(1, headerCount + 1, 1, missing.length).setValues([missing]);
    }
  }
  return sheet;
}

function formatDataSheets_() {
  formatTextColumns_(SHEETS.users, ['userId', 'password', 'studentId', 'phone']);
  formatTextColumns_(SHEETS.students, ['studentId', 'userId', 'phone', 'classLevel', 'room']);
  formatTextColumns_(SHEETS.experts, ['expertId', 'phone']);
  formatTextColumns_(SHEETS.projects, ['projectId']);
  formatTextColumns_(SHEETS.projectExperts, ['projectExpertId', 'projectId', 'expertId']);
  formatTextColumns_(SHEETS.projectProgress, ['projectProgressId', 'projectId', 'processId']);
}

function formatTextColumns_(definition, columns) {
  var sheet = getSheet_(definition);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  columns.forEach(function (header) {
    var index = headers.indexOf(header);
    if (index !== -1) sheet.getRange(1, index + 1, sheet.getMaxRows(), 1).setNumberFormat('@');
  });
}

function seedProgressSteps_() {
  var existing = readRows_(SHEETS.progressSteps);
  var existingIds = {};
  existing.forEach(function (step) {
    if (step.processId) existingIds[String(step.processId)] = true;
  });
  DEFAULT_PROGRESS_STEPS.forEach(function (step) {
    if (!existingIds[String(step.processId)]) appendRow_(SHEETS.progressSteps, step);
  });
}

function seedStudentsFromUsers_() {
  if (readRows_(SHEETS.students).length > 0) return;
  readRows_(SHEETS.users).filter(function (user) {
    return user.role === 'student' && user.studentId;
  }).forEach(function (user) {
    upsertStudentProfile_(user, '');
  });
}

function seedExpertsFromUsers_() {
  if (readRows_(SHEETS.experts).length > 0) return;
  readRows_(SHEETS.users).filter(function (user) {
    return ['advisor', 'co_advisor', 'school_advisor'].indexOf(user.role) !== -1;
  }).forEach(function (user) {
    upsertExpertFromUser_(user);
  });
}

function ensureProjectExpertLinks_() {
  var existing = {};
  readRows_(SHEETS.projectExperts).forEach(function (link) {
    existing[String(link.projectId || '') + '|' + String(link.expertId || '') + '|' + String(link.expertRole || '')] = true;
  });
  readRows_(SHEETS.projects).forEach(function (project) {
    appendProjectExpertLink_(existing, project, project.advisorId, 'advisor', 'ดูแลและอนุมัติการตรวจโครงงาน');
    appendProjectExpertLink_(existing, project, project.coAdvisorId, 'co_advisor', 'ให้คำปรึกษาร่วมและติดตามความก้าวหน้า');
    appendProjectExpertLink_(existing, project, project.schoolAdvisorId, 'school_advisor', 'ประสานงานและติดตามจากโรงเรียน');
  });
}

function appendProjectExpertLink_(existing, project, expertId, expertRole, responsibility) {
  if (!project.projectId || !expertId) return;
  var key = String(project.projectId) + '|' + String(expertId) + '|' + String(expertRole);
  if (existing[key]) return;
  appendRow_(SHEETS.projectExperts, {
    projectExpertId: project.projectId + '-' + expertRole,
    projectId: project.projectId,
    expertId: expertId,
    expertRole: expertRole,
    responsibility: responsibility || '',
    assignedAt: project.createdAt || new Date().toISOString(),
    active: 'TRUE',
    note: ''
  });
  existing[key] = true;
}

function ensureProjectProgressRows_() {
  var steps = activeProgressSteps_(readRows_(SHEETS.progressSteps));
  var existing = {};
  readRows_(SHEETS.projectProgress).forEach(function (row) {
    existing[String(row.projectId || '') + '|' + String(row.processId || '')] = true;
  });
  readRows_(SHEETS.projects).forEach(function (project) {
    steps.forEach(function (step) {
      var key = String(project.projectId || '') + '|' + String(step.processId || '');
      if (!project.projectId || existing[key]) return;
      appendRow_(SHEETS.projectProgress, {
        projectProgressId: project.projectId + '-' + step.processId,
        projectId: project.projectId,
        processId: step.processId,
        status: step.defaultStatus || 'not_started',
        percent: progressPercentFromStatus_(step.defaultStatus || 'not_started'),
        dueDate: step.processId === 'final_report' ? (project.dueDate || '') : '',
        startedAt: '',
        submittedAt: '',
        reviewedAt: '',
        completedAt: '',
        ownerId: '',
        reviewerId: '',
        submissionId: '',
        note: '',
        updatedAt: project.createdAt || new Date().toISOString()
      });
      existing[key] = true;
    });
  });
}

function upsertStudentProfile_(user, projectId) {
  var studentId = String(user.studentId || user.userId || '').trim();
  if (!studentId) return;
  var existing = readRows_(SHEETS.students).filter(function (item) {
    return String(item.studentId || '').trim() === studentId;
  })[0] || {};
  var projectIds = unique_(split_(existing.projectIds).concat(projectId ? [projectId] : []));
  var now = new Date().toISOString();
  upsertRowById_(SHEETS.students, 'studentId', studentId, {
    studentId: studentId,
    userId: user.userId || studentId,
    prefix: existing.prefix || '',
    name: user.name || existing.name || studentId,
    email: user.email || existing.email || '',
    phone: user.phone || existing.phone || '',
    school: user.school || existing.school || '',
    classLevel: user.classLevel || existing.classLevel || '',
    room: user.room || existing.room || '',
    photoUrl: user.photoUrl || existing.photoUrl || '',
    projectIds: projectIds.join(', '),
    active: user.active || existing.active || 'TRUE',
    createdAt: existing.createdAt || user.createdAt || now,
    updatedAt: now,
    note: existing.note || ''
  });
}

function upsertExpertFromUser_(user) {
  var expertId = String(user.email || user.userId || '').trim();
  if (!expertId) return;
  var existing = readRows_(SHEETS.experts).filter(function (item) {
    return String(item.expertId || '').trim().toLowerCase() === expertId.toLowerCase();
  })[0] || {};
  var now = new Date().toISOString();
  upsertRowById_(SHEETS.experts, 'expertId', expertId, {
    expertId: expertId,
    name: user.name || existing.name || expertId,
    email: user.email || existing.email || '',
    phone: user.phone || existing.phone || '',
    organization: user.school || existing.organization || '',
    expertise: existing.expertise || '',
    expertRole: user.role || existing.expertRole || 'external_expert',
    photoUrl: user.photoUrl || existing.photoUrl || '',
    active: user.active || existing.active || 'TRUE',
    createdAt: existing.createdAt || user.createdAt || now,
    updatedAt: now,
    note: existing.note || ''
  });
}

function readRows_(definition) {
  var sheet = getSheet_(definition);
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var headers = values[0];
  return values.slice(1).filter(function (row) {
    return row.some(function (cell) { return cell !== ''; });
  }).map(function (row) {
    var item = {};
    headers.forEach(function (header, index) {
      item[header] = row[index];
    });
    return item;
  });
}

function appendRow_(definition, item) {
  var sheet = getSheet_(definition);
  var row = definition.headers.map(function (header) {
    return item[header] === undefined ? '' : item[header];
  });
  sheet.appendRow(row);
}

function updateRowById_(definition, idColumn, idValue, updates) {
  var sheet = getSheet_(definition);
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) throw new Error('ไม่พบข้อมูลสำหรับอัปเดต');

  var headers = values[0];
  var idIndex = headers.indexOf(idColumn);
  if (idIndex === -1) throw new Error('ไม่พบคอลัมน์ ' + idColumn);

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][idIndex]) !== String(idValue)) continue;
    Object.keys(updates).forEach(function (key) {
      var columnIndex = headers.indexOf(key);
      if (columnIndex !== -1) sheet.getRange(rowIndex + 1, columnIndex + 1).setValue(updates[key]);
    });
    return;
  }
  throw new Error('ไม่พบรายการที่ต้องการอัปเดต');
}

function upsertRowById_(definition, idColumn, idValue, item) {
  var sheet = getSheet_(definition);
  var values = sheet.getDataRange().getValues();
  var headers = values[0] || definition.headers;
  var idIndex = headers.indexOf(idColumn);
  if (idIndex === -1) throw new Error('ไม่พบคอลัมน์ ' + idColumn);

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][idIndex]) !== String(idValue)) continue;
    definition.headers.forEach(function (header) {
      if (item[header] === undefined) return;
      var columnIndex = headers.indexOf(header);
      if (columnIndex !== -1) sheet.getRange(rowIndex + 1, columnIndex + 1).setValue(item[header]);
    });
    return;
  }

  appendRow_(definition, item);
}

function audit_(actor, action, detail) {
  appendRow_(SHEETS.audit, {
    time: new Date().toISOString(),
    actor: actor || 'system',
    action: action,
    detail: detail || ''
  });
}

function sheetName_(name) {
  return SETTINGS.prefix + name;
}

function split_(value) {
  return String(value || '').split(',').map(function (item) {
    return item.trim();
  }).filter(Boolean);
}

function clean_(value) {
  return String(value || '').trim();
}

function phoneFromSourceRow_(row, headers) {
  var phoneHeaders = ['phone', 'tel', 'mobile', 'เบอร์', 'โทร', 'ติดต่อ'];
  for (var index = 0; index < headers.length; index += 1) {
    var header = String(headers[index] || '').toLowerCase();
    var matched = phoneHeaders.some(function (keyword) { return header.indexOf(keyword) !== -1; });
    if (matched) return clean_(row[index]);
  }
  return [clean_(row[6]), clean_(row[7])].filter(function (value) {
    var digits = value.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 12;
  })[0] || '';
}

function collectStaff_(staff, existingUsers, role, name, email, school, projectId) {
  if (!name && !email) return '';
  var userId = email || name;
  var key = role + '|' + String(userId).toLowerCase();
  if (!staff[key] && !existingUsers[String(userId).toLowerCase()]) {
    staff[key] = {
      userId: userId,
      role: role,
      name: name || email,
      email: email,
      school: school || '',
      projects: []
    };
  }
  if (staff[key]) staff[key].projects.push(projectId);
  return userId;
}

function unique_(items) {
  var seen = {};
  return items.filter(function (item) {
    var key = String(item || '').trim();
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function writeMissingAdvisorEmails_(spreadsheet, rows) {
  var sheetName = 'NEW_MissingAdvisorEmails';
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);
  sheet.clear();
  var values = [['role', 'name', 'temporaryUser', 'emailToFill', 'projects']];
  rows.forEach(function (item) {
    values.push([
      item.role,
      item.name,
      item.userId,
      '',
      unique_(item.projects).join(', ')
    ]);
  });
  sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  sheet.setFrozenRows(1);
}

function repairStudentPasswordDisplay_() {
  var sheet = getSheet_(SHEETS.users);
  formatDataSheets_();
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return { repaired: 0 };

  var headers = values[0];
  var passwordIndex = headers.indexOf('password');
  var roleIndex = headers.indexOf('role');
  if (passwordIndex === -1 || roleIndex === -1) return { repaired: 0 };

  var repaired = 0;
  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][roleIndex]) !== 'student') continue;
    var password = String(values[rowIndex][passwordIndex] || '').trim();
    if (!password) password = generateStudentPassword_();
    if (/^\d+$/.test(password) && password.length < 4) {
      password = ('0000' + password).slice(-4);
    }
    if (/^\d{4}$/.test(password)) {
      sheet.getRange(rowIndex + 1, passwordIndex + 1).setNumberFormat('@').setValue(password);
      repaired += 1;
    }
  }
  return { repaired: repaired };
}

function generatePassword_() {
  var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  var password = '';
  for (var index = 0; index < 10; index += 1) {
    password += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return password;
}

function generateStudentPassword_() {
  var password = '';
  for (var index = 0; index < 4; index += 1) {
    password += String(Math.floor(Math.random() * 10));
  }
  return password;
}
