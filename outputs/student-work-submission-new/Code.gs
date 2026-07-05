var SETTINGS = {
  spreadsheetId: PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || '14Zs2kyIE8B3DpwvX78l8_IHqtQVYdWP6AZCaS_F0XRc',
  prefix: 'NEW_',
  appName: 'ProjectFlow'
};

var SHEETS = {
  users: {
    name: 'Users',
    headers: ['userId', 'password', 'role', 'name', 'email', 'studentId', 'school', 'active', 'createdAt', 'updatedAt']
  },
  projects: {
    name: 'Projects',
    headers: ['projectId', 'title', 'studentIds', 'studentNames', 'advisorId', 'coAdvisorId', 'schoolAdvisorId', 'school', 'dueDate', 'status', 'createdAt', 'updatedAt']
  },
  submissions: {
    name: 'Submissions',
    headers: ['submissionId', 'projectId', 'studentId', 'studentNames', 'title', 'workType', 'fileUrl', 'note', 'status', 'reviewerId', 'reviewerName', 'reviewerNote', 'createdAt', 'updatedAt']
  },
  audit: {
    name: 'AuditLog',
    headers: ['time', 'actor', 'action', 'detail']
  }
};

function doGet() {
  ensureSheets_();
  return json_({
    ok: true,
    data: {
      app: SETTINGS.appName,
      message: 'ProjectFlow Apps Script is ready',
      sheets: Object.keys(SHEETS).map(function (key) { return sheetName_(SHEETS[key].name); })
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

function route_(request) {
  var action = request.action;
  var payload = request.payload || {};

  if (action === 'login') return login_(payload);

  var user = requireUser_(request.token);
  if (action === 'dashboard') return dashboard_(user);
  if (action === 'submitWork') return submitWork_(user, payload);
  if (action === 'reviewSubmission') return reviewSubmission_(user, payload);
  if (action === 'sendReminder') return sendReminder_(user, payload);
  if (action === 'createUser') return createUser_(user, payload);
  if (action === 'createProject') return createProject_(user, payload);

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

function dashboard_(user) {
  var projects = filterProjectsForUser_(readRows_(SHEETS.projects), user);
  var projectIds = projects.map(function (project) { return project.projectId; });
  var submissions = readRows_(SHEETS.submissions).filter(function (submission) {
    return user.role === 'admin' || projectIds.indexOf(submission.projectId) !== -1;
  }).map(function (submission) {
    return enrichSubmission_(submission, projects);
  });
  submissions.sort(function (a, b) {
    return new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0);
  });

  var canReview = ['advisor', 'co_advisor', 'school_advisor', 'admin'].indexOf(user.role) !== -1;
  var reviewQueue = canReview ? submissions.filter(function (submission) {
    return ['ส่งแล้ว', 'รอตรวจ'].indexOf(String(submission.status || '')) !== -1;
  }) : [];

  return {
    user: safeUser_(user),
    projects: projects,
    submissions: submissions,
    reviewQueue: reviewQueue,
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

  if (!payload.title || !payload.fileUrl) {
    throw new Error('กรุณากรอกชื่องานและลิงก์ไฟล์งาน');
  }

  var now = new Date().toISOString();
  var submission = {
    submissionId: 'SUB-' + Utilities.getUuid(),
    projectId: project.projectId,
    studentId: studentKey,
    studentNames: user.name,
    title: payload.title,
    workType: payload.workType || 'ส่งงาน',
    fileUrl: payload.fileUrl,
    note: payload.note || '',
    status: 'ส่งแล้ว',
    reviewerId: '',
    reviewerName: '',
    reviewerNote: '',
    createdAt: now,
    updatedAt: now
  };

  appendRow_(SHEETS.submissions, submission);
  updateRowById_(SHEETS.projects, 'projectId', project.projectId, { status: 'ส่งงานแล้ว', updatedAt: now });
  notifyReviewers_(project, submission);
  audit_(user.userId, 'submitWork', submission.submissionId);
  return { submissionId: submission.submissionId };
}

function reviewSubmission_(user, payload) {
  if (['advisor', 'co_advisor', 'school_advisor', 'admin'].indexOf(user.role) === -1) {
    throw new Error('บัญชีนี้ไม่มีสิทธิ์ตรวจงาน');
  }

  var submissions = readRows_(SHEETS.submissions);
  var submission = submissions.filter(function (item) { return item.submissionId === payload.submissionId; })[0];
  if (!submission) throw new Error('ไม่พบรายการส่งงาน');

  var project = readRows_(SHEETS.projects).filter(function (item) { return item.projectId === submission.projectId; })[0];
  if (!project) throw new Error('ไม่พบโครงงานของรายการนี้');

  if (user.role !== 'admin' && filterProjectsForUser_([project], user).length === 0) {
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
  updateRowById_(SHEETS.projects, 'projectId', project.projectId, {
    status: status === 'อนุมัติ' ? 'ผ่านการตรวจล่าสุด' : 'รอแก้ไข',
    updatedAt: now
  });

  notifyStudents_(project, submission, status, payload.note || '', user);
  audit_(user.userId, 'reviewSubmission', submission.submissionId + ' ' + status);
  return { submissionId: submission.submissionId, status: status };
}

function sendReminder_(user) {
  if (['advisor', 'co_advisor', 'school_advisor', 'admin'].indexOf(user.role) === -1) {
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
  if (!payload.userId || !payload.password || !payload.role || !payload.name) {
    throw new Error('กรุณากรอกข้อมูลผู้ใช้งานให้ครบ');
  }
  if (findUser_(payload.userId)) throw new Error('มีรหัสผู้ใช้นี้แล้ว');

  var now = new Date().toISOString();
  appendRow_(SHEETS.users, {
    userId: payload.userId,
    password: payload.password,
    role: payload.role,
    name: payload.name,
    email: payload.email || '',
    studentId: payload.studentId || '',
    school: payload.school || '',
    active: 'TRUE',
    createdAt: now,
    updatedAt: now
  });
  audit_(user.userId, 'createUser', payload.userId);
  return { userId: payload.userId };
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
  audit_(user.userId, 'createProject', payload.projectId);
  return { projectId: payload.projectId };
}

function notifyReviewers_(project, submission) {
  var users = readRows_(SHEETS.users);
  var reviewerIds = [project.advisorId, project.coAdvisorId, project.schoolAdvisorId].filter(Boolean);
  var recipients = users.filter(function (user) {
    return reviewerIds.indexOf(user.userId) !== -1 && user.email;
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

function enrichSubmission_(submission, projects) {
  var project = projects.filter(function (item) { return item.projectId === submission.projectId; })[0] || {};
  submission.projectTitle = project.title || submission.projectId;
  submission.dueDate = project.dueDate || '';
  if (!submission.studentNames) submission.studentNames = project.studentNames || submission.studentId || '';
  return submission;
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
    return projects.filter(function (project) { return project.advisorId === user.userId; });
  }
  if (user.role === 'co_advisor') {
    return projects.filter(function (project) { return project.coAdvisorId === user.userId; });
  }
  if (user.role === 'school_advisor') {
    return projects.filter(function (project) {
      return project.schoolAdvisorId === user.userId || (user.school && project.school === user.school);
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
    school: user.school
  };
}

function isActive_(user) {
  return String(user.active || 'TRUE').toUpperCase() !== 'FALSE';
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
      userId: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'ผู้ดูแลระบบ',
      email: '',
      studentId: '',
      school: '',
      active: 'TRUE',
      createdAt: now,
      updatedAt: now
    });
  }
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
  }
  return sheet;
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
