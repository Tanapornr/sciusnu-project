const fs = require('fs');
const path = require('path');

const root = process.cwd();
const source = path.join(root, 'outputs', 'student-work-submission-new');
const target = path.join(root, 'dist');
const files = [
  'index.html',
  'student.html',
  'advisor.html',
  'admin.html',
  'requests.html',
  'style.css',
  'app.js',
  'config.js'
];

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });

for (const file of files) {
  const from = path.join(source, file);
  const to = path.join(target, file);
  let content = fs.readFileSync(from, 'utf8');

  if (file === 'config.js' && process.env.PROJECTFLOW_APPS_SCRIPT_URL) {
    content = content
      .replace("APPS_SCRIPT_URL: '',", "APPS_SCRIPT_URL: '" + process.env.PROJECTFLOW_APPS_SCRIPT_URL + "',")
      .replace('DEMO_MODE: true', 'DEMO_MODE: false');
  }

  if (file === 'config.js' && process.env.GOOGLE_CLIENT_ID) {
    content = content.replace("GOOGLE_CLIENT_ID: '',", "GOOGLE_CLIENT_ID: '" + process.env.GOOGLE_CLIENT_ID + "',");
  }

  fs.writeFileSync(to, content, 'utf8');
}

console.log('Built ProjectFlow submission site into dist');
