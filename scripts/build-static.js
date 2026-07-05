const fs = require('fs');
const path = require('path');

const root = process.cwd();
const source = path.join(root, 'outputs', 'sciusnu-smart-style-code');
const target = path.join(root, 'dist');
const files = [
  'index.html',
  'student.html',
  'advisor.html',
  'viewer.html',
  'admin.html',
  'style.css',
  'shared.js',
  'config.js'
];

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });

for (const file of files) {
  const from = path.join(source, file);
  const to = path.join(target, file);
  let content = fs.readFileSync(from, 'utf8');

  if (file === 'config.js' && process.env.APPS_SCRIPT_URL) {
    content = content.replace('PASTE_APPS_SCRIPT_EXEC_URL_HERE', process.env.APPS_SCRIPT_URL);
  }

  fs.writeFileSync(to, content, 'utf8');
}

console.log('Built static SCIUSNU SMART site into dist');
