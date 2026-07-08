// สคริปต์สร้างบัญชี admin คนแรก
// วิธีใช้: กำหนด ADMIN_USERNAME/ADMIN_PASSWORD ใน .env (ไม่บังคับ มีค่า default ให้)
// แล้วรัน `node seed.js` หลังจากสร้างตารางจาก database/schema.sql แล้ว
// ควรเปลี่ยนรหัสผ่านหลัง login ครั้งแรก

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function seedAdmin() {
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [ADMIN_USERNAME]);
    if (existing.length > 0) {
        console.log('มีบัญชี admin อยู่แล้ว ไม่ต้องสร้างซ้ำ');
        process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query(
        'INSERT INTO users (username, password, role, employee_id) VALUES (?, ?, ?, ?)',
        [ADMIN_USERNAME, hashedPassword, 'admin', null]
    );

    console.log(`สร้างบัญชี admin สำเร็จ: username=${ADMIN_USERNAME}, password=${ADMIN_PASSWORD}`);
    process.exit(0);
}

seedAdmin().catch((err) => {
    console.error('สร้างบัญชี admin ไม่สำเร็จ:', err);
    process.exit(1);
});
