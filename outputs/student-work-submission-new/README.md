# ProjectFlow — ระบบส่งงานโครงงานนักเรียนชุดใหม่

โฟลเดอร์นี้เป็นระบบใหม่แยกจาก `sciusnu-smart-style-code` เดิมทั้งหมด โดย backend จะสร้างชีตใหม่ด้วย prefix `NEW_` เพื่อไม่แก้ข้อมูลเดิมใน Google Sheet

## ฐานข้อมูลและคลังไฟล์ที่ตั้งไว้

- Google Sheet DB: `14Zs2kyIE8B3DpwvX78l8_IHqtQVYdWP6AZCaS_F0XRc`
- Google Drive folder สำหรับเก็บไฟล์โครงร่าง: `1a2663IC5L_fkFE28AkUojDPVca8ITi8W`
- ค่าเหล่านี้อยู่ใน `Code.gs` และตั้งทับได้ด้วย Script Properties: `SPREADSHEET_ID`, `DRIVE_FOLDER_ID`, `ADMIN_EMAIL`

## ไฟล์สำคัญ

- `index.html` หน้าเว็บระบบส่งงานแบบมินิมอล
- `style.css` ธีม UI ใหม่
- `app.js` logic ฝั่งหน้าเว็บและโหมด demo
- `config.js` ตั้งค่า Apps Script Web App URL
- `Code.gs` backend สำหรับ Google Apps Script
- `appsscript.json` manifest สำหรับ Apps Script

## การใช้งานแบบ Demo

เปิด `index.html` ได้ทันที เพราะ `config.js` ตั้ง `DEMO_MODE: true`

- ผู้ดูแลระบบ: `admin@example.com` / `admin123`
- นักเรียน: `68983244` / `demo123`
- อาจารย์: `advisor@example.com` / `demo123`

## การเชื่อมต่อ Google Sheet จริง

1. สร้าง Google Apps Script project ใหม่
2. วางโค้ดจาก `Code.gs`
3. ตั้งค่า `appsscript.json` ให้ตรงกับไฟล์นี้
4. Deploy เป็น Web App โดยเลือก `Execute as: Me` และ `Who has access: Anyone`
5. คัดลอก Web App URL ไปใส่ใน `config.js` หรือใส่เป็น Vercel env `PROJECTFLOW_APPS_SCRIPT_URL`
6. เปลี่ยน `DEMO_MODE` เป็น `false` หรือให้ build script เปลี่ยนให้อัตโนมัติเมื่อมี `PROJECTFLOW_APPS_SCRIPT_URL`

ระบบจะใช้ Google Sheet ID เดิมที่ให้มา แต่จะสร้างแท็บใหม่เท่านั้น:

- `NEW_Users`
- `NEW_Projects`
- `NEW_Submissions`
- `NEW_AuditLog`

ไฟล์ที่นักเรียนอัปโหลดจะถูกสร้างในโฟลเดอร์ Drive ที่กำหนด และแยก subfolder ตามโครงงาน

## กติกาบัญชีผู้ใช้

- นักเรียน: ใช้ `รหัสนักเรียน` เป็น USER
- admin / อาจารย์ที่ปรึกษาหลัก / อาจารย์ที่ปรึกษาร่วม / อาจารย์ที่ปรึกษาโรงเรียน: ใช้ `อีเมล` เป็น USER
- ถ้าเว้นรหัสผ่านว่าง ระบบจะ Gen Password ให้อัตโนมัติ
- ปุ่ม `Gen Password นักเรียนจากโครงงาน` จะอ่านรหัสนักเรียนใน `NEW_Projects` แล้วสร้างบัญชีใน `NEW_Users`

## บัญชีเริ่มต้น

เมื่อ backend ทำงานครั้งแรก จะสร้างบัญชีผู้ดูแลระบบใน `NEW_Users`

- userId: `admin@example.com`
- password: `admin123`

ควรเปลี่ยนรหัสผ่านในชีตทันทีหลังติดตั้งจริง

## Flow หลัก

1. นักเรียนเข้าสู่ระบบและส่งลิงก์ไฟล์งาน
2. ระบบบันทึกลง `NEW_Submissions`
3. ระบบส่งอีเมลแจ้งอาจารย์ที่ปรึกษา/อาจารย์ร่วม/อาจารย์โรงเรียน
4. อาจารย์อนุมัติหรือส่งแก้ไข
5. ระบบส่งอีเมลแจ้งผลกลับนักเรียน

## หมายเหตุ

ระบบนี้ไม่แตะไฟล์หรือแท็บข้อมูลของ SCIUS SMART เดิม ถ้าต้องการ deploy เป็นเว็บจริงแทน URL ปัจจุบัน ให้เปลี่ยน build target ไปที่โฟลเดอร์นี้ก่อน push ขึ้น Vercel
