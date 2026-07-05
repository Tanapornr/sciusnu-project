# ProjectFlow — ระบบส่งงานโครงงานนักเรียนชุดใหม่

โฟลเดอร์นี้เป็นระบบใหม่แยกจาก `sciusnu-smart-style-code` เดิมทั้งหมด โดย backend จะสร้างชีตใหม่ด้วย prefix `NEW_` เพื่อไม่แก้ข้อมูลเดิมใน Google Sheet

## ไฟล์สำคัญ

- `index.html` หน้าเว็บระบบส่งงานแบบมินิมอล
- `style.css` ธีม UI ใหม่
- `app.js` logic ฝั่งหน้าเว็บและโหมด demo
- `config.js` ตั้งค่า Apps Script Web App URL
- `Code.gs` backend สำหรับ Google Apps Script
- `appsscript.json` manifest สำหรับ Apps Script

## การใช้งานแบบ Demo

เปิด `index.html` ได้ทันที เพราะ `config.js` ตั้ง `DEMO_MODE: true`

- ผู้ดูแลระบบ: `admin` / `admin123`
- นักเรียน: `68983244` / `demo123`
- อาจารย์: `advisor01` / `demo123`

## การเชื่อมต่อ Google Sheet จริง

1. สร้าง Google Apps Script project ใหม่
2. วางโค้ดจาก `Code.gs`
3. ตั้งค่า `appsscript.json` ให้ตรงกับไฟล์นี้
4. Deploy เป็น Web App โดยเลือก `Execute as: Me` และ `Who has access: Anyone`
5. คัดลอก Web App URL ไปใส่ใน `config.js`
6. เปลี่ยน `DEMO_MODE` เป็น `false`

ระบบจะใช้ Google Sheet ID เดิมที่ให้มา แต่จะสร้างแท็บใหม่เท่านั้น:

- `NEW_Users`
- `NEW_Projects`
- `NEW_Submissions`
- `NEW_AuditLog`

## บัญชีเริ่มต้น

เมื่อ backend ทำงานครั้งแรก จะสร้างบัญชีผู้ดูแลระบบใน `NEW_Users`

- userId: `admin`
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
