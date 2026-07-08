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
