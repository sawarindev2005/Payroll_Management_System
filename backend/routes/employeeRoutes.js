const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { withNetSalary } = require('../utils/salary');

// GET /api/employees/me - พนักงานดูเงินเดือนของตัวเอง (ต้อง login แต่ไม่ต้องเป็น admin)
router.get('/me', verifyToken, async (req, res) => {
    if (!req.user.employee_id) {
        return res.status(404).json({ message: 'บัญชีนี้ไม่ได้ผูกกับข้อมูลพนักงาน' });
    }
    const [rows] = await pool.query('SELECT * FROM employees WHERE id = ?', [req.user.employee_id]);
    if (rows.length === 0) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลพนักงาน' });
    }
    res.json(withNetSalary(rows[0]));
});

// ตั้งแต่บรรทัดนี้ลงไป ใช้ได้เฉพาะ admin เท่านั้น
router.use(verifyToken, requireAdmin);

// GET /api/employees - รายชื่อพนักงานทั้งหมด พร้อมสถานะบัญชี login (ถ้ามี)
router.get('/', async (req, res) => {
    const [rows] = await pool.query(
        `SELECT e.*, u.id AS user_id, u.username AS account_username
         FROM employees e
         LEFT JOIN users u ON u.employee_id = e.id
         ORDER BY e.id`
    );
    res.json(rows.map(withNetSalary));
});

// GET /api/employees/:id - พนักงานคนเดียว
router.get('/:id', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
        return res.status(404).json({ message: 'ไม่พบพนักงานคนนี้' });
    }
    res.json(withNetSalary(rows[0]));
});

// POST /api/employees - เพิ่มพนักงานใหม่
router.post('/', async (req, res) => {
    const { name, position, base_salary, bonus, deduction } = req.body;
    const [result] = await pool.query(
        'INSERT INTO employees (name, position, base_salary, bonus, deduction) VALUES (?, ?, ?, ?, ?)',
        [name, position, base_salary, bonus || 0, deduction || 0]
    );
    res.status(201).json({ id: result.insertId });
});

// PUT /api/employees/:id - แก้ไขข้อมูล/เงินเดือนพนักงาน
router.put('/:id', async (req, res) => {
    const { name, position, base_salary, bonus, deduction } = req.body;
    await pool.query(
        'UPDATE employees SET name = ?, position = ?, base_salary = ?, bonus = ?, deduction = ? WHERE id = ?',
        [name, position, base_salary, bonus || 0, deduction || 0, req.params.id]
    );
    res.json({ message: 'อัปเดตข้อมูลสำเร็จ' });
});

// DELETE /api/employees/:id - ลบพนักงาน
router.delete('/:id', async (req, res) => {
    await pool.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ message: 'ลบข้อมูลสำเร็จ' });
});

module.exports = router;
