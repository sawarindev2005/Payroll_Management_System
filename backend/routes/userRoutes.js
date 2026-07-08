const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// ทุก route ในไฟล์นี้ใช้ได้เฉพาะ admin เท่านั้น
router.use(verifyToken, requireAdmin);

// POST /api/users - สร้างบัญชี login ให้พนักงานคนหนึ่ง
router.post('/', async (req, res) => {
    const { employee_id, username, password } = req.body;

    if (!employee_id || !username || !password) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
    }

    const [employeeRows] = await pool.query('SELECT id FROM employees WHERE id = ?', [employee_id]);
    if (employeeRows.length === 0) {
        return res.status(404).json({ message: 'ไม่พบพนักงานคนนี้' });
    }

    const [existingAccount] = await pool.query('SELECT id FROM users WHERE employee_id = ?', [employee_id]);
    if (existingAccount.length > 0) {
        return res.status(400).json({ message: 'พนักงานคนนี้มีบัญชี login อยู่แล้ว' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [result] = await pool.query(
            'INSERT INTO users (username, password, role, employee_id) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, 'employee', employee_id]
        );
        res.status(201).json({ id: result.insertId, username });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว กรุณาเลือกชื่ออื่น' });
        }
        throw err;
    }
});

// DELETE /api/users/:id - ลบบัญชี login ของพนักงาน (เพิกถอนสิทธิ์เข้าระบบ)
router.delete('/:id', async (req, res) => {
    const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
        return res.status(404).json({ message: 'ไม่พบบัญชีนี้' });
    }
    if (rows[0].role !== 'employee') {
        return res.status(403).json({ message: 'ไม่สามารถลบบัญชี admin ผ่านทางนี้ได้' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'ลบบัญชี login สำเร็จ' });
});

module.exports = router;
