# SCIUSNU SMART Style Code

ชุดนี้เป็นโค้ดตามแนวคู่มือ SCIUSNU SMART: หน้าเว็บหลายหน้า + Google Apps Script เป็น API กลาง + Google Sheet เป็นฐานข้อมูล + Google Drive เก็บไฟล์ PDF

## ไฟล์

- `Code.gs` backend Google Apps Script
- `appsscript.json` Apps Script manifest
- `config.js` ตั้งค่า Web App URL
- `shared.js` ฟังก์ชันกลางของ frontend
- `style.css` CSS กลาง
- `index.html` หน้าเข้าสู่ระบบ
- `student.html` หน้านักเรียน ส่งงาน/ส่งคำร้อง/ส่งไฟล์แก้ไข
- `advisor.html` หน้าอาจารย์ที่ปรึกษาหลัก ตรวจและอนุมัติงาน
- `viewer.html` หน้าอาจารย์ที่ปรึกษาร่วม/โรงเรียน ดูสถานะ read-only
- `admin.html` หน้าแอดมิน ตรวจคำร้องและส่งแจ้งเตือน

## Google Sheet ที่ใช้

ระบบตั้งค่าไว้กับชีตนี้:

`https://docs.google.com/spreadsheets/d/14Zs2kyIE8B3DpwvX78l8_IHqtQVYdWP6AZCaS_F0XRc/edit`

อ่านข้อมูลหลักจากแท็บ `sheet1` และสร้างแท็บเพิ่มอัตโนมัติ:

- `Submissions`
- `Requests`
- `Email_Log`

## การล็อกอิน

| บทบาท | บัญชี | รหัสผ่าน | หน้า |
| --- | --- | --- | --- |
| นักเรียน | รหัสนักเรียนหรืออีเมลนักเรียน | คอลัมน์ S | `student.html` |
| อาจารย์ที่ปรึกษาหลัก | อีเมล/ชื่อ/รหัสอาจารย์ | คอลัมน์ V | `advisor.html` |
| อาจารย์ที่ปรึกษาร่วม | อีเมล/ชื่อ | คอลัมน์ W | `viewer.html` |
| อาจารย์ที่ปรึกษาโรงเรียน | อีเมล/ชื่อ | คอลัมน์ X | `viewer.html` |
| แอดมิน | ค่าใน `ADMIN_EMAILS` | ค่าใน `ADMIN_PASSWORD` | `admin.html` |

## วิธีติดตั้ง Apps Script

1. เปิด Google Sheet
2. ไปที่ `Extensions > Apps Script`
3. วาง `Code.gs`
4. เปิดการแก้ไข manifest แล้ววาง `appsscript.json`
5. แก้ค่าใน `Code.gs`
   - `ADMIN_EMAILS`
   - `ADMIN_PASSWORD`
   - `DRIVE_FOLDER_ID` ถ้าต้องการระบุโฟลเดอร์ Drive เอง
6. เลือกฟังก์ชัน `setupSystem` แล้ว Run เพื่อสร้างชีตระบบและ authorize
7. ไปที่ `Deploy > New deployment > Web app`
8. ตั้งค่า `Execute as: Me`
9. ตั้งค่า access ตามนโยบาย เช่น `Anyone with Google Account`
10. Copy URL ที่ลงท้าย `/exec`

## วิธีติดตั้งหน้าเว็บ

1. เปิด `config.js`
2. แทน `PASTE_APPS_SCRIPT_EXEC_URL_HERE` ด้วย Web App URL ที่ลงท้าย `/exec`
3. อัปโหลดไฟล์ frontend ทั้งหมดไป GitHub/Vercel หรือ hosting static อื่น
4. เปิด `index.html` เพื่อเข้าสู่ระบบ

## Workflow หลัก

- นักเรียนส่งไฟล์ PDF พร้อมประเภทงาน
- ระบบอัปโหลดไฟล์เข้า Google Drive และบันทึกลง `Submissions`
- ระบบอีเมลแจ้งอาจารย์ที่ปรึกษาหลัก พร้อมสำเนาให้อาจารย์ที่ปรึกษาร่วม/โรงเรียน
- อาจารย์ที่ปรึกษาหลักกด `อนุมัติ` หรือ `ไม่อนุมัติ`
- ถ้าไม่อนุมัติ นักเรียนจะเห็นปุ่ม `ส่งไฟล์แก้ไข` ที่รายการเดิม
- การส่งไฟล์แก้ไขจะสร้างรายการใหม่ และคงหมายเหตุเดิมไว้ให้ตรวจย้อนหลัง
- อาจารย์ที่ปรึกษาร่วม/โรงเรียนเห็นข้อมูลแบบ read-only
- แอดมินตรวจคำร้องและส่งแจ้งเตือนงานค้างได้

## หมายเหตุสำคัญ

- ต้องกรอกอีเมลในชีตให้ถูกต้อง ไม่เช่นนั้นระบบจะบันทึกงานได้ แต่ส่งอีเมลไม่ครบ
- ถ้าแก้ `Code.gs` ต้อง Deploy Apps Script เป็นเวอร์ชันใหม่
- ถ้าแก้ไฟล์ HTML/CSS/JS บน Vercel ต้อง push แล้วรอ deploy
- ระบบนี้ยังใช้รหัสผ่านจาก Google Sheet ตามโครงเดิม หากใช้งานจริงระยะยาวควรย้ายไปใช้ Google Workspace sign-in
