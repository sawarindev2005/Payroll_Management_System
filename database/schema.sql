-- สร้างฐานข้อมูลและตารางสำหรับระบบจัดการเงินเดือนพนักงาน
-- วิธีใช้: เปิดไฟล์นี้ใน MySQL Workbench แล้วรันทั้งหมด (Execute)

CREATE DATABASE IF NOT EXISTS salary_db;
USE salary_db;

CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    base_salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
    bonus DECIMAL(10, 2) NOT NULL DEFAULT 0,
    deduction DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- บัญชีผู้ใช้สำหรับ login แยกจากข้อมูลพนักงาน
-- role = 'admin' -> จัดการพนักงานได้ทั้งหมด, employee_id เป็น NULL
-- role = 'employee' -> ดูได้แค่เงินเดือนตัวเอง, employee_id ผูกกับ employees.id
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
    employee_id INT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- หมายเหตุ: ตารางนี้ยังไม่มีบัญชี admin เริ่มต้น
-- ให้รัน `node seed.js` ในโฟลเดอร์ backend หลังสร้างตารางแล้ว เพื่อสร้างบัญชี admin คนแรก
-- (รหัสผ่านต้อง hash ด้วย bcrypt ซึ่งทำผ่าน SQL ตรงๆ ไม่ได้ จึงต้องใช้สคริปต์ Node)

-- ประวัติเงินเดือนรายเดือนของพนักงาน แต่ละแถวคือ snapshot ของเดือนนั้น (ปี+เดือน) แยกกันเก็บ
-- แก้ไขเดือนใดเดือนหนึ่งจะไม่กระทบเดือนอื่น เดือนปัจจุบันถูกสร้างอัตโนมัติ (lazy)
-- จากค่า employees.base_salary/bonus/deduction ตอนที่มีการเรียกดูครั้งแรกของเดือนนั้น
-- (ระบบนี้ไม่มี cron/scheduler ถ้าไม่มีใครเข้าดูเลยในเดือนนั้น จะไม่มีแถวของเดือนนั้นเกิดขึ้น)
CREATE TABLE IF NOT EXISTS salary_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    period_year SMALLINT UNSIGNED NOT NULL,
    period_month TINYINT UNSIGNED NOT NULL, -- 1-12
    base_salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
    bonus DECIMAL(10, 2) NOT NULL DEFAULT 0,
    deduction DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_employee_period (employee_id, period_year, period_month),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- คำขอเบิก: ครอบคลุมทั้งเบิกเงินเดือนล่วงหน้า (advance) และเบิกคืนค่าใช้จ่าย (reimbursement)
-- พนักงานเป็นผู้สร้างคำขอเอง, admin เป็นผู้อนุมัติ/ปฏิเสธเท่านั้น
-- สถานะเปลี่ยนได้ทางเดียวจาก pending ไปสู่ approved/rejected เท่านั้น
CREATE TABLE IF NOT EXISTS claim_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    type ENUM('advance', 'reimbursement') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    qr_image_path VARCHAR(255) NULL, -- รูป QR พร้อมเพย์ที่พนักงานแนบตอนยื่นคำขอ
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    admin_note VARCHAR(255) NULL,
    slip_image_path VARCHAR(255) NULL, -- รูปสลิปโอนเงินที่แอดมินแนบตอนอนุมัติ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ถ้ามีฐานข้อมูลเดิมอยู่แล้ว (ตารางถูกสร้างไปก่อนเพิ่มฟีเจอร์แนบรูป) ให้รันเพิ่มเองใน Workbench:
-- ALTER TABLE claim_requests
--   ADD COLUMN qr_image_path VARCHAR(255) NULL AFTER reason,
--   ADD COLUMN slip_image_path VARCHAR(255) NULL AFTER admin_note;
