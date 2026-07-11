const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
        return res.status(401).json({ message: 'username หรือ password ไม่ถูกต้อง' });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
        return res.status(401).json({ message: 'username หรือ password ไม่ถูกต้อง' });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, employee_id: user.employee_id },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    res.json({
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role,
            employee_id: user.employee_id,
        },
    });
});

// PUT /api/auth/change-password - ผู้ใช้ที่ login แล้ว (admin หรือ employee) เปลี่ยนรหัสผ่านของตัวเอง
router.put('/change-password', verifyToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
        return res.status(404).json({ message: 'ไม่พบบัญชีผู้ใช้นี้' });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatches) {
        return res.status(400).json({ message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
});

module.exports = router;
