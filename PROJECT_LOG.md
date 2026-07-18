# Khantoke Gold System — บันทึกโปรเจค

## ภาพรวม

แอประบบจัดการร้านข้าวกล่อง "Khantoke Gold" — ติดตามยอดขาย, บันทึกออเดอร์ลูกค้า, วางแผนการผลิต,
จัดการสต๊อกวัตถุดิบ (รวมน้ำจิ้ม), คำนวณต้นทุน/กำไรต่อเมนู, และจัดการรายชื่อลูกค้า/ผู้จำหน่าย

- **ที่มา:** นำเข้าจากโปรเจค Claude Design (claude.ai/design) ไฟล์ต้นฉบับ `Khantoke Gold System.dc.html`
  (เวอร์ชันแรกพอร์ตเป็นไฟล์ HTML เดี่ยว React+Babel ก่อน แล้วแปลงเป็น PHP+MySQL ตามคำขอวันที่ 2026-07-18)
- **เทคโนโลยี:** PHP (แยกไฟล์ต่อหน้า) + MySQLi + JavaScript (vanilla, ไม่ใช้ framework) —
  ต้องมีเซิร์ฟเวอร์ PHP (เช่น XAMPP/Apache หรือ `php -S`) และฐานข้อมูล MySQL/MariaDB
- **การเก็บข้อมูล:** ฐานข้อมูล MySQL `khantoke_gold` (ผ่าน `db.php`) — ข้อมูลทุกอย่าง (ออเดอร์/สต๊อก/สูตร/
  ลูกค้า/โหมดมืด/วันที่ที่เลือก) real-time ข้ามอุปกรณ์ได้ทันทีที่เข้าฐานข้อมูลเดียวกัน
  หน้าเว็บ poll ข้อมูลใหม่จากเซิร์ฟเวอร์ทุก 5-6 วินาที (ดู `assets/app.js` → `KG.startPolling`)
- **วิธีใช้งาน:**
  1. สร้างฐานข้อมูล: `mysql --default-character-set=utf8mb4 -u root < schema.sql`
     (**ต้องใช้ `--default-character-set=utf8mb4`** ไม่งั้นข้อความภาษาไทยจะเพี้ยนตอนนำเข้า)
  2. ตั้งค่าการเชื่อมต่อใน `db.php` ให้ตรงกับเซิร์ฟเวอร์ MySQL ของคุณ (ค่าเริ่มต้นคือ XAMPP: root ไม่มีรหัสผ่าน)
  3. รันผ่าน Apache (วางโปรเจคใน `htdocs`) หรือทดสอบเร็วๆ ด้วย `php -S localhost:8000` ที่โฟลเดอร์โปรเจค
  4. เปิด `index.php`
- **GitHub:** https://github.com/uthainantang/Khantoke_Gold.git

## โครงสร้างไฟล์

- `db.php` — ไฟล์เชื่อมต่อฐานข้อมูล (MySQLi) ไฟล์เดียว ใช้ร่วมกันทุกหน้า/ทุก API
- `schema.sql` — สร้างฐานข้อมูล ตาราง และข้อมูลตัวอย่างเริ่มต้น
- `includes/functions.php` — ฟังก์ชันช่วยเหลือร่วม (แปลงวันที่ไทย, format เงิน, สถานะสต๊อก, JSON helpers)
- `includes/header.php`, `includes/footer.php` — ส่วนหัว/ท้ายหน้าที่ใช้ร่วมกันทุกหน้า (นำทาง, toast, ฯลฯ)
- `index.php`, `orders.php`, `production.php`, `stock.php`, `recipes.php`, `settings.php` — หน้าเพจแยกไฟล์ 6 หน้า
- `api/*.php` — API endpoints (dashboard, orders, production, stock, recipes, vendors, settings)
  รับ-ส่งข้อมูลเป็น JSON อ่าน/เขียนฐานข้อมูลผ่าน MySQLi
- `assets/style.css`, `assets/app.js` — สไตล์และ JS ที่ใช้ร่วมกันทุกหน้า (polling, toast, สลับโหมดมืด)
- `assets/dashboard.js`, `orders.js`, `production.js`, `stock.js`, `recipes.js`, `settings.js` — JS เฉพาะแต่ละหน้า
- `PROJECT_LOG.md` — ไฟล์นี้ บันทึกความเป็นมาและประวัติการแก้ไข

## หน้าจอในแอป

1. **หน้าหลัก (Dashboard)** — ยอดขาย/กำไร/ต้นทุนวันนี้, แจ้งเตือนสต๊อกต่ำ, เมนูขายดี, รายการออเดอร์ + ปุ่มจ่ายเงิน
2. **ออเดอร์ (Orders)** — เลือกวันที่, เลือกเมนูที่ทำวันนี้, รับออเดอร์ต่อลูกค้าแบบเพิ่ม/ลดจำนวน
3. **ผลิต (Production)** — บันทึกปริมาณวัตถุดิบที่ใช้ 3 สถานี (น้ำซุป/หุงข้าว/เนื้อ) พร้อมหักสต๊อกอัตโนมัติ
4. **สต๊อก (Stock)** — จัดการวัตถุดิบ (เพิ่ม/แก้ไข/ลบ) + จัดการน้ำจิ้ม (ส่วนผสมต่อรอบ, ทำรอบใหม่)
5. **เมนู (Recipes)** — จัดการเมนู, ส่วนผสมต่อกล่อง, คำนวณต้นทุน/กำไรอัตโนมัติ
6. **ตั้งค่า (Settings)** — จัดการรายชื่อลูกค้า/ผู้จำหน่าย

## ประวัติการแก้ไข (Changelog)

### 2026-07-18 — สร้างโปรเจคครั้งแรก
- นำเข้าดีไซน์จาก Claude Design (`Khantoke Gold System.dc.html` + `support.js`)
- พอร์ตเป็นแอปทำงานได้จริงในไฟล์ `index.html` เดียว (React 18 + Babel ผ่าน CDN)
- เพิ่มระบบบันทึกข้อมูลลง localStorage
- แก้บั๊ก: เมนูขายดีในหน้าหลักแสดง "฿NaN" (จาก format ตัวเลขซ้ำสองครั้ง)
- ทดสอบทุกหน้าจอผ่านเบราว์เซอร์จริง (เพิ่มออเดอร์, สลับโหมดมืด, รีโหลดแล้วข้อมูลยังอยู่) — ผ่านทั้งหมด
- ตั้งค่า Git และเชื่อมกับ GitHub repo `uthainantang/Khantoke_Gold`

### 2026-07-18 — แปลงสถาปัตยกรรมเป็น PHP + MySQLi (real-time database)
- ตามคำขอ: แปลงจาก single-file HTML/React เป็น PHP + JavaScript (vanilla) + MySQLi ฐานข้อมูลจริง
- ออกแบบและสร้างฐานข้อมูล `khantoke_gold` (`schema.sql`) 10 ตาราง: settings, stock, recipes,
  recipe_ingredients, sauces, sauce_ingredients, vendors, orders, order_items, station_logs
- แยกไฟล์เชื่อมต่อฐานข้อมูล (`db.php`) และฟังก์ชันร่วม (`includes/functions.php`) ต่างหากตามที่ขอ
- แยกแต่ละหน้าเป็นไฟล์ PHP ของตัวเอง (`index.php`, `orders.php`, `production.php`, `stock.php`,
  `recipes.php`, `settings.php`) ใช้ `includes/header.php` + `includes/footer.php` ร่วมกัน
- สร้าง API 7 ไฟล์ใน `api/` (dashboard, orders, production, stock, recipes, vendors, settings)
  แต่ละหน้าดึงข้อมูลผ่าน fetch → JSON แล้ว poll ทุก 5-6 วินาทีให้ข้อมูลอัปเดต real-time
- ลบ `index.html` เดิม (ถูกแทนที่ด้วยสถาปัตยกรรมใหม่ทั้งหมด)
- **บั๊กที่พบและแก้ระหว่างทดสอบจริงกับ MySQL:**
  - นำเข้า `schema.sql` โดยไม่ระบุ `--default-character-set=utf8mb4` ทำให้ข้อความไทยเพี้ยนในฐานข้อมูล
    (ต้องนำเข้าใหม่ด้วยแฟล็กนี้เสมอ — บันทึกไว้ในขั้นตอนการติดตั้งแล้ว)
  - ช่องกรอกตัวเลข/ข้อความเสียโฟกัสทุกครั้งที่พิมพ์ เพราะ re-render DOM ทั้งก้อนใน event `input`
    — แก้โดยแยก preview (เช่น ราคาต่อหน่วย, ต้นทุนต่อกล่อง) ออกมาอัปเดตเฉพาะจุดแทนการ re-render ทั้งหมด
  - `str_starts_with()` เป็นฟังก์ชัน PHP 8+ แต่เซิร์ฟเวอร์ทดสอบ (XAMPP) ใช้ PHP 7.4.1 — เปลี่ยนเป็น
    `substr(...) === ...` ให้ใช้ได้กับ PHP 7.4 ขึ้นไป
- ทดสอบทุก endpoint (GET/POST ทุก action ของทุกโมดูล) ผ่าน XAMPP MySQL จริง — ไม่มี PHP fatal error
- ทดสอบ flow จริงผ่านเบราว์เซอร์: เพิ่มออเดอร์ → หักสต๊อกจากหน้าผลิต → แก้ราคาสต๊อก → เพิ่มวัตถุดิบเมนู
  พร้อม preview ต้นทุน real-time → สลับโหมดมืด (บันทึกลง MySQL ข้ามอุปกรณ์ได้จริง ไม่ใช่แค่ localStorage)
- รีเซ็ตฐานข้อมูลกลับเป็นข้อมูลตัวอย่างเริ่มต้นหลังทดสอบเสร็จ
