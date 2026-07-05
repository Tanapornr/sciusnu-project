# ProjectFlow Student Submission

ระบบส่งโครงงานและระบบคำร้องออนไลน์สำหรับนักเรียน อาจารย์ที่ปรึกษา และผู้ดูแลระบบ

## Structure

- `index.html` หน้าเข้าสู่ระบบที่วางไว้หน้า repo เพื่อให้อ่านโค้ดง่าย
- `student.html` หน้านักเรียนสำหรับส่งงานและยื่นคำร้องทั่วไป
- `advisor.html` หน้าอาจารย์สำหรับตรวจงานและเซ็นคำร้อง
- `admin.html` หน้าแอดมินสำหรับจัดการระบบและเซ็นลำดับสุดท้าย
- `requests.html` หน้าคำร้องออนไลน์แบบแยกสำหรับนำเสนอ workflow
- `outputs/student-work-submission-new/` contains the real source HTML, CSS, JS, and Apps Script files.
- `scripts/build-static.js` copies deployable frontend files to `dist/`.
- `Code.gs` and `appsscript.json` inside the source folder are for Google Apps Script setup.

## Request Signature Flow

คำร้องใหม่ต้องให้เจ้าของเรื่องเซ็นเอกสารก่อน จากนั้นระบบจะส่งอีเมลตามลำดับ: เพื่อนร่วมโครงงาน → อาจารย์ที่ปรึกษาหลัก → อาจารย์ที่ปรึกษาร่วม → อาจารย์ที่ปรึกษาโรงเรียน → แอดมิน

## Deploy

Vercel runs:

```bash
npm run build
```

The deployed static site is generated into `dist/`.

## Backend Setup

Deploy `outputs/student-work-submission-new/Code.gs` as a Google Apps Script Web App, then put the `/exec` URL into `outputs/student-work-submission-new/config.js` or set `APPS_SCRIPT_URL` during build.
